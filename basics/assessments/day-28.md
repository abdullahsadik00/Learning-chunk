# Day 28 Assessment — CSS Architecture · BEM · Modules · Tailwind vs CSS-in-JS

**Theme:** You are doing a tech stack review. The team debates BEM + Sass vs CSS Modules vs Tailwind vs styled-components. Your job is to make the call with evidence.

---

### Q1 — BEM Naming ⭐

**Scenario:** The design team delivers a "Feature Card" component. It has a header with an optional icon, a body with a description, a "featured" variant that adds a gold border, and a CTA button. A junior asks how to name the classes.

**Task:** Write every BEM class name needed for this component. Explain the Block, Element, and Modifier naming rules.

**Acceptance Criteria:**
- [ ] Block name: `.card` (the standalone component)
- [ ] Elements: `.card__header`, `.card__icon`, `.card__body`, `.card__description`, `.card__cta` — all use double underscore
- [ ] Modifier: `.card--featured` on the block for the gold border variant — uses double dash
- [ ] Does NOT write `.card__header--icon` for the icon — the icon is its own element `.card__icon`, not a modifier of the header
- [ ] Explains Block: a self-contained, reusable component (no dependencies on other components)
- [ ] Explains Element: a part of the block that cannot exist independently outside it, connected with `__`
- [ ] Explains Modifier: a variation or state of a block or element, connected with `--`

---

### Q2 — CSS Modules Basics ⭐

**Scenario:** A new engineer joins from a Rails background. They have never used CSS Modules. They import a stylesheet as `import styles from './Card.module.css'` and try to use it as a string class name (`className="button"`). The styles do not apply.

**Task:** Explain how CSS Modules work, how to correctly use the imported object, and what the generated class name looks like in the browser.

**Acceptance Criteria:**
- [ ] Explains that CSS Modules transform class names into unique, locally scoped identifiers at build time
- [ ] Correct usage: `className={styles.button}` — `styles` is a JavaScript object whose keys are the original class names
- [ ] Explains why `className="button"` fails: the class in the DOM is not `.button` — it is a hash like `.Card_button__a3f9b`
- [ ] Describes the generated class name pattern: `[filename]_[localname]__[hash]` (varies by bundler config)
- [ ] Explains that CSS Modules prevent class name collisions because two `.button` classes in different modules generate different hashed names
- [ ] Mentions that `:global(.class-name)` can escape the scoping when you need to target a global class (e.g., a third-party library class)
- [ ] Explains that the CSS file itself is still plain CSS — no new syntax required for basic usage

---

### Q3 — Tailwind Mental Model ⭐

**Scenario:** A designer reviewing a pull request sees the HTML: `<button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">`. They ask why there is no semantic class name like `.primary-button` and whether all those classes bloat the CSS bundle.

**Task:** Explain the utility-first philosophy. Explain why Tailwind's production bundle is small despite the large number of available utilities.

**Acceptance Criteria:**
- [ ] Explains utility-first: each class does exactly one thing (`bg-blue-500` sets background color, `py-2` sets vertical padding) — no abstraction layer
- [ ] Explains the benefit: you never have to name things or switch between HTML and CSS files; styles are colocated with markup
- [ ] Explains JIT (Just-In-Time) mode: Tailwind scans the `content` array files at build time and only generates CSS for the classes that actually appear in the source
- [ ] Explains that the traditional Tailwind CDN script ships thousands of classes, but the production build ships only what is used — typically 5–15 kB
- [ ] Contrasts with semantic CSS: semantic classes grow with every new component; utility classes reach a ceiling (most utility combinations are already there)
- [ ] Acknowledges the readability trade-off: long class strings in HTML can be hard to read; tools like `prettier-plugin-tailwindcss` sort them consistently
- [ ] Mentions that `@apply` exists to extract repeated utility patterns into a class name when needed

---

### Q4 — Global CSS Problems ⭐

**Scenario:** A team of 12 engineers works on a monolithic frontend. They use global CSS. You have been asked to document three real incidents caused by global class name collisions or unintended cascade to justify migrating to scoped styles.

**Task:** Describe three concrete incidents that happen in real projects due to global CSS without scoping.

**Acceptance Criteria:**
- [ ] Incident 1: Two engineers both add a `.card` class in separate files. Feature A's card accidentally inherits styles from Feature B's `.card`, causing visual regressions in production that only appear when both files load together
- [ ] Incident 2: A developer renames a CSS class for a button to `.btn-primary` but misses that another page uses the old name `.button-primary` in a dynamically rendered template — styles silently break on that page
- [ ] Incident 3: A third-party library is updated; it ships a `.modal` class that collides with the app's own `.modal` class. The app's modal layout breaks after a routine dependency update
- [ ] Each incident is plausible, specific, and tied to a root cause (collision, missed rename, third-party conflict)
- [ ] Explains the common root cause: global scope means any `.classname` anywhere in the CSS applies everywhere the HTML uses that class
- [ ] Proposes that CSS Modules, BEM namespacing, or Tailwind's utility approach each prevent these incidents in different ways
- [ ] Notes that the problem scales with team size — 2 engineers rarely collide; 12 engineers collide regularly

---

### Q5 — CSS Modules + TypeScript ⭐⭐

**Scenario:** Engineers keep using `styles.buttton` (typo) and TypeScript does not catch it. The bug only appears at runtime. You want compile-time safety for CSS Module class names.

**Task:** Explain how to generate TypeScript type definitions for CSS Module files. Describe the setup and what error TypeScript would report for a typo.

**Acceptance Criteria:**
- [ ] Explains that by default, `import styles from './Card.module.css'` gives TypeScript type `{ [key: string]: string }` — any key is valid, so typos are not caught
- [ ] Describes the solution: generate `.module.css.d.ts` declaration files (typed CSS Modules)
- [ ] Names at least one tool that generates these: `typescript-plugin-css-modules`, `css-modules-typescript-loader`, or `typed-css-modules` CLI (`tcm`)
- [ ] Explains that the generated `.d.ts` exports each class name as a named string literal: `export const button: string;`
- [ ] With typed CSS Modules, `styles.buttton` causes a TypeScript error: "Property 'buttton' does not exist on type..."
- [ ] Explains that the `.d.ts` files can be committed to source control or gitignored and regenerated in CI
- [ ] Notes that Vite has built-in `cssModules: { localsConvention: 'camelCase' }` option and a plugin can auto-generate types on file save

---

### Q6 — Tailwind `@apply` ⭐⭐

**Scenario:** A developer is tired of repeating `bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded` on every button in the codebase. They propose using `@apply` to extract it into a `.btn-primary` class. You need to evaluate this trade-off.

**Task:** Explain what `@apply` does, when it is appropriate, and when it defeats Tailwind's purpose.

**Acceptance Criteria:**
- [ ] Explains `@apply`: lets you use Tailwind utility classes inside a CSS rule, extracting them into a semantic class — processed at build time
- [ ] Demonstrates correct syntax in a CSS file: `.btn-primary { @apply bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded; }`
- [ ] Appropriate use case: when you have a truly repeated pattern across many files (e.g., base button styles, form input resets) and it reduces duplication without obscuring intent
- [ ] When `@apply` defeats Tailwind: when used for every single class just to avoid long class strings in HTML — you end up with the same problems as semantic CSS (naming things, maintaining two files, specificity issues)
- [ ] Notes that `@apply` breaks one of Tailwind's key promises: that you never need to name things or open a CSS file to style HTML
- [ ] Recommends the preferred alternative: extract to a React/Vue/HTML component instead of using `@apply` — colocate the class string in a single component file
- [ ] States that the Tailwind docs themselves warn against overusing `@apply` and recommend it only for specific scenarios

---

### Q7 — styled-components vs Tailwind ⭐⭐

**Scenario:** The tech lead asks you to compare styled-components and Tailwind for a Next.js SSR project. You need to evaluate: runtime cost, SSR support, class name collisions, and developer experience.

**Task:** Compare styled-components and Tailwind across the four dimensions listed in the scenario.

**Acceptance Criteria:**
- [ ] Runtime cost: styled-components injects styles at runtime via JavaScript — adds ~12kB gzipped and executes JS to generate class names in the browser; Tailwind generates a static CSS file at build time — zero runtime JS
- [ ] SSR support: styled-components requires a `ServerStyleSheet` or `StyleRegistry` wrapper to extract styles during SSR and inject them into the HTML; missing this causes a flash of unstyled content on first load; Tailwind is a static CSS file — no SSR configuration needed
- [ ] Class name collisions: styled-components generates unique hashed class names automatically (e.g., `.sc-abc123`), zero collision risk; Tailwind uses global utility class names — no collision because utility names are standardized, not component-specific
- [ ] Developer experience: styled-components — colocated styles in JavaScript, full CSS syntax, dynamic styles via props, good autocomplete with `vscode-styled-components`; Tailwind — styles in HTML/JSX, no context switching, requires learning utility names, `Tailwind CSS IntelliSense` extension for autocomplete
- [ ] Identifies the key trade-off: styled-components has more expressive dynamic styling; Tailwind has zero runtime cost and simpler SSR
- [ ] Notes that Next.js App Router has issues with styled-components (client-component only) while Tailwind works in both server and client components
- [ ] Recommends Tailwind for new SSR/RSC projects; recommends styled-components only for deeply dynamic theming scenarios where CSS variables are insufficient

---

### Q8 — Class Variance Authority (cva) ⭐⭐

**Scenario:** The design system defines a `Badge` component with 4 variants (success, warning, danger, info) and 2 sizes (sm, md). Without a library, the component has a messy `if/else` chain to build the class string. You introduce `cva`.

**Task:** Implement the `Badge` component using `cva`. Show the variant definitions and how the component consumes them.

**Acceptance Criteria:**
- [ ] Imports `cva` from `'class-variance-authority'`
- [ ] Calls `cva(baseClasses, { variants: { variant: {...}, size: {...} } })` with all 4 variants and 2 sizes defined
- [ ] Base classes include shared styles applicable to all badges (e.g., `inline-flex items-center font-medium rounded-full`)
- [ ] Variant classes map: `success: 'bg-green-100 text-green-800'`, `warning: 'bg-yellow-100 text-yellow-800'`, etc.
- [ ] Size classes map: `sm: 'text-xs px-2 py-0.5'`, `md: 'text-sm px-3 py-1'`
- [ ] The React component calls the `cva` function with `{ variant, size }` from props to get the class string
- [ ] Sets a `defaultVariants` in the `cva` config: e.g., `{ variant: 'info', size: 'md' }` so the component works without explicit props

---

### Q9 — Critical CSS ⭐⭐

**Scenario:** Lighthouse reports that the product page has a poor LCP (Largest Contentful Paint) score. An audit shows that the 200kB main CSS file is render-blocking — the browser cannot paint until it fully downloads and parses it.

**Task:** Explain what Critical CSS is, why it matters for LCP, how CSS-in-JS handles it automatically, and what you must do manually with Tailwind.

**Acceptance Criteria:**
- [ ] Defines Critical CSS: the minimal set of CSS rules needed to render the above-the-fold content visible to the user on first load
- [ ] Explains the LCP connection: render-blocking CSS delays when the browser can first paint content — improving Critical CSS delivery directly improves LCP
- [ ] Explains the solution: inline the Critical CSS in `<style>` in the `<head>` so it is immediately available; load the rest of the stylesheet asynchronously with `rel="preload"` + `onload`
- [ ] CSS-in-JS automatic handling: styled-components and Emotion extract only the styles used by the server-rendered components during SSR — only those styles are injected into the HTML `<head>`, making all SSR styles implicitly "critical"
- [ ] Tailwind manual config: Tailwind generates all utility classes at build time into one file — to extract Critical CSS, you need an additional tool like `critters` or Vite's `critical` plugin that inlines above-the-fold styles and defers the rest
- [ ] Notes that Next.js has built-in optimizations that partially address this for the App Router
- [ ] Mentions that this trade-off (automatic Critical CSS in CSS-in-JS vs manual setup for Tailwind) is a real consideration for performance-critical marketing pages

---

### Q10 — Sass vs PostCSS ⭐⭐

**Scenario:** A new project is being set up. The team lead asks whether to use Sass or PostCSS. You need to explain what each adds beyond plain CSS and recommend one for a 2026 project.

**Task:** Compare Sass and PostCSS. Explain what features Sass adds that CSS now handles natively, and what PostCSS plugins are most valuable today.

**Acceptance Criteria:**
- [ ] Sass features: nesting (now in native CSS), variables (CSS custom properties are better), mixins, `@extend`, `@each`/`@for` loops, functions, and `@use`/`@forward` module system
- [ ] Correctly notes that CSS nesting and CSS custom properties are now supported in all modern browsers — removing two of Sass's biggest selling points
- [ ] PostCSS: a tool that transforms CSS with plugins — it is a build-time CSS processor, not a language extension
- [ ] Names key PostCSS plugins: `autoprefixer` (adds vendor prefixes), `postcss-preset-env` (lets you use future CSS syntax today), `cssnano` (minification), `postcss-import` (processes `@import` at build time)
- [ ] Recommendation for 2026: PostCSS with `postcss-preset-env` — gets you future CSS features without learning a separate language; pair with `autoprefixer` for browser compatibility
- [ ] States when Sass still makes sense: large existing Sass codebase, complex loop/mixin usage not achievable in plain CSS, or team already skilled in Sass
- [ ] Notes that Vite and webpack support both Sass and PostCSS out of the box — no significant setup difference

---

### Q11 — CSS-in-JS Runtime Cost ⭐⭐

**Scenario:** A Next.js App Router project uses styled-components for all components. After enabling React Server Components, the app crashes with "styled-components cannot be used in Server Components." The team also notices hydration warnings and layout shifts on slow connections.

**Task:** Explain why styled-components causes these issues in SSR/RSC apps. Describe zero-runtime alternatives.

**Acceptance Criteria:**
- [ ] Explains that styled-components generates class names at runtime in JavaScript — it requires the browser (or Node.js) to execute the styling logic
- [ ] Explains why RSC (React Server Components) breaks styled-components: RSCs run on the server and cannot include client-side JavaScript; styled-components' dynamic class generation requires client-side execution
- [ ] Explains layout shifts: if the `ServerStyleSheet` is not properly configured, styles are not injected into the SSR HTML — the browser loads the HTML without styles and re-applies them after JS hydrates, causing a visible flash
- [ ] Explains hydration mismatch: if the server and client generate different class name hashes (e.g., due to different render order), React detects a mismatch and re-renders
- [ ] Names zero-runtime alternatives: `Linaria` (extracts CSS to static files at build time), `vanilla-extract` (type-safe CSS-in-TypeScript, zero runtime), `Panda CSS` (CSS-in-JS that generates static CSS), `Tailwind CSS`
- [ ] Explains zero-runtime: styles are processed at build time and emitted as static CSS files — no JavaScript runs in the browser to apply styles, eliminating runtime cost, hydration issues, and RSC incompatibility
- [ ] Recommends `vanilla-extract` or `Panda CSS` for teams that want CSS-in-JS DX with RSC compatibility

---

### Q12 — Architecture Decision: Large Team + SSR + Design System ⭐⭐⭐

**Scenario:** You are the tech lead for a new greenfield project: a Next.js App Router app with React Server Components, a shared design system consumed by a 20-person team, and a strict performance budget (LCP < 2s, FID < 100ms, CLS < 0.1). The team has mixed experience — some know Tailwind, some know styled-components, none know vanilla-extract.

**Task:** Recommend a CSS architecture. Justify every choice. Acknowledge trade-offs.

**Acceptance Criteria:**
- [ ] Recommends Tailwind CSS as the primary styling approach — justification: zero runtime, static CSS file, RSC compatible, LCP-friendly, scales with team via consistent utility vocabulary
- [ ] Recommends CSS Modules for complex component-specific styles that exceed what Tailwind can cleanly express — justification: zero runtime, locally scoped, TypeScript-typed via plugin
- [ ] Recommends `cva` (class-variance-authority) + `tailwind-merge` for variant-based component APIs — justification: type-safe variant system, eliminates manual class string building, works with Tailwind
- [ ] Addresses the design system: a shared package with Tailwind config preset and CSS Module components — consuming apps extend the preset; components import their own `.module.css` files
- [ ] Acknowledges the learning curve trade-off: engineers who know styled-components must learn Tailwind — proposes a 1-week ramp period and pair programming on the first 3 components
- [ ] Addresses performance: Tailwind's JIT output with PurgeCSS in production, `critters` or built-in Next.js CSS optimization for Critical CSS, no runtime JS for styles
- [ ] Identifies the one scenario where this recommendation fails: if the design system requires deeply dynamic, prop-driven styles that change at runtime (e.g., user-uploaded brand colors) — for this, CSS custom properties with Tailwind's arbitrary values handle it without CSS-in-JS runtime

---

### Q13 — Headless UI Pattern ⭐⭐⭐

**Scenario:** The team builds a custom `<Select>` component. It handles keyboard navigation, ARIA attributes, and click-outside detection correctly. But when the team tries to style it differently for a new client, they must fork the entire component and re-implement accessibility logic. A colleague suggests switching to Radix UI.

**Task:** Explain the headless UI pattern. Describe how Radix UI / Headless UI provide behavior without styles. Show how to style a Radix `<Dialog>` with both Tailwind and CSS Modules.

**Acceptance Criteria:**
- [ ] Defines headless UI: components that provide behaviour (accessibility, keyboard handling, state management) without any visual styles — they render unstyled or nearly unstyled HTML
- [ ] Explains the advantage: behaviour is implemented once and tested for accessibility compliance; teams layer their own styles without fighting framework defaults
- [ ] Names two headless UI libraries: `@radix-ui/react-*` (primitive, composable) and `@headlessui/react` (Tailwind Labs, slightly higher level)
- [ ] Radix primitives expose `data-state` attributes (e.g., `data-state="open"`) that can be targeted with CSS: `[data-state="open"] { opacity: 1; }`
- [ ] Demonstrates styling with Tailwind: `<Dialog.Content className="bg-white rounded-xl shadow-xl p-6 ...">`
- [ ] Demonstrates styling with CSS Modules: `<Dialog.Content className={styles.dialog}>` where `.dialog` is defined in a `.module.css` file
- [ ] Explains the composability: Radix's `<Dialog.Trigger>`, `<Dialog.Portal>`, `<Dialog.Overlay>`, `<Dialog.Content>` are separate parts — each receives its own `className`, giving complete visual control

---

### Q14 — Tailwind Config Deep Dive ⭐⭐⭐

**Scenario:** A design system team ships a Tailwind preset. A consuming app needs to: extend brand colors without losing Tailwind's defaults, add a custom `xs` breakpoint at `480px`, write a plugin that adds a `.focus-ring` utility, and safelist some dynamic class names generated at runtime.

**Task:** Write the relevant sections of `tailwind.config.ts` for each requirement above.

**Acceptance Criteria:**
- [ ] Extends brand colors with `theme.extend.colors` (not `theme.colors`) — using `extend` preserves all default Tailwind colors; using `theme.colors` would replace them entirely
- [ ] Adds a custom `xs` breakpoint: `theme.extend.screens: { xs: '480px' }` — results in an `xs:` prefix usable in HTML
- [ ] Writes a valid plugin function that registers `.focus-ring` as a utility: uses `plugin(({ addUtilities }) => addUtilities({ '.focus-ring': { outline: '2px solid', outlineOffset: '2px' } }))`
- [ ] Explains the `content` array: controls which files Tailwind scans for class names — must include all files that use Tailwind classes (e.g., `./src/**/*.{ts,tsx}`)
- [ ] Demonstrates `safelist`: an array of class names (or RegExp patterns) that Tailwind always includes in the output even if not found in scanned files — used for dynamic class names built at runtime (e.g., `text-${color}-500`)
- [ ] Correctly differentiates `theme` (full replacement) vs `theme.extend` (merge with defaults) — demonstrates awareness that `theme.colors = { brand: '#...' }` would remove all Tailwind colors including `gray`, `blue`, etc.
- [ ] Shows how a preset works: `presets: [require('@company/tailwind-preset')]` — the app's config is merged on top of the preset

---

### Q15 — Migration Strategy: Global CSS to CSS Modules ⭐⭐⭐

**Scenario:** A 200-file React project uses global CSS with no naming conventions. Class names like `.button`, `.card`, `.header` are scattered everywhere and some are accidentally shared. You are leading the migration to CSS Modules. It must not break the app at any step.

**Task:** Write a step-by-step migration strategy. Each step must leave the app in a working state.

**Acceptance Criteria:**
- [ ] Step 1: Audit — run a script to find all CSS class names and which components use each one; identify shared collisions and accidental global dependencies; document as a spreadsheet
- [ ] Step 2: Establish conventions — agree on the CSS Module naming convention before migrating (camelCase class names, one `.module.css` per component file)
- [ ] Step 3: Migrate leaf components first — start with components that have no child components depending on their class names; rename the CSS file to `.module.css` and update the component to use `import styles from './Component.module.css'` and `className={styles.className}`
- [ ] Step 4: Handle shared styles — identify truly shared styles (e.g., a `.visually-hidden` utility); move them to a `global.css` file imported in `_app.tsx`; explicitly keep them global with `:global()` in CSS Modules where needed
- [ ] Step 5: Migrate parent components after their children are migrated — this prevents a situation where a parent still has a global `.card` that collides with the module-scoped `.card` in a child
- [ ] Step 6: Add TypeScript types — enable `typescript-plugin-css-modules` or run `tcm` after each file migration to get type safety immediately
- [ ] Step 7: Remove the old global CSS file entries incrementally — only remove a global class once all components that used it have been migrated; add a CI check that warns on leftover global classes matching the old naming patterns
