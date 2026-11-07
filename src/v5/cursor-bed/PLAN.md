# The cursor box

A small row in the nav, beside the mark, holding the pointer designs you are
not using. Take one and it becomes your cursor, and the one you were holding
goes back in its place.

## The idea in one line

Every pointer design is either **in your hand** or **in the row**. There is no
third place, and that single invariant is the whole model.

## Model

`App` owns one piece of state: `pointer`, which design is equipped,
persisted as before and validated against `POINTERS` on read — `invert`,
`dot`, `cross`, `rails` and `ticks` have all been dropped at some point, and
anyone who picked one still has it in storage. An unknown id matches no CSS
and would restore as a pointer that draws nothing.

`loose` is derived on every render and never stored: every design that is not
`pointer`. There is nothing to reconcile and no state to keep in step — the
box simply renders whatever is not in your hand. Both ways in are then the
same transition: **taking a shape** out of the row, and **choosing a design
in the fx panel**.

**There is no drop control.** Taking a shape already puts back the one in your
hand, so a drop button was a second way to do a thing that happens anyway.
The only state it could reach that taking cannot is holding nothing at all,
and the OS arrow in the fx panel is that. Its removal took the `detached`
state, the `empty` pointer mode and the leaving-home re-attach rule with it.

## The roster

Four designs with bodies, plus the OS arrow, which has no shape and so never
appears in the row:

| design   | at rest                  | over a target |
| -------- | ------------------------ | ------------- |
| `ring`   | 26px circle              | squares off, then opens into a rounded box; a stadium on a pill |
| `square` | 24px square              | the same box, square — it **never changes shape, only size** |
| `frame`  | four 1px corner brackets | the brackets travel to the target's corners |
| `dotted` | 26px circle, dotted      | everything the ring does, dotted |

`invert`, `dot`, `cross`, `rails` and `ticks` were dropped along the way.

`dotted` is not a second design so much as the ring with a different stroke,
so the two **share every rule** in `96-cursor.css` through
`:is([data-mode='ring'], [data-mode='dotted'])` and differ by one variable,
`--line-style`. Copying the block would mean every later change to how a
circle answers a pill or an anchor had to be made twice, and the second one
would eventually be forgotten. The pair is checked by diffing their computed
geometry across every state, including held and post-click: the stroke is the
only difference.

That stroke needs **two** variables, not one. A CSS border's dots are always
as wide as the border and sit that far apart, so weight is the only handle
there is on either their size or their spacing — and at 1px Chrome draws them
as single-pixel dashes, which reads as a grey line rather than as dots. At
2px they are round, and separate. Hence `--line-weight` beside
`--line-style`, defaulting to 1px so the square, which shares the
screenshot rule, keeps its hairline.

More separation than that would mean leaving CSS borders behind for an SVG
stroke with round caps — and the border is what follows `border-radius`
through the circle → rounded box → stadium → underline morph that the design
is built on. Not worth trading the morph for a wider gap.

The caret is the exception that proves the sharing — it is drawn with a
background rather than a border, so it stays solid in both, which is right,
because a dotted caret would be an invisible one.

The others are each an argument about how to point at something: the **ring**
morphs and the **square** refuses to, which is why the square skips the 65ms
corner beat in `Cursor.jsx` — there are no corners to resolve, so the pause
would read as a stall. The **frame** keeps its gaps everywhere, including on
a project screenshot, where it once went solid.

**Every design covers the whole state vocabulary** — `link`, `row`, `pill`,
`anchor`, `zoom`, `text`, `picture`, `scroll`, `bare` — in its own idiom. Two
bugs lived in the gaps:

`picture` was written once for every mode at once. It lit the ring as a solid
rectangle and hid the brackets outright, so pointing at a project screenshot
turned the frame into a plain box. A design that drops its own idea at the
biggest target on the site is a design you cannot really pick.

`anchor` is the one state the JS parks at the line's **left** end rather than
its middle, so the underline draws out the way one is written. Every other
state is centre-anchored. Any design laid out from the centre therefore landed
half a width to the left of the words it was wrapping — which is exactly what
the frame did on a text link. It now measures from the left edge instead:
crop marks around the word.

**Inside the box the pointer never wraps anything.** `.bed` is a `default`
target in `TARGETS`, ahead of the catch-all that would otherwise read the 44px
shape hit areas as the buttons they are. Drawing a box around the one control
whose whole job is to show you pointers is the pointer talking over it.

## Layout

The row lives **in the nav, beside the mark**, rather than pinned to the edge
of the page. It is a thing you set, not a place you go, so it sits with the
avatars rather than among the links.

**A row, not a grid.** Four designs means three are loose at any time, and
three in a 2×2 is an empty quadrant that reads as a mistake rather than a
layout. A row takes three or four equally well and runs the direction the nav
already runs in. Four loose — the OS arrow equipped — is the widest it gets,
at 90px, which still clears the links by 79px.

**One size, always open.** It used to collapse to a 40px square and expand on
hover, which was worth it when it was a 196px box of drifting shapes pinned to
the page. At 68×24 in the nav there is nothing to hide, and the
collapsed state was the thing making the layout awkward: three shapes crammed
into a quarter-scale grid, too small to recognise.

- 24px tall against the 40px avatars, so it reads as a control set among them
  rather than a third portrait, and never sets the nav's height. The nav
  centres it against them.
- The designs are drawn at about three quarters of their resting size, and
  **written out rather than scaled**: `transform: scale()` on a 1px hairline
  renders it at a fraction of a pixel and the whole row goes soft.
- They are **sized to look equal, not to measure equal.** A square and a
  circle of the same nominal size never read the same — equal area puts the
  square at ~0.886 of the circle's diameter, and the square's corners reach
  further from the centre than any point on the circle does. Carrying over
  the resting proportions, where the frame is the largest of the four, made
  it the biggest thing in the row twice over. So the round pair take the
  large number (14 and 15px) and the square pair the small one (13px each),
  the dotted circle a px over the solid ring because the eye reads it along
  the centres of its dots rather than its outer edge.
- **The dotted circle's stroke cannot go under 2px.** Rendered at 1px and at
  1.5px, Chrome draws a dotted border as rectangles, not dots — checked at 7×
  both times. 2px is the floor for round ones, and since a border's dots are
  as wide as the border and sit that far apart, that also fixes how many fit
  round a 15px circle. Magnified it looks coarse; at the size it ships, it
  reads as a dotted circle, which is the size that matters.
- The frame is level with the solid square rather than a px under it. That px
  was correcting for four corners holding less ink than a whole perimeter,
  and at 13px a single pixel is nearly a tenth of the shape — far too coarse
  to carry a correction that subtle.
- Each button is a whole cell, so the hit area is the full height of the row —
  a bracket drawn in hairlines has almost no area of its own to aim at.

## Edges

- **Touch and reduced motion**: the box never mounts, gated on
  `(pointer: fine)` and `not (prefers-reduced-motion: reduce)`, with a CSS
  belt to that brace. The second condition is not about motion any more —
  under reduced motion `.cursor` is `display: none` and the native arrow is
  back, so there is no custom pointer for the box to be choosing between.
- **Keyboard**: the shapes are real buttons, reachable by Tab, and sit in the
  tab order right after the mark.
- **Clicks**: the shapes are ordinary buttons in the nav, so nothing overlays
  page content and no capture-phase swallow is needed.

## Files

```
src/v5/cursor-bed/
  PLAN.md        this
  CursorBed.jsx  the box
src/v5/styles/98-bed.css   the shapes at rest, mirroring the designs
```

There is no roster file: the designs are read straight off `POINTERS`, minus
`off`, so one cannot exist in the fx panel and be missing from the row. There
is no engine either — the shapes used to drift inside a box, and once they
stopped, a physics file, a shape-geometry file, an animation loop, a
reconciler and an open/closed state all turned out to be scaffolding for an
effect that is no longer there.

The CSS lives with the other numbered layers rather than in this folder: those
files are an ordered cascade and breaking the order to keep a folder tidy is
the worse trade.
