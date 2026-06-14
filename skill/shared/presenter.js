/* Presenter shared runtime — deck-side controller.
   Contract: #deck[data-nav="fade"|"scroll"|"anim"] containing .slide sections,
   one optional <aside class="speaker-notes"> per slide. Optional chrome, wired
   by id when present: #prev #next #dots #cur #total #bar #hint #remote.
   Keys: arrows/space/PgUp/PgDn/Home/End navigate · S notes panel · F fullscreen ·
   R speaker remote. The remote (remote.html, next to this file) talks over
   postMessage and reconnects on its own if either window reloads.

   anim mode: slides are stacked and changes play a transition. The deck's
   data-transition is the default; a slide's own data-transition is how that
   slide ENTERS (going back plays the inverse of the transition that led here).
   bubble and wipe run on the #presenter-veil overlay; bubble grows from the
   last click/tap position. prefers-reduced-motion collapses everything. */
(function () {
  'use strict';

  var deck = document.getElementById('deck');
  if (!deck) return;

  var navAttr = deck.getAttribute('data-nav');
  var mode = navAttr === 'scroll' ? 'scroll' : navAttr === 'anim' ? 'anim' : 'fade';
  var slides = Array.prototype.slice.call(deck.querySelectorAll('.slide'));
  if (!slides.length) return;

  var current = 0;
  var remoteWin = null;

  var curEl = document.getElementById('cur');
  var totalEl = document.getElementById('total');
  var barEl = document.getElementById('bar');
  var hintEl = document.getElementById('hint');
  var dotsWrap = document.getElementById('dots');
  var dots = [];

  function pad(n) { return String(n).padStart(2, '0'); }
  function clamp(i) { return Math.max(0, Math.min(slides.length - 1, i)); }

  function titleOf(i) {
    var h = slides[i].querySelector('h1, h2, h3');
    return h ? h.textContent.replace(/\s+/g, ' ').trim() : 'Slide ' + (i + 1);
  }
  function notesOf(i) {
    var a = slides[i].querySelector('.speaker-notes');
    return a ? a.innerHTML.trim() : '';
  }

  if (totalEl) totalEl.textContent = pad(slides.length);
  if (dotsWrap) {
    slides.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      b.addEventListener('click', function () { go(i); });
      dotsWrap.appendChild(b);
    });
    dots = Array.prototype.slice.call(dotsWrap.children);
  }

  /* ---- notes panel (S) and toast ---- */
  var panel = document.createElement('div');
  panel.id = 'presenter-notes-panel';
  panel.innerHTML = '<h3></h3><div class="body"></div>';
  document.body.appendChild(panel);

  var toastEl = document.createElement('div');
  toastEl.id = 'presenter-toast';
  document.body.appendChild(toastEl);
  var toastTimer = null;

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2800);
  }

  function renderNotesPanel() {
    panel.querySelector('h3').textContent = (current + 1) + ' / ' + slides.length + ' · ' + titleOf(current);
    panel.querySelector('.body').innerHTML = notesOf(current) || '<em>No notes for this slide.</em>';
  }

  /* ---- transitions (anim mode) ---- */
  var TR = { // name → [enter/exit ms, veil reveal ms (two-phase only)]
    cut: [0, 0], fade: [540, 0], push: [660, 0], rise: [660, 0], zoom: [640, 0],
    flip: [790, 0], blur: [700, 0], stack: [660, 0], iris: [800, 0],
    wipe: [440, 440], bubble: [500, 520]
  };
  var VEIL_KIND = { bubble: 1, wipe: 1 };
  var deckDefault = deck.getAttribute('data-transition') || 'fade';
  if (!TR[deckDefault]) deckDefault = 'fade';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var animating = false;

  var veil = null;
  if (mode === 'anim') {
    veil = document.createElement('div');
    veil.id = 'presenter-veil';
    veil.innerHTML = '<span class="v-circle"></span><span class="v-band"></span>';
    document.body.appendChild(veil);
    // bubble grows from where the presenter last clicked/tapped
    document.addEventListener('pointerdown', function (e) {
      veil.style.setProperty('--tx', (e.clientX / window.innerWidth * 100).toFixed(1) + '%');
      veil.style.setProperty('--ty', (e.clientY / window.innerHeight * 100).toFixed(1) + '%');
      deck.style.setProperty('--tx', (e.clientX / window.innerWidth * 100).toFixed(1) + '%');
      deck.style.setProperty('--ty', (e.clientY / window.innerHeight * 100).toFixed(1) + '%');
    });
  }

  function transOf(i) {
    var t = slides[i].getAttribute('data-transition');
    return t && TR[t] ? t : deckDefault;
  }

  function clearTransClasses(el) {
    el.className = el.className.replace(/\s*\b(entering|leaving|tr-[a-z]+)\b/g, '');
    el.removeAttribute('data-dir');
  }

  function animateTo(i) {
    var dir = i > current ? 'fwd' : 'back';
    // forward: the entering slide's transition; back: undo the leaving slide's
    var name = dir === 'fwd' ? transOf(i) : transOf(current);
    if (reduced) name = 'cut';
    var enter = slides[i], leave = slides[current];

    if (name === 'cut' || TR[name][0] === 0) { setActive(i); return; }
    animating = true;

    if (VEIL_KIND[name]) { // two-phase: cover the page, swap behind it, reveal
      var coverMs = TR[name][0], revealMs = TR[name][1];
      veil.className = name + ' cover' + (dir === 'back' ? ' back' : '');
      setTimeout(function () {
        setActive(i);
        // force a restart of the veil animation between phases
        void veil.offsetWidth;
        veil.className = name + ' reveal' + (dir === 'back' ? ' back' : '');
        setTimeout(function () { veil.className = ''; animating = false; }, revealMs + 40);
      }, coverMs + 10);
      return;
    }

    setActive(i);
    leave.classList.add('leaving', 'tr-' + name);
    leave.setAttribute('data-dir', dir);
    enter.classList.add('entering', 'tr-' + name);
    enter.setAttribute('data-dir', dir);
    setTimeout(function () {
      clearTransClasses(leave);
      clearTransClasses(enter);
      animating = false;
    }, TR[name][0] + 60);
  }

  /* ---- navigation ---- */
  function setActive(i) {
    current = i;
    if (mode !== 'scroll') {
      slides.forEach(function (s, k) { s.classList.toggle('active', k === i); });
    }
    dots.forEach(function (d, k) { d.classList.toggle('active', k === i); });
    if (curEl) curEl.textContent = pad(i + 1);
    if (barEl) barEl.style.width = (slides.length > 1 ? i / (slides.length - 1) * 100 : 100) + '%';
    if (hintEl) hintEl.style.opacity = i > 0 ? '0' : '1';
    renderNotesPanel();
    sendState();
  }

  function go(i) {
    i = clamp(i);
    if (i === current) return;
    if (mode === 'scroll') slides[i].scrollIntoView({ behavior: 'smooth' });
    else if (mode === 'anim') { if (!animating) animateTo(i); }
    else setActive(i);
  }

  if (mode === 'scroll') {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && e.intersectionRatio >= 0.55) setActive(slides.indexOf(e.target));
      });
    }, { root: deck, threshold: [0.55] });
    slides.forEach(function (s) { io.observe(s); });
  }

  /* ---- fullscreen (F, or the remote's button) ---- */
  function toggleFullscreen() {
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    var p = document.documentElement.requestFullscreen();
    if (p && p.catch) p.catch(function () {
      toast('Fullscreen was blocked here — press F in the deck window.');
    });
  }
  document.addEventListener('fullscreenchange', sendState);

  /* ---- speaker remote (R) ---- */
  var src = (document.currentScript && document.currentScript.src) || 'shared/presenter.js';
  var remoteUrl = src.replace(/presenter\.js([?#].*)?$/, 'remote.html');

  function openRemote() {
    remoteWin = window.open(remoteUrl, 'presenterRemote', 'width=980,height=640');
    if (!remoteWin) toast('Pop-up blocked — allow pop-ups to open the speaker remote.');
  }

  function sendState() {
    if (remoteWin && !remoteWin.closed) {
      remoteWin.postMessage({ type: 'state', current: current, fullscreen: !!document.fullscreenElement }, '*');
    }
  }

  function sendInit(target) {
    target.postMessage({
      type: 'init',
      title: document.title,
      current: current,
      fullscreen: !!document.fullscreenElement,
      slides: slides.map(function (_, i) { return { title: titleOf(i), notes: notesOf(i) }; })
    }, '*');
  }

  window.addEventListener('message', function (e) {
    var m = e.data;
    if (!m || typeof m.type !== 'string') return;
    if (m.type === 'hello') { remoteWin = e.source; sendInit(e.source); }
    else if (m.type === 'next') go(current + 1);
    else if (m.type === 'prev') go(current - 1);
    else if (m.type === 'goto') go(m.index | 0);
    else if (m.type === 'fullscreen') toggleFullscreen();
  });

  /* ---- buttons + keys ---- */
  var prevBtn = document.getElementById('prev');
  var nextBtn = document.getElementById('next');
  var remoteBtn = document.getElementById('remote');
  if (prevBtn) prevBtn.addEventListener('click', function () { go(current - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { go(current + 1); });
  if (remoteBtn) remoteBtn.addEventListener('click', openRemote);

  /* blur clicked buttons so space keeps navigating instead of re-clicking them */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button');
    if (b) b.blur();
  });

  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].indexOf(e.key) !== -1) { e.preventDefault(); go(current + 1); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].indexOf(e.key) !== -1) { e.preventDefault(); go(current - 1); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(slides.length - 1); }
    else if (e.key === 's' || e.key === 'S') panel.classList.toggle('open');
    else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    else if (e.key === 'r' || e.key === 'R') openRemote();
  });

  setActive(0);
})();
