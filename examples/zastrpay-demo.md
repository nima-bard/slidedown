---
title: Slidedown demo — every element, Zastrpay
theme: zastrpay
brand: Slidedown · Demo
quote: We bring cash to the digital world.
transition: rise
audience: Company-Wide
duration: 15
---

# Slidedown demo — every element, Zastrpay

## One language,<br>built into ==zastrpay== decks. {title}
Eyebrow: Demo · Zastrpay · Elements
Edit the md, sync, present — **deterministic**, **diffable**, **plain text**.

::: meta
- **Author** · Presenter skill
- **Theme** · Zastrpay
- **Transition** · rise
:::
Notes: This deck shows every element in the Zastrpay theme. The deck default transition is "rise"; two slides override it.

## What the language gives you
Eyebrow: Elements · Cards
Three element families: layout, content, and emphasis.

::: cards
- ◆ | Deterministic | Same md in, same html out — every time.
- ● | Plain text | Diffable, reviewable, editable in any editor.
-* ▲ | Forgiving | Write what you mean — close enough lands. | New
:::

::: callout
**Tip:** the starred card renders as the highlighted winner.
:::
Notes: One sentence per card. Transition: label lines.

## Friendly label lines {pure}
Eyebrow: Elements · Labels
One-line shortcuts — a known word plus a colon becomes a visual.

Tip: `Tip:` renders this green callout.
Warning: `Warning:` becomes the amber one.
Important: `Important:` gets the strong treatment.
Quote: Write what you mean — close enough lands. — the README
Notes: Remember the sharp edge — Notes: with an s is speaker-only, like this line.

## From idea to deck in four steps
Eyebrow: Elements · Steps

::: steps
- Brief the presenter skill | Audience, duration, theme, subject.
- It writes the Slidedown md | Your content, in the language.
- The compiler builds the html | `node compiler/compile.js deck.md`
- You edit and sync | The md stays the source of truth.
:::
Notes: Walk steps 1 to 4; step 3 is the deterministic part.

## What is already covered {dark glow}
Eyebrow: Elements · Checks

::: checks
- Speaker notes | Hidden on screen, in the remote and print.
- Remote control | Separate window, R to open.
- Fullscreen | F on the deck, button on the remote.
- Slide list | Jump to any slide from the remote.
- Transitions | Eleven entrances, per deck or per slide.
- Print handout | Notes included under each slide.
:::
Notes: Pick two checks to talk through; the rest are on the handout.

## Today vs next {dark}
Eyebrow: Elements · Panels

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
Notes: Left panel is today, right panel is next. Transition: the flow.

## How a sync run flows {pure}
Eyebrow: Elements · Flow

::: flow
- ① | Edit | deck.md
- ② | Sync | /presenter sync
-* ③ | Compile | deterministic
- ④ | Reload | browser
-* ✓ | Present | with remote
:::

::: callout
**Reminder:** unresolved directives (double-bracket notes) block the build until resolved.
:::
Notes: Trace one edit through the five nodes; highlight the green ones.

## Before and after {bubble}
Eyebrow: Elements · Versus
This slide enters with the ==bubble== — a brand-colored circle that swallows the page and pops.

::: versus
Before | Exact names only
- one typo, one build error
- per-theme element matrix
---
After | Write what you mean
- aliases and fuzzy matching
- every element, both themes
:::
Notes: The before/after alias renders an arrow divider. Transition: the roadmap.

## The roadmap
Eyebrow: Elements · Timeline

::: timeline
- v1 | Two themes | strict names
-* v2 | Forgiving language | we are here
-? v3 | Image themes | derived palettes
:::
Notes: Star marks the current milestone, question mark the future. Transition: the numbers.

## The numbers
Eyebrow: Elements · Metrics

::: metrics
- 2 | themes
- 26 | elements
- 11 | transitions
- 0 | dependencies
- 100% | plain text
:::

::: chips
- Edit anywhere
- Diff in reviews
- Build in one command
:::
Notes: Anchor on zero dependencies. Transition: meters and donuts.

## Meters and donuts
Eyebrow: Elements · Bars
Bars, splits and gauges all take a label and a percentage.

::: bars
- Slides covered | 73
:::

::: split
- Branch coverage | 46
:::

::: gauge
- 88 | would present again
:::
Notes: Use one meter style per slide in real decks; this one stacks them only to demo. Transition: the big number.

## One big number
Eyebrow: Elements · Badge
Transition: wipe
The `badge` is the one number to remember — this slide enters with a `Transition: wipe` curtain.
---
::: badge
- 42 | elements · demoed
:::
Notes: Pause on the number. Transition: tables.

## Tables and evidence
Eyebrow: Elements · Tables

::: compare
| Option | Fast | Verdict | Chosen |
| *Slidedown | y | Deterministic, plain text | y |
| Slide app exports | y | Not diffable | n |
:::

::: example
covered / total = **73%**
:::
Notes: The starred row is the chosen one. Transition: the formula.

## The risk formula {dark}
Eyebrow: Elements · Formula

::: formula
risk = impact^{2} × (1 − **coverage**)^{3}
:::

```bash
node compiler/compile.js deck.md
```
Notes: Formula for math, code windows for commands. Transition: people.

## People and questions
Eyebrow: Elements · Team

::: team
- Nima Boobard | Platform | deck author
- Presenter Skill | Compiler | does the rest
:::

::: faq
- Do I need to memorize names? | No — close enough works, and errors name the nearest element.
- Is it still deterministic? | Yes — same md, same html, byte for byte.
:::
Notes: Initials avatars are derived from the names. Transition: the quote.

## Someone said it better
Eyebrow: Elements · Quote

::: quote
Simplicity is the ultimate sophistication.
— Leonardo da Vinci
:::
Notes: Quotes get the big mark and the attribution line. Transition: plain points.

## When a slide is just points
Eyebrow: Elements · Points

- Top-level bullets become a clean arrow list
- Use `code` for literal identifiers
- Use **bold** for emphasis and ++underline++ for accents
Notes: Close the loop: the same bullets work in both themes.

## One language,<br>— ==for presentations only==. {closing}
Eyebrow: Wrap-up

::: cta
Edit the md, run sync, present with the remote — the html is always generated, never written.
:::
Notes: Repeat the throughline, thank the room, invite questions.
