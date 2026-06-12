---
name: presenter
description: |
  Quickly create a tailored HTML presentation from a topic plus the user's repos
  and docs. Use whenever someone wants to build a deck, slides, a talk, a tech
  talk, a demo, a stakeholder update or a readout — or asks to "present",
  "explain to the team", or "show leadership" a feature, architecture, or change,
  even if they don't say the word "presentation". Adapts to audience (Development
  Team vs Company-Wide), duration (5/10/15/30/60 min), and theme (Purple,
  Zastrpay, or Image-Inspired). First creates an editable Slidedown outline (the
  deterministic presentation language documented in README.md) plus the compiled
  HTML deck and reports both; "/presenter sync" recompiles the outline on demand;
  only on a later explicit "/presenter loop" does it watch the outline and
  live-rebuild the HTML on each change, until "/presenter stop".
user-invocable: true
---

# Presenter

Turn a topic into a focused, self-contained HTML deck — shaped for an audience,
sized to a time slot, and styled with a chosen theme. Grounded in the user's
actual code and docs, not generic slideware.

## Inputs

Ask for any of the first four that are missing; don't guess them.

1. **Audience** — `Development Team` or `Company-Wide`
2. **Duration** — `5`, `10`, `15`, `30`, or `60` minutes
3. **Theme** — `Purple`, `Zastrpay`, or `Image-Inspired` (needs an image)
4. **Subject** — the topic and any notes to expand
5. **Sources** (optional but encouraged) — repositories, docs, an existing deck

## How it runs

The user drives this in explicit steps, and the **create step does not start any
loop** — the watch loop runs only when asked for separately. The editable outline
is created in the **current directory** and the built deck in an
**`./output/<slug>/` folder** under it, sharing a base name from the topic, e.g.
`id-austria-dev-30min.md` and `output/id-austria-dev-30min/index.html`.

**Step 1 — create (the first prompt)**
1. Confirm the four inputs (audience, duration, theme, subject); ask for any missing.
2. Read the sources first — repos and docs are the source of truth. Reuse their real
   names, architecture, and terminology (see the vocab files); never invent detail
   that conflicts with the code; ask if something needed is unclear.
3. Decide the throughline (the one sentence the audience should remember) and order
   the slides as a story (e.g. problem → approach → result), one idea per slide,
   sized to the duration/audience budget.
4. Write the outline to `./<slug>.md` **in Slidedown** — the deterministic
   presentation language specified in `README.md` (in this folder; every element
   works in both themes). Translate the user's content into Slidedown elements,
   applying every rule below — audience, duration budget, element choice,
   transitions, diagrams, speaker notes, quality. Then build the deck by
   **running the compiler**:
   `node <skill-folder>/compiler/compile.js ./<slug>.md`. It writes
   `./output/<slug>/` (`index.html` + `style.css` + `shared/`, plus `assets/`
   when slides embed local images). The compiler is the only thing that writes
   deck html — **never hand-write or post-edit it**. If the build fails, fix the
   md and re-run; the errors name the slide and element.
5. Open both for the user side by side — the outline in the editor
   (`open -a "Rider" ./<slug>.md`) and the rendered deck in the browser
   (`open ./output/<slug>/index.html`) — and **report both paths** plus the
   fullscreen present command (below). Then stop. Do **not** start a loop; mention
   that `/presenter loop` will begin live rebuilds.

**Step 2 — sync (`/presenter sync`)**
6. The user edited the md and wants it compiled. First resolve any
   `[[ directives ]]` by **editing the md** — replace each with the real content
   it asks for (the compiler refuses to build while any remain). Then run the
   compiler once and report the result; on errors, show them, fix the md only if
   the fix is unambiguous, otherwise ask.

**Step 3 — watch loop (only when explicitly asked, e.g. `/presenter loop`)**
7. Start the loop only on a later, explicit request — never as part of Step 1. Note
   the md's modified time, then about once a minute check it: if the md changed,
   run a sync (directives, then compiler) and update the noted time; if not, do
   nothing; if it's empty or mid-edit, skip and wait. Drive the cadence with the
   harness loop / scheduled-wakeup facility (~60s — schedule the next check ≈60s
   out and re-enter on wake); never foreground-sleep. If no deck exists yet, do
   Step 1 first, then start the loop.

**Step 4 — stop (`/presenter stop`)**
8. Stop the loop now — no rebuild, no reschedule — and report the final paths plus
   the fullscreen present command (below).

**Rendering — no image previews.** Show the deck by opening it in the browser
(`open ./output/<slug>/index.html`) so it renders side by side with the editor. Do
**not** generate screenshot / JPEG / PNG previews of the deck, and do not start a
preview-screenshot tool to "verify" it — that wastes time; the browser is the
preview. On a rebuild the files are overwritten in place, so the already-open
browser shows the new version on reload.

**Presenting — fullscreen (Chrome kiosk).** When the deck is ready, give the user
the command to present it in true fullscreen kiosk mode (no tabs, no address bar),
using the deck's **absolute** path:

```
open -na "Google Chrome" --args --kiosk --app="file:///absolute/path/to/output/<slug>/index.html"
```

`--kiosk` is real fullscreen kiosk, `--app` drops all browser chrome; quit with ⌘Q.
Report this command (do not run it automatically — presenting is the user's call).

**Presenting — speaker remote.** In the deck, `R` (or the ⧉ nav button) opens the
speaker remote: a separate window with the current slide's notes, an up-next line,
a clickable list of all slides, prev/next, and a deck fullscreen toggle. It pairs
with the deck window it was opened from and reconnects by itself if either window
reloads. Tell the user: if the browser blocks the pop-up, allow pop-ups for the
deck; and when using the remote, prefer presenting via `F` (fullscreen) + `R` in a
normal browser window over the kiosk command, since kiosk launches a separate
window the remote isn't paired with.

### The outline language — Slidedown

The outline is written in **Slidedown**, the deterministic presentation language
specified in `README.md` (in this folder). Read that spec before writing or
editing an outline — it defines the front-matter, slide flags, label lines,
inline marks, every element, and the transitions. The shape, at a glance:

```
---
title: Deck title — one-line throughline
theme: zastrpay
brand: Topbar tag / brand text
transition: rise
audience: Development Team
duration: 30
---

## Slide title {title}
Eyebrow: kicker · 01
Lead paragraph.
Notes: speaker notes — talking points, transition to the next slide.

## Another slide {bubble}
Tip: label lines like this render as visible callouts.
::: flow
- ① | Service A | receives the event
-* ② | Service B | the step to dwell on
:::
```

**Every element works in both themes**, and the language is forgiving: element
names, slide flags, labels and theme names resolve through aliases and a fuzzy
matcher (`::: pills`, `::: important note`, `Warning: …`, `{thanks}` all land).
When the skill writes or edits an outline it still uses the **canonical names**
from `README.md` — forgiveness is for humans typing quickly, not an excuse for
sloppy generated md. If a user writes intent the compiler can't resolve (the
build error names the closest element), translate it to the nearest element on
sync rather than bouncing the error back to them.

Compilation is deterministic: the same md always produces the same html. Never
free-style html — express content through Slidedown elements. Use the
`::: html` escape hatch only for custom SVG diagrams.

**Element choice.** Pick the element that matches the concept, not always the
same three: roadmaps/milestones → `timeline`; before/after or any
two-way choice → `versus`; one percentage that matters → `gauge` or `badge`;
several KPIs → `metrics`; quotes/testimonials → `quote`; Q&A or objections →
`faq`; people/owners → `team`; real code for dev audiences → `code`;
warnings/tips/key points → callout tones (`Tip:` / `Warning:` / `Important:`).
Variety keeps a deck colorful — but still one idea per slide.

### Inline directives — `[[ ... ]]`

Inside the md, text wrapped in `[[ double brackets ]]` is a **directive** — an
instruction to this skill, not slide content, e.g.
`[[ use the real service name from the repo ]]`,
`[[ make this slide a 3-node flow instead of text ]]`,
`[[ too salesy — make it factual ]]`.

On every sync/loop rebuild, resolve each directive **by editing the md**:
replace it with the content it asks for (consulting sources as needed), then
compile. The compiler hard-fails while any `[[ ]]` remains, so a directive can
never leak into a deck. Single backticks are plain inline code in Slidedown —
they are **not** directives.

## Commands

- `/presenter <brief>` — create the Slidedown `.md` outline + the
  `output/<slug>/` deck folder (via the compiler) and report both paths. No loop
  is started.
- `/presenter sync` — resolve `[[ directives ]]` into the md, then compile once
  and report.
- `/presenter loop` — start the once-a-minute watch loop that syncs the deck
  folder whenever the `.md` changes.
- `/presenter stop` — stop the watch loop and report the final paths.

## Audience

**Development Team** (engineers, architects, leads) — technical depth is welcome.
Show real architecture, communication/integration patterns, design patterns, and
small code excerpts when they teach. Explain trade-offs and why a decision was
made. Diagrams (architecture, sequence, event/communication flow) are encouraged.
Use the in-house names from `vocabulary-dev.md` (in this folder).

**Company-Wide** (leadership, product, ops, non-technical) — no jargon. Lead with
outcomes and business value, not implementation. Keep slides simple and visual,
and prefer a clear before/after or a simple flow over text. Use the plain-language
terms from `vocabulary-company.md` (in this folder) and avoid the jargon it lists.

## Duration → slide budget

Plan to finish inside the slot with a little buffer; for 30/60 min leave a
separate few minutes for questions. Counts include the title and closing.

| Duration | Company-Wide | Dev Team | Diagrams |
|---|---|---|---|
| 5 min  | 4–5   | 3–4   | 0–1  |
| 10 min | 7–9   | 5–7   | 1–2  |
| 15 min | 10–13 | 7–10  | 2–3  |
| 30 min | 16–20 | 12–16 | 3–6  |
| 60 min | 24–32 | 18–26 | 5–10 |

Longer slots get more detail, more (and richer) diagrams, deeper speaker notes,
and section dividers. If the topic is bigger than the slot, cut to the throughline
rather than cramming.

## Themes

Themes are compiled, not hand-built: the compiler emits the markup and copies the
theme's stylesheet from `themes/` into the output as `style.css`. The reference
decks (`purple-theme.html`, `zastrpay-theme.html`, in this folder) stay as the
visual reference of what each element looks like. Whatever the theme, the deck
must read as a focused deck, **never a marketing landing page** (no hero banners,
feature-card walls, or logo strips).

- **Purple** — lavender background, Poppins, violet→magenta gradient accents,
  white cards, a deep-indigo `{dark}` surface. Default pagination: fade.
  Good for technical decks.
- **Zastrpay** — green brand palette, Inter, light/dark surfaces. Default
  pagination: vertical scroll-snap. The official zastrpay logo is injected by
  the compiler on the title, top bars, and closing. Good for company-facing
  decks.
- **Image-Inspired** — the user supplies an image. Analyse it and derive a
  palette and font *inspired by* it (not a copy). Compile with whichever built-in
  theme's structure fits best, then overwrite the output's `style.css` with a
  re-skinned copy of that theme's css (colors/fonts only — selectors and layout
  stay identical so the compiled markup keeps working). This re-skin is the one
  artifact the compiler doesn't own; keep it legible.

Every Slidedown element is available in both themes — pick by concept, not by
theme. Each theme paints the elements (and the transition veil) in its own
palette.

## Transitions

Slide transitions are part of the language (see `README.md`): a `transition:`
front-matter default plus optional per-slide overrides (`{bubble}` flag or
`Transition:` line). With no `transition:` the deck keeps the theme's classic
behavior (purple fades, zastrpay scrolls). Taste rules when the skill writes an
outline:

- Ask or infer from tone: calm business deck → `rise` or `fade`; energetic or
  demo-day → `push`, `zoom`, or `mix`.
- Accent sparingly: give at most 1–2 pivotal slides (the throughline reveal, a
  section divider, the closing) a standout entrance like `bubble`, `iris`, or
  `wipe`. A deck where every slide shows off reads as noise.
- `mix` deals a deterministic rotation across slides — offer it when the user
  asks for "more dynamic", otherwise prefer one default + accents.
- Company-Wide decks stay calm; Development Team decks can take `push`/`zoom`.

## Shared runtime (`shared/` in this folder)

One runtime serves every theme. Never fork or inline it — copy the whole folder
into the output and link it relatively.

- `presenter.js` — deck controller: navigation in three modes (`data-nav="fade"`
  Purple-style, `data-nav="scroll"` Zastrpay-style, `data-nav="anim"` whenever
  the deck declares transitions), chrome wiring by element id, keyboard
  (arrows/space/PgUp/PgDn/Home/End), `S` notes panel, `F` fullscreen,
  `R` speaker remote; talks to the remote over postMessage. In anim mode it
  runs the transition engine (slide enter/exit classes plus the bubble/wipe
  veil, which grows from the last click point).
- `presenter.css` — hides `.speaker-notes` on screen, styles the notes panel and
  toasts, prints the notes so the deck doubles as a handout, and carries the
  anim-mode layout, all transition keyframes, the veil, and the
  reduced-motion/print fallbacks. Veil colors come from the theme's
  `--veil`/`--veil-grad` variables.
- `remote.html` / `remote.js` / `remote.css` — the speaker remote: a separate
  window showing the current slide's notes, an up-next line, a clickable list of
  all slides, prev/next, and a fullscreen toggle for the deck. It pings the deck
  and reconnects automatically if either window reloads. (Entering fullscreen from
  the remote uses Chromium's capability delegation; if the browser refuses, the
  deck shows a toast pointing at `F`.)

Deck contract the generated HTML must keep: a `#deck` element with the right
`data-nav` (plus `data-transition` defaults/overrides in anim mode), containing
`.slide` sections, one `<aside class="speaker-notes">` per slide, and the
optional chrome ids `prev`, `next`, `dots`, `cur`, `total`, `bar`, `hint`,
`remote` (the runtime skips any that are absent — both reference decks show the
intended markup per theme).

## Diagrams

Add a diagram whenever a flow, sequence, or relationship is easier to see than to
read — integrations, communication and event flows, architecture, processes,
domains. Adapt the altitude: name real services/events for the Development Team;
collapse to a few friendly, business-labelled boxes (3–5 nodes) for Company-Wide.
Use the `::: flow` element first (`::: timeline` when the dimension is time);
when a flow genuinely isn't enough (branching, sequence lanes), put an inline
SVG in a `::: html` block. Diagrams must be faithful to the real system — don't
invent architecture.

## Speaker notes

Keep slides spare and put the substance in per-slide notes: the expansion of the
point, talking points, transition to the next slide, and supporting detail. Write
them as `Notes:` lines on each slide in the md — the compiler embeds them as the
hidden aside and the shared runtime does the rest (`S` notes panel on the deck,
`R` speaker remote, notes included in print as a handout).

## Quality

- No marketing buzzwords — avoid *game-changing, revolutionary, best-in-class,
  cutting-edge, world-class, transformative, seamless*. Prefer facts, specific
  outcomes, real numbers, and concrete examples.
- Every slide earns its place — one idea each, no filler (no agenda-of-headings,
  no empty "thank you", no generic AI-template arc).
- Slide count proportional to topic complexity, audience, and duration.
- When the content or context isn't clear, ask before generating.

## Output

- `./<slug>.md` — the editable Slidedown outline in the **current directory**;
  the source of truth. Both the user and this skill edit only this file.
- `./output/<slug>/` — the compiled deck, written exclusively by
  `compiler/compile.js` on create/sync/loop:
  - `index.html` — the slide markup; links the css/js below with relative paths;
    fonts via CDN.
  - `style.css` — the theme stylesheet, copied from `themes/<theme>.css`.
  - `assets/` — local images referenced by `::: image` slides, copied in so the
    folder stays portable (only present when used).
  - `shared/` — verbatim copy of this skill's shared runtime: `presenter.js`,
    `presenter.css`, `remote.html`, `remote.js`, `remote.css`.

The folder is self-contained: `index.html` opens by double-clicking, and moving or
sharing the whole folder keeps the deck, notes, and speaker remote working.