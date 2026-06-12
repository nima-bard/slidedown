#!/usr/bin/env node
/* Slidedown compiler — deterministic .md → presentation build.
   Usage: node compile.js <deck.md> [--out <dir>]
   Same input always produces the same output. The language is documented in
   ../README.md; theme styles live in ../themes/, the deck runtime in ../shared/.
   Output folder: index.html + style.css + assets/ (images) + shared/ (verbatim).

   The language is forgiving: element names, slide flags, labels and theme names
   are resolved through aliases and a fuzzy matcher, so "::: important note",
   "::: pills" or "Warning: …" all land on a real element. Resolution is
   deterministic — the same loose name always resolves the same way. */
'use strict';

const fs = require('fs');
const path = require('path');

const SKILL_DIR = path.join(__dirname, '..');
const THEMES = {
  purple: {
    css: 'themes/purple.css',
    font: '<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">',
    nav: 'fade',
  },
  zastrpay: {
    css: 'themes/zastrpay.css',
    font: '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">',
    nav: 'scroll',
  },
};
const THEME_ALIASES = {
  purple: 'purple', violet: 'purple', lavender: 'purple', poppins: 'purple',
  zastrpay: 'zastrpay', zastr: 'zastrpay', green: 'zastrpay', brand: 'zastrpay', company: 'zastrpay',
};

/* ---------------- the element vocabulary ----------------
   Every element works in every theme. Keys are normalized names (lowercase,
   alphanumeric); values are the canonical element, optionally with a preset
   (callout tone, versus divider). */

const ELEMENTS = ['chips', 'flow', 'callout', 'quote', 'bars', 'split', 'badge', 'gauge',
  'metrics', 'formula', 'code', 'example', 'table', 'compare', 'cards', 'steps', 'checks',
  'panels', 'versus', 'timeline', 'team', 'faq', 'image', 'meta', 'cta', 'html'];

const EL_ALIASES = {
  chips: 'chips', pills: 'chips', tags: 'chips', labels: 'chips', keywords: 'chips', badges: 'chips',
  flow: 'flow', pipeline: 'flow', process: 'flow', arrows: 'flow', diagram: 'flow', sequence: 'flow',
  callout: 'callout', banner: 'callout',
  note: { el: 'callout', tone: 'info' }, info: { el: 'callout', tone: 'info' }, fyi: { el: 'callout', tone: 'info' },
  tip: { el: 'callout', tone: 'tip' }, hint: { el: 'callout', tone: 'tip' }, protip: { el: 'callout', tone: 'tip' },
  warning: { el: 'callout', tone: 'warn' }, warn: { el: 'callout', tone: 'warn' }, caution: { el: 'callout', tone: 'warn' },
  careful: { el: 'callout', tone: 'warn' }, risk: { el: 'callout', tone: 'warn' }, watchout: { el: 'callout', tone: 'warn' },
  important: { el: 'callout', tone: 'key' }, importantnote: { el: 'callout', tone: 'key' }, keypoint: { el: 'callout', tone: 'key' },
  key: { el: 'callout', tone: 'key' }, remember: { el: 'callout', tone: 'key' }, highlight: { el: 'callout', tone: 'key' },
  attention: { el: 'callout', tone: 'key' }, takeaway: { el: 'callout', tone: 'key' },
  quote: 'quote', quotation: 'quote', blockquote: 'quote', saying: 'quote', testimonial: 'quote',
  bars: 'bars', progress: 'bars', progressbars: 'bars', percentages: 'bars',
  split: 'split', splitbars: 'split', coverage: 'split', coveredvsuncovered: 'split',
  badge: 'badge', bignumber: 'badge', heronumber: 'badge', big: 'badge',
  gauge: 'gauge', donut: 'gauge', ring: 'gauge', dial: 'gauge', percentcircle: 'gauge', speedometer: 'gauge',
  metrics: 'metrics', stats: 'metrics', kpis: 'metrics', kpi: 'metrics', numbers: 'metrics', figures: 'metrics',
  formula: 'formula', math: 'formula', equation: 'formula',
  code: 'code', snippet: 'code', codeblock: 'code', terminal: 'code', source: 'code',
  example: 'example', sample: 'example',
  table: 'table', report: 'table', data: 'table', datatable: 'table',
  compare: 'compare', comparison: 'compare', matrix: 'compare', optionstable: 'compare', prosandcons: 'compare',
  cards: 'cards', boxes: 'cards', tiles: 'cards', features: 'cards', options: 'cards', pillars: 'cards',
  steps: 'steps', numbered: 'steps', instructions: 'steps', howto: 'steps', agenda: 'steps',
  checks: 'checks', checklist: 'checks', ticks: 'checks', done: 'checks', benefits: 'checks', checkmarks: 'checks',
  panels: 'panels', twopanels: 'panels', groups: 'panels', sidebyside: 'panels',
  versus: 'versus', vs: 'versus', headtohead: 'versus', abtest: 'versus', eitheror: 'versus',
  beforeafter: { el: 'versus', mid: '→' }, beforevsafter: { el: 'versus', mid: '→' }, nowvsnext: { el: 'versus', mid: '→' },
  timeline: 'timeline', roadmap: 'timeline', milestones: 'timeline', history: 'timeline',
  journey: 'timeline', phases: 'timeline', schedule: 'timeline', plan: 'timeline',
  team: 'team', people: 'team', who: 'team', speakers: 'team', owners: 'team', contacts: 'team', authors: 'team',
  faq: 'faq', qa: 'faq', qanda: 'faq', questions: 'faq', questionsandanswers: 'faq',
  image: 'image', img: 'image', picture: 'image', photo: 'image', screenshot: 'image', figure: 'image',
  meta: 'meta', byline: 'meta', titlemeta: 'meta', details: 'meta',
  cta: 'cta', calltoaction: 'cta', message: 'cta', closingbox: 'cta', action: 'cta',
  html: 'html', raw: 'html', svg: 'html', embed: 'html',
};

/* element body kinds (panels/versus parse their own group bodies) */
const RAW_BLOCKS = ['callout', 'formula', 'example', 'cta', 'html', 'quote'];
const VERBATIM_BLOCKS = ['code'];
const TABLE_BLOCKS = ['table', 'compare'];

/* ---------------- transitions ----------------
   How a slide ENTERS. Deck default via front-matter `transition:`, per slide via
   a `Transition:` line or a {flag}. Going back plays the inverse. */

const TRANSITIONS = ['cut', 'fade', 'push', 'rise', 'zoom', 'flip', 'blur', 'stack', 'iris', 'wipe', 'bubble'];
const TR_ALIASES = {
  cut: 'cut', none: 'cut', instant: 'cut', jump: 'cut',
  fade: 'fade', crossfade: 'fade', cross: 'fade',
  push: 'push', slide: 'push', shove: 'push', pan: 'push', horizontal: 'push',
  rise: 'rise', up: 'rise', lift: 'rise', elevator: 'rise', vertical: 'rise',
  zoom: 'zoom', scale: 'zoom', grow: 'zoom', punch: 'zoom',
  flip: 'flip', card: 'flip', turn: 'flip', rotate: 'flip', pageturn: 'flip',
  blur: 'blur', focus: 'blur', dissolve: 'blur', melt: 'blur', dream: 'blur',
  stack: 'stack', deal: 'stack', ontop: 'stack', cover: 'stack',
  iris: 'iris', reveal: 'iris', eye: 'iris', aperture: 'iris', circlereveal: 'iris',
  wipe: 'wipe', sweep: 'wipe', curtain: 'wipe', swipe: 'wipe',
  bubble: 'bubble', circle: 'bubble', pop: 'bubble', balloon: 'bubble', drop: 'bubble', bubbleup: 'bubble',
  mix: 'mix', varied: 'mix', surprise: 'mix', variety: 'mix',
};
/* deterministic rotation used by `transition: mix` */
const MIX_CYCLE = ['rise', 'iris', 'push', 'bubble', 'zoom', 'wipe', 'blur', 'stack'];

/* ---------------- slide flags ---------------- */

const FLAG_ALIASES = {
  title: 'title', cover: 'title', opening: 'title', start: 'title', hero: 'title', intro: 'title',
  closing: 'closing', end: 'closing', final: 'closing', thanks: 'closing', thankyou: 'closing', outro: 'closing',
  dark: 'dark', night: 'dark', black: 'dark',
  pure: 'pure', white: 'pure', clean: 'pure',
  glow: 'glow',
};

/* ---------------- label lines ----------------
   Plain "Label: text" lines inside a slide. `Notes:` is for the speaker;
   Note:/Tip:/Warning:/… render a visible callout. */

const LABEL_ALIASES = {
  eyebrow: 'eyebrow', kicker: 'eyebrow', overline: 'eyebrow', tagline: 'eyebrow',
  notes: 'notes', speakernotes: 'notes', presenternotes: 'notes', speaker: 'notes',
  transition: 'transition', enter: 'transition', effect: 'transition', animation: 'transition', motion: 'transition',
  quote: 'quote', big: 'big', image: 'image', img: 'image',
  note: 'co:info', info: 'co:info', fyi: 'co:info',
  tip: 'co:tip', hint: 'co:tip', protip: 'co:tip',
  warning: 'co:warn', warn: 'co:warn', caution: 'co:warn', careful: 'co:warn',
  important: 'co:key', importantnote: 'co:key', keypoint: 'co:key', remember: 'co:key',
  callout: 'co:', highlight: 'co:key', takeaway: 'co:key',
};

const CALLOUT_ICONS = { info: 'i', tip: '✦', warn: '!', key: '★' };

/* ---------------- fuzzy resolution ---------------- */

const FILLERS = ['put', 'add', 'show', 'make', 'insert', 'place', 'use', 'render', 'draw',
  'create', 'with', 'a', 'an', 'the', 'my', 'our', 'this', 'here', 'please', 'some', 'as', 'of'];

function norm(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, ''); }

function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const row = [i];
    for (let j = 1; j <= n; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[n];
}

/* Resolve a loose name against an alias map. Tries: exact → singular/plural →
   filler-stripped → unique closest within a small edit distance. Returns the
   alias map value (string or object) or null. Deterministic. */
function resolve(rawName, aliases) {
  const tries = [];
  const n0 = norm(rawName);
  if (n0) tries.push(n0);
  if (n0.endsWith('s')) tries.push(n0.slice(0, -1)); else tries.push(n0 + 's');
  const words = String(rawName).toLowerCase().split(/[^a-z0-9]+/).filter(w => w && !FILLERS.includes(w));
  const stripped = words.join('');
  if (stripped && stripped !== n0) {
    tries.push(stripped);
    if (stripped.endsWith('s')) tries.push(stripped.slice(0, -1)); else tries.push(stripped + 's');
  }
  for (const t of tries) if (aliases[t] !== undefined) return aliases[t];
  // fuzzy: unique best match within distance budget
  for (const t of tries) {
    if (t.length < 3) continue;
    const budget = t.length >= 6 ? 2 : 1;
    let best = null, bestD = budget + 1, ties = 0;
    for (const key of Object.keys(aliases)) {
      if (key.length < 3) continue;
      const d = lev(t, key);
      if (d < bestD) { bestD = d; best = key; ties = 1; }
      else if (d === bestD && aliases[key] !== aliases[best]) ties++;
    }
    if (best && bestD <= budget && ties === 1) return aliases[best];
  }
  return null;
}

function closest(rawName, aliases) {
  const t = norm(rawName);
  let best = null, bestD = 99;
  for (const key of Object.keys(aliases)) {
    const d = lev(t, key);
    if (d < bestD) { bestD = d; best = key; }
  }
  return bestD <= 4 ? best : null;
}

function elSpec(value) { // normalize alias value to {el, tone?, mid?}
  return typeof value === 'string' ? { el: value } : value;
}

/* ---------------- helpers ---------------- */

const errors = [];
const buildNotes = [];
function fail(slide, msg) {
  errors.push((slide != null ? 'slide ' + slide + ': ' : '') + msg);
}
function note(msg) { buildNotes.push(msg); }

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(s, theme) {
  let t = esc(s);
  t = t.replace(/&lt;br&gt;/g, '<br>');
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/==([^=]+)==/g, theme === 'purple'
    ? '<span class="grad-text">$1</span>'
    : '<span class="grad">$1</span>');
  t = t.replace(/\+\+([^+]+)\+\+/g, theme === 'zastrpay'
    ? '<span class="underline-accent">$1</span>'
    : '<strong>$1</strong>');
  return t;
}

function inlineFormula(s) {
  let t = esc(s);
  t = t.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  t = t.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>');
  t = t.replace(/\^(\w)/g, '<sup>$1</sup>');
  return t;
}

function splitFields(s) { return s.split(/\s*\|\s*/).map(f => f.trim()); }

function pct(v) {
  const n = parseInt(String(v).replace(/[^\d-]/g, ''), 10);
  return Math.max(0, Math.min(100, isNaN(n) ? 0 : n));
}

/* ---------------- parsing ---------------- */

function parseFrontMatter(lines) {
  const fm = {};
  let i = 0;
  if (lines[0] !== '---') return { fm, rest: lines };
  for (i = 1; i < lines.length && lines[i] !== '---'; i++) {
    const m = lines[i].match(/^(\w[\w-]*):\s*(.*)$/);
    if (m) fm[m[1].toLowerCase()] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return { fm, rest: lines.slice(i + 1) };
}

function parseItems(lines, slideNo, blockName) {
  // item line: "- text" or "-* ..." (highlight) or "-? ..." (planned/future)
  const items = [];
  for (const ln of lines) {
    const m = ln.match(/^-(\*|\?)?\s+(.*)$/);
    if (!m) {
      if (ln.trim()) fail(slideNo, 'in ::: ' + blockName + ', expected "- item" lines, got: "' + ln.trim() + '"');
      continue;
    }
    items.push({ mod: m[1] || '', fields: splitFields(m[2]) });
  }
  if (!items.length) fail(slideNo, '::: ' + blockName + ' has no "- item" lines');
  return items;
}

function parseTable(lines, slideNo, blockName) {
  const rows = [];
  for (const ln of lines) {
    const t = ln.trim();
    if (!t.startsWith('|')) { if (t) fail(slideNo, '::: ' + blockName + ' expects markdown table rows'); continue; }
    if (/^\|[\s:|-]+\|$/.test(t)) continue; // separator row
    rows.push(t.replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
  }
  if (rows.length < 2) fail(slideNo, '::: ' + blockName + ' needs a header row and at least one data row');
  return rows;
}

function parseGroups(body, slideNo, blockName) {
  const groups = [];
  let g = null;
  for (const b of body) {
    if (b.trim() === '---') { g = null; continue; }
    if (!b.trim()) continue;
    if (!g) {
      const f = splitFields(b);
      g = { label: f[0] || '', heading: f[1] || '', items: [] };
      groups.push(g);
    } else {
      const m2 = b.match(/^-\s+(.*)$/);
      if (m2) g.items.push(m2[1]);
      else fail(slideNo, '::: ' + blockName + ': expected "- item" lines after the "label | heading" line');
    }
  }
  return groups;
}

/* a "Label: text" line → resolved action, or null to treat as plain text */
function matchLabelLine(ln) {
  const m = ln.match(/^([A-Za-z][A-Za-z ]{0,28}?):\s+(.*)$/);
  if (!m) return null;
  const kind = resolve(m[1], LABEL_ALIASES);
  if (!kind) return null;
  return { kind, text: m[2].trim() };
}

function makeCallout(tone, text) {
  return { type: 'callout', tone: tone || '', raw: [text] };
}

function parseQuoteRaw(rawLines) {
  // attribution: a trailing "— name" line, or "text | name" on a single line
  let lines = rawLines.slice();
  let by = '';
  if (lines.length === 1 && lines[0].includes(' | ')) {
    const f = splitFields(lines[0]);
    lines = [f[0]];
    by = f.slice(1).join(' · ');
  } else if (lines.length > 1 && /^(—|–|--|by )/i.test(lines[lines.length - 1].trim())) {
    by = lines.pop().trim().replace(/^(—|–|--|by )\s*/i, '');
  }
  return { type: 'quote', raw: lines, by };
}

function parseSlides(lines) {
  const slides = [];
  let cur = null;
  let i = 0;

  function pushNode(node) { (cur.cols ? cur.right : cur.nodes).push(node); }

  function isStructural(ln) {
    return /^(##\s|:::|```|---\s*$|-\s)/.test(ln) || !!matchLabelLine(ln);
  }

  while (i < lines.length) {
    const ln = lines[i];

    if (ln.startsWith('## ')) {
      // collect every trailing {flags} group — "{closing bubble}" and
      // "{closing} {bubble}" both work
      let title = ln.slice(3).trim();
      const flagTokens = [];
      let fm2;
      while ((fm2 = title.match(/\{([^}]*)\}\s*$/))) {
        flagTokens.unshift(...fm2[1].split(/\s+/).filter(Boolean));
        title = title.slice(0, fm2.index).trim();
      }
      cur = {
        no: slides.length + 1,
        title: title.replace(/^\d+[.)]\s*/, '').trim(),
        role: '', surfaces: [], transition: '',
        eyebrow: '', notes: [], nodes: [], cols: false, right: [],
      };
      for (const f of flagTokens) {
        const flag = resolve(f, FLAG_ALIASES);
        if (flag === 'title' || flag === 'closing') { cur.role = flag; continue; }
        if (flag === 'dark' || flag === 'pure' || flag === 'glow') { cur.surfaces.push(flag); continue; }
        const tr = resolve(f, TR_ALIASES);
        if (tr && tr !== 'mix') { cur.transition = tr; continue; }
        fail(cur.no, 'unknown flag "{' + f + '}" — use a role (title, closing), a surface (dark, pure, glow) or a transition (' + TRANSITIONS.join(', ') + ')');
      }
      slides.push(cur);
      i++; continue;
    }
    if (!cur) { // before the first slide: allow "# deck title" and blanks
      i++; continue;
    }

    const label = matchLabelLine(ln);
    if (label) {
      const { kind, text } = label;
      if (kind === 'eyebrow') cur.eyebrow = text;
      else if (kind === 'notes') cur.notes.push(text);
      else if (kind === 'transition') {
        const tr = resolve(text, TR_ALIASES);
        if (tr && tr !== 'mix') cur.transition = tr;
        else fail(cur.no, 'unknown transition "' + text + '" — one of: ' + TRANSITIONS.join(', '));
      }
      else if (kind === 'quote') {
        // attribution = the part after the LAST dash, so quotes may contain dashes
        const m2 = text.match(/^(.*)\s+(?:—|–|--)\s+(.*)$/);
        pushNode(m2 ? { type: 'quote', raw: [m2[1]], by: m2[2] } : { type: 'quote', raw: [text], by: '' });
      }
      else if (kind === 'big') {
        const f = splitFields(text);
        pushNode({ type: 'badge', items: [{ mod: '', fields: f }] });
      }
      else if (kind === 'image') {
        pushNode({ type: 'image', items: [{ mod: '', fields: splitFields(text) }] });
      }
      else if (kind.startsWith('co:')) pushNode(makeCallout(kind.slice(3), text));
      i++; continue;
    }

    if (/^:::\s*\S/.test(ln)) {
      const head = ln.replace(/^:::\s*/, '');
      const body = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ':::') {
        if (lines[i].startsWith('## ')) { fail(cur.no, '::: block is not closed (reached next slide)'); break; }
        body.push(lines[i]); i++;
      }
      if (i < lines.length && lines[i].trim() === ':::') i++;

      // head = name + optional arg; the name may be several words ("important note")
      const headWords = head.trim().split(/\s+/);
      let spec = resolve(headWords.join(' '), EL_ALIASES);
      let arg = '';
      if (!spec && headWords.length > 1) { // try name minus trailing arg word(s)
        for (let cut = headWords.length - 1; cut >= 1 && !spec; cut--) {
          spec = resolve(headWords.slice(0, cut).join(' '), EL_ALIASES);
          if (spec) arg = headWords.slice(cut).join(' ');
        }
      }
      if (!spec) {
        const near = closest(head, EL_ALIASES);
        fail(cur.no, '::: ' + head.trim() + ' — no matching element' + (near ? ' (closest: "' + near + '")' : '') +
          '. Elements: ' + ELEMENTS.join(', ') + '. Loose names work too — write what you mean.');
        continue;
      }
      spec = elSpec(spec);
      const name = spec.el;

      let node = { type: name, arg };
      if (name === 'callout') {
        node.tone = spec.tone || (arg ? (resolve(arg, { info: 'info', tip: 'tip', warn: 'warn', warning: 'warn', key: 'key', important: 'key' }) || '') : '');
        node.raw = body.filter(b => b.trim() !== '').map(b => b.trim());
        if (!node.raw.length) fail(cur.no, '::: callout is empty');
      } else if (name === 'quote') {
        const raw = body.filter(b => b.trim() !== '').map(b => b.trim());
        if (!raw.length) { fail(cur.no, '::: quote is empty'); continue; }
        node = parseQuoteRaw(raw);
      } else if (name === 'versus') {
        node.groups = parseGroups(body, cur.no, name);
        node.mid = spec.mid || arg || 'VS';
        if (node.groups.length !== 2) fail(cur.no, '::: versus needs exactly 2 groups separated by a "---" line');
      } else if (name === 'panels') {
        node.groups = parseGroups(body, cur.no, name);
        if (node.groups.length < 2) fail(cur.no, '::: panels needs 2+ groups separated by "---" lines');
      } else if (VERBATIM_BLOCKS.includes(name)) {
        let raw = body.slice();
        while (raw.length && !raw[0].trim()) raw.shift();
        while (raw.length && !raw[raw.length - 1].trim()) raw.pop();
        if (!raw.length) { fail(cur.no, '::: code is empty'); continue; }
        const indent = Math.min(...raw.filter(l => l.trim()).map(l => l.match(/^\s*/)[0].length));
        node.raw = raw.map(l => l.slice(indent));
      } else if (RAW_BLOCKS.includes(name)) {
        node.raw = body.filter(b => b.trim() !== '').map(b => b.trim());
        if (!node.raw.length) fail(cur.no, '::: ' + name + ' is empty');
      } else if (TABLE_BLOCKS.includes(name)) {
        node.rows = parseTable(body, cur.no, name);
      } else {
        node.items = parseItems(body, cur.no, name);
      }
      pushNode(node);
      continue;
    }

    if (/^```/.test(ln)) { // markdown code fence → code element
      const lang = ln.replace(/^```+\s*/, '').trim();
      const body = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) { body.push(lines[i]); i++; }
      if (i < lines.length) i++;
      let raw = body.slice();
      while (raw.length && !raw[0].trim()) raw.shift();
      while (raw.length && !raw[raw.length - 1].trim()) raw.pop();
      if (raw.length) {
        const indent = Math.min(...raw.filter(l => l.trim()).map(l => l.match(/^\s*/)[0].length));
        pushNode({ type: 'code', arg: lang, raw: raw.map(l => l.slice(indent)) });
      }
      continue;
    }

    if (ln.trim() === '---') {
      if (cur.cols) fail(cur.no, 'more than one "---" column split');
      cur.cols = true;
      i++; continue;
    }

    if (/^-\s+/.test(ln)) { // top-level bullets → points list
      const pts = [];
      while (i < lines.length && /^-\s+/.test(lines[i])) { pts.push(lines[i].replace(/^-\s+/, '')); i++; }
      pushNode({ type: 'points', items: pts });
      continue;
    }

    if (ln.trim() !== '') { // paragraph: join consecutive text lines
      const buf = [];
      while (i < lines.length && lines[i].trim() !== '' && !isStructural(lines[i])) {
        buf.push(lines[i].trim()); i++;
      }
      pushNode({ type: 'p', text: buf.join(' ') });
      continue;
    }
    i++;
  }
  return slides;
}

/* ---------------- rendering: shared elements ---------------- */

function notesAside(slide, theme) {
  if (!slide.notes.length) return '';
  return '      <aside class="speaker-notes">' + inline(slide.notes.join(' '), theme) + '</aside>\n';
}

function pointsHtml(items, theme) {
  return '<ul class="points">' + items.map(p => '<li>' + inline(p, theme) + '</li>').join('') + '</ul>';
}

function initials(name) {
  const w = name.trim().split(/\s+/).filter(Boolean);
  return ((w[0] || '?')[0] + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase();
}

const GAUGE_C = (2 * Math.PI * 52).toFixed(2); // r=52 circumference

function render(node, t, slide) {
  switch (node.type) {
    case 'p':
      return '<p class="' + (t === 'purple' ? 'sub' : 'lead') + '">' + inline(node.text, t) + '</p>';
    case 'points':
      return pointsHtml(node.items, t);

    case 'chips':
      if (t === 'purple') {
        return '<div class="chips">' + node.items.map(it => {
          let color = 'purple', icon = '◆', text = it.fields.join(' | ');
          const m = text.match(/^\[(\w+)(?::(\S+))?\]\s+(.*)$/);
          if (m) { color = m[1]; icon = m[2] || icon; text = m[3]; }
          return '<span class="chip ' + color + '"><span class="ic">' + esc(icon) + '</span> ' + inline(text, t) + '</span>';
        }).join('') + '</div>';
      }
      return '<div class="payoff">' + node.items.map(it => {
        const text = it.fields.join(' | ').replace(/^\[\w+(?::\S+)?\]\s+/, '');
        return '<span class="chip">' + inline(text, t) + '</span>';
      }).join('') + '</div>';

    case 'flow':
      if (t === 'purple') {
        return '<div class="flow">' + node.items.map(it =>
          '<div class="step' + (it.mod === '*' ? ' hot' : '') + '"><span class="ic">' + esc(it.fields[0] || '•') + '</span><div>' +
          inline(it.fields[1] || '', t) + (it.fields[2] ? '<small>' + inline(it.fields[2], t) + '</small>' : '') + '</div></div>'
        ).join('<span class="arrow">→</span>') + '</div>';
      }
      return '<div class="flow">' + node.items.map(it =>
        '<div class="node' + (it.mod === '*' ? ' gov' : '') + '"><div class="ic">' + esc(it.fields[0] || '•') + '</div><strong>' +
        inline(it.fields[1] || '', t) + '</strong>' + (it.fields[2] ? '<span>' + inline(it.fields[2], t) + '</span>' : '') + '</div>'
      ).join('<div class="arrow">→</div>') + '</div>';

    case 'callout': {
      const cls = (t === 'purple' ? 'moon' : 'note') + (node.tone ? ' tone-' + node.tone : '');
      const ic = node.tone ? '<span class="co-ic">' + CALLOUT_ICONS[node.tone] + '</span>' : '';
      return '<div class="' + cls + '">' + ic + '<span>' + inline(node.raw.join(' '), t) + '</span></div>';
    }

    case 'quote':
      return '<figure class="bigquote"><span class="q-mark">“</span><blockquote>' +
        node.raw.map(r => inline(r, t)).join('<br>') + '</blockquote>' +
        (node.by ? '<figcaption>' + inline(node.by, t) + '</figcaption>' : '') + '</figure>';

    case 'bars':
    case 'split':
      return node.items.map((it, k) => {
        const p = pct(it.fields[1]);
        const top = '<div class="top"><span>' + inline(it.fields[0] || '', t) + '</span><span class="pct">' + p + '%</span></div>';
        const bar = node.type === 'bars'
          ? '<div class="bar"><span style="width:' + p + '%"></span></div>'
          : '<div class="split"><span class="cov" style="width:' + p + '%"></span><span class="unc" style="width:' + (100 - p) + '%"></span></div>';
        return '<div class="meter"' + (k ? ' style="margin-top:22px"' : '') + '>' + top + bar + '</div>';
      }).join('');

    case 'badge': {
      const it = node.items[0];
      return '<div class="badge"><span class="n">' + esc(it.fields[0] || '') + '</span><span class="l">' + esc(it.fields[1] || '') + '</span></div>';
    }

    case 'gauge':
      return '<div class="gauges">' + node.items.map(it => {
        const p = pct(it.fields[0]);
        const dash = (p / 100 * GAUGE_C).toFixed(2);
        return '<div class="gauge"><svg viewBox="0 0 120 120" aria-hidden="true">' +
          '<circle class="g-track" cx="60" cy="60" r="52"/>' +
          '<circle class="g-val" cx="60" cy="60" r="52" stroke-dasharray="' + dash + ' ' + GAUGE_C + '" transform="rotate(-90 60 60)"/>' +
          '</svg><div class="g-num">' + p + '%</div><div class="g-cap">' + inline(it.fields[1] || '', t) + '</div></div>';
      }).join('') + '</div>';

    case 'metrics':
      return '<div class="metrics">' + node.items.map(it =>
        '<div class="metric"><div class="v">' + inline(it.fields[0] || '', t) + '</div><div class="k">' + inline(it.fields[1] || '', t) + '</div></div>'
      ).join('') + '</div>';

    case 'formula':
      return '<div class="formula">' + node.raw.map(inlineFormula).join('<br>') + '</div>';

    case 'example':
      return '<div class="example">' + node.raw.map(r => esc(r).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')).join('<br>') + '</div>';

    case 'code':
      return '<div class="codewin"><div class="codebar"><span class="cdot r"></span><span class="cdot y"></span><span class="cdot g"></span>' +
        (node.arg ? '<span class="ctitle">' + esc(node.arg) + '</span>' : '') +
        '</div><pre><code>' + node.raw.map(esc).join('\n') + '</code></pre></div>';

    case 'table':
    case 'compare': {
      const cls = node.type === 'table' ? 'report' : 'cmp';
      const head = '<thead><tr>' + node.rows[0].map(c => '<th>' + inline(c, t) + '</th>').join('') + '</tr></thead>';
      const body = node.rows.slice(1).map(row => {
        const pick = node.type === 'compare' && row[0].startsWith('*');
        const cells = row.map((c, ci) => {
          if (pick && ci === 0) c = c.replace(/^\*\s*/, '');
          if (node.type === 'compare') {
            if (c === 'y') return '<td class="c yes">✓</td>';
            if (c === 'n') return '<td class="c no">✗</td>';
            if (ci === 0) return '<td class="opt">' + inline(c, t) + (pick ? ' <span class="pick-pill">chosen</span>' : '') + '</td>';
            return '<td class="verdict">' + inline(c, t) + '</td>';
          }
          return '<td' + (ci === 0 ? ' class="name"' : '') + '>' + inline(c, t) + '</td>';
        }).join('');
        return '<tr' + (pick ? ' class="pick"' : '') + '>' + cells + '</tr>';
      }).join('');
      return '<div class="card tablewrap"><table class="' + cls + '">' + head + '<tbody>' + body + '</tbody></table></div>';
    }

    case 'cards': {
      const g = ['2', '3', '4'].includes(node.arg) ? node.arg : String(Math.min(4, Math.max(2, node.items.length)));
      return '<div class="grid g' + g + '">' + node.items.map(it => {
        const cls = it.mod === '*' ? ' win' : it.mod === '?' ? ' soon' : '';
        const pill = it.mod === '*' ? '<span class="pill">' + inline(it.fields[3] || 'Recommended', t) + '</span>'
          : it.mod === '?' ? '<span class="pill soon">' + inline(it.fields[3] || 'Planned', t) + '</span>' : '';
        return '<div class="card' + cls + '">' + pill + '<div class="ic">' + esc(it.fields[0] || '◆') + '</div><h3>' +
          inline(it.fields[1] || '', t) + '</h3><p>' + inline(it.fields[2] || '', t) + '</p></div>';
      }).join('') + '</div>';
    }

    case 'steps':
      return '<div class="steps">' + node.items.map((it, k) =>
        '<div class="step"><span class="n">' + (k + 1) + '</span><span class="body"><strong>' + inline(it.fields[0] || '', t) +
        '</strong><span>' + inline(it.fields[1] || '', t) + '</span></span></div>'
      ).join('') + '</div>';

    case 'checks': {
      const check = it => '<div class="check"><span class="tick">✓</span><span class="tx"><strong>' + inline(it.fields[0] || '', t) +
        '</strong>' + (it.fields[1] ? '<span>' + inline(it.fields[1], t) + '</span>' : '') + '</span></div>';
      if (node.items.length <= 3) return '<div class="checks checks-solo">' + node.items.map(check).join('') + '</div>';
      const half = Math.ceil(node.items.length / 2);
      return '<div class="grid g2 checks-solo"><div class="checks">' +
        node.items.slice(0, half).map(check).join('') + '</div><div class="checks">' +
        node.items.slice(half).map(check).join('') + '</div></div>';
    }

    case 'panels':
      return '<div class="twopanel">' + node.groups.map(g =>
        '<div class="panel"><div class="label">' + inline(g.label, t) + '</div><h3>' + inline(g.heading, t) + '</h3><ul>' +
        g.items.map(li => '<li>' + inline(li, t) + '</li>').join('') + '</ul></div>'
      ).join('') + '</div>';

    case 'versus': {
      const side = (g, cls) => '<div class="vside ' + cls + '"><div class="vlabel">' + inline(g.label, t) + '</div><h3>' +
        inline(g.heading, t) + '</h3><ul>' + g.items.map(li => '<li>' + inline(li, t) + '</li>').join('') + '</ul></div>';
      return '<div class="versus">' + side(node.groups[0], 'a') +
        '<div class="vmid">' + esc(node.mid) + '</div>' + side(node.groups[1], 'b') + '</div>';
    }

    case 'timeline':
      return '<div class="timeline">' + node.items.map(it =>
        '<div class="tl' + (it.mod === '*' ? ' hot' : it.mod === '?' ? ' soon' : '') + '"><span class="tl-dot"></span>' +
        '<span class="tl-when">' + inline(it.fields[0] || '', t) + '</span>' +
        '<strong class="tl-title">' + inline(it.fields[1] || '', t) + '</strong>' +
        (it.fields[2] ? '<span class="tl-sub">' + inline(it.fields[2], t) + '</span>' : '') + '</div>'
      ).join('') + '</div>';

    case 'team':
      return '<div class="team">' + node.items.map(it =>
        '<div class="person"><span class="avatar">' + esc(initials(it.fields[0] || '?')) + '</span><strong>' +
        inline(it.fields[0] || '', t) + '</strong><span class="role">' + inline(it.fields[1] || '', t) + '</span>' +
        (it.fields[2] ? '<span class="p-sub">' + inline(it.fields[2], t) + '</span>' : '') + '</div>'
      ).join('') + '</div>';

    case 'faq':
      return '<div class="faq">' + node.items.map(it =>
        '<div class="qa"><div class="q"><span class="qm">Q</span>' + inline(it.fields[0] || '', t) + '</div>' +
        '<div class="a">' + inline(it.fields[1] || '', t) + '</div></div>'
      ).join('') + '</div>';

    case 'image': {
      const it = node.items[0];
      return '<figure class="pic"><img src="' + esc(node.src || it.fields[0] || '') + '" alt="' + esc(it.fields[2] || it.fields[1] || '') + '">' +
        (it.fields[1] ? '<figcaption>' + inline(it.fields[1], t) + '</figcaption>' : '') + '</figure>';
    }

    case 'meta':
      return '<div class="hero-meta">' + node.items.map(it => '<span>' + inline(it.fields.join(' | '), t) + '</span>').join('') + '</div>';

    case 'cta':
      return '<div class="closing-cta">' + inline(node.raw.join(' '), t) + '</div>';

    case 'html':
      return node.raw.join('\n');

    default:
      fail(slide.no, 'internal: unhandled node ' + node.type);
      return '';
  }
}

/* ---------------- rendering: purple chrome ---------------- */

function purpleSlide(slide, idx) {
  const t = 'purple';
  const eyebrow = slide.eyebrow
    ? '      <span class="eyebrow"><span class="dot"></span> ' + inline(slide.eyebrow, t) + '</span>\n' : '';
  let body = '';

  if (slide.role === 'title' || slide.role === 'closing') {
    const lead = slide.nodes.find(n => n.type === 'p');
    const rest = slide.nodes.filter(n => n !== lead);
    body = eyebrow
      + '      <h1>' + inline(slide.title, t) + '</h1>\n'
      + (lead ? '      <p class="lead">' + inline(lead.text, t) + '</p>\n' : '')
      + rest.map(n => '      ' + render(n, t, slide)).join('\n') + (rest.length ? '\n' : '');
  } else if (slide.cols) {
    const wrap = (nodes) => {
      if (nodes.length === 1 && ['bars', 'split', 'table', 'compare'].includes(nodes[0].type)) {
        if (nodes[0].type === 'table' || nodes[0].type === 'compare') return render(nodes[0], t, slide);
        return '<div class="card">' + render(nodes[0], t, slide) + '</div>';
      }
      if (nodes.length && ['badge', 'gauge'].includes(nodes[0].type)) {
        return '<div style="display:grid;place-items:center">' + nodes.map(n => render(n, t, slide)).join('') + '</div>';
      }
      return '<div>' + nodes.map(n => render(n, t, slide)).join('') + '</div>';
    };
    body = eyebrow
      + '      <div class="grid2">\n'
      + '        <div>\n'
      + '          <h2>' + inline(slide.title, t) + '</h2>\n'
      + slide.nodes.map(n => '          ' + render(n, t, slide)).join('\n') + (slide.nodes.length ? '\n' : '')
      + '        </div>\n'
      + '        ' + wrap(slide.right) + '\n'
      + '      </div>\n';
  } else {
    body = eyebrow
      + '      <h2>' + inline(slide.title, t) + '</h2>\n'
      + slide.nodes.map(n => '      ' + render(n, t, slide)).join('\n') + (slide.nodes.length ? '\n' : '');
  }

  const cls = ['slide'];
  if (slide.surfaces.includes('dark')) cls.push('dark');
  if (slide.role === 'closing') cls.push('closing');
  if (idx === 0) cls.push('active');
  return '    <!-- ' + slide.no + ' · ' + slide.title.replace(/-->/g, '') + ' -->\n'
    + '    <section class="' + cls.join(' ') + '"' + (slide.transition ? ' data-transition="' + slide.transition + '"' : '') + '>\n'
    + body + notesAside(slide, t)
    + '    </section>\n';
}

/* ---------------- rendering: zastrpay chrome ---------------- */

const ZP_LOGO_USE = '<svg class="zp-logo" viewBox="0 0 480 80" role="img" aria-label="zastrpay"><use href="#zp-logo"/></svg>';

function zastrSlide(slide, idx, fm, anim) {
  const t = 'zastrpay';
  const isTitle = slide.role === 'title';
  const isClosing = slide.role === 'closing';
  let surface = 'light';
  if (isTitle) surface = 'dark glow bl';
  else if (isClosing) surface = 'dark glow';
  else {
    if (slide.surfaces.includes('dark')) surface = 'dark';
    if (slide.surfaces.includes('pure')) surface = 'light pure';
    if (slide.surfaces.includes('glow')) surface += ' glow';
  }

  const eyebrow = slide.eyebrow ? '      <span class="eyebrow">' + inline(slide.eyebrow, t) + '</span>\n' : '';
  const tag = fm.brand || fm.tag || '';
  const topbar = (isTitle || isClosing) ? '' :
    '    <div class="topbar">\n      ' + ZP_LOGO_USE + '\n' +
    (tag ? '      <span class="tag"' + (surface.startsWith('dark') ? ' style="color:#9aa0b2"' : '') + '>' + inline(tag, t) + '</span>\n' : '') +
    '    </div>\n';

  let inner = '';
  if (isTitle) {
    const lead = slide.nodes.find(n => n.type === 'p');
    const rest = slide.nodes.filter(n => n !== lead);
    inner = '      <div class="hero-top">\n        ' + ZP_LOGO_USE + '\n'
      + '        <span style="color:#9aa0b2;font-weight:600;letter-spacing:.1em;text-transform:uppercase;font-size:.82rem;">Presentation</span>\n      </div>\n'
      + eyebrow
      + '      <h1>' + inline(slide.title, t) + '</h1>\n'
      + (lead ? '      <p class="lead" style="margin-top:clamp(1.8rem,4vh,2.6rem);font-size:clamp(1.2rem,2.1vw,1.7rem);">' + inline(lead.text, t) + '</p>\n' : '')
      + rest.map(n => '      ' + render(n, t, slide)).join('\n') + (rest.length ? '\n' : '');
  } else if (isClosing) {
    inner = eyebrow
      + '      <h1>' + inline(slide.title, t) + '</h1>\n'
      + slide.nodes.map(n => '      ' + render(n, t, slide)).join('\n') + (slide.nodes.length ? '\n' : '')
      + '      <div class="hero-meta" style="margin-top:clamp(2.4rem,6vh,4rem); justify-content:space-between;">\n'
      + '        <svg class="zp-logo lg" viewBox="0 0 480 80" role="img" aria-label="zastrpay"><use href="#zp-logo"/></svg>\n'
      + (fm.quote ? '        <span style="font-style:italic;color:#c3c7d4;">“' + inline(fm.quote, t) + '”</span>\n' : '')
      + '      </div>\n'
      + '      <p style="margin-top:1.6rem;color:#9aa0b2;font-weight:600;letter-spacing:.04em;">Thank you.</p>\n';
  } else if (slide.cols) {
    inner = eyebrow
      + '      <h2>' + inline(slide.title, t) + '</h2>\n'
      + '      <div class="grid g2" style="margin-top:clamp(2.8rem,6vh,4.4rem)">\n'
      + '        <div>\n' + slide.nodes.map(n => '          ' + render(n, t, slide)).join('\n') + (slide.nodes.length ? '\n' : '') + '        </div>\n'
      + '        <div>\n' + slide.right.map(n => '          ' + render(n, t, slide)).join('\n') + (slide.right.length ? '\n' : '') + '        </div>\n'
      + '      </div>\n';
  } else {
    inner = eyebrow
      + '      <h2>' + inline(slide.title, t) + '</h2>\n'
      + slide.nodes.map(n => '      ' + render(n, t, slide)).join('\n') + (slide.nodes.length ? '\n' : '');
  }

  const active = anim && idx === 0 ? ' active' : '';
  return '  <!-- ' + slide.no + ' · ' + slide.title.replace(/-->/g, '') + ' -->\n'
    + '  <section class="slide ' + surface + active + '"' + (slide.transition ? ' data-transition="' + slide.transition + '"' : '') + '>\n'
    + topbar
    + '    <div class="inner">\n' + inner + '    </div>\n'
    + notesAside(slide, t)
    + '  </section>\n';
}

/* ---------------- document assembly ---------------- */

function buildHtml(fm, slides, theme, deckTransition) {
  const anim = !!deckTransition;
  const nav = anim ? 'anim' : THEMES[theme].nav;
  const title = fm.title || 'Presentation';
  const head = '<!DOCTYPE html>\n<html lang="en">\n<head>\n'
    + '<meta charset="utf-8" />\n<meta name="viewport" content="width=device-width, initial-scale=1" />\n'
    + '<title>' + esc(title) + '</title>\n'
    + '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
    + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
    + THEMES[theme].font + '\n'
    + '<link rel="stylesheet" href="shared/presenter.css">\n'
    + '<link rel="stylesheet" href="style.css">\n'
    + '</head>\n<body>\n';

  const deckAttrs = ' id="deck" data-nav="' + nav + '"' + (anim ? ' data-transition="' + deckTransition + '"' : '');

  let chrome1 = '', chrome2 = '';
  if (theme === 'purple') {
    chrome1 = '  <div class="blob a"></div><div class="blob b"></div><div class="blob c"></div>\n'
      + '  <div class="brand"><span class="sq"></span> ' + inline(fm.brand || title, 'purple') + '</div>\n'
      + '  <div class="count"><b id="cur">01</b> / <span id="total">' + String(slides.length).padStart(2, '0') + '</span></div>\n\n'
      + '  <div class="deck"' + deckAttrs + '>\n\n';
    chrome2 = '  </div>\n\n'
      + '  <div class="nav">\n'
      + '    <button class="nbtn" id="prev" aria-label="Previous slide">‹</button>\n'
      + '    <div class="dots" id="dots"></div>\n'
      + '    <button class="nbtn" id="next" aria-label="Next slide">›</button>\n'
      + '    <button class="nbtn" id="remote" title="Speaker remote (R)" aria-label="Open speaker remote" style="font-size:14px">⧉</button>\n'
      + '  </div>\n'
      + '  <div class="hint" id="hint">← → navigate · S notes · R remote · F fullscreen</div>\n';
  } else {
    const logo = fs.readFileSync(path.join(SKILL_DIR, 'themes', 'zastrpay-logo.html'), 'utf8').trimEnd();
    const hintKey = anim ? '→' : '↓';
    const hintWord = anim ? 'navigate' : 'scroll';
    chrome1 = logo + '\n\n<div class="progress"><div class="bar" id="bar"></div></div>\n\n'
      + '<main class="deck"' + deckAttrs + '>\n\n';
    chrome2 = '</main>\n\n'
      + '<nav class="dots" id="dots" aria-label="Slide navigation"></nav>\n'
      + '<div class="counter"><b id="cur">01</b> / <span id="total">' + String(slides.length).padStart(2, '0') + '</span></div>\n'
      + '<div class="arrows">\n'
      + '  <button id="remote" title="Speaker remote (R)" aria-label="Open speaker remote">⧉</button>\n'
      + '  <button id="prev" aria-label="Previous slide">↑</button>\n'
      + '  <button id="next" aria-label="Next slide">↓</button>\n'
      + '</div>\n'
      + '<div class="hint" id="hint"><span class="key">' + hintKey + '</span> ' + hintWord + ' · <span class="key">S</span> notes · <span class="key">R</span> remote · <span class="key">F</span> fullscreen</div>\n';
  }

  const body = slides.map((s, i) => theme === 'purple' ? purpleSlide(s, i) : zastrSlide(s, i, fm, anim)).join('\n');
  return head + chrome1 + body + '\n' + chrome2 + '\n<script src="shared/presenter.js"></script>\n</body>\n</html>\n';
}

function copyShared(outDir) {
  const src = path.join(SKILL_DIR, 'shared');
  const dst = path.join(outDir, 'shared');
  fs.rmSync(dst, { recursive: true, force: true });
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(src)) fs.copyFileSync(path.join(src, f), path.join(dst, f));
}

/* collect local images referenced by ::: image, validate them, and plan the
   copies into output/assets/ so the deck folder stays self-contained */
function planAssets(slides, mdDir) {
  const copies = []; // {from, to}
  const taken = new Map(); // basename → abs source
  for (const slide of slides) {
    for (const node of slide.nodes.concat(slide.right)) {
      if (node.type !== 'image') continue;
      const src = (node.items[0].fields[0] || '').trim();
      if (!src) { fail(slide.no, '::: image needs a path or URL as the first field'); continue; }
      if (/^(https?:|data:)/i.test(src)) { node.src = src; continue; }
      const abs = path.resolve(mdDir, src);
      if (!fs.existsSync(abs)) { fail(slide.no, 'image not found: ' + src); continue; }
      let name = path.basename(abs);
      if (taken.has(name) && taken.get(name) !== abs) name = copies.length + '-' + name;
      taken.set(name, abs);
      node.src = 'assets/' + name;
      copies.push({ from: abs, to: name });
    }
  }
  return copies;
}

/* ---------------- main ---------------- */

function main() {
  const args = process.argv.slice(2);
  const outFlag = args.indexOf('--out');
  const outArg = outFlag !== -1 ? args.splice(outFlag, 2)[1] : null;
  const mdPath = args[0];
  if (!mdPath) { console.error('usage: node compile.js <deck.md> [--out <dir>]'); process.exit(2); }
  if (!fs.existsSync(mdPath)) { console.error('not found: ' + mdPath); process.exit(2); }

  const raw = fs.readFileSync(mdPath, 'utf8');

  // unresolved [[ directives ]] block the build
  const directives = [...raw.matchAll(/\[\[([\s\S]*?)\]\]/g)];
  if (directives.length) {
    console.error('Build blocked — unresolved [[ directives ]] in ' + mdPath + ':');
    directives.forEach(d => console.error('  [[' + d[1].trim() + ']]'));
    console.error('Ask the presenter skill to sync (it resolves directives into the md), or remove them.');
    process.exit(1);
  }

  const lines = raw.split(/\r?\n/);
  const { fm, rest } = parseFrontMatter(lines);
  let theme = 'purple';
  if (fm.theme) {
    const resolved = resolve(fm.theme, THEME_ALIASES);
    if (resolved) theme = resolved;
    else { console.error('front-matter "theme" must be one of: purple, zastrpay (got "' + fm.theme + '")'); process.exit(1); }
  } else {
    note('no theme set — defaulting to purple');
  }
  if (!fm.title) {
    const h1 = rest.find(l => l.startsWith('# '));
    fm.title = h1 ? h1.slice(2).trim() : path.basename(mdPath, '.md');
  }

  const slides = parseSlides(rest);
  if (!slides.length) fail(null, 'no slides found (a slide starts with "## Title")');

  // surfaces that purple doesn't paint are dropped quietly, not errors
  if (theme === 'purple') {
    for (const s of slides) {
      const drop = s.surfaces.filter(x => x === 'pure' || x === 'glow');
      if (drop.length) { note('slide ' + s.no + ': {' + drop.join(' ') + '} is zastrpay-only — ignored'); }
      s.surfaces = s.surfaces.filter(x => x === 'dark');
    }
  }

  // transitions: deck default + per slide; `mix` deals a deterministic rotation
  let deckTransition = '';
  const fmTr = fm.transition || fm.transitions || '';
  if (fmTr) {
    const tr = resolve(fmTr, TR_ALIASES);
    if (!tr) fail(null, 'front-matter transition "' + fmTr + '" — one of: ' + TRANSITIONS.join(', ') + ', mix');
    else if (tr === 'mix') {
      deckTransition = 'fade';
      slides.forEach((s, k) => { if (!s.transition) s.transition = MIX_CYCLE[k % MIX_CYCLE.length]; });
    } else deckTransition = tr;
  } else if (slides.some(s => s.transition)) {
    deckTransition = 'fade'; // per-slide transitions exist → animated deck with a calm default
  }

  const mdDir = path.dirname(path.resolve(mdPath));
  const assetCopies = planAssets(slides, mdDir);

  if (errors.length) {
    console.error('Build failed — ' + errors.length + ' error(s):');
    errors.forEach(e => console.error('  - ' + e));
    process.exit(1);
  }

  const slug = path.basename(mdPath, '.md');
  const outDir = outArg ? path.resolve(outArg)
    : fm.output ? path.resolve(mdDir, fm.output)
    : path.join(mdDir, 'output', slug);

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), buildHtml(fm, slides, theme, deckTransition));
  fs.copyFileSync(path.join(SKILL_DIR, THEMES[theme].css), path.join(outDir, 'style.css'));
  if (assetCopies.length) {
    fs.mkdirSync(path.join(outDir, 'assets'), { recursive: true });
    for (const c of assetCopies) fs.copyFileSync(c.from, path.join(outDir, 'assets', c.to));
  }
  copyShared(outDir);

  buildNotes.forEach(n => console.error('note: ' + n));
  console.log('built ' + slides.length + ' slides (' + theme + (deckTransition ? ' · ' + (fmTr && resolve(fmTr, TR_ALIASES) === 'mix' ? 'mix' : deckTransition) + ' transitions' : '') + ') → ' + outDir);
}

main();
