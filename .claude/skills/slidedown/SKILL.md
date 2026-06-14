---
name: slidedown
description: >-
  Turn a subject (a feature, repo, architecture, update, idea) into a polished
  presentation authored in the Slidedown language and compiled to a static HTML
  deck with this repo's deterministic compiler. Use whenever someone wants to
  build slides, a deck, a talk, a tech talk, a demo, a readout, or a stakeholder
  update — or asks to "present", "explain to the team", or "show leadership"
  something. Gathers theme + duration interactively, pulls light/dark logos from
  the provided context, conceptualizes the material into UI-rich slides (favouring
  components over walls of text), and guarantees an error-free build.
---

# Slidedown — author a deck, compile it clean

You build a presentation by **writing a `.sd` document in the Slidedown language and
compiling it** with the repo's compiler. The whole language lives under `slidedown/`.
Your job: take the context you were given, conceptualize it into the most expressive
slides the language allows, and produce a deck that **compiles with zero errors and
zero unresolved notes**.

Work from the repo root (`/media/nima/Works/codes/claude-presenter-skill`). All paths
below are relative to it.

---

## Step 0 — Learn the language (MANDATORY, every run)

Before writing a single `[tag]`, read these three in full — they are the source of
truth and the language evolves, so never author from memory:

1. `slidedown/MANIFESTO.md` — the language: document anatomy, front-matter, directives, slides/surfaces, components, shared props, columns, the compiler.
2. `slidedown/COMPONENTS.md` — every component, its **exact props, children, aliases, and content mode**. Verify against this; do not invent props or children.
3. `slidedown/README.md` — build mechanics and layout.

Then **discover what's actually installed** (the set grows over time — don't trust a hardcoded list):

```bash
ls slidedown/themes/                              # available themes
ls slidedown/components/                          # available components
grep -oE '^[a-z][a-z0-9-]*:' slidedown/icons/heroicons-outline.yaml   # valid icon names
```

Skim `slidedown/examples/demo.sd` (exercises every component) and
`slidedown/examples/falling-star.sd` as worked references for real syntax and density.
When unsure of a component's exact props, read its manifest:
`slidedown/components/<name>/component.yaml`.

---

## Step 1 — Understand the context

You are invoked **with the subject** the deck is about (a description, a repo path, a
feature, docs, a change). Absorb it:

- If it points at code/docs, read them (README, key modules, the PR/feature) to extract the real story, real numbers, real names. Prefer **real data over placeholders**.
- Identify: the **one message** the audience must leave with, the **audience** (infer dev-team vs leadership/company-wide from the context — only ask if genuinely unclear), and the natural **arc** (problem → approach → result → what's next).
- If the context is too thin to build a coherent narrative, ask **1–2 targeted** clarifying questions (subject, key takeaway) — don't pad with questions you can answer yourself.

---

## Step 2 — Gather the essentials interactively

Use **AskUserQuestion** with exactly these two questions (build the theme options from
what `ls slidedown/themes/` actually returned — read each theme's `tokens.yaml` top
comment for a one-line descriptor):

- **Theme** — one option per installed theme. Current set (verify at runtime):
  - `aurora` — violet, clean and modern (light + dark)
  - `verde` — brand green, bordered cards (light + dark)
  - `falling-star` — Van Gogh starry-night, full-bleed, custom font (dramatic)
- **Duration** — minutes, 5 → 60. Offer `5`, `10`, `15`, `30` and let the user pick *Other* for `45`/`60` or an exact figure. This sets the slide budget (Step 3).

### Logo — from CONTEXT, never a strict input
Do **not** ask for the logo. Hunt for it in the context instead: look through the
provided repo/docs/brand assets for image files whose names suggest a logo
(`logo`, `logo-dark`, `logo-light`, `logo-white`, `wordmark`, `brand`, `mark`, `icon`;
`.svg`/`.png`). Distinguish light- vs dark-mode variants by filename. If found, copy them
into the deck's `assets/` (Step 4) and wire `logo:` in front-matter.

- If you find one logo only → use it for both modes.
- If you find none → **proceed without it**, and in the final report note: *"Supplying a
  light and a dark logo would improve the design — drop them in the context and re-run."*
  Never block the build on a missing logo.

---

## Step 3 — Conceptualize into slides (UI-first)

Map the message to a slide budget by duration (a guide, not a cage — quality over count):

| Duration | Slides (incl. title + closing) |
|---|---|
| 5 min | 5–7 |
| 10 min | 8–12 |
| 15 min | 12–16 |
| 30 min | 18–26 |
| 45 min | 26–36 |
| 60 min | 34–46 |

Design principles — these are the point of the skill:

- **One idea per slide.** Speaker detail goes in `[@note] … [/@note]`, never on the slide.
- **Show, don't write.** Prefer components over prose. A slide that is three sentences is almost always one component instead (cards, flow, metrics, steps, compare…). Reserve plain Markdown paragraphs for short connective lines.
- **Mix components** to keep rhythm: a `statement` open, a `flow`, a `metrics`+`gauge` pairing in `columns`, a `compare` decision, a `timeline`/`milestones` roadmap, a `cta` close. Vary `dark` slides and a `glow`/`title`/`closing` surface for pacing.
- **Match component to intent** (verify props in COMPONENTS.md):

  | Intent | Reach for |
  |---|---|
  | Open / hero / single sentence | `statement`, `[@slide title]`, `meta`, `badge` |
  | Process L→R / pipeline | `flow` |
  | Circular / repeating process | `cycle` |
  | Numbered how-to / agenda | `steps` |
  | Roadmap / timeline | `timeline`, `milestones` |
  | Hierarchy / value stack | `pyramid`, `architecture` |
  | A vs B / decision | `versus`, `compare` |
  | Feature grid / options | `cards`, `panels`, `pricing` |
  | Benefits / checklist / tags | `checks`, `chips` |
  | People / Q&A | `team`, `faq` |
  | RAG status / endpoints | `status`, `api` |
  | KPI dashboard / one metric + movement | `scorecard`, `delta`, `metrics` |
  | Percent / progress / coverage | `gauge`, `bars`, `split` |
  | Trend / distribution / matrix | `line-chart`, `bar-chart`, `pie-chart`, `heatmap` |
  | Evidence / proof | `table`, `code`, `formula`, `example` |
  | Emphasis / pull-quote | `callout`, `quote`, `text` |
  | Closing ask | `cta`, `[@slide closing]` |
  | Media / custom | `image`, `icon`, `html` (escape hatch) |
  | Layout | `columns`, `group` |

Sketch a quick one-line-per-slide outline internally before writing the `.sd`.

---

## Step 4 — Write the `.sd` deck

Create a self-contained deck folder so assets resolve correctly:

```
decks/<slug>/
├─ <slug>.sd
└─ assets/         ← logos/images you pulled from context (paths are relative to the .sd)
```

Front-matter (only keys defined in the MANIFESTO; quote values with spaces):

```yaml
---
title:      <presentation title>
theme:      <chosen theme>
accent:     "#45f3a6"        # OPTIONAL — only if context implies a brand colour; quote the hex, else omit
transition: slide            # fade | slide
duration:   <minutes>
brand:      <brand/wordmark, if known from context>
logo:                        # only if found in context — else omit entirely
  light:    ./assets/logo.svg
  dark:     ./assets/logo-dark.svg
author:     <byline, if known>
---
```

**Accent override (optional, like the logo — from context, never asked).** The theme
sets the accent by default. If the context implies a brand colour (a hex in a brand kit,
CSS `--brand`/`--primary`, a logo's dominant colour, a stated palette), set `accent:` to
recolour the whole accent system — it propagates to the gradient, charts, and accent fills.
**Always quote it** (`accent: "#45f3a6"`); an unquoted `#` is read as a YAML comment and
silently ignored. If nothing in the context implies a colour, omit `accent` — the theme's
own accent is the right default. (Add `accent2: "#…"` to control the gradient's second tone.)

Authoring rules (the build will reject violations — get them right the first time):

- **Tokens only.** Colours are token names (`accent`, `ink`, `muted`, `ok`, `warn`, `danger`, `info`) — never raw hex in the `.sd`.
- **Real icon names only.** Every `icon:`/`[icon name:…]` must exist in the active pack (you listed them in Step 0). A wrong name produces a `note:` and a blank glyph — not allowed.
- **Exact structure.** Close every component (`[/name]`); use only documented children and props; void components self-close (`[image … /]`). Quote prop values containing spaces (`title:"first month"`).
- **Speaker notes** via `[@note] … [/@note]` on slides that need narration.
- **No leftover `[@instruction]`.** You may drop `[@instruction] need real Q2 figure [/@instruction]` as a TODO while drafting, but the build *fails* while any remain — so resolve **every one** from context before the final compile (or, if a number is truly unknowable, ask the user, or remove the claim). Never ship illustrative numbers dressed as real ones.

---

## Step 5 — Compile, and the zero-error guarantee

```bash
node slidedown/compiler/slidedown.js decks/<slug>/<slug>.sd --out decks/<slug>/build
```

The build **must** end at `[5/5] publish … built N slides` with **exit 0**. The compiler
is forgiving and tells you exactly what's wrong (with nearest-match suggestions). Loop:

1. **Errors** (`Build failed — … error(s)`) abort the build. Read each, fix the `.sd`, recompile. Common causes: unknown component/prop (typo → use the suggestion), unclosed tag, a surviving `[@instruction]`, unknown theme.
2. **Notes** (`note: …`) don't abort but signal broken output — **resolve them too**: `icon "x" not in the icon pack` → pick a real name; `image asset not found` → fix the path or copy the file; `theme missing token` → not your deck, ignore.
3. Repeat until the build is **clean: exit 0, no errors, no actionable notes.** This is non-negotiable — do not finish on a failing or warning build.

(Optional sanity pass: confirm `decks/<slug>/build/index.html` and `styles.css` exist and the slide count matches your outline.)

---

## Step 6 — Report

Tell the user, concisely:

- **What you built**: title, theme, slide count, duration.
- **Where**: the editable source `decks/<slug>/<slug>.sd` and the compiled deck `decks/<slug>/build/index.html` (open in a browser; `←/→` navigate, `S` notes, `F` fullscreen, `R` remote).
- **A one-line outline** (slide → component) so they can see the shape.
- **Logo note** if none was found: that light + dark logos would sharpen the design.
- Invite edits to the `.sd` + a recompile (it's deterministic — same source ⇒ same deck).

---

## Hard rules (summary)

1. Read MANIFESTO.md + COMPONENTS.md + README.md every run; verify props/children/icons/themes against the live files — never from memory.
2. Theme + duration are the only required interactive inputs. Logo comes from context; its absence is a note, not a blocker.
3. UI components over text. One idea per slide. Detail lives in `[@note]`.
4. Tokens for colour; real icon names; documented props only.
5. Resolve every `[@instruction]`; prefer real data over placeholders.
6. Finish only on a **clean build (exit 0, no errors, no actionable notes).**
