# Slidedown — Component Reference

> Companion to [`MANIFESTO.md`](MANIFESTO.md). The compiler defines each
> component's structure and props (below); the active **theme** supplies its
> look — colours, fonts, surfaces, spacing. No specific theme is named here. For
> the syntax of components, props and composition, see the manifesto §4–§6.

**Composition is the whole model.** A grouping component (flow, cards, timeline…)
is built from **its own child components**, each a normal `[name props] … [/name]`
with its own props — there is no shared item or `|`-field syntax (manifesto
§4.4). Each entry below therefore lists the component's **children** (if any) and
**props**. Every component *also* accepts the shared props.

> **All 45 components below are implemented** — one
> `components/<name>/component.yaml` each — plus the `@slide` / `@subtitle` /
> `@note` / `@instruction` directives. `examples/demo.sd` exercises every one,
> and both themes (`aurora`, `verde`) render them from token values alone.

---

## Shared props — accepted by every component

| Prop | Values | Meaning |
|---|---|---|
| `size` | `WxH` in slide-percent — `20x50`, `40x*`, `*x30`, `40` | size as a share of the 100×100 slide canvas (`*` = intrinsic) |
| `align` | `left` · `center` · `right` | horizontal placement on the slide + inner text alignment |
| `valign` | `top` · `middle` · `bottom` | vertical placement within its area |
| `color` | `accent` · `ink` · `muted` · `inverse` · *named* · `#hex` | foreground / accent colour |
| `filled` | `none` · `paper` · `dark` · `accent` · `muted` · `#hex` | background fill |
| `border` | `none` · `thin` · `thick` · `accent` | border weight / colour (`thin` ≈ "narrow") |
| `mode` | `dark` · `light` | force just this component to the theme's dark or light palette, regardless of the slide's mode (layout-neutral) |
| `id` | slug | optional anchor for linking / directives |

`icon:` props (on nodes, cards, chips…) name a glyph in the deck's `icons` pack
(e.g. `heroicons-outline`), resolved from the shared icon resource — manifesto §2.

---

## Text & emphasis

### `text`
A styled span or box — the universal "extra formatting" primitive, and the
*only* one (no punctuation shorthands). Inline when short; a block when it wraps
block content.
- **Children:** none. **Content:** any Markdown.
- **Props:** `color`, `align`, `filled`, `border`, `weight` (`regular`/`medium`/`semibold`/`bold`), `case` (`normal`/`upper`/`small-caps`), `gradient` (flag), `underline` (flag).

```slidedown
Shipped [text color:accent weight:semibold]ahead of schedule[/text].
```

---

## Say it

### `callout`  · aliases: `note`, `important`
One highlighted statement — the theme's tinted note bar.
- **Children:** none. **Content:** one statement of Markdown.
- **Props:** `tone:` `info` · `tip` · `warn` · `key` *(default — accent gradient)*; `color:` tints the bar; `icon:` overrides the leading glyph.

```slidedown
[callout tone:warn] Refunds older than 90 days need a manager's approval. [/callout]
```

### `quote`  · aliases: `quotation`, `testimonial`
A large quote card with a quotation mark and attribution.
- **Children:** none. **Content:** the quote, then an attribution line starting `—`.

```slidedown
[quote]
Simplicity is the ultimate sophistication.
— Leonardo da Vinci
[/quote]
```

### `chips`  · aliases: `pills`, `tags`
A row of small pills; the theme decides their exact shape.
- **Child — `chip`:** content is the label. Props: `color` (a theme palette hue — `accent`, a theme-named slot, or `#hex`), `icon`.

```slidedown
[chips]
  [chip color:accent icon:check]Tested end to end[/chip]
  [chip icon:bolt]Event-driven[/chip]
[/chips]
```

### `cta`  · aliases: `takeaway`, `call to action`
The closing message box — a bold, accent-filled panel.
- **Children:** none. **Content:** one or two lines of Markdown.

```slidedown
[cta] Edit the md, sync, present. [/cta]
```

### `statement`  · aliases: `hero`, `big-idea`
One oversized, centred sentence — the slide that is a single idea. `kicker` (eyebrow above), `by` (attribution below), `gradient` (paint the text). Use [text] inside to accent words.

```slidedown
[statement kicker:"Why Slidedown" gradient]
Decks should be written, not dragged.
[/statement]
```

---

## Show structure

### `flow`  · aliases: `pipeline`, `process`
A left-to-right diagram of nodes joined by arrows.
- **Props:** `scale` (`1` default · `2` · `3` — larger nodes).
- **Child — `node`:** content is the sub-text. Props: `icon`, `title`, `focal` (flag — the highlighted node).

```slidedown
[flow]
  [node icon:pencil-square title:Edit] deck.md [/node]
  [node icon:cog title:Compile focal] deterministic [/node]
  [node icon:play title:Present] index.html [/node]
[/flow]
```

### `steps`  · aliases: `instructions`, `how-to`, `agenda`
An auto-numbered vertical list (numbered by order).
- **Child — `step`:** content is the detail. Props: `title`.

```slidedown
[steps]
  [step title:"Brief the skill"] Audience, duration, theme, subject. [/step]
  [step title:"It writes the md"] Your content, in the language. [/step]
[/steps]
```

### `checks`  · aliases: `checklist`, `benefits`
A ✓-list. Four or more children auto-split into two columns.
- **Child — `check`:** content is the detail. Props: `title`, `icon` (default `check`).

```slidedown
[checks]
  [check title:"Speaker notes"] In the remote and print. [/check]
  [check title:Fullscreen] F on the deck. [/check]
[/checks]
```

### `cards`  · aliases: `boxes`, `features`, `options`
A grid of icon cards.
- **Props:** `cols:` `2` · `3` · `4`.
- **Child — `card`:** content is the body. Props: `icon`, `title`, `pill` (corner tag text), `state:` `win` (highlighted) · `soon` (planned, dashed), `animated` (flag — a sweeping shine across the card).

```slidedown
[cards cols:3]
  [card icon:bolt title:Instant] Settles in under a minute. [/card]
  [card icon:star title:Recommended pill:New state:win] The chosen path. [/card]
  [card icon:clock title:Later state:soon] On the roadmap. [/card]
[/cards]
```

### `panels`  · aliases: `groups`
Grouped dark panels, each with a label, heading and its own content.
- **Child — `panel`:** content is Markdown (typically a bullet list). Props: `label`, `title`.

```slidedown
[panels]
  [panel label:Today title:"What we have"]
    - Two themes
  [/panel]
  [panel label:Next title:"What we add"]
    - More components
  [/panel]
[/panels]
```

### `versus`  · aliases: `vs`, `before/after`
A against B.
- **Props:** `icon:` the centre-badge icon, an icon-pack name (default `arrow-right`).
- **Child — `side`** (two of them): content is Markdown (bullets). Props: `label`, `title`, `prefer` (flag — the highlighted side).

```slidedown
[versus]
  [side label:Before title:"Manual checks"]
    - slow
  [/side]
  [side label:After title:Automated prefer]
    - instant
  [/side]
[/versus]
```

### `timeline`  · aliases: `roadmap`, `phases`, `journey`
Horizontal milestones on a track.
- **Child — `phase`** (alias `milestone`): content is the sub-text. Props: `when`, `title`, `state:` `current` (highlighted) · `future` (dashed, muted), `animated` (flag — the dot "beeps" with an expanding pulse).

```slidedown
[timeline]
  [phase when:Q1 title:Discovery] scope agreed [/phase]
  [phase when:Q2 title:Build state:current] we are here [/phase]
  [phase when:Q3 title:Rollout state:future] all merchants [/phase]
[/timeline]
```

### `milestones`  · aliases: `chronology`, `milestone-track`
An alternating timeline: labelled cards above and below a horizontal track, each tied to a node. (For a simpler single-row track, use `timeline`.)
- **Child — `milestone`** (aliases `stop`, `point`): content is the description. Props: `label`, `current` (flag — highlights its node + card), `animated` (flag — the same shine sweep the cards use).

```slidedown
[milestones]
  [milestone label:"Day 1"] Draft the deck in plain .sd [/milestone]
  [milestone label:"Day 2" current animated] Compile — five deterministic stages [/milestone]
  [milestone label:"Day 3"] Present in the browser [/milestone]
[/milestones]
```

### `faq`  · aliases: `q&a`, `questions`
A question / answer list.
- **Child — `qa`:** content is the answer. Props: `q` (the question).

```slidedown
[faq]
  [qa q:"Is it deterministic?"] Yes — same md, same html. [/qa]
[/faq]
```

### `team`  · aliases: `people`, `owners`
People cards with an avatar.
- **Child — `person`:** content is the name. Props: `avatar` (initials or glyph), `role`, `note`.

```slidedown
[team]
  [person avatar:AL role:Engineering note:reviewer] Ada Lovelace [/person]
[/team]
```

### `pricing`  · aliases: `plans`, `tiers`
Side-by-side pricing plans for a slide — each a card with a name, price and feature list (no CTA buttons; it's a deck, not a landing page). Flag one plan `featured` to lift it, add a `badge` (e.g. "Popular"), and `animated` for the shine sweep.
- **Child — `plan`** (aliases `tier`, `pkg`): content is the feature list (bullets render as ticks). Props: `name`, `price`, `period`, `badge`, `featured`, `animated`.

```slidedown
[pricing]
  [plan name:Starter price:Free]
    - One theme
    - All components
  [/plan]
  [plan name:Team price:"$12" period:"/mo" featured animated badge:Popular]
    - Both themes
    - Speaker remote
  [/plan]
[/pricing]
```

### `pyramid`  · aliases: `hierarchy`, `layers`
A layered pyramid — list layers apex-first (top, narrowest) down to the base (widest); each width is computed from its position.
- **Child — `layer`** (aliases `level`, `tier`): content is the sub-text. Props: `title`.

```slidedown
[pyramid]
  [layer title:Vision] why we build [/layer]
  [layer title:Foundation] tokens & compiler [/layer]
[/pyramid]
```

### `cycle`  · aliases: `loop`, `circular`
A circular process — stages around a ring with a looping icon in the centre; positions are computed by index (best 3–6). List clockwise from the top.
- **Props:** `icon` (centre glyph, default `arrow-path`).
- **Child — `stage`** (aliases `step`, `phase`): content is the sub-text. Props: `title`.

```slidedown
[cycle]
  [stage title:Author] write .sd [/stage]
  [stage title:Compile] five stages [/stage]
[/cycle]
```

### `architecture`  · aliases: `tiers`, `stack`
A layered architecture — tiers stacked top to bottom, each a row of boxes with an optional side label. (For free-form boxes + arrows, use [html].)
- **Child — `tier`** (aliases `layer`, `row`): props `label`. Holds **`box`** children (aliases `node`, `service`): content is the box label, prop `icon`.

```slidedown
[architecture]
  [tier label:Build]
    [box icon:cog] compiler [/box]
    [box icon:swatch] themes [/box]
  [/tier]
[/architecture]
```

---

## Show numbers

### `metrics`  · aliases: `stats`, `kpis`
A row of big-value stat tiles.
- **Child — `metric`:** content is the label. Props: `value`.

```slidedown
[metrics]
  [metric value:"<1 min"] settlement [/metric]
  [metric value:0] dependencies [/metric]
[/metrics]
```

### `bars`  · alias: `progress`
Labelled progress bars, clamped to 0–100.
- **Child — `bar`:** content is the label. Props: `value` (0–100), `animated` (flag — the fill shows a sweeping shine).

```slidedown
[bars]
  [bar value:73] Line coverage [/bar]
[/bars]
```

### `split`  · alias: `coverage`
Covered-vs-uncovered shown in one two-tone bar. Uses the same `bar` child; the
remainder of `value` renders as the uncovered share.
- **Child — `bar`:** content is the label. Props: `value` (covered share, 0–100).

```slidedown
[split]
  [bar value:46] Branch coverage [/bar]
[/split]
```

### `badge`  · alias: `big number`
One big number — the figure the room should remember.
- **Children:** none. **Content:** the label under the number. **Props:** `value`.

```slidedown
[badge value:42] services · migrated [/badge]
```

### `gauge`  · aliases: `donut`, `ring`, `dial`
Donut percentage(s) — one or two.
- **Child — `dial`:** content is the caption. Props: `value` (0–100).

```slidedown
[gauge]
  [dial value:73] line coverage [/dial]
[/gauge]
```

### `delta`  · aliases: `trend`, `movement`
One big number with its movement — an up/down/flat arrow + change figure, coloured by direction (up = ok, down = danger) or an explicit `tone`.
- **Props:** `value`, `change`, `dir:` `up`·`down`·`flat`, `tone:` `ok`·`warn`·`danger`·`accent` (override the pill colour), `label`, `accent` (flag — fill the card with the theme gradient), `animated` (flag — shine sweep). Content is an optional note.

```slidedown
[delta value:"+34%" change:"vs last quarter" dir:up label:Adoption accent animated] growth across teams [/delta]
```

### `scorecard`  · aliases: `kpis`, `scoreboard`
A grid of KPI tiles — value, optional target, and a movement. (For one headline number use `delta`; for plain figures use `metrics`.)
- **Child — `kpi`** (aliases `stat`, `score`): props `value`, `label`, `target`, `change`, `dir`, `tone`.

```slidedown
[scorecard]
  [kpi value:"$1.2M" label:ARR change:"+18%" dir:up]
  [kpi value:"4.7%" label:Churn change:"-0.6pt" dir:down tone:ok]
[/scorecard]
```

### `status`  · aliases: `health`, `rag`
Red/amber/green status rows — a coloured dot, a name, a note and an optional owner.
- **Child — `item`** (aliases `row`, `line`): content is the note. Props: `state:` `ok`·`done`·`warn`·`risk`·`blocked`·`info`, `title`, `owner`.

```slidedown
[status]
  [item state:ok title:Compiler] all green [/item]
  [item state:risk title:Docs owner:DX] behind [/item]
[/status]
```

---

## Charts

All charts are inline SVG (no library; colours follow the theme + mode) and honour the
shared **`size`** prop — `size:96` renders the chart at 96% of the content width, `align:center`
to centre it. They scale crisply to whatever width you give them.

### `bar-chart`  · aliases: `barchart`, `column-chart`
A themed bar chart drawn as inline SVG; each bar takes a distinct token colour (the same palette the pie cycles).
- **Child — `point`** (alias `datum`): a data point. Props: `label`, `value`.

```slidedown
[bar-chart]
  [point label:Q1 value:30]
  [point label:Q2 value:52]
  [point label:Q3 value:46]
[/bar-chart]
```

### `line-chart`  · aliases: `linechart`, `trend`
A themed line chart drawn as inline SVG — a line, dots and a soft area fill.
- **Child — `point`** (alias `datum`): a data point. Props: `label`, `value`.

```slidedown
[line-chart]
  [point label:Jan value:12]
  [point label:Feb value:30]
  [point label:Mar value:24]
[/line-chart]
```

### `pie-chart`  · aliases: `piechart`, `pie`
A themed pie chart (inline SVG) with a coloured side legend — a distinct token colour per slice.
- **Props:** `animated` (flag) — a looping spotlight: each slice pops outward while its legend row brightens, in turn, then settles as the next takes over — cycling through every slice forever.
- **Child — `point`** (alias `datum`): a slice. Props: `label`, `value`.

```slidedown
[pie-chart animated size:70]
  [point label:Writing value:45]
  [point label:Reviewing value:25]
  [point label:Design value:20]
[/pie-chart]
```

### `heatmap`  · aliases: `matrix`, `gridmap`
A grid of intensity cells (level 0–4 on the accent scale) in labelled rows — calendars, cohorts, value matrices.
- **Child — `hrow`** (alias `row`): props `label`. Holds **`cell`** children: props `level` (0–4), `value` (optional, shown in the cell).

```slidedown
[heatmap]
  [hrow label:Mon][cell level:1][cell level:4][cell level:2][/hrow]
  [hrow label:Tue][cell level:3][cell level:0][cell level:4][/hrow]
[/heatmap]
```

---

## Show evidence

### `table`  · alias: `report`
A report table. The first column is the row name; a risk word (`low`/`mid`/`high`)
in the last column is colour-coded.
- **Children:** none. **Content:** a Markdown table. **Props:** `head` (header colour — a token, e.g. `accent`/`ink`).

```slidedown
[table]
| Component | Coverage | Risk |
| compiler.js | 73% | low |
[/table]
```

### `compare`  · alias: `comparison`
A comparison table. A row whose name starts with `*` is the **chosen** row;
`y`/`n` cells render as ✓/✗.
- **Children:** none. **Content:** a Markdown table. **Props:** `head` (header colour token).

```slidedown
[compare]
| Option | Fast | Verdict | Chosen |
| *RabbitMQ | y | Fits the event flow | y |
| Polling | n | Too slow | n |
[/compare]
```

### `code`  · aliases: `snippet`, `terminal`
A code window with a title bar.
- **Children:** none. **Content:** verbatim code. **Props:** `lang`, `title`.

```slidedown
[code lang:bash title:build]
node compiler/compile.js deck.md
[/code]
```

### `formula`  · alias: `math`
A dark maths card. `^{…}` renders a superscript; `**bold**` is the accent.
- **Children:** none. **Content:** one line of Markdown maths.

```slidedown
[formula] risk = impact^{2} × (1 − **coverage**)^{3} [/formula]
```

### `example`
A single line of monospace example text.
- **Children:** none. **Content:** one inline line; `**bold**` highlights.

```slidedown
[example] covered / total = **73%** [/example]
```

### `api`  · aliases: `endpoints`, `routes`
A list of API endpoints — a colour-coded method chip, a monospace path, a description. GET (blue) · POST (green) · PUT/PATCH (amber) · DELETE (red).
- **Child — `endpoint`** (aliases `route`, `ep`): content is the description. Props: `method`, `path`.

```slidedown
[api]
  [endpoint method:GET path:"/decks"] list decks [/endpoint]
  [endpoint method:POST path:"/compile"] build a deck [/endpoint]
[/api]
```

---

## Media

### `image`  · aliases: `img`, `picture`
A framed image; local files are copied into the deck on build. Void — may self-close.
- **Children:** none. **Props:** `src`, `alt`, `caption`.

```slidedown
[image src:./architecture.png caption:"The event flow today" /]
```

### `logo`  · aliases: `wordmark`, `brandmark`
The deck logo placed on a slide. Void — self-closes. With no `src` it uses the
front-matter `logo:` (light + dark) and shows the variant matching the slide's
mode; files are copied into `output/assets/`.
- **Children:** none. **Props:** `src` (a single override for both modes; defaults to the front-matter `logo:`), `alt`; plus shared `size`/`align`.

```slidedown
[logo size:20x* align:left /]
```

### `icon`  · aliases: `heroicon`, `glyph`
A named icon from the deck's pack (front-matter `icons:`, default
`heroicons-outline`). Void — self-closes; inherits the surrounding text colour
unless `color:` is set. Components with an `icon:` prop (`node`, `card`, `chip`,
`callout`) take the same names.
- **Children:** none. **Props:** `name` (e.g. `cog`, `bolt`, `check-circle`), `size` (px, default 28), `color` (token).

```slidedown
[icon name:cog size:40 color:accent /]
```

### `html`
The escape hatch — content is emitted verbatim, untouched by the theme.
- **Children:** none. **Content:** raw HTML (e.g. an inline SVG).

```slidedown
[html]
<svg viewBox="0 0 100 40">…</svg>
[/html]
```

---

## Layout

### `columns`  · alias: `cols`
Divides the slide into vertical columns. **The number of `[column]` children is
the number of columns.**
- **Child — `column`:** content is anything (Markdown / components). Props: the
  shared `size` (its width share) and `align`; a column with no `size` takes an
  equal share of the remainder.

```slidedown
[columns]
  [column size:55 align:left]
    The lead paragraph on the left.
  [/column]
  [column size:45]
    [bars]
      [bar value:73] Line coverage [/bar]
    [/bars]
  [/column]
[/columns]
```

### `group`  · aliases: `box`, `stack`
A layout wrapper that stacks and aligns any components together — works for every
component (use it instead of a per-component `align` when a whole group should be
centred or right-aligned).
- **Child:** any components. **Props:** `align` (`left`/`center`/`right`), `gap` (px).

```slidedown
[group align:center]
  [chips]
    [chip]One[/chip]
    [chip]Two[/chip]
  [/chips]
[/group]
```

---

## Meta & tool directives

### `meta`
The title-slide byline row.
- **Children:** none. **Content:** a Markdown list; each item is one entry (e.g. `- **Label** · value`).

```slidedown
[meta]
- **Author** · Presenter skill
- **Date** · Q2 review
[/meta]
```

### `@note`  · aliases: `@notes`, `@speaker-notes`
Hidden speaker notes for the current slide — shown in the speaker panel, remote
and print handout, never on the slide. The `@` marks it as a tool directive, not
rendered content (manifesto §3).
- **Children:** none. **Content:** Markdown.

```slidedown
[@note] Lead with the 84% bar; 38% is the gap to close. [/@note]
```

### `@instruction`
A directive to the authoring tool — never rendered. The build refuses to
complete while any `@instruction` remains, so a forgotten note can't leak into a
deck.
- **Children:** none. **Content:** the instruction text.

```slidedown
[@instruction] use the real first-month number from the repo [/@instruction]
```

---

## Quick index

| Group | Component | Children |
|---|---|---|
| Text | `text` | — |
| Say it | `callout` · `quote` · `chips` · `cta` · `statement` | `chip` |
| Structure | `flow` · `steps` · `checks` · `cards` · `panels` · `versus` · `timeline` · `milestones` · `pyramid` · `cycle` · `architecture` · `pricing` · `faq` · `team` | `node` · `step` · `check` · `card` · `panel` · `side` · `phase` · `milestone` · `layer` · `stage` · `tier` · `box` · `plan` · `qa` · `person` |
| Numbers | `metrics` · `bars` · `split` · `badge` · `gauge` · `delta` · `scorecard` · `status` | `metric` · `bar` · `dial` · `kpi` · `item` |
| Charts | `bar-chart` · `line-chart` · `pie-chart` · `heatmap` | `point` · `hrow` · `cell` |
| Evidence | `table` · `compare` · `code` · `formula` · `example` · `api` | `endpoint` |
| Media | `image` · `html` · `logo` · `icon` | — |
| Layout | `columns` · `group` | `column` |
| Meta | `meta` · `@note` · `@instruction` | — |
