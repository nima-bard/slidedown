# Slidedown

A small Markdown dialect for presentations, and a deterministic compiler that
turns a `.sd` document into a static HTML deck. Self-contained: everything the
compiler needs lives in this folder.

```
you write deck.sd  ──►  node compiler/slidedown.js deck.sd  ──►  output/<deck>/
                                                                  ├─ index.html
                                                                  ├─ styles.css
                                                                  └─ viewer/
```

- **Language spec:** [`MANIFESTO.md`](MANIFESTO.md)
- **Component reference:** [`COMPONENTS.md`](COMPONENTS.md)

## Build

```bash
node compiler/slidedown.js examples/demo.sd            # → examples/output/demo/
node compiler/slidedown.js deck.sd --out path/to/dir   # explicit output dir
```

Zero dependencies (plain Node), no network, no timestamps — the same `.sd` plus
the same theme produces **byte-identical** output.

## Layout

```
slidedown/
├─ compiler/slidedown.js   ← the five-stage compiler (register · parse+lint · render · bundle · publish)
├─ tokens/schema.yaml      ← the token contract (token → type)
├─ themes/<name>/          ← tokens.yaml (values for the schema) + optional theme.css + optional assets/ (fonts, backdrops)
├─ components/<name>/component.yaml   ← one manifest per component: props, children, template, styles
├─ icons/<pack>.yaml       ← icon packs (Heroicons outline + `…-solid` filled, 580+ glyphs)
├─ base.css                ← structural + typographic layer (reads token custom properties)
├─ viewer/                 ← the player runtime (nav, transitions, notes, remote) — copied into every deck
└─ examples/demo.sd        ← a sample deck (theme: falling-star; exercises all 46 components)
```

## How it fits together

- **Tokens are the contract.** `tokens/schema.yaml` declares the design
  vocabulary. A theme provides the values — mode-invariant tokens plus `light:`
  and `dark:` blocks — and the compiler emits the light set as `:root` custom
  properties (`color.accent` → `--color-accent`) and the dark set scoped to
  dark-mode slides. Documents reference tokens by name (`color:accent`), never
  raw values, so swapping the theme — or a slide's mode (`[@slide … dark]`) —
  restyles every component.
- **Components are data.** Each `components/<name>/component.yaml` is a uniform
  manifest with a logicless template and its own CSS. Adding a component is a
  drop-in folder; the compiler discovers and validates it at build time.
- **CSS is ship-all.** Every component's styles are bundled into one
  `styles.css`. No per-deck tree-shaking, so output stays simple and stable.
- **Themes can ship assets.** Beyond tokens + an optional `theme.css`, a theme may
  bundle fonts or backdrop images in `themes/<name>/assets/`; the compiler copies
  them into the deck's `assets/`, so a custom-font, full-bleed theme (like
  `falling-star`) stays offline and byte-deterministic.

## Authoring, in one breath

```slidedown
---
title: My deck
theme: aurora
---

[@slide title] Hello
[@subtitle] a subtitle
[@note] speaker-only notes [/@note]

A line of Markdown with a [text color:accent]highlight[/text].

[cards cols:3]
  [card icon:cube title:One] first [/card]
  [card icon:bolt title:Two state:win] second [/card]
  [card icon:sparkles title:Three] third [/card]
[/cards]
```

See [`MANIFESTO.md`](MANIFESTO.md) for the full language and
[`COMPONENTS.md`](COMPONENTS.md) for every component and its props.
