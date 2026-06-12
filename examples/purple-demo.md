---
title: Slidedown demo — every element, Purple
theme: purple
brand: Slidedown
transition: mix
audience: Development Team
duration: 15
---

# Slidedown demo — every element, Purple

## Slidedown {title}
Eyebrow: Demo · Purple · Elements
A ==forgiving language== for decks — edit the md, sync, done.

::: chips
- [purple:◆] Deterministic build
- [pink:●] Plain markdown
- [green:▲] Speaker remote
- [blue:■] Creative transitions
:::

::: meta
- **Author** · Presenter skill
- **Theme** · Purple
- **Transitions** · mix
:::
Notes: This deck shows every element in the Purple theme, with the "mix" transition rotation. Keep one idea per slide in real decks.

## How a deck is built
Eyebrow: Pipeline
You edit the **md**, the compiler does the rest — same input, same output.

::: flow
- ① | Edit | deck.md
-* ② | Compile | compile.js
- ③ | Present | index.html
:::

::: callout
◆ The md file is the **source of truth** — html is never edited by hand.
:::
Notes: Walk the flow left to right; dwell on the compile step. Transition: label lines.

## Friendly label lines
Eyebrow: Elements · 01
A line starting with a known word and a colon becomes a visual — close spellings work too.

Tip: `Tip:` renders this green tip callout.
Warning: `Warning:` becomes this amber one.
Important note: `Important note:` (even typo'd) gets the star.
Big: 26 | elements in the language
Notes: Emphasize that Notes: with an s stays speaker-only — like this line.

## Progress bars
Eyebrow: Elements · 02
The `bars` element renders labelled progress bars, **clamped to 0–100**.
---
::: bars
- Slides covered | 73
- Elements demoed | 84
- Coffee left | 38
:::
Notes: Lead with the 84 bar. Transition: split bars.

## Split bars and examples
Eyebrow: Elements · 03
The `split` element shows covered vs uncovered in one bar.

::: example
covered / total = **73%**
:::
---
::: split
- Branch coverage | 46
- Line coverage | 73
:::
Notes: Explain covered vs uncovered with the example. Transition: the badge.

## One big number
Eyebrow: Elements · 04
Transition: bubble
The `badge` element is for the **one number** the room should remember — this slide enters with an explicit `Transition: bubble`.
---
::: badge
- 42 | elements · demoed
:::
Notes: Pause on the number; the bubble grew from wherever you clicked. Transition: gauges.

## Donuts and tiles
Eyebrow: Elements · 05
`gauge` draws donut percentages; `metrics` lays out stat tiles.

::: gauge
- 73 | line coverage
- 46 | branch coverage
:::

::: metrics
- 2 | themes
- 26 | elements
- 11 | transitions
- 0 | dependencies
:::
Notes: Donuts for one or two percentages, tiles for a row of KPIs. Transition: the formula.

## Formulas
Eyebrow: Elements · 06
The `formula` element renders a dark math card, with `^{...}` for exponents.

::: formula
risk = impact^{2} × (1 − **coverage**)^{3}
:::

::: chips
- [green:✓] Accent with **bold**
- [purple:◆] Superscripts
:::
Notes: Read the formula once in plain words. Transition: tables.

## Report tables
Eyebrow: Elements · 07
The `table` element renders the report style — first column is the row name.

::: table
| Component | Coverage | Risk |
| compiler.js | 73% | low |
| presenter.js | 83% | low |
| remote.js | 24% | high |
:::
Notes: Point at the high-risk row only. Transition: comparison tables.

## Comparison tables
Eyebrow: Elements · 08

::: compare
| Option | Fast | Verdict | Chosen |
| *Slidedown | y | Deterministic, plain text | y |
| Hand-written HTML | n | Slow to edit | n |
| Slide app exports | y | Not diffable | n |
:::
Notes: Explain why the starred row won. Transition: cards.

## Icon cards {dark}
Eyebrow: Elements · 09
Cards work on the new purple ==dark surface== too.

::: cards
- ◆ | Deterministic | Same md in, same html out — every time.
-* ▲ | Theme-aware | One vocabulary, rendered per theme. | New
-? ● | Your idea | More elements on demand.
:::
Notes: Starred card is the winner, question-marked card is planned. Transition: steps.

## From idea to deck
Eyebrow: Elements · 10

::: steps
- Brief the presenter skill | Audience, duration, theme, subject.
- It writes the Slidedown md | Your content, in the language.
- The compiler builds the html | node compiler/compile.js deck.md
- You edit and sync | The md stays the source of truth.
:::
Notes: Step 3 is the deterministic part. Transition: checks.

## Already covered
Eyebrow: Elements · 11

::: checks
- Speaker notes | Hidden on screen, in the remote and print.
- Remote control | Separate window, R to open.
- Fullscreen | F on the deck, button on the remote.
- Slide list | Jump to any slide from the remote.
- Transitions | Eleven entrances, per deck or per slide.
- Print handout | Notes included under each slide.
:::
Notes: Four or more checks auto-split into two columns. Transition: panels.

## Today vs next
Eyebrow: Elements · 12

::: panels
Today | What you have
- Two themes
- One universal element set
- Eleven transitions
---
Next | What can come
- Image-inspired themes
- More elements on demand
- Your ideas here
:::
Notes: Panels group bullet lists under labelled headings. Transition: versus.

## Strict vs forgiving
Eyebrow: Elements · 13

::: versus
Before | Exact names only
- one typo, one build error
- per-theme element matrix
---
After | Write what you mean
- aliases and fuzzy matching
- every element, both themes
:::
Notes: The before/after alias renders an arrow instead of VS. Transition: the timeline.

## The roadmap
Eyebrow: Elements · 14

::: timeline
- v1 | Two themes | strict names
-* v2 | Forgiving language | we are here
-? v3 | Image themes | derived palettes
:::
Notes: Star marks the current milestone, question mark the future one. Transition: the quote.

## Someone said it better
Eyebrow: Elements · 15

::: quote
Simplicity is the ultimate sophistication.
— Leonardo da Vinci
:::
Notes: Quotes get the big mark and an attribution line. Transition: people.

## Who runs this
Eyebrow: Elements · 16

::: team
- Nima Boobard | Platform | deck author
- Presenter Skill | Compiler | does the rest
:::

::: faq
- Do I need to memorize names? | No — close enough works, and errors name the nearest element.
- Is it still deterministic? | Yes — same md, same html, byte for byte.
:::
Notes: Team renders initials avatars; faq renders question/answer cards. Transition: code.

## Show the code
Eyebrow: Elements · 17
Fenced blocks — `::: code` or plain markdown fences — become a code window.

```bash
node compiler/compile.js deck.md
open output/deck/index.html
```
Notes: Use code sparingly and only when it teaches. Transition: plain points.

## Plain points
Eyebrow: Elements · 18
Top-level bullets become a clean list — for when a slide really is just points.

- One idea per slide
- `code` for literal identifiers
- ==gradient== for the headline word
- **bold** for emphasis
Notes: Almost done — closing next.

## One language,<br>==now with motion==. {closing}
Eyebrow: Wrap-up

::: cta
Edit the md, run sync, present with the remote — and let the slides make an entrance.
:::
Notes: Repeat the throughline, thank the room, invite questions.
