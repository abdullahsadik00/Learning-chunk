# Day 27 Assessment — CSS Variables · Responsive Design · Dark Mode

**Theme:** You are building a multi-theme, responsive product dashboard that must work on mobile, tablet, and desktop. The product must support light mode, dark mode, and a user-override that persists across sessions.

---

### Q1 — CSS Custom Properties Syntax ⭐

**Scenario:** A junior engineer declares a CSS variable inside a component class and wonders why it is not available on a sibling component. You need to explain scope, the `:root` convention, and fallback values.

**Task:** Demonstrate the correct way to declare global CSS variables, override them for a dark theme class, and consume them with a fallback value.

**Acceptance Criteria:**
- [ ] Variables are declared inside `:root {}` for global scope, using `--` prefix (e.g., `--color-bg: #ffffff`)
- [ ] Correctly overrides variables inside `.dark {}` or `[data-theme="dark"] {}` by re-declaring the same custom property names with new values
- [ ] Correctly uses variables with `var(--color-bg)` syntax
- [ ] Demonstrates a fallback: `var(--color-bg, #ffffff)` and explains when the fallback is used (variable is undefined or invalid)
- [ ] Explains variable scope: a variable declared on `.card {}` is only available to `.card` and its descendants
- [ ] Explains that CSS variables are inherited down the DOM tree, unlike preprocessor variables
- [ ] States that CSS variables can be reassigned at any scope level without breaking other uses

---

### Q2 — Media Query Syntax ⭐

**Scenario:** Two engineers debate mobile-first vs desktop-first breakpoints. One writes `@media (max-width: 767px)`, the other writes `@media (min-width: 768px)`. You need to explain which approach is preferred and why, and fix a specificity issue caused by declaration order.

**Task:** Write both forms of a breakpoint for `768px`. Explain the practical difference and the recommended approach.

**Acceptance Criteria:**
- [ ] Correctly writes `@media (min-width: 768px)` for "tablet and above" (mobile-first)
- [ ] Correctly writes `@media (max-width: 767px)` for "mobile only" (desktop-first)
- [ ] Explains mobile-first: base styles apply to all sizes, media queries add complexity for larger screens
- [ ] Explains desktop-first: base styles target large screens, media queries strip features for smaller screens
- [ ] States that mobile-first is preferred because it progressively enhances rather than degrades
- [ ] Notes that declaration order matters: a `min-width` query later in the file overrides an earlier one at the same specificity
- [ ] Mentions `@media (width >= 768px)` as the newer range syntax equivalent to `min-width`

---

### Q3 — Tailwind Breakpoints ⭐

**Scenario:** A new team member comes from a desktop-first CSS background. They write `lg:hidden` expecting it to hide an element on large screens, then show it on small. The element is always hidden. You need to clarify how Tailwind's prefix system works.

**Task:** List the five default Tailwind breakpoints with their pixel values. Explain what `sm:flex` means in plain English. Fix the engineer's misunderstanding.

**Acceptance Criteria:**
- [ ] Lists all five breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`
- [ ] Explains that all Tailwind responsive prefixes are `min-width` — they activate at that width and above
- [ ] Correctly reads `sm:flex` as "apply `display: flex` at screen widths 640px and above"
- [ ] Explains the engineer's bug: `lg:hidden` means "hide at 1024px and above", not "hide only on large screens" — it does not undo itself below `lg`
- [ ] Provides the correct fix: `flex lg:hidden` (show by default, hide at large screens)
- [ ] States that Tailwind has no built-in `max-width` variant by default (though it can be configured)
- [ ] Explains that unprefixed utilities apply at all breakpoints (mobile-first base)

---

### Q4 — Viewport Units ⭐

**Scenario:** On iOS Safari, a full-screen hero section using `height: 100vh` is cropped by the browser chrome (address bar). A designer files a bug. You also need to demonstrate fluid typography using `clamp()`.

**Task:** Explain the difference between `vh`, `dvh`, and `svh`. Write a `clamp()` expression for a heading that scales between `1.5rem` at mobile and `3rem` at desktop.

**Acceptance Criteria:**
- [ ] Explains `vh`: 1% of the viewport height — does not account for browser UI like the address bar on mobile
- [ ] Explains `dvh` (dynamic viewport height): updates as the browser UI appears and disappears on scroll — fixes the iOS Safari crop bug
- [ ] Explains `svh` (small viewport height): always the minimum height when browser UI is fully visible — safe, consistent, but may feel short
- [ ] Fixes the hero section with `height: 100dvh` and notes `100svh` as a conservative alternative
- [ ] Writes a valid `clamp()`: e.g., `font-size: clamp(1.5rem, 4vw, 3rem)`
- [ ] Explains the three arguments: minimum value, preferred/fluid value, maximum value
- [ ] States that the preferred value (`4vw`) is used when it falls between min and max; at narrow viewports, the min clamps it; at wide viewports, the max clamps it

---

### Q5 — CSS Variables + Dark Mode Color System ⭐⭐

**Scenario:** The design system requires five semantic color tokens: background, surface, text primary, text secondary, and brand accent. Each must work in both light and dark mode. The tokens must be easy for engineers to use without memorizing hex values.

**Task:** Implement the five semantic tokens for light mode in `:root` and dark mode in `.dark`. Use the tokens in a sample card component.

**Acceptance Criteria:**
- [ ] Declares all five tokens in `:root`: `--color-bg`, `--color-surface`, `--color-text-primary`, `--color-text-secondary`, `--color-brand` (or equivalent semantic names)
- [ ] Overrides all five tokens under `.dark` with dark-mode appropriate values
- [ ] Demonstrates using tokens in a `.card` component (background uses `--color-surface`, text uses `--color-text-primary`, etc.)
- [ ] Avoids hardcoding hex values directly in component CSS — all values flow through variables
- [ ] The dark mode override only changes the variable values, not the component CSS rules — component CSS is written once
- [ ] Uses a meaningful naming convention (semantic names, not descriptive like `--blue-500`)
- [ ] Includes at least one token used for `border` or `box-shadow` to show tokens work beyond color fills

---

### Q6 — Responsive Typography with `clamp()` ⭐⭐

**Scenario:** A heading uses `clamp(1rem, 2.5vw, 2rem)`. A QA engineer tests it at `320px`, `768px`, and `1600px` viewport widths and gets confused by the results. You need to predict the rendered font size at each width and explain when the preferred value wins.

**Task:** Given `font-size: clamp(1rem, 2.5vw, 2rem)`, calculate the rendered font size at `320px`, `800px`, and `1600px` viewport widths. Explain the clamping behaviour.

**Acceptance Criteria:**
- [ ] At `320px`: preferred = `2.5vw = 8px`, which is below the `1rem (16px)` minimum, so rendered size = `16px` (minimum clamps it)
- [ ] At `800px`: preferred = `2.5vw = 20px`, which is between min (16px) and max (32px), so rendered size = `20px` (preferred wins)
- [ ] At `1600px`: preferred = `2.5vw = 40px`, which exceeds the `2rem (32px)` maximum, so rendered size = `32px` (maximum clamps it)
- [ ] Explains that the preferred value "wins" only when it falls strictly between the min and max values
- [ ] Notes that `rem` units in `clamp()` are relative to the root font size (typically `16px`) and are not affected by viewport width
- [ ] Suggests that `clamp()` can eliminate most font-size media queries for headings
- [ ] Identifies a potential accessibility concern: `vw`-based font sizes do not respect the user's browser font size preference — recommends combining with `rem` in the preferred value

---

### Q7 — Dark Mode Strategies ⭐⭐

**Scenario:** The product team wants dark mode. The accessibility team requires it to respect the user's OS preference. The UX team wants a manual toggle that persists. You need to design a strategy that satisfies all three requirements.

**Task:** Compare class-based dark mode (`html.dark`) vs `prefers-color-scheme` media query. Explain the pros and cons of each, then describe how to combine both.

**Acceptance Criteria:**
- [ ] Explains `prefers-color-scheme: dark`: reads the OS/browser setting, no JavaScript required, automatic
- [ ] Explains class-based (`.dark` on `<html>`): requires JavaScript to add/remove the class, allows user override, requires `localStorage` to persist
- [ ] Pro of `prefers-color-scheme`: zero JS, works with CSS only, respects user system preference automatically
- [ ] Con of `prefers-color-scheme`: no user override without JavaScript reading the media query anyway
- [ ] Pro of class-based: full control over when dark mode activates, easy to toggle programmatically
- [ ] Con of class-based: does not default to system preference without JS; can cause FOUC (flash of unstyled content) if JS is slow to run
- [ ] Describes a combined strategy: default to `prefers-color-scheme` via media query, then override with `.dark`/`.light` class when user manually toggles; read `localStorage` on page load before first paint to prevent FOUC

---

### Q8 — Container Queries ⭐⭐

**Scenario:** A `<Card>` component is used in three contexts: a full-width hero, a 3-column grid, and a 400px sidebar. In the sidebar, the card needs to switch to a compact layout. A `@media` breakpoint cannot target just the sidebar cards — it targets all cards at that viewport width.

**Task:** Explain what `@container` queries solve. Write a container query that switches the card to a stacked layout when its container is narrower than `400px`.

**Acceptance Criteria:**
- [ ] Explains the problem with `@media`: it queries the viewport, so all cards change at the same breakpoint regardless of their actual available space
- [ ] Explains `@container`: queries the size of the element's containing block, not the viewport
- [ ] Demonstrates declaring a containment context: `container-type: inline-size` on the card's parent wrapper
- [ ] Optionally adds `container-name: card-wrapper` to target named containers specifically
- [ ] Writes a valid container query: `@container (max-width: 400px) { .card { flex-direction: column; } }`
- [ ] Explains that without `container-type` on an ancestor, `@container` has no reference point and will not work
- [ ] Notes browser support: container queries are supported in all modern browsers as of 2023, with no need for a polyfill in most projects

---

### Q9 — CSS Variables Limitations ⭐⭐

**Scenario:** A developer tries to use a CSS variable as a media query value and it silently fails. Another tries to animate a color by transitioning a CSS variable and gets no animation. You need to explain why and what the workarounds are.

**Task:** Describe two key limitations of CSS custom properties. For each, provide a concrete workaround.

**Acceptance Criteria:**
- [ ] Limitation 1: CSS variables cannot be used inside media query conditions — `@media (min-width: var(--breakpoint-md))` is invalid because media queries are evaluated before the cascade
- [ ] Workaround 1: Use PostCSS or Sass variables (processed at build time) for media query values, or use `@custom-media` (CSS Media Queries Level 5 proposal, requires PostCSS plugin)
- [ ] Limitation 2: CSS variables themselves cannot be transitioned/animated directly — `transition: --color 0.3s` has no effect because the browser does not know the variable's type
- [ ] Workaround 2a: Transition the property that uses the variable (e.g., `transition: background-color 0.3s`) — this works if the variable controls a single property
- [ ] Workaround 2b: Use `@property` to register a typed CSS variable with a syntax and initial value — this enables animation
- [ ] Demonstrates `@property` registration syntax: `@property --color { syntax: '<color>'; inherits: false; initial-value: #fff; }`
- [ ] Explains that registered properties via `@property` can be transitioned and animated like any regular CSS property

---

### Q10 — `prefers-reduced-motion` ⭐⭐

**Scenario:** The app has several animations: a spinning loader, a page slide transition, and a button press bounce. A user with vestibular disorder reports nausea from the slide transition. You need to respect the OS accessibility setting.

**Task:** Explain what `prefers-reduced-motion` detects and which OS setting controls it. Write a media query that disables the animations for affected users.

**Acceptance Criteria:**
- [ ] Explains that `prefers-reduced-motion: reduce` detects the OS "Reduce Motion" setting (macOS: Accessibility → Display, iOS: Accessibility → Motion, Windows: Ease of Access → Display)
- [ ] Writes a correct media query: `@media (prefers-reduced-motion: reduce) { ... }`
- [ ] Disables or simplifies each animation inside the query (e.g., `animation: none`, `transition: none`, or a simple fade instead of a slide)
- [ ] Distinguishes between disabling motion entirely vs replacing it with a subtle fade (fade is acceptable; rapid movement is what triggers issues)
- [ ] Demonstrates the recommended "opt-in" motion pattern: define `animation: none` by default and add motion inside `@media (prefers-reduced-motion: no-preference)`
- [ ] Shows Tailwind's equivalent: `motion-reduce:animate-none` or `motion-safe:animate-spin`
- [ ] Notes that the spinning loader should switch to a static visual or a simple opacity pulse when reduced motion is active

---

### Q11 — Responsive Images: `srcset`, `sizes`, and `<picture>` ⭐⭐

**Scenario:** The marketing page has a hero image. On a 1x display it loads fine, but on a Retina (2x) screen the image looks blurry. On mobile, the full 2000px image still downloads, wasting 4G bandwidth. You need to fix both problems.

**Task:** Implement a responsive hero image using `srcset` and `sizes`. Explain when to use `<picture>` instead.

**Acceptance Criteria:**
- [ ] Writes an `<img>` with a `srcset` attribute listing at least two image sources with their widths (e.g., `hero-800.jpg 800w, hero-1600.jpg 1600w`)
- [ ] Adds a `sizes` attribute that tells the browser how wide the image will actually render (e.g., `sizes="(max-width: 768px) 100vw, 1200px"`)
- [ ] Explains that `srcset` with `w` descriptors provides width options; the browser selects the best one based on `sizes` and the device pixel ratio
- [ ] Explains that without `sizes`, the browser assumes 100vw and may download an unnecessarily large image
- [ ] Explains `<picture>`: used for art direction (different image crops per breakpoint) or format switching (WebP with JPEG fallback)
- [ ] Demonstrates `<picture>` with a `<source media="(min-width: 768px)" srcset="wide.jpg">` and a fallback `<img src="narrow.jpg">`
- [ ] States the rule: use `srcset`+`sizes` for resolution/size selection; use `<picture>` when the image composition itself changes

---

### Q12 — Design Token System: Three-Tier Architecture ⭐⭐⭐

**Scenario:** The design system is a mess of hardcoded hex values scattered across 80 CSS files. When the brand color changes from `#0052CC` to `#0047AB`, 47 files need updating. You propose a three-tier token system.

**Task:** Design a three-tier token system (primitive → semantic → component) for a button. Define at least 4 primitives, 3 semantic tokens that reference them, and 2 component tokens that reference the semantic tier.

**Acceptance Criteria:**
- [ ] Tier 1 (Primitive): raw values with no semantic meaning — e.g., `--color-blue-500: #0052CC`, `--color-blue-700: #003D99`, `--color-white: #ffffff`, `--color-slate-900: #0f172a`
- [ ] Tier 2 (Semantic): reference primitives and describe intent — e.g., `--color-action-primary: var(--color-blue-500)`, `--color-action-hover: var(--color-blue-700)`, `--color-text-on-action: var(--color-white)`
- [ ] Tier 3 (Component): specific to a component, references semantic tokens — e.g., `--btn-bg: var(--color-action-primary)`, `--btn-hover-bg: var(--color-action-hover)`
- [ ] Changing `--color-blue-500` in the primitive tier cascades to all semantic and component tokens automatically — demonstrates a single-point-of-truth change
- [ ] Dark mode only needs to override the semantic tier: `--color-action-primary` maps to a different primitive value in `.dark`
- [ ] Explains why skipping the semantic tier (using primitives directly in components) breaks dark mode theming
- [ ] Documents each tier's naming convention clearly — engineers can guess the token name without looking it up

---

### Q13 — Fluid Layouts without Breakpoints ⭐⭐⭐

**Scenario:** A designer asks if it is possible to build a layout that "just works" at any screen size without a single `@media` query. You accept the challenge and use `min()`, `max()`, and `clamp()` with CSS intrinsic sizing.

**Task:** Build a two-column layout where the sidebar is at least `200px`, at most `300px`, and takes `25%` of the container otherwise — all without a breakpoint. Demonstrate `clamp()` for a heading in this layout.

**Acceptance Criteria:**
- [ ] Uses `display: grid` with `grid-template-columns: clamp(200px, 25%, 300px) 1fr` to size the sidebar fluidly
- [ ] Correctly explains `clamp(200px, 25%, 300px)`: minimum `200px`, preferred `25%` of container, maximum `300px`
- [ ] The main content area uses `1fr` to fill remaining space without a breakpoint
- [ ] At narrow viewports where 25% would be below 200px, the sidebar holds at 200px (minimum clamps it)
- [ ] At wide viewports where 25% would exceed 300px, the sidebar stops at 300px (maximum clamps it)
- [ ] Demonstrates `min()` or `max()` usage: e.g., `width: min(600px, 90vw)` to cap content width while keeping it padded at mobile
- [ ] Acknowledges the limitation: purely intrinsic layouts cannot handle all design requirements — a breakpoint that changes layout structure (e.g., stacking to grid) still requires `@media` or `@container`

---

### Q14 — CSS Cascade Layers ⭐⭐⭐

**Scenario:** The app imports a third-party UI library. The library's button styles (`.btn { color: blue }`) have higher specificity than the team's override (`.btn { color: red }`). Every override requires `!important` or adding IDs. The codebase is accumulating specificity hacks.

**Task:** Explain how `@layer` solves this problem. Define three layers: `base`, `components`, `utilities`. Show how a low-specificity utility rule can override a high-specificity component rule in a lower layer.

**Acceptance Criteria:**
- [ ] Explains that cascade layers allow explicit control over the cascade order, independent of specificity
- [ ] Declares layers in order: `@layer base, components, utilities;` — later layers win over earlier ones, regardless of specificity
- [ ] Shows placing the third-party library import in the `base` layer: `@layer base { @import 'library.css'; }`
- [ ] Shows a team utility in the `utilities` layer: `@layer utilities { .text-red { color: red; } }`
- [ ] Explains that `.text-red` in `utilities` wins over the library's `.btn { color: blue }` in `base` even if `.btn` has higher specificity — because layer order wins first in the cascade
- [ ] Shows that within a layer, normal specificity rules apply
- [ ] States that unlayered styles beat all layers (treat unlayered styles as a top-priority implicit layer) and explains the implication for third-party imports that are not wrapped in a layer

---

### Q15 — Theming Architecture: SSR-safe, Persistent, System-aware ⭐⭐⭐

**Scenario:** The dashboard is a Next.js SSR app. A previous attempt at dark mode caused a white flash on every page load (FOUC). The previous developer used `useEffect` to read `localStorage` after hydration — but by then the page already painted in light mode.

**Task:** Design a theming architecture that: avoids FOUC on SSR, persists the user's choice to `localStorage`, defaults to the system preference, and allows manual override. Describe each piece and why it is necessary.

**Acceptance Criteria:**
- [ ] Identifies the FOUC root cause: `useEffect` runs after paint on the client — the server sends HTML without knowing the user's preference, and the client corrects it too late
- [ ] Proposes injecting a blocking `<script>` in `<head>` before any CSS loads — this script reads `localStorage` and sets `document.documentElement.classList.add('dark')` synchronously, before the browser paints
- [ ] The blocking script checks `localStorage` first (user override), then falls back to `window.matchMedia('(prefers-color-scheme: dark)')` for system preference
- [ ] CSS uses `.dark` class on `<html>` to apply dark theme via custom property overrides — no runtime style injection needed
- [ ] A React context or Zustand store manages the current theme state for the toggle UI only — the `<html>` class is the source of truth for styles
- [ ] The manual toggle writes to `localStorage` and updates the `<html>` class immediately — no re-render delay
- [ ] The system preference is monitored via `window.matchMedia(...).addEventListener('change', ...)` so if the user changes their OS setting, the app updates — but only if they have not set a manual override in `localStorage`
