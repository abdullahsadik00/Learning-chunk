# Day 30 Assessment — Design Systems · Tokens · Component Library · Accessibility

**Theme:** You are a senior frontend engineer hired to build a design system from scratch for a 50-person engineering team. The system must be accessible (WCAG AA), themeable, and documented.

---

### Q1 — Design Tokens: Three-Tier Definition ⭐

**Scenario:** The design lead hands you a Figma file with colors named "Blue Primary" and "Button Background." You need to establish a token vocabulary before any code is written, and explain to the team what the three tiers mean and why a flat list of tokens is not enough.

**Task:** Define primitive, semantic, and component tokens. Provide at least two examples at each tier. Explain why all three tiers are needed.

**Acceptance Criteria:**
- [ ] Primitive tokens: raw, context-free values — e.g., `color-blue-500: #3b82f6`, `color-blue-700: #1d4ed8`, `space-4: 16px`, `font-size-base: 16px` — these have no meaning by themselves
- [ ] Semantic tokens: map a primitive to an intent — e.g., `color-action-primary: {color-blue-500}`, `color-text-muted: {color-gray-500}`, `space-component-padding: {space-4}` — these describe use, not appearance
- [ ] Component tokens: scoped to a specific component — e.g., `button-bg-default: {color-action-primary}`, `button-padding-x: {space-component-padding}` — these are the final layer engineers use
- [ ] Explains why flat tokens fail: `--blue-500` used directly in 40 components means changing the brand color requires 40 file updates; with semantic tokens, you change `--color-action-primary` once
- [ ] Explains the dark mode benefit: only the semantic tier needs to change for dark mode — primitive values stay the same; semantic tokens remap to different primitives
- [ ] Explains the component token benefit: a component can expose its tokens for consumer overrides without exposing the entire semantic layer
- [ ] Correctly distinguishes that primitive tokens should never appear in component code — only semantic or component tokens should be used by engineers

---

### Q2 — WCAG Contrast Requirements ⭐

**Scenario:** The designer proposes light gray text (`#aaaaaa`) on a white background for secondary labels and a small italic caption at `12px`. You need to check these against WCAG and report which pass and which fail.

**Task:** State the WCAG AA contrast requirements for normal text, large text, and UI components. Calculate whether `#aaaaaa` on `#ffffff` passes AA for normal text.

**Acceptance Criteria:**
- [ ] WCAG AA normal text: minimum contrast ratio of 4.5:1 (text under 18pt regular or 14pt bold)
- [ ] WCAG AA large text: minimum contrast ratio of 3:1 (text 18pt+ regular or 14pt+ bold)
- [ ] WCAG AA UI components and graphical objects: minimum contrast ratio of 3:1 (for borders of form inputs, icons, focus indicators)
- [ ] WCAG AAA normal text: 7:1 — notes this is the enhanced level, not required for AA compliance
- [ ] Calculates or looks up the contrast ratio of `#aaaaaa` on `#ffffff`: approximately 2.32:1 — fails AA for all text sizes
- [ ] Identifies that the 12px caption is "normal text" in WCAG terms (not large text) — so it needs 4.5:1 at a minimum
- [ ] Proposes a fix: use a darker gray (e.g., `#767676` has a 4.54:1 ratio on white — the minimum passing gray for AA normal text)

---

### Q3 — ARIA Basics ⭐

**Scenario:** A developer adds ARIA attributes to a custom select component but uses them incorrectly: `aria-label` is applied to a container `div` that wraps both a label and an input, and `aria-hidden="true"` is set on a decorative icon that also contains the only accessible text for a button.

**Task:** Explain the correct use of `role`, `aria-label`, `aria-labelledby`, `aria-describedby`, and `aria-hidden`. Fix the two bugs described.

**Acceptance Criteria:**
- [ ] `role`: overrides the implicit semantic role of an element — e.g., `role="button"` on a `<div>` tells screen readers to treat it as a button; use sparingly, prefer semantic HTML
- [ ] `aria-label`: provides an accessible name directly as a string — use on elements with no visible text (e.g., icon buttons: `<button aria-label="Close dialog">`)
- [ ] `aria-labelledby`: references the `id` of another visible element as the accessible name — preferred over `aria-label` when a visible label already exists
- [ ] `aria-describedby`: references additional descriptive text (e.g., error messages, hints) — supplementary to the name, read after it
- [ ] `aria-hidden="true"`: removes the element from the accessibility tree — use on decorative elements only; never use on elements that contain the only accessible name of something
- [ ] Fix 1: remove `aria-label` from the wrapping `div`; associate the label with the input using `for`/`id` or `aria-labelledby` pointing to the label's `id`
- [ ] Fix 2: remove `aria-hidden` from the icon if it is the only accessible text source; either add a sibling visually-hidden `<span>` for the accessible name, or move the text outside the hidden element

---

### Q4 — Focus Management ⭐

**Scenario:** A dropdown menu opens when a button is clicked. Keyboard users cannot navigate the menu items because focus stays on the button. When the menu closes, focus goes to `<body>` instead of back to the trigger button. A developer asks about `tabindex` and programmatic focus.

**Task:** Explain the three `tabindex` values (-1, 0, and positive). Describe when to call `.focus()` programmatically. Fix the menu focus flow.

**Acceptance Criteria:**
- [ ] `tabindex="0"`: places the element in the natural tab order at its DOM position — use to make non-interactive elements focusable (e.g., `<div role="button" tabindex="0">`)
- [ ] `tabindex="-1"`: makes the element focusable programmatically via `.focus()` but removes it from the tab order — ideal for menu items managed with arrow keys
- [ ] `tabindex="1"` (positive): places the element before all `tabindex="0"` elements in tab order — almost always wrong; creates confusing tab order for keyboard users; avoid
- [ ] Menu items should use `tabindex="-1"` — focus is managed programmatically via arrow key handlers, not tab key
- [ ] On menu open: call `.focus()` on the first menu item programmatically
- [ ] On menu close: store a reference to the trigger button; call `triggerRef.current.focus()` on close — this returns focus to the trigger
- [ ] Explains that losing focus to `<body>` on close is a WCAG 2.4.3 (Focus Order) failure — keyboard users lose their place in the page

---

### Q5 — Accessible Modal ⭐⭐

**Scenario:** The product has a confirmation modal for destructive actions. Keyboard users can tab behind the modal overlay and interact with the page beneath it. The Escape key does not close the modal. Screen readers do not announce the modal title when it opens.

**Task:** Implement a fully accessible modal. Address focus trap, Escape to close, `aria-modal`, `role="dialog"`, and `aria-labelledby` pointing to the title.

**Acceptance Criteria:**
- [ ] Modal container has `role="dialog"` and `aria-modal="true"` — `aria-modal` tells supporting screen readers to treat the modal as an isolated context
- [ ] `aria-labelledby` on the dialog points to the `id` of the modal's `<h2>` title element — screen readers announce the title when focus enters the modal
- [ ] Focus trap: a `keydown` event listener intercepts Tab and Shift+Tab; when Tab is pressed on the last focusable element, focus wraps to the first; when Shift+Tab on the first, it wraps to the last
- [ ] On open: focus is moved to the modal container or the first focusable element inside — using `useEffect` + `ref.current.focus()`
- [ ] Escape key listener closes the modal and returns focus to the element that triggered it (stored in a `triggerRef` before opening)
- [ ] Background page content has `aria-hidden="true"` applied while the modal is open — prevents screen readers from reading background content
- [ ] When the modal closes, `aria-hidden` is removed from background content and focus returns to the trigger element

---

### Q6 — Design Token Cascade in CSS ⭐⭐

**Scenario:** The design system ships 200 primitive color tokens and 40 semantic tokens. Engineers keep reaching for primitive tokens directly in their components (e.g., `var(--color-blue-500)`) instead of semantic tokens (e.g., `var(--color-action-primary)`). When dark mode is added, those components do not respond.

**Task:** Implement a semantic token layer that references primitives. Demonstrate why the dark mode override works automatically when semantic tokens are used but fails when primitives are used directly.

**Acceptance Criteria:**
- [ ] Primitives in `:root`: `--color-blue-500: #3b82f6`, `--color-blue-200: #bfdbfe`, `--color-slate-900: #0f172a`, `--color-slate-100: #f1f5f9`
- [ ] Semantic tokens in `:root`: `--color-action-primary: var(--color-blue-500)`, `--color-bg-primary: var(--color-slate-100)`, `--color-text-primary: var(--color-slate-900)`
- [ ] Dark mode override in `.dark` or `[data-theme="dark"]`: re-maps ONLY the semantic tokens — `--color-bg-primary: var(--color-slate-900)`, `--color-text-primary: var(--color-slate-100)` — primitives are unchanged
- [ ] Demonstrates the failure: a component using `background: var(--color-blue-500)` directly does not change in dark mode because `--color-blue-500` is never overridden
- [ ] Demonstrates the success: a component using `background: var(--color-action-primary)` automatically picks up the dark mode value because the semantic token's referent changes
- [ ] Explains the rule: engineers should only use semantic tokens (or component tokens) in component CSS — primitive tokens are for the design system's internal token mapping only
- [ ] Shows that adding a new theme (e.g., high-contrast) requires only adding another token override block, not changing any component CSS

---

### Q7 — Icon Accessibility: Three Patterns ⭐⭐

**Scenario:** The icon library is used in three contexts: a purely decorative chevron next to text, an icon-only "delete" button with no visible label, and a "Download PDF" button where both an icon and the text "Download" are visible.

**Task:** Implement each of the three patterns correctly for screen readers.

**Acceptance Criteria:**
- [ ] Pattern 1 — Decorative icon: `<svg aria-hidden="true" focusable="false">` — screen readers skip it; `focusable="false"` prevents SVG from receiving focus in IE/Edge legacy
- [ ] Pattern 2 — Icon-only button: `<button aria-label="Delete item"><svg aria-hidden="true">...</svg></button>` — the button's accessible name comes from `aria-label`; the SVG is hidden from the tree to prevent double-reading
- [ ] Pattern 3 — Icon with visible text: `<button><svg aria-hidden="true">...</svg><span>Download</span></button>` — the icon is hidden; the visible text provides the accessible name naturally; no `aria-label` needed (it would override the visible text)
- [ ] Correctly explains that adding `aria-label` to a button that also has visible text causes screen readers to read the `aria-label` instead of the visible text — use `aria-label` only when there is no visible text
- [ ] Notes that `focusable="false"` is an SVG-specific attribute required for some older browsers where SVG elements could receive Tab focus unexpectedly
- [ ] Explains that `aria-hidden="true"` on an SVG inside a focusable element does not hide the parent element — only the SVG subtree is removed from the accessibility tree
- [ ] Recommends a shared `Icon` component that accepts an `aria-hidden` prop defaulting to `true` with an optional `aria-label` that switches the icon to labeled mode

---

### Q8 — Skip Links ⭐⭐

**Scenario:** A keyboard-only user must Tab through the entire navigation (32 links) before reaching the main content on every page load. A screen reader user reports the same issue. You need to implement a skip link.

**Task:** Explain what a skip link is. Implement one that is visually hidden by default but becomes visible on focus. Explain the CSS technique.

**Acceptance Criteria:**
- [ ] Defines a skip link: an anchor tag at the very top of the page that links to `#main-content` (or another in-page anchor), allowing keyboard users to bypass repetitive navigation
- [ ] The skip link is the first focusable element in the DOM — placed before the `<nav>` or any other content
- [ ] Visually hidden by default using the accessible hide technique: `position: absolute; left: -9999px` or the `sr-only` pattern (`clip: rect(0,0,0,0); width: 1px; height: 1px; overflow: hidden`)
- [ ] Becomes visible on focus: `:focus { position: static; }` or `focus-visible:not-sr-only` in Tailwind — the link snaps into view at the top of the page when tabbed to
- [ ] The target element (`#main-content`) is the main landmark: `<main id="main-content">` — no `tabindex` needed on `<main>` in modern browsers for anchor navigation
- [ ] Explains why `display: none` or `visibility: hidden` would not work: those also hide the element from the focus order — it would never receive focus and keyboard users could never activate it
- [ ] Notes that WCAG 2.4.1 (Bypass Blocks) requires a mechanism to skip repeated navigation — skip links are the most common and reliable implementation

---

### Q9 — Color as Sole Indicator ⭐⭐

**Scenario:** A form validation design shows required fields with a red border and error messages shown only in red text. A colorblind user (deuteranopia — difficulty distinguishing red/green) reports they cannot tell which fields are invalid. You need to audit and fix the design.

**Task:** Explain the WCAG rule about color as a sole indicator. Redesign the form error state to communicate clearly without relying on color alone.

**Acceptance Criteria:**
- [ ] States WCAG 1.4.1 (Use of Color, Level A): information must not be conveyed by color alone — color can be used but must be supplemented by another visual indicator
- [ ] Identifies the failures: red border alone and red text alone are both color-only indicators
- [ ] Fix 1 — Border: add an icon (warning triangle) or increase border thickness for error state — e.g., error borders are `2px` (vs normal `1px`) plus red color plus an icon
- [ ] Fix 2 — Error message text: add a warning icon before the error message text — `⚠ This field is required` — so the message is not just red text but also has a symbol
- [ ] Fix 3 — Field label: mark required fields with an asterisk (*) in the label, not just color
- [ ] Fix 4 — Error summary: at form submission, add an error summary at the top of the form listing all errors with links to the invalid fields — useful for keyboard and screen reader users
- [ ] Explains that the fix should be tested by viewing the design in grayscale (Chrome DevTools > Rendering > Emulate vision deficiencies) — the errors must still be distinguishable in grayscale

---

### Q10 — Component API Design: `Button` ⭐⭐

**Scenario:** Three teams have built their own `Button` components. Each has different prop names (`onClick` vs `onPress`, `isDisabled` vs `disabled`), inconsistent variant naming, and none forward the HTML `button` element's ref or spread native attributes. A shared design system `Button` would replace all three.

**Task:** Design the TypeScript props API for the shared `Button` component. Define required vs optional props, sensible defaults, ref forwarding, and HTML attribute passthrough.

**Acceptance Criteria:**
- [ ] Props interface extends `React.ButtonHTMLAttributes<HTMLButtonElement>` — this gives `onClick`, `disabled`, `type`, `form`, and all other native button attributes for free
- [ ] Custom props added: `variant?: 'primary' | 'secondary' | 'ghost' | 'danger'` with default `'primary'`, `size?: 'sm' | 'md' | 'lg'` with default `'md'`, `isLoading?: boolean`, `leftIcon?: React.ReactNode`, `rightIcon?: React.ReactNode`
- [ ] Avoids `isDisabled` — uses the native `disabled` (inherited from `HTMLAttributes`) to maintain standard HTML semantics
- [ ] Uses `React.forwardRef<HTMLButtonElement, ButtonProps>` — allows consumers to attach refs for programmatic focus (e.g., returning focus after a modal closes)
- [ ] Spreads `...rest` onto the `<button>` element: `<button {...rest} className={...}>` — all native props (aria-*, data-*, tabIndex, form, etc.) pass through without being explicitly listed
- [ ] `type` defaults to `'button'` — native button default is `'submit'` which accidentally submits forms; explicitly default to `'button'`
- [ ] `className` prop (from HTMLAttributes) is merged using `twMerge` or `cn` so consumers can override styles without conflicts

---

### Q11 — Typography System ⭐⭐

**Scenario:** The product has no consistent typography. Headings range from `14px` to `28px` without a scale, line heights are set ad hoc, and long paragraphs of text on wide monitors are 1000px+ wide and unreadable. You need to define a typography system.

**Task:** Define a 6-step type scale, 4 font weights, line-height rules per size, and a max-width constraint for readable body text.

**Acceptance Criteria:**
- [ ] Defines 6 sizes with names and values: e.g., `xs: 12px`, `sm: 14px`, `base: 16px`, `lg: 18px`, `xl: 20px`, `2xl: 24px`, `3xl: 30px` (can use any reasonable scale such as a 1.25 or 1.333 ratio)
- [ ] Defines 4 weights: `regular: 400`, `medium: 500`, `semibold: 600`, `bold: 700`
- [ ] Line-height rules: larger text needs smaller line height (better for headlines); smaller text needs larger line height (better for readability) — e.g., headings: `1.2`, body: `1.5–1.6`, captions: `1.4`
- [ ] Defines readable line length constraint: `max-width: 60–75ch` on prose containers — the `ch` unit equals the width of the "0" character, approximating character count per line; 60–75 characters per line is the optimal reading range
- [ ] Documents the usage convention: heading levels (`h1`–`h6`) are semantic, not visual — a visual style may be applied to any element via a class (`text-2xl font-bold`)
- [ ] Includes at least one fluid type rule using `clamp()` for responsive heading sizes without breakpoints
- [ ] Notes font stack consideration: a system font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`) or a web font with appropriate `font-display: swap` for performance

---

### Q12 — Compound Component with Accessibility: Tabs ⭐⭐⭐

**Scenario:** The design system needs a `<Tabs>` component. Previous implementations used state without ARIA, meaning screen readers announced "button" instead of "tab" and did not communicate which panel was active. Keyboard arrow key navigation was missing entirely.

**Task:** Implement accessible `<Tabs>`, `<TabList>`, `<Tab>`, and `<TabPanel>` components with correct ARIA roles, `aria-selected`, `aria-controls`, and left/right arrow key navigation.

**Acceptance Criteria:**
- [ ] `<TabList>` renders a `<div role="tablist">` — this is the ARIA container for tab buttons
- [ ] Each `<Tab>` renders a `<button role="tab">` with `aria-selected="true"` on the active tab and `aria-selected="false"` on inactive tabs
- [ ] Each `<Tab>` has `aria-controls="panel-{id}"` pointing to its associated `<TabPanel>`'s `id`
- [ ] Each `<TabPanel>` has `role="tabpanel"`, `id="panel-{id}"`, and `aria-labelledby="tab-{id}"` pointing back to its tab
- [ ] Only the active tab has `tabindex="0"`; inactive tabs have `tabindex="-1"` — keyboard users Tab once to reach the tab list, then use arrows to navigate
- [ ] Left arrow key moves focus and selection to the previous tab (wrapping from first to last)
- [ ] Right arrow key moves focus and selection to the next tab (wrapping from last to first)
- [ ] Home key moves to the first tab; End key moves to the last tab — both are required by the ARIA authoring practices
- [ ] The active `<TabPanel>` is shown; inactive panels are hidden with `hidden` attribute or `display: none` — not `visibility: hidden` (which still takes up space)

---

### Q13 — Testing Accessibility ⭐⭐⭐

**Scenario:** The team adds axe-core to their CI pipeline. It passes. A screen reader user then reports they cannot use the date picker. An audit finds the issue is not detectable by axe. You need to explain why automated testing has limits and what each testing method catches.

**Task:** Describe what axe-core, Lighthouse accessibility audit, manual keyboard testing, and screen reader testing each catch — and what each misses.

**Acceptance Criteria:**
- [ ] axe-core catches: missing alt text, incorrect ARIA usage, color contrast failures, duplicate IDs, form labels not associated with inputs, focus not visible on certain elements — rule-based violations derivable from static DOM
- [ ] axe-core misses: logical focus order issues (the order is valid HTML order but confusing), meaningful descriptions that exist but are unhelpful, keyboard navigation patterns inside custom widgets (e.g., arrow-key behavior), visual-only context like "this icon explains the error to the left"
- [ ] Lighthouse catches: a subset of axe-core rules; also scores accessibility as a percentage; useful for tracking regression over time; misses the same dynamic and semantic issues as axe
- [ ] Manual keyboard testing catches: focus trap correctness, modal/dialog close and focus return, custom widget keyboard patterns (arrow keys, Home/End), skip link visibility on focus, logical reading order, form error focus behavior
- [ ] Screen reader testing (NVDA + Firefox, VoiceOver + Safari/Chrome) catches: what is actually announced (vs what ARIA says should be announced — there is often a gap), verbosity problems (too much or too little), announcement of dynamic content changes via `aria-live`, browse mode vs interaction mode behavior, virtual buffer reading order
- [ ] States the hierarchy: automated tests catch ~30–40% of accessibility issues; manual keyboard + screen reader testing is required for the rest
- [ ] Recommends a testing matrix: axe-core in unit tests (fast, catches regressions), Playwright + axe-core in E2E (catches dynamic state), manual keyboard check per new component, screen reader testing on critical flows before release

---

### Q14 — Design System Maintenance ⭐⭐⭐

**Scenario:** The design system is version `1.4.0`. Version `2.0.0` is planned with a breaking rename: the `Button` prop `variant="outlined"` becomes `variant="secondary"`. 15 teams consume the package. You need a deprecation strategy that does not break consumers on upgrade.

**Task:** Design a semver versioning strategy, a deprecation pattern for the rename, a consuming app upgrade guide format, and a changelog automation approach.

**Acceptance Criteria:**
- [ ] Semver: major version for breaking changes (removed props, renamed components), minor for new features (backward compatible), patch for bug fixes — clearly documented in the contribution guide
- [ ] Deprecation pattern for the prop rename: in version `1.5.0`, accept both `variant="outlined"` and `variant="secondary"`; log a `console.warn` in development: "Warning: variant='outlined' is deprecated. Use variant='secondary'. This will be removed in v2.0.0."
- [ ] The deprecated prop is simply aliased internally: if `variant === 'outlined'` set it to `'secondary'` — no behaviour changes for consumers before v2.0.0
- [ ] v2.0.0 removes the deprecated prop — consuming apps that followed the deprecation warning are already updated; those that ignored it get a TypeScript error at the prop type level
- [ ] Upgrade guide format: a `MIGRATION.md` or versioned guide in the docs site — one section per breaking change with: what changed, why it changed, find-and-replace instructions or a codemod command, before/after code snippet
- [ ] Changelog automation: Conventional Commits (`feat:`, `fix:`, `BREAKING CHANGE:`) + `release-it` or `changesets` — automatically categorizes commits, bumps semver, and generates a `CHANGELOG.md` entry per release
- [ ] Recommends providing a codemod (using `jscodeshift` or `ast-grep`) for large rename changes — teams run `npx @design-system/codemod v2-variant-rename ./src` to automate the migration

---

### Q15 — Design System Adoption ⭐⭐⭐

**Scenario:** Six months after launch, a usage audit shows only 30% of new UI code uses the design system. Engineers say the documentation is hard to find, it is faster to build custom, and they do not know which component to use for a given use case. Leadership asks for a plan to reach 80% adoption.

**Task:** Design a multi-pronged adoption strategy. Address: documentation quality, discoverability, enforcement, and cultural buy-in.

**Acceptance Criteria:**
- [ ] Documentation — Storybook: every component has interactive stories for all variants and states, a "When to use / When not to use" section, copy-paste code snippets, and accessibility notes; Storybook is deployed and linked from the internal developer portal
- [ ] Discoverability — Figma integration: design tokens are synced from the code token source of truth to Figma via a token plugin (e.g., Token Studio); designers and engineers share vocabulary; Figma component names match code component names exactly
- [ ] Enforcement — ESLint plugin: write or adopt an ESLint plugin that warns when engineers use raw HTML elements where a design system component exists — e.g., `<button>` → use `<Button>` from the design system; the warning includes a link to the Storybook page
- [ ] Enforcement — PR review checklist: add a design system section to the PR template; reviewers check for custom implementations that duplicate an existing component
- [ ] Adoption metrics: instrument Storybook with analytics (page views, copy clicks); track design system import frequency in the codebase via a weekly automated report (grep for `@company/design-system` imports); set a team-level goal visible in the engineering dashboard
- [ ] Cultural buy-in — office hours: weekly 30-minute design system Q&A session; rotation of team members presenting how they used a component; design system team pair-programs with product teams on their first component adoption
- [ ] Feedback loop: a public Slack channel for design system requests and bugs; a quarterly "component bounty" where the design system team fast-tracks the most-requested component; engineers who contribute are credited in release notes — makes adoption feel collaborative, not imposed
