# Slidedown — the Presenter language

Slidedown is a small markdown dialect for building presentations. You write one
`.md` file; the compiler turns it into a themed HTML deck. Same md in, same html
out — every time. The html is always generated, never edited by hand.

```
you edit deck.md  ──►  node compiler/compile.js deck.md  ──►  output/<slug>/
                                                              ├─ index.html
                                                              ├─ style.css
                                                              ├─ assets/   (your images, if any)
                                                              └─ shared/   (runtime + speaker remote)
```

**The language is forgiving.** Element names are points of reference, not
keywords to memorize. `::: callout`, `::: note`, `::: important note` — even a
typo like `::: calout` — all land on the same element. If nothing matches, the
build stops and tells you the closest name; nothing is ever silently dropped.

- Scaffold a deck by briefing the **presenter skill** (`/presenter <brief>`);
  it writes the md for you and compiles it.
- Edit the md yourself, then `/presenter sync` (or run the compiler) to rebuild.
- Working examples: [`examples/purple-demo.md`](examples/purple-demo.md) and
  [`examples/zastrpay-demo.md`](examples/zastrpay-demo.md).

## A whole deck in 30 lines

```markdown
---
title: Payment links — what shipped
theme: purple                 # or zastrpay; skip it and you get purple
transition: rise              # how slides enter (see Transitions)
---

## Payment links {title}
Eyebrow: Q2 review
One link, any channel — the customer pays in two taps.
Notes: open with the demo numbers; this deck is the follow-up.

## How a link flows {bubble}
::: flow
- ① | Create | in the portal
-* ② | Share | any channel
- ③ | Paid | settled in <1 min
:::
Tip: star a step with `-*` to highlight it.

## What changed
- Links expire automatically
- Refunds from the same view
Big: 9.300 | links in the first month

## Thank you {closing}
::: cta
Try it today — portal → Payment links → Create.
:::
```

That's the shape: front-matter, then one `##` per slide. Plain text becomes the
slide's lead paragraph, plain `- ` bullets become a clean list, and everything
fancier is either a one-line **label** or a fenced **block**.

## Slides

```markdown
## The slide title {flags}
Eyebrow: small kicker above the title
Body text becomes the lead paragraph.
Notes: speaker notes — S panel, remote, and print. Not shown on the slide.
```

`{flags}` after the title are optional, in any mix:

| Flag | Meaning |
|---|---|
| `title` / `cover` | opening-slide layout |
| `closing` / `thanks` | closing layout |
| `dark` | dark surface (also `pure`, `glow` on zastrpay) |
| any transition name | how this slide enters, e.g. `{bubble}` — see Transitions |

A `---` line inside a slide splits it into two columns (left above, right below).

## Label lines — one-liners that just work

A line that starts with a known word and a colon turns into something visual.
Close spellings work ("Imporant note:" still lands).

| You write | You get |
|---|---|
| `Eyebrow: Architecture · 01` | the small kicker above the title (`Kicker:` works too) |
| `Notes: talk slowly here` | **speaker notes** — never visible on the slide |
| `Note: heads up` / `Info: …` | a blue info callout on the slide |
| `Tip: …` / `Hint: …` | a green tip callout |
| `Warning: …` / `Caution: …` | an amber warning callout |
| `Important: …` / `Key point: …` / `Remember: …` | a starred accent callout |
| `Quote: text — who said it` | a big quote card |
| `Big: 42 | services migrated` | one big number badge |
| `Image: ./shot.png | caption` | a framed image |
| `Transition: bubble` | this slide's entrance |

Mind the one sharp edge: `Notes:` (exactly) is for the speaker;
`Note:` puts a visible callout on the slide.

## Blocks

Anything bigger is a fenced block: `::: name` … `:::`. Items are `- ` lines;
fields inside an item are separated by `|`. Two markers work everywhere:
`-*` highlights an item, `-?` marks it as planned/future.

Every block works in **both themes** — each theme just paints it its own way.
Names are forgiving: the alias in parentheses works just as well.

### Say it

```markdown
::: callout                   # one highlighted statement (note, tip, warning,
◆ The md is the **source of truth**.        # important — tones pick a color)
:::

::: quote                     # big quote card (quotation, testimonial)
Simple is harder than complex.
— Steve Jobs
:::

::: chips                     # small pills (pills, tags, keywords)
- [green:✓] Tested end to end # purple: optional [color:icon] prefix
- [purple:◆] Event-driven     # zastrpay renders arrow pills
:::

::: cta                       # the closing message box (takeaway, call to action)
Edit the md, sync, present.
:::
```

### Show structure

```markdown
::: flow                      # left-to-right diagram (pipeline, process, arrows)
- ① | Edit | deck.md
-* ② | Compile | deterministic
:::

::: steps                     # numbered list (instructions, how to, agenda)
- Brief the skill | Audience, duration, theme, subject.
:::

::: checks                    # ✓-list (checklist, benefits); 4+ → two columns
- Speaker notes | In the remote and print.
:::

::: cards 3                   # icon cards (boxes, features, options) · arg = columns
- ◆ | Instant | Settles in under a minute.
-* ▲ | Recommended | The chosen path. | New
-? ● | Later | On the roadmap.
:::

::: panels                    # grouped dark panels; groups split by ---
Today | What we have
- Two themes
---
Next | What we add
- More elements
:::

::: versus                    # A against B (vs, before/after — that one gets a →)
Before | Manual checks
- slow
---
After | Automated
- instant
:::

::: timeline                  # milestones (roadmap, phases, journey)
- Q1 | Discovery | scope agreed
-* Q2 | Build | we are here
-? Q3 | Rollout | all merchants
:::

::: faq                       # question/answer list (q&a, questions)
- Is it deterministic? | Yes — same md, same html.
:::

::: team                      # people with initials avatars (people, who, owners)
- Ada Lovelace | Engineering | reviewer
:::
```

### Show numbers

```markdown
::: metrics                   # big-value stat tiles (stats, kpis, numbers)
- <1 min | settlement
:::

::: bars                      # labelled progress bars (progress) · 0–100
- Line coverage | 73
:::

::: split                     # covered vs uncovered in one bar (coverage)
- Branch coverage | 46
:::

::: badge                     # one big number (big number)
- 42 | services · migrated
:::

::: gauge                     # donut percentage (donut, ring, dial)
- 73 | line coverage
:::

::: table                     # report table (markdown table syntax)
| Component | Coverage | Risk |
| compiler.js | 73% | low |
:::

::: compare                   # comparison table · "*row" = chosen · y/n → ✓/✗
| Option | Fast | Verdict | Chosen |
| *RabbitMQ | y | Fits the event flow | y |
| Polling | n | Too slow | n |
:::
```

### Show evidence

````markdown
::: code fsharp               # code window with title bar (snippet, terminal)
let add a b =
    a + b
:::

```bash                       # markdown fences work too — same window
node compiler/compile.js deck.md
```

::: formula                   # dark math card · ^{2} → superscript
risk = impact^{2} × (1 − **coverage**)^{3}
:::

::: example                   # one-line monospace example
covered / total = **73%**
:::

::: image                     # framed image; local files are copied into the deck
- ./architecture.png | The event flow today
:::

::: meta                      # title-slide byline row
- **Author** · Presenter skill
:::

::: html                      # escape hatch — raw HTML, e.g. an inline SVG diagram
<svg viewBox="0 0 100 40">…</svg>
:::
````

## Transitions

How slides enter. Set a deck-wide default in the front-matter, override any
single slide with a `{flag}` or a `Transition:` line. Going back plays the
inverse. No `transition:` anywhere → the theme's classic behavior (purple
fades, zastrpay scrolls).

```markdown
---
transition: rise        # deck default · use "mix" for a tasteful rotation
---

## The big reveal {bubble}     ← this one slide bubbles in
```

| Name | What happens |
|---|---|
| `fade` | soft crossfade with a gentle rise |
| `push` (slide) | the new slide pushes the old off horizontally |
| `rise` (lift) | vertical push, like a smooth elevator |
| `zoom` (scale) | old flies toward you, new scales up |
| `flip` (page turn) | 3D page turn |
| `blur` (dissolve) | old melts out of focus, new sharpens in |
| `stack` (deal) | new slide dealt on top like a card |
| `iris` (reveal) | new slide revealed through an expanding circle |
| `wipe` (curtain) | a brand-colored curtain sweeps across |
| `bubble` (pop) | a brand-colored bubble grows from your click, swallows the page, pops to reveal the next slide |
| `cut` (none) | instant |

`bubble` and `wipe` take their color from the theme. `bubble` grows from
wherever you last clicked — on keyboard it rises from the bottom.
`prefers-reduced-motion` collapses every transition to an instant cut.

## Inline marks

| You write | You get |
|---|---|
| `**bold**` | emphasis |
| `==text==` | gradient headline text (theme accent) |
| `++text++` | underline accent (zastrpay) / bold (purple) |
| `` `code` `` | literal code styling |
| `<br>` | manual line break (titles included) |
| `[[ instruction ]]` | a **directive** — see below; never rendered |

## Front-matter

Only `title` and `theme` matter day to day; everything else is optional.

```markdown
---
title: Coverage initiative — what moved and what's next
theme: purple                  # purple | zastrpay · default purple
transition: rise               # optional deck default (or "mix")
brand: Acme Quality            # purple: top-left brand · zastrpay: topbar tag
quote: We bring cash to the digital world.   # zastrpay closing slide only
output: output/coverage-dev/   # optional; default output/<md-filename>/
audience: Development Team     # metadata for the skill, not rendered
duration: 30                   # metadata for the skill, not rendered
---
```

## Two-column slides

A top-level `---` line splits a slide: content above goes left, below goes
right. In Purple the right column auto-frames `bars`/`split`/`table` in a card
and centers a `badge` or `gauge`.

```markdown
## Coverage moved
Eyebrow: Results · 01
The lead paragraph on the left.
---
::: bars
- Line coverage | 73
:::
```

## Directives — `[[ ... ]]`

A directive is an instruction **to the presenter skill**, not content:

```markdown
The rollout took [[ look up the real number in the repo ]] weeks.
[[ make this slide a 3-node flow instead of text ]]
```

On `/presenter sync`, the skill first resolves each directive by editing the
md, then compiles. The compiler refuses to build while any `[[ ]]` remains —
a forgotten directive can never leak into a deck.

## Determinism guarantee

- The compiler is plain Node, zero dependencies, no network, no timestamps.
- Identical md + identical skill version ⇒ **byte-identical** `index.html`.
- Loose-name resolution is deterministic too — the same spelling always lands
  on the same element.
- All styling comes from `themes/<theme>.css` (copied to `style.css`); all
  behavior from `shared/` (copied verbatim). Decks never get hand-tuned css/js.

## Compile

```bash
node <skill-folder>/compiler/compile.js deck.md            # → ./output/<deck>/
node <skill-folder>/compiler/compile.js deck.md --out dir  # explicit output dir
```

## Project layout

```
presenter-skill/
├─ README.md            ← this language manual
├─ SKILL.md             ← how the presenter skill drives all of this
├─ compiler/compile.js  ← the Slidedown compiler (node, no deps)
├─ themes/              ← purple.css · zastrpay.css · zastrpay-logo.html
├─ shared/              ← deck runtime + transitions + speaker remote
├─ examples/            ← one full demo deck per theme
└─ purple-theme.html / zastrpay-theme.html  ← visual reference decks
```

## Presenting

- **S** — speaker-notes panel on the deck · **F** — fullscreen · **R** — the
  speaker remote (separate window: notes, slide list, prev/next, fullscreen).
- Print the deck to get a handout with notes under each slide.
