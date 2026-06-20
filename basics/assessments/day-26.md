# Day 26 Assessment — CSS Layout · Flexbox · Grid · Box Model

**Theme:** You are the frontend lead at a SaaS company. The design team delivers mockups and you need to implement pixel-perfect, responsive layouts using modern CSS techniques. No CSS frameworks — pure CSS only for this day.

---

### Q1 — Box Model: `border-box` vs `content-box` ⭐

**Scenario:** A designer hands you a spec that says the input field must be exactly `300px` wide including its padding and border. Your colleague's code sets `width: 300px`, `padding: 12px`, and `border: 2px solid`. The input renders wider than the container.

**Task:** Explain the difference between `box-sizing: content-box` and `box-sizing: border-box`. Compute the final rendered width of the broken input, then fix it.

**Acceptance Criteria:**
- [ ] Correctly states that `content-box` adds padding and border on top of the declared `width`
- [ ] Computes the broken width: `300 + (12 * 2) + (2 * 2) = 328px`
- [ ] Correctly states that `border-box` makes padding and border included within the declared `width`
- [ ] Fixes the input by applying `box-sizing: border-box` so final rendered width is `300px`
- [ ] Explains the common global reset: `*, *::before, *::after { box-sizing: border-box; }`
- [ ] Explains what `margin` does (it is never included in either model — it lives outside)
- [ ] Identifies that `height` follows the same rules as `width` in both models

---

### Q2 — Flexbox Basics ⭐

**Scenario:** A new engineer on your team cannot get a loading spinner to center inside a full-screen overlay. They keep using `margin: auto` with unpredictable results.

**Task:** Demonstrate how to center a `div` both horizontally and vertically using flexbox. Explain each property you use.

**Acceptance Criteria:**
- [ ] Uses `display: flex` on the container
- [ ] Uses `justify-content: center` to center on the main axis
- [ ] Uses `align-items: center` to center on the cross axis
- [ ] Correctly explains that `flex-direction: row` (default) makes the main axis horizontal
- [ ] Correctly explains that `flex-direction: column` swaps which axis `justify-content` affects
- [ ] Demonstrates awareness that the container needs a defined height (e.g., `height: 100vh`) for vertical centering to work
- [ ] Explains at least one alternative: `align-self`, `margin: auto` on the child inside a flex container

---

### Q3 — CSS Grid Basics ⭐

**Scenario:** You need to build a portfolio grid with 3 equal-width columns. A junior asks you what the `fr` unit means and why you chose `auto-fill` over `auto-fit`.

**Task:** Define a 3-column grid using `fr`, then build a responsive version using `auto-fill` and `minmax`. Explain `auto-fill` vs `auto-fit`.

**Acceptance Criteria:**
- [ ] Writes a valid 3-column grid: `grid-template-columns: 1fr 1fr 1fr` or `repeat(3, 1fr)`
- [ ] Correctly explains `fr` as a fraction of the remaining free space in the grid container
- [ ] Writes a responsive version: `grid-template-columns: repeat(auto-fill, minmax(250px, 1fr))`
- [ ] Explains `auto-fill`: keeps empty column tracks even if there are no items to fill them
- [ ] Explains `auto-fit`: collapses empty tracks so existing items can stretch to fill the row
- [ ] Demonstrates when `auto-fit` produces a different visual result than `auto-fill` (e.g., 2 items in a potentially 4-column grid)
- [ ] Correctly uses `grid-gap` or `gap` to add gutter spacing between cells

---

### Q4 — CSS Specificity ⭐

**Scenario:** A CSS bug report lands on your desk: the button text is blue when it should be red. There are four competing rules all targeting the same element.

**Task:** Calculate the specificity score for each selector below and predict which rule wins. Explain the scoring system.

```css
/* A */ div p .btn { color: green; }
/* B */ #nav .btn { color: blue; }
/* C */ .sidebar .nav .btn { color: red; }
/* D */ p.btn { color: orange; }
```

**Acceptance Criteria:**
- [ ] States the specificity format as (inline, IDs, classes/attributes/pseudo-classes, elements/pseudo-elements)
- [ ] Correctly scores selector A: (0, 0, 1, 2)
- [ ] Correctly scores selector B: (0, 1, 1, 0) — highest score, wins with `color: blue`
- [ ] Correctly scores selector C: (0, 0, 3, 0)
- [ ] Correctly scores selector D: (0, 0, 1, 1)
- [ ] Correctly identifies selector B wins because IDs outweigh any number of classes
- [ ] Explains that `!important` overrides specificity entirely and why it should be avoided as a habit

---

### Q5 — Flexbox Layout: Navigation Bar ⭐⭐

**Scenario:** The design team delivers a nav bar mockup: the logo is pinned to the left, three navigation links sit in the center, and a "Get Started" CTA button is on the far right. No inline styles. No absolute positioning.

**Task:** Implement the nav bar in HTML + CSS using flexbox. The layout must work without hardcoded widths.

**Acceptance Criteria:**
- [ ] Nav container uses `display: flex` and `align-items: center`
- [ ] Logo is the first child and naturally sits on the left
- [ ] Center links use `margin: 0 auto` on their wrapper, OR the layout uses `flex: 1` on the logo and button containers to push the center group to the middle
- [ ] CTA button is the last child and sits on the right without using `position: absolute`
- [ ] `gap` or `margin` is used for spacing between links instead of hardcoded pixel margins on each element
- [ ] No inline styles (`style=""`) are used anywhere
- [ ] Nav bar is responsive enough that it does not overflow the viewport at `320px` wide

---

### Q6 — CSS Grid Layout: Magazine with Spanning Sidebar ⭐⭐

**Scenario:** A magazine-style landing page requires a 3-column grid. The left sidebar must span 2 rows, the main content occupies the top-right two cells, and a secondary article fills the bottom-right two cells.

**Task:** Implement this layout using CSS Grid. Use `grid-column` and `grid-row` span syntax.

**Acceptance Criteria:**
- [ ] Container uses `display: grid` with `grid-template-columns: 200px 1fr 1fr` or equivalent
- [ ] Sidebar uses `grid-row: span 2` (or explicit line numbers) to span two rows
- [ ] Main content area uses `grid-column: span 2` to fill the top-right two columns
- [ ] Secondary article uses `grid-column: span 2` to fill the bottom-right two columns
- [ ] `grid-template-rows` is either defined or `auto` rows adapt to content height
- [ ] `gap` is applied between grid cells
- [ ] No floats, no absolute positioning, no table display values are used

---

### Q7 — Responsive Grid with `auto-fill` and `minmax` ⭐⭐

**Scenario:** You build a product card grid with `grid-template-columns: repeat(auto-fill, minmax(250px, 1fr))`. A QA engineer notices that at `768px` viewport width, 3 cards fit per row but at `767px` they drop to 2. They file a bug. You need to explain the behaviour and decide if it is a bug.

**Task:** Explain exactly when and why the cards wrap. Adjust the minimum to make cards wrap at a different breakpoint if needed.

**Acceptance Criteria:**
- [ ] Explains that `minmax(250px, 1fr)` means each card is at least `250px` wide
- [ ] Calculates that at `768px` with 3 cards: `768 / 3 = 256px >= 250px` so 3 fit; at `749px`: `749 / 3 = ~250px` still fits; identifies the exact wrapping point based on gap values
- [ ] Correctly identifies this as expected CSS behaviour, not a bug
- [ ] Knows that `gap` reduces the available space, so the wrapping point also depends on the gap value
- [ ] Demonstrates how to change the minimum (e.g., `minmax(200px, 1fr)`) to shift the breakpoint
- [ ] Distinguishes `auto-fill` (keeps empty tracks) from `auto-fit` (collapses them) in this context
- [ ] Can explain how to add a `@media` query override for edge cases where the auto algorithm is insufficient

---

### Q8 — Positioning: Fixed Header, Sticky Sidebar, Scrollable Main ⭐⭐

**Scenario:** The new app shell has three regions: a header that stays at the top as you scroll, a left sidebar that sticks within its scrolling parent but scrolls away once you reach the footer, and a main content area that scrolls normally.

**Task:** Specify the correct `position` value for each region and explain what each value does. Write the minimal CSS required.

**Acceptance Criteria:**
- [ ] Header uses `position: fixed` with `top: 0; left: 0; right: 0` (or `width: 100%`)
- [ ] Correctly explains `fixed`: positioned relative to the viewport, removed from normal flow
- [ ] Sidebar uses `position: sticky` with a `top` value (e.g., `top: 60px` to clear the fixed header)
- [ ] Correctly explains `sticky`: stays in normal flow but sticks to its offset once the scroll threshold is reached, and releases when the parent scrolls out of view
- [ ] Main content uses `position: static` (the default) and scrolls normally
- [ ] Adds `padding-top` to the layout body equal to the header height to prevent content from hiding behind the fixed header
- [ ] Explains that `sticky` requires the parent to have overflow different from `hidden` or `clip`, otherwise it silently falls back to static

---

### Q9 — z-index and Stacking Context ⭐⭐

**Scenario:** A dropdown menu with `z-index: 9999` is still rendering behind a sibling card. You've checked and the dropdown definitely has a higher `z-index`. The junior engineer is confused.

**Task:** Explain why `z-index` is not working. List three ways a stacking context is created and explain what that means for child elements.

**Acceptance Criteria:**
- [ ] Explains that `z-index` only works on elements with a `position` value other than `static` (or flex/grid children)
- [ ] Explains that a stacking context isolates its descendants — children cannot escape their parent stacking context
- [ ] Lists at least 3 ways to create a stacking context: `position` + `z-index` (non-auto), `opacity < 1`, `transform`, `filter`, `will-change`, `isolation: isolate`, `mix-blend-mode`
- [ ] Diagnoses the scenario: the dropdown's parent likely has its own stacking context with a lower `z-index` than the sibling card
- [ ] Proposes the correct fix: restructure the DOM or set `isolation: isolate` on the correct ancestor
- [ ] Explains why `isolation: isolate` is the cleanest fix when you cannot change the DOM structure
- [ ] Warns against using arbitrarily large `z-index` values as a workaround

---

### Q10 — Flexbox vs Grid: Choosing the Right Tool ⭐⭐

**Scenario:** Your team reviews five layout problems at standup. For each one, you must recommend Flexbox or CSS Grid and briefly justify your choice.

**Task:** For each layout below, choose Flexbox or Grid and justify in one sentence.

1. A horizontal list of social icon buttons in a footer
2. A photo gallery where images span different numbers of rows and columns
3. A form row where a label and input sit side by side with the input taking remaining space
4. A full-page dashboard with header, sidebar, main, and footer regions
5. A set of tags/chips that wrap onto the next line when they overflow

**Acceptance Criteria:**
- [ ] Problem 1 — Flexbox: one-dimensional row of items, no 2D alignment needed
- [ ] Problem 2 — Grid: requires 2D placement and item spanning across rows and columns
- [ ] Problem 3 — Flexbox: one row, one item grows with `flex: 1`, simple axis alignment
- [ ] Problem 4 — Grid: two-dimensional page-level layout with named regions
- [ ] Problem 5 — Flexbox with `flex-wrap: wrap`: items flow in one dimension but wrap naturally
- [ ] Correctly identifies that Grid and Flexbox are complementary, not competing
- [ ] Can name one case where either tool could work and explains the trade-off

---

### Q11 — The CSS Cascade ⭐⭐

**Scenario:** Three CSS rules target the same `color` property on a paragraph. One is set via an element selector in a stylesheet, one via a class in an inline `<style>` tag, and one via `!important`. The designer claims the color should be green. Your job is to predict what color actually renders.

```css
/* external stylesheet */
p { color: red; }

/* inline <style> tag */
.intro { color: blue; }

/* another rule */
p.intro { color: green !important; }
```

**Task:** Given a `<p class="intro">` element, predict the computed color. Explain each cascade step.

**Acceptance Criteria:**
- [ ] Identifies the cascade order: importance → specificity → source order
- [ ] Correctly identifies that `p { color: red }` has specificity (0,0,0,1)
- [ ] Correctly identifies that `.intro { color: blue }` has specificity (0,0,1,0) — would win over `red` without `!important`
- [ ] Correctly identifies that `p.intro { color: green !important }` wins because `!important` overrides all non-important rules regardless of specificity
- [ ] Correctly predicts the computed color is `green`
- [ ] Explains that if two `!important` rules conflict, specificity and source order apply between them
- [ ] States that inline styles (`style=""`) outrank stylesheets unless the stylesheet rule uses `!important`

---

### Q12 — Holy Grail Layout with CSS Grid ⭐⭐⭐

**Scenario:** The marketing team wants a classic holy grail page: full-width header at top, full-width footer at bottom, and a three-column middle section with a nav column on the left, main content in the center, and an ads column on the right. The middle section must stretch to fill available vertical space. No floats, no tables.

**Task:** Implement the complete holy grail layout using CSS Grid. The page must fill the full viewport height even when content is short.

**Acceptance Criteria:**
- [ ] Outer wrapper uses `display: grid` with `grid-template-rows: auto 1fr auto` to make the middle section grow
- [ ] Wrapper height is set to `min-height: 100vh` so the footer sticks to the bottom
- [ ] Middle section uses its own `display: grid` with `grid-template-columns: 200px 1fr 150px`
- [ ] Header spans full width: either by being outside the column grid or using `grid-column: 1 / -1`
- [ ] Footer spans full width: same approach as header
- [ ] Left nav, main, and right aside are siblings inside the middle row container
- [ ] Code has zero floats, zero `display: table`, zero absolute positioning for layout purposes
- [ ] Works at viewport widths down to `375px` (either responsive columns or wraps gracefully)

---

### Q13 — Nested Flexbox: Cards with Pinned Footer ⭐⭐⭐

**Scenario:** A product grid shows cards of variable content height. Each card has a thumbnail, a title, a description of varying length, and a price + CTA button row. The CTA row must always sit at the bottom of the card regardless of how long the description is.

**Task:** Implement the card layout using nested flexbox. All cards in a grid row should be the same height (stretch to the tallest), and the CTA row must pin to the bottom in each card.

**Acceptance Criteria:**
- [ ] Grid container uses `display: grid` or `display: flex; flex-wrap: wrap` with `align-items: stretch` (or `align-items` is not set, defaulting to stretch)
- [ ] Each card uses `display: flex; flex-direction: column`
- [ ] The description element uses `flex: 1` or `flex-grow: 1` to consume all available vertical space, pushing the CTA to the bottom
- [ ] The CTA row sits as the last child and needs no special positioning because flex column layout pushes it down
- [ ] `height: 100%` is not used as the primary mechanism — flex grow handles it
- [ ] Card renders correctly when the description is 1 line vs 5 lines
- [ ] Solution works without JavaScript measurement or `position: absolute` for the CTA row

---

### Q14 — CSS Grid Named Areas: Dashboard with Mobile Fallback ⭐⭐⭐

**Scenario:** A dashboard has five regions: a top header, left sidebar for navigation, main content area, right panel for widgets, and a footer. The design system requires `grid-template-areas` for readability. At mobile widths, all regions must stack vertically in reading order.

**Task:** Implement the dashboard using named grid areas. Write the mobile-first CSS and the desktop override inside a `@media` query.

**Acceptance Criteria:**
- [ ] `grid-template-areas` is used on the container with legible string syntax (each row is a quoted string)
- [ ] All five regions have `grid-area` names that match the template: e.g., `header`, `sidebar`, `main`, `panel`, `footer`
- [ ] Mobile layout (base): `grid-template-columns: 1fr` with areas stacked: header → sidebar → main → panel → footer
- [ ] Desktop layout (`@media (min-width: 768px)`): multi-column template like `200px 1fr 250px` with header and footer spanning all columns
- [ ] A period (`.`) is used correctly if any empty cells exist in the template (or demonstrated awareness of its purpose)
- [ ] `min-height: 100vh` ensures the layout fills the screen
- [ ] The named areas approach is explained as an alternative to line-number placement with the trade-off being readability vs flexibility for complex spans

---

### Q15 — CSS Layout Performance: Reflow, Repaint, Composite ⭐⭐⭐

**Scenario:** Your team's animated sidebar transition (it slides in from the left using `left` or `margin-left` changes) causes visible jank at 30fps on mid-range Android devices. A performance audit shows constant layout recalculations during the animation.

**Task:** Explain the three browser rendering stages (reflow, repaint, composite), classify which CSS properties trigger each, and rewrite the animation to run at 60fps on the compositor thread.

**Acceptance Criteria:**
- [ ] Defines reflow (layout): the browser recalculates positions and sizes of elements — triggered by `width`, `height`, `margin`, `padding`, `top`, `left`, `font-size`, DOM insertion
- [ ] Defines repaint: the browser redraws pixel colors without recalculating layout — triggered by `color`, `background-color`, `box-shadow`, `border-color`
- [ ] Defines composite: the browser moves already-painted layers — triggered only by `transform` and `opacity` (and `filter` in some cases)
- [ ] Identifies `left`/`margin-left` as reflow-triggering — forces full layout recalculation on every animation frame
- [ ] Rewrites the sidebar animation to use `transform: translateX(-100%)` → `transform: translateX(0)` instead
- [ ] Explains that `transform` and `opacity` are composited by the GPU and do not trigger reflow or repaint
- [ ] Optionally adds `will-change: transform` on the sidebar to promote it to its own compositor layer, with the caveat that overuse wastes GPU memory
