# Day 29 Assessment — Tailwind CSS Deep Dive · Variants · Animation

**Theme:** You are building the design system for a B2B SaaS product using Tailwind CSS v3. You need a consistent, accessible, animated component library.

---

### Q1 — Tailwind v3 JIT ⭐

**Scenario:** A developer on your team is using a Tailwind CDN script in development. It loads all Tailwind classes at once, so arbitrary values like `w-[342px]` work. But in the production build (Vite + Tailwind v3), those arbitrary classes disappear. They do not understand why or how JIT works.

**Task:** Explain how Tailwind v3's JIT engine works. Explain what the `content` array controls and why the CDN and build output differ.

**Acceptance Criteria:**
- [ ] Explains JIT: Tailwind scans source files on demand (and on change in dev mode) and generates only the CSS classes found in the content files
- [ ] Explains the `content` array in `tailwind.config.ts`: it is a list of file globs that JIT scans for Tailwind class name strings
- [ ] Explains why arbitrary values (`w-[342px]`) disappear in production: if the file containing that class is not in the `content` array, JIT never sees it and never generates the CSS
- [ ] Explains the CDN difference: the CDN script ships a pre-built stylesheet with all classes included — it does not scan anything
- [ ] Provides the correct fix: add the missing file path or glob to the `content` array in `tailwind.config.ts`
- [ ] Explains that in Tailwind v3, JIT is the only mode — the "purge" step from v2 is gone because generation and purging happen simultaneously
- [ ] Notes that dynamic class names built at runtime (e.g., template literals: `text-${color}-500`) are invisible to JIT — these must be safelisted

---

### Q2 — Responsive Prefix ⭐

**Scenario:** A junior engineer writes `md:hidden` expecting the element to be hidden on medium-sized screens only. The element is instead hidden on medium screens and all larger screens. They file a bug.

**Task:** Explain what the responsive prefix activates and at what viewport width. Clarify the "medium screens only" misunderstanding. Provide the correct class combination.

**Acceptance Criteria:**
- [ ] Lists the five breakpoint values: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`
- [ ] Explains that all responsive prefixes in Tailwind use `min-width` — they activate at that breakpoint and stay active for all larger sizes
- [ ] Explains the engineer's misunderstanding: `md:hidden` means "hidden at 768px and above" not "hidden only at 768px–1023px"
- [ ] Provides the correct solution to hide on medium only: `md:hidden lg:block` — hide starting at `md`, then un-hide at `lg`
- [ ] States that unprefixed classes apply at all sizes (mobile-first base)
- [ ] Explains the mental model: Tailwind breakpoints are range-floor, not range-exact — there is no built-in `md-only` variant by default
- [ ] Mentions that `max-md:hidden` (Tailwind v3.2+) or custom `max-width` screen variants can achieve "below a breakpoint" targeting

---

### Q3 — Dark Mode Prefix ⭐

**Scenario:** The design system supports dark mode but the `dark:` prefix is not working for a developer. They have the HTML class `.dark` on the `<html>` tag, but the dark styles do not apply. You check `tailwind.config.ts` and see no `darkMode` setting.

**Task:** Explain the two dark mode strategies in Tailwind. Show the config for each. Explain when you would choose one over the other.

**Acceptance Criteria:**
- [ ] Explains strategy 1 — `media`: Tailwind's default; the `dark:` prefix activates based on the OS `prefers-color-scheme: dark` media query; no JavaScript class manipulation needed
- [ ] Explains strategy 2 — `class`: the `dark:` prefix activates when a `dark` class is on a parent element (usually `<html>`); requires JavaScript to add/remove the class; enables user-controlled toggle
- [ ] Shows the config for `class` strategy: `darkMode: 'class'` in `tailwind.config.ts`
- [ ] Shows the config for `media` strategy: `darkMode: 'media'` (or simply omitting `darkMode` — media is the default in v3)
- [ ] Diagnoses the bug: the developer has the class on `<html>` but Tailwind defaults to `media` mode, so the class is ignored
- [ ] Fix: add `darkMode: 'class'` to `tailwind.config.ts`
- [ ] Recommends `class` strategy for most production apps: gives user control and avoids FOUC issues with server rendering

---

### Q4 — State Variants ⭐

**Scenario:** A new engineer asks you to explain the five state variants they see in the codebase: `hover:`, `focus:`, `active:`, `disabled:`, and `group-hover:`. They want to know what each targets and when to use each.

**Task:** Explain all five variants with one concrete example each. Clarify what `group-hover:` requires in the HTML structure.

**Acceptance Criteria:**
- [ ] `hover:` — applies when the user hovers the element with a pointer; example: `hover:bg-blue-700` on a button
- [ ] `focus:` — applies when the element has keyboard or programmatic focus; example: `focus:ring-2 focus:ring-blue-500` on an input
- [ ] `active:` — applies while the element is being pressed (mousedown or touchstart); example: `active:scale-95` for a "press" effect on a button
- [ ] `disabled:` — applies when the element has the HTML `disabled` attribute; example: `disabled:opacity-50 disabled:cursor-not-allowed` on a button
- [ ] `group-hover:` — applies to a child element when its ancestor (marked with `group`) is hovered; example: a card with `group` that shows an icon using `group-hover:opacity-100` when the card is hovered
- [ ] Explains that `group` must be on an ancestor element for `group-hover:` to work — Tailwind generates `group:hover .child` CSS
- [ ] Notes that `focus-visible:` (not `focus:`) is preferred for ring styles because it only shows for keyboard navigation, not mouse clicks — better accessibility

---

### Q5 — `group` and `peer` ⭐⭐

**Scenario:** A table row should turn blue (`bg-blue-50`) when hovered, and a disclosure icon on the right side of that row should rotate 90° and change color when the row is hovered. Using individual `hover:` on each element requires separate JavaScript. You want a pure CSS solution with Tailwind.

**Task:** Implement this row using `group` and `group-hover`. Then describe a scenario where `peer` would be used instead, and how `peer` differs from `group`.

**Acceptance Criteria:**
- [ ] The `<tr>` or row container has the `group` class applied
- [ ] The row itself uses `group-hover:bg-blue-50` to change its own background (or the same class is on the row, since `group-hover` can apply to the group element itself in newer Tailwind via `group-hover:` on a sibling)
- [ ] The icon uses `group-hover:rotate-90 group-hover:text-blue-600` to transform and recolor on row hover
- [ ] Explains that `group` creates a named hover scope — child elements can react to the parent's hover state
- [ ] Named groups: `group/row` and `group-hover/row:` for disambiguation when groups are nested
- [ ] Explains `peer`: marks a sibling element so a following sibling can react to its state; example: a checkbox `peer` and a label `peer-checked:text-green-600` that turns green when the checkbox is checked
- [ ] Key difference: `group` is parent → child; `peer` is sibling → sibling (following sibling only, due to CSS `~` selector direction)

---

### Q6 — `cva` (class-variance-authority) ⭐⭐

**Scenario:** The design system needs an `Alert` component with four variants (success, warning, error, info) and two sizes (sm, md). Without a structured approach, the component uses a long `if/else` chain. You introduce `cva`.

**Task:** Implement the full `Alert` component using `cva`. Include base classes, all variants, both sizes, and a default variant configuration.

**Acceptance Criteria:**
- [ ] Imports `cva` and optionally `VariantProps` from `'class-variance-authority'`
- [ ] Defines base classes shared across all alerts: e.g., `'flex items-start gap-3 rounded-lg border p-4 text-sm font-medium'`
- [ ] Defines 4 `variant` entries with distinct Tailwind classes: `success`, `warning`, `error`, `info` — each with different background, text, and border color utilities
- [ ] Defines 2 `size` entries: `sm` with smaller padding/text, `md` with standard padding/text
- [ ] Sets `defaultVariants: { variant: 'info', size: 'md' }` so `<Alert />` works without any props
- [ ] The React component uses `VariantProps<typeof alertVariants>` to type the `variant` and `size` props
- [ ] The component passes `{ variant, size }` to the `cva` function and spreads the result into `className` — supports `className` prop for additional overrides via `twMerge`

---

### Q7 — `tailwind-merge` ⭐⭐

**Scenario:** A `Button` component has a default `className` of `px-4 py-2 bg-blue-500`. A consumer passes `className="px-6 bg-red-500"`. Simple string concatenation produces `px-4 py-2 bg-blue-500 px-6 bg-red-500` — the button renders with `px-4` (not `px-6`) because both apply and the first one in the Tailwind output wins. The consumer's override is silently ignored.

**Task:** Explain why naive concatenation fails with Tailwind. Show how `tailwind-merge` (`twMerge`) solves it. Show the correct implementation inside the `Button` component.

**Acceptance Criteria:**
- [ ] Explains the root cause: Tailwind's utility classes all exist in a static CSS file; when `px-4` and `px-6` both appear in the class list, CSS specificity does not differentiate them — whichever comes later in the stylesheet wins, which is unpredictable from the HTML
- [ ] Explains that `twMerge('px-4 px-6')` returns `'px-6'` because `tailwind-merge` understands Tailwind's class groups — it deduplicates conflicting classes, keeping the last one
- [ ] Demonstrates the component pattern: `className={twMerge('px-4 py-2 bg-blue-500', props.className)}`
- [ ] Explains that `twMerge` handles complex conflicts: `p-4` vs `px-6` (keeps `p-4` and `px-6`, removing only the x-axis padding from `p-4`), `text-sm` vs `text-lg` (keeps `text-lg`)
- [ ] Shows combining `cva` + `twMerge`: wrap the `cva` output and the consumer's className in `twMerge` so both work correctly together
- [ ] Distinguishes `twMerge` from `clsx`: `clsx` only handles conditional class joining (e.g., `clsx({ 'bg-blue': isBlue })`) but does not resolve Tailwind class conflicts
- [ ] Notes the common pattern: `import { clsx } from 'clsx'; import { twMerge } from 'tailwind-merge'; const cn = (...args) => twMerge(clsx(args));` — often imported from a shared `utils/cn.ts` file

---

### Q8 — Tailwind Animations ⭐⭐

**Scenario:** The loading state uses `animate-spin` on a spinner icon, a skeleton loader uses `animate-pulse`, and a notification badge uses `animate-bounce`. A developer asks what keyframes each uses and how to add a custom `animate-ping` variant that fades out instead of scaling.

**Task:** Describe the keyframes behind each built-in animation. Write the `tailwind.config.ts` addition for a custom `fade-out-ping` animation.

**Acceptance Criteria:**
- [ ] `animate-spin`: applies a `spin` keyframe — `from { transform: rotate(0deg) }` → `to { transform: rotate(360deg) }` — continuous linear rotation
- [ ] `animate-pulse`: applies a `pulse` keyframe — fades between `opacity: 1` and `opacity: 0.5` using `ease-in-out` timing — used for skeleton loaders
- [ ] `animate-bounce`: applies a `bounce` keyframe — translates Y from 0 to `-25%` and back, with `cubic-bezier` easing for a bounce feel
- [ ] `animate-ping`: applies a `ping` keyframe — scales from 1 to 2 while fading from `opacity: 1` to `opacity: 0` — used for notification badges/beacons
- [ ] Adds the custom animation to `theme.extend.keyframes`: defines a `fade-out-ping` keyframe that fades opacity from 1 to 0 without scaling
- [ ] Adds to `theme.extend.animation`: `'fade-out-ping': 'fade-out-ping 1s ease-out infinite'`
- [ ] Resulting utility class in HTML: `animate-fade-out-ping`

---

### Q9 — `@apply` Directive ⭐⭐

**Scenario:** A developer creates a `.btn` class in `globals.css` using `@apply` to encapsulate the button's Tailwind utilities. It works in development. A colleague points out two problems with this approach at scale.

**Task:** Write a button using `@apply`. Then explain the two key problems it introduces compared to putting the utilities directly in the HTML/JSX.

**Acceptance Criteria:**
- [ ] Demonstrates valid `@apply` usage: `.btn { @apply bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors; }`
- [ ] Problem 1 — build-time coupling: `@apply` requires the utilities to be available at CSS processing time; in some PostCSS configurations with `@layer` ordering, `@apply`-ing a class from a higher layer into a lower layer causes build errors or unexpected results
- [ ] Problem 2 — JIT optimization loss: when using `@apply` in plain CSS files, Tailwind cannot tree-shake or optimize those rules as aggressively; the developer experience of seeing exactly what CSS is generated becomes less transparent
- [ ] Problem 3 (bonus): defeats Tailwind's core purpose — you are back to naming things (`.btn`) and maintaining two files; the whole point of Tailwind is colocating styles with markup
- [ ] States the Tailwind team's official recommendation: prefer extracting to a component (React/Vue/HTML partial) over using `@apply` — the component IS the single source of truth
- [ ] Notes the one valid use case for `@apply`: base HTML element resets in a `@layer base` block — e.g., `h1 { @apply text-3xl font-bold; }` — where you cannot add classes to the HTML
- [ ] Shows the preferred refactor: move the button styles back into the JSX as a className string, wrap in a `<Button>` component

---

### Q10 — Arbitrary Values ⭐⭐

**Scenario:** A designer specifies exact pixel values that do not exist in the default Tailwind scale: `342px` for a sidebar, `#1a1a2e` for a custom dark background, and a fluid font size using `clamp(1rem, 2vw, 2rem)`.

**Task:** Write the Tailwind class for each arbitrary value. Explain when to use arbitrary values vs adding the value to `tailwind.config.ts`.

**Acceptance Criteria:**
- [ ] Writes correct arbitrary width: `w-[342px]`
- [ ] Writes correct arbitrary background color: `bg-[#1a1a2e]`
- [ ] Writes correct arbitrary font size with `clamp`: `text-[clamp(1rem,2vw,2rem)]`
- [ ] Rule for using arbitrary values: use them for one-off values that are component-specific and unlikely to be reused across the codebase
- [ ] Rule for adding to config: if the same value is used in 3+ places, add it to `theme.extend` — it becomes a named utility (e.g., `w-sidebar`, `bg-brand-deep`) with autocomplete support
- [ ] Notes that arbitrary values work with any Tailwind utility that accepts a value: `w-`, `h-`, `bg-`, `text-`, `p-`, `m-`, `border-`, `shadow-`, `top-`, etc.
- [ ] Warns that arbitrary values with spaces require underscore substitution: `bg-[url('/image.png')]` uses `_` for spaces within the bracket: `content-['hello_world']`

---

### Q11 — Transition & Animation Best Practices ⭐⭐

**Scenario:** A component uses `transition-all duration-300` for smoothness. A performance engineer flags it during a code review, saying it causes unnecessary reflows. You also need to integrate `prefers-reduced-motion` support.

**Task:** Explain why `transition-all` is problematic. List which properties to transition instead. Show the correct `prefers-reduced-motion` integration with Tailwind.

**Acceptance Criteria:**
- [ ] Explains `transition-all`: watches every CSS property for changes and transitions them all — this means any property change (including layout-triggering ones) is animated, causing potential reflows on every frame
- [ ] Explains the preferred approach: only transition the properties that actually change — e.g., `transition-colors duration-200` for color/background changes, `transition-transform duration-200` for movement, `transition-opacity duration-200` for fade effects
- [ ] Lists Tailwind's specific transition utilities: `transition-colors`, `transition-opacity`, `transition-shadow`, `transition-transform` — each targets only the relevant CSS properties
- [ ] Explains `will-change`: hints to the browser to create a compositor layer in advance; `will-change-transform` promotes the element before animation starts; use sparingly — each layer consumes GPU memory
- [ ] Demonstrates Tailwind's `motion-safe:` prefix: `motion-safe:transition-transform` — applies the transition only when `prefers-reduced-motion` is not `reduce`
- [ ] Demonstrates Tailwind's `motion-reduce:` prefix: `motion-reduce:transition-none` — explicitly disables transitions for users who prefer reduced motion
- [ ] Recommends the pattern: write animations with `motion-safe:` prefix by default, treating reduced motion as the baseline, enhanced motion as the opt-in

---

### Q12 — Tailwind Plugin: Custom Utility ⭐⭐⭐

**Scenario:** The design system requires a `.text-gradient` utility that applies a configurable gradient to text. It should support a default blue-to-purple gradient but allow consumers to specify custom colors via arbitrary values.

**Task:** Write a Tailwind plugin that registers a `.text-gradient` utility with a default gradient. Explain the plugin API methods used.

**Acceptance Criteria:**
- [ ] Imports `plugin` from `'tailwindcss/plugin'`
- [ ] Calls `plugin(({ addUtilities, matchUtilities, theme }) => { ... })` to register the plugin
- [ ] Uses `addUtilities` to register a static `.text-gradient` class with the required CSS: `background-clip: text`, `-webkit-background-clip: text`, `color: transparent`, and a default `background-image: linear-gradient(to right, #3b82f6, #8b5cf6)`
- [ ] Optionally uses `matchUtilities` to make the gradient configurable: `matchUtilities({ 'text-gradient': (value) => ({ backgroundImage: value, ... }) }, { values: theme('gradients') })` — enabling `text-gradient-brand` tied to a theme value
- [ ] Correctly notes that `background-clip: text` requires `-webkit-background-clip: text` for Safari compatibility
- [ ] Explains `addUtilities`: registers static utility classes; `matchUtilities`: registers dynamic utilities that accept values (enables arbitrary value support like `text-gradient-[linear-gradient(...)]`)
- [ ] The resulting `.text-gradient` class in HTML produces visible gradient text when combined with a text element — explains which HTML element types show the effect

---

### Q13 — Design Token Mapping: Figma to Tailwind ⭐⭐⭐

**Scenario:** The design team exports a token JSON file from Figma with color tokens, spacing values, and border radii. You need to map these into `tailwind.config.ts` so engineers can use them as standard Tailwind utilities (e.g., `text-brand-primary`, `p-2`, `rounded-card`).

**Task:** Given the following Figma token structure, write the corresponding `tailwind.config.ts` `theme.extend` section.

```json
{
  "color": {
    "brand": { "primary": "#0052CC", "secondary": "#0747A6" },
    "neutral": { "100": "#F4F5F7", "900": "#172B4D" }
  },
  "spacing": { "xs": "4px", "sm": "8px", "md": "16px", "lg": "24px" },
  "radius": { "card": "12px", "button": "6px", "pill": "9999px" }
}
```

**Acceptance Criteria:**
- [ ] Maps `color.brand` to `theme.extend.colors.brand: { primary: '#0052CC', secondary: '#0747A6' }` — generates `text-brand-primary`, `bg-brand-secondary`, etc.
- [ ] Maps `color.neutral` to `theme.extend.colors.neutral: { 100: '#F4F5F7', 900: '#172B4D' }` — generates `bg-neutral-100`, `text-neutral-900`
- [ ] Maps `spacing` to `theme.extend.spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px' }` — generates `p-xs`, `m-sm`, `gap-md`, etc.
- [ ] Maps `radius` to `theme.extend.borderRadius: { card: '12px', button: '6px', pill: '9999px' }` — generates `rounded-card`, `rounded-button`, `rounded-pill`
- [ ] Uses `theme.extend` (not `theme`) for all mappings to preserve Tailwind's default scale alongside the tokens
- [ ] Explains the naming collision risk: token names like `sm` in spacing might conflict with Tailwind's default spacing scale — notes that `extend` merges but does not warn on overrides, so custom `sm` would override Tailwind's default `sm: 0.875rem`
- [ ] Recommends a prefix convention to avoid collisions: `ds-sm` or `brand-sm` for design system spacing tokens

---

### Q14 — Performance: Tree-shaking and CSS Audit ⭐⭐⭐

**Scenario:** A developer runs `npm run build` and the resulting CSS is 180kB. They expected Tailwind to be small. An audit reveals they are importing a large CSS file in a component using `@import`, and some classes are used in a dynamically loaded CMS template that Tailwind cannot scan.

**Task:** Explain how Tailwind's build-time tree-shaking works, what the typical production CSS size is, and how to audit for unused classes and fix the dynamic class problem.

**Acceptance Criteria:**
- [ ] Explains the tree-shaking mechanism: Tailwind's JIT scans all files in the `content` array using regex/AST parsing for class name strings and generates only the CSS for those classes
- [ ] States typical production CSS sizes: simple apps 5–15kB, large design systems 20–50kB gzipped; 180kB suggests either a large imported CSS file not processed by Tailwind, or many arbitrary values
- [ ] Diagnoses the `@import` problem: a large raw CSS file imported inside a component bypasses Tailwind's JIT — that CSS is bundled as-is without purging; solution: move the import to a global stylesheet or replace with Tailwind utilities
- [ ] Diagnoses the dynamic CMS template problem: if class names are assembled at runtime (e.g., from a CMS field), JIT cannot see them at build time; solution: add those classes to the `safelist` in `tailwind.config.ts`
- [ ] Describes the audit process: run `npx tailwind-stats` or analyze the build output with PurgeCSS reports; use browser DevTools Coverage tab to see which CSS rules are not used at runtime
- [ ] Explains `safelist` with a pattern: `safelist: [{ pattern: /bg-(red|blue|green)-(100|500|900)/ }]` — generates a predictable set of dynamic classes
- [ ] Notes that `cssnano` (included in the Tailwind PostCSS pipeline) further minifies the output — the raw build output vs the gzipped delivery are very different; always report gzipped size

---

### Q15 — Accessibility with Tailwind ⭐⭐⭐

**Scenario:** The design system needs a keyboard-accessible dropdown menu. Clicking the trigger button opens a menu panel. The panel must: close on Escape, show a visible focus ring for keyboard users (but not mouse users), display the open/closed state via ARIA, and animate open/close with a fade — but not if the user prefers reduced motion.

**Task:** Implement the dropdown using Tailwind classes. Show the ARIA attributes, `focus-visible:ring`, `group` open-state styling, and `motion-safe:` animation.

**Acceptance Criteria:**
- [ ] Trigger button has `aria-expanded="true"/"false"` toggled by JavaScript to communicate open/closed state to screen readers
- [ ] Trigger button has `aria-controls="menu-id"` pointing to the menu panel's `id` — allows screen readers to associate trigger with its controlled element
- [ ] Trigger button uses `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none` — ring appears for keyboard navigation but not mouse clicks
- [ ] Menu panel has `role="menu"` and each item has `role="menuitem"` with `tabindex="-1"` (focus is managed programmatically, not via tab order)
- [ ] Uses `group` on the wrapper or triggers open state via a data attribute: menu items use `group-data-[state=open]:opacity-100` or conditional classes from a state variable
- [ ] Panel uses `motion-safe:transition-opacity motion-safe:duration-150` — transition only applies when the user has not requested reduced motion
- [ ] JavaScript handles: Escape key closes the menu and returns focus to the trigger; clicking outside closes the menu; Arrow keys navigate between `menuitem` elements programmatically via `focus()`
