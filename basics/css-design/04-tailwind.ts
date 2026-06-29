// ════════════════════════════════════════════════════════
// CSS 04: TAILWIND CSS DEEP DIVE — VARIANTS · ANIMATION · PLUGINS  (Day 29)
// Vite demo: cd basics/css-design && npm run dev
// ════════════════════════════════════════════════════════
//
// HOW TO USE THIS FILE
//  1. Read a section, understand the concept
//  2. Open the Vite demo — ButtonVariants, CardComponents, AnimationDemo, FormComponents
//     and Day29Page are all live at localhost:5173
//  3. Hit the PRACTICE CHALLENGES at the bottom
//  4. Score yourself on the SELF-ASSESSMENT
//
// CSS/HTML is shown as template literal strings or block comments.
// Your browser runs the real thing in the Vite demo.

// ─────────────────────────────────────────────────────────
// 1. TAILWIND MENTAL MODEL
// ─────────────────────────────────────────────────────────
//
// The core shift: you stop writing CSS files.
// Instead of:  "here is my button's CSS file"
// You write:   "here is my button's markup, including its design"
//
// Component-first (the old way):
//   1. Write HTML: <button class="btn btn--primary">
//   2. Write CSS:  .btn-primary { background: blue; padding: 8px 16px; ... }
//   3. Context-switch between files constantly
//
// Utility-first (Tailwind):
//   1. Write JSX:  <button className="bg-blue-600 px-4 py-2 text-white rounded-lg">
//   No step 2 — the design is right there.
//
// ── Why it feels wrong at first ─────────────────────────
//
// Your instinct says: "this is mixing concerns — HTML is structure, CSS is style."
// That instinct was formed in an era of server-rendered pages with shared stylesheets.
// In component-based UI, the "separation" is the COMPONENT, not the file type.
// The Button component IS the unit of reuse — not some .btn class in a stylesheet.
//
// After a week, you stop missing the CSS file. After a month, going back feels painful.
//
// ── The three problems Tailwind solves ──────────────────
//
// 1. NAMING FATIGUE
//    What do you call a container div that holds the product image and caption?
//    .product-card__media-wrapper? .product-image-container? .card-media?
//    Tailwind: <div className="relative overflow-hidden rounded-lg"> — no naming needed.
//
// 2. DEAD CSS
//    You delete a component. Its .card--featured class stays in the stylesheet forever.
//    Tailwind purges unused utilities at build time — your bundle only ships what you use.
//
// 3. CONTEXT SWITCHING
//    Toggle between JSX and CSS files 40 times a day.
//    Tailwind: everything in one place. Your editor never needs to leave the component.
//
// ── Tailwind v3 vs v4 ────────────────────────────────────
//
// v3 (current default in most projects):
//   - Config in tailwind.config.js / tailwind.config.ts
//   - CSS entry: @tailwind base; @tailwind components; @tailwind utilities;
//   - Fast. JIT (just-in-time) mode is default since v3.
//
// v4 (new, CSS-first):
//   - No tailwind.config.js by default — config lives in your CSS with @theme
//   - Entry: @import "tailwindcss"; — one line
//   - Custom tokens in CSS:
//
const v4ThemeExample = `
/* globals.css — Tailwind v4 */
@import "tailwindcss";

@theme {
  --color-brand: #6366f1;
  --color-brand-dark: #4f46e5;
  --spacing-18: 4.5rem;
  --font-family-display: "Cal Sans", sans-serif;
  --breakpoint-xs: 30rem;
}
`;

// v4 is ~5× faster on cold builds (uses Lightning CSS under the hood).
// The config is now a CSS file, not a JS module — no require() complications.
// Most production projects in 2024-2025 are still on v3. v4 is stable but adoption is gradual.

// ⚠️ GOTCHA: Tailwind is NOT a replacement for knowing CSS.
// It's CSS with a fixed vocabulary. `flex items-center` is just `display:flex; align-items:center`.
// If you don't know what flex does, `items-center` is magic — and magic breaks in unpredictable ways.
// Learn the CSS first (you're doing that now), then let Tailwind make you faster.

// ─────────────────────────────────────────────────────────
// 2. CORE UTILITY CATEGORIES
// ─────────────────────────────────────────────────────────
//
// These 6 categories cover ~90% of daily Tailwind usage.

// ── Spacing ──────────────────────────────────────────────
//
// Tailwind uses a numeric scale where 1 unit = 0.25rem (4px at default font size).
//
//  p-4         → padding: 1rem (16px)
//  px-2        → padding-left: 0.5rem; padding-right: 0.5rem
//  py-6        → padding-top: 1.5rem; padding-bottom: 1.5rem
//  pt-3        → padding-top: 0.75rem
//  m-auto      → margin: auto  (center a block element horizontally)
//  mx-auto     → margin-left: auto; margin-right: auto
//  mt-8        → margin-top: 2rem
//  -mt-4       → margin-top: -1rem  (negative margin, useful for pull-up effects)
//  gap-4       → gap: 1rem          (flex/grid gap)
//  space-x-4   → margin-left: 1rem on every child except the first
//               (workaround for older flex row spacing — prefer gap)

const spacingExamples = `
<!-- Card with consistent spacing -->
<div class="p-6 space-y-4">
  <h2 class="mb-2">Title</h2>
  <p class="mt-0">Body text with vertical spacing between siblings</p>
  <div class="flex items-center gap-3">
    <button class="px-4 py-2">Action</button>
    <button class="px-4 py-2">Cancel</button>
  </div>
</div>
`;

// ── Sizing ────────────────────────────────────────────────
//
//  w-full          → width: 100%
//  w-1/2           → width: 50%
//  w-1/3           → width: 33.333%
//  w-64            → width: 16rem
//  max-w-screen-lg → max-width: 1024px
//  max-w-prose     → max-width: 65ch  (optimal line length for reading)
//  h-screen        → height: 100vh
//  h-full          → height: 100%
//  min-h-0         → min-height: 0   (fixes a flex/grid overflow bug — you'll need this)
//  min-h-screen    → min-height: 100vh
//  aspect-video    → aspect-ratio: 16/9
//  aspect-square   → aspect-ratio: 1/1

const sizingExamples = `
<!-- Full-width responsive container -->
<div class="w-full max-w-screen-lg mx-auto px-4">
  <!-- Thumbnail with forced aspect ratio -->
  <div class="aspect-video w-full overflow-hidden rounded-lg">
    <img class="w-full h-full object-cover" src="..." alt="..." />
  </div>
</div>
`;

// ── Typography ────────────────────────────────────────────
//
//  text-xs / sm / base / lg / xl / 2xl / 3xl / 4xl
//  font-thin / light / normal / medium / semibold / bold / extrabold / black
//  leading-none / tight / snug / normal / relaxed / loose
//  tracking-tighter / tight / normal / wide / wider / widest
//  text-gray-600       → color from the default palette
//  text-[#1da1f2]      → arbitrary color
//  truncate            → overflow:hidden; text-overflow:ellipsis; white-space:nowrap
//  line-clamp-2        → clamp to 2 lines with ellipsis (uses -webkit-line-clamp)
//  uppercase / lowercase / capitalize / normal-case
//  text-left / center / right / justify

const typographyExamples = `
<article class="max-w-prose">
  <h1 class="text-3xl font-bold tracking-tight text-gray-900">Article title</h1>
  <p class="mt-4 text-base leading-relaxed text-gray-600">
    Body text with relaxed line height for comfortable reading.
  </p>
  <!-- Card with truncated title -->
  <div class="w-64">
    <p class="truncate font-medium">Very long product name that overflows the card</p>
    <p class="line-clamp-2 text-sm text-gray-500">
      Description that might span multiple lines and needs clamping at exactly two.
    </p>
  </div>
</article>
`;

// ── Colors ────────────────────────────────────────────────
//
// Tailwind's default palette: slate, gray, zinc, neutral, stone, red, orange, amber,
// yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia,
// pink, rose. Each has shades 50, 100, 200 ... 900, 950.
//
//  bg-blue-500     → background-color
//  text-white      → color
//  border-gray-200 → border-color
//  ring-2          → outline ring, 2px wide
//  ring-blue-500   → ring color
//  ring-offset-2   → offset gap between element and ring
//  divide-y        → border between stacked children
//  shadow-sm / md / lg / xl / 2xl → box-shadow
//  shadow-none     → remove shadow

const colorExamples = `
<!-- Focus ring pattern (accessibility-friendly) -->
<button class="bg-blue-600 text-white px-4 py-2 rounded-lg
               hover:bg-blue-700
               focus-visible:outline-none focus-visible:ring-2
               focus-visible:ring-blue-500 focus-visible:ring-offset-2">
  Click me
</button>

<!-- Dividers between list items -->
<ul class="divide-y divide-gray-200">
  <li class="py-3">Item 1</li>
  <li class="py-3">Item 2</li>
</ul>
`;

// ── Flexbox & Grid ────────────────────────────────────────
//
// Flex:
//  flex                → display: flex
//  inline-flex         → display: inline-flex
//  flex-col            → flex-direction: column
//  flex-row            → flex-direction: row (default)
//  flex-wrap           → flex-wrap: wrap
//  items-center        → align-items: center
//  items-start / end / baseline / stretch
//  justify-between     → justify-content: space-between
//  justify-center / start / end / around / evenly
//  flex-1              → flex: 1 1 0%  (fill available space)
//  flex-none           → flex: none    (don't shrink/grow)
//  flex-shrink-0       → flex-shrink: 0
//  order-first / last / -1 / 2 etc.
//
// Grid:
//  grid                → display: grid
//  grid-cols-3         → grid-template-columns: repeat(3, minmax(0, 1fr))
//  grid-cols-[200px_1fr] → arbitrary template
//  col-span-2          → grid-column: span 2 / span 2
//  col-start-2         → grid-column-start: 2
//  grid-rows-4
//  auto-rows-min / max / fr
//  place-items-center  → align-items + justify-items: center

const layoutExamples = `
<!-- Navbar: space-between with centered logo -->
<nav class="flex items-center justify-between px-6 h-16">
  <a class="font-bold text-lg">Brand</a>
  <ul class="hidden md:flex items-center gap-6">
    <li>Home</li><li>About</li><li>Contact</li>
  </ul>
  <button class="md:hidden">Menu</button>
</nav>

<!-- Responsive 3-column product grid -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  <div class="rounded-xl border p-4">Card</div>
  <div class="rounded-xl border p-4">Card</div>
  <div class="rounded-xl border p-4">Card</div>
</div>
`;

// ⚠️ GOTCHA: Tailwind's default spacing scale is in rem, not px.
// p-4 = padding: 1rem = 16px (at default browser font size of 16px).
// p-1 = 0.25rem = 4px. p-2 = 0.5rem = 8px.
// New devs often write p-16 expecting 16px — they get 4rem (64px).
// Quick mental math: scale number ÷ 4 = rem value. Or use arbitrary: p-[16px].

// ─────────────────────────────────────────────────────────
// 3. VARIANTS AND MODIFIERS
// ─────────────────────────────────────────────────────────
//
// A variant is a prefix that conditionally applies a utility.
// Format:  variant:utility    e.g.  hover:bg-blue-700

// ── State variants ───────────────────────────────────────
//
//  hover:        → :hover pseudo-class
//  focus:        → :focus
//  focus-visible: → :focus-visible  (keyboard focus, not mouse click — prefer this for rings)
//  focus-within:  → :focus-within   (parent styled when any child is focused)
//  active:       → :active
//  disabled:     → :disabled
//  visited:      → :visited
//  placeholder:  → ::placeholder
//  first: / last: / odd: / even: → nth-child selectors
//  empty:        → :empty

const stateVariantsExample = `
<input
  class="border border-gray-300
         focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
         placeholder:text-gray-400
         disabled:opacity-50 disabled:cursor-not-allowed"
  placeholder="Enter email"
/>

<!-- Zebra striping with odd/even -->
<table>
  <tr class="odd:bg-white even:bg-gray-50">...</tr>
</table>
`;

// ── Responsive (mobile-first) ────────────────────────────
//
// Tailwind is mobile-first: unprefixed utilities apply to ALL screen sizes.
// Prefixed utilities apply at that breakpoint AND ABOVE.
//
// Default breakpoints:
//  sm   → 640px
//  md   → 768px
//  lg   → 1024px
//  xl   → 1280px
//  2xl  → 1536px
//
// Think: "small screens first, then override as screen gets bigger"
//
//  class="text-sm md:text-base lg:text-lg"
//  → text-sm on mobile, text-base on tablet, text-lg on desktop

const responsiveExample = `
<!-- Hidden on mobile, visible on desktop -->
<aside class="hidden lg:block">Sidebar</aside>

<!-- Full width on mobile, 1/3 on large screens -->
<div class="w-full lg:w-1/3">Filter panel</div>

<!-- Stack on mobile, row on tablet -->
<div class="flex flex-col sm:flex-row gap-4">
  <div class="flex-1">Left</div>
  <div class="flex-1">Right</div>
</div>
`;

// ── Dark mode ────────────────────────────────────────────
//
// In tailwind.config.js:  darkMode: 'class'  (toggle via adding .dark to <html>)
// Or:                     darkMode: 'media'  (follows OS preference automatically)
//
//  dark:bg-gray-900 dark:text-white dark:border-gray-700

const darkModeExample = `
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white
            border border-gray-200 dark:border-gray-700 rounded-xl p-6">
  Works in light and dark mode.
</div>
`;

// ── Group and peer ───────────────────────────────────────
//
// GROUP: style a child based on the parent's state
//
//  1. Add `group` to the parent
//  2. Use `group-hover:`, `group-focus:`, etc. on children

const groupExample = `
<!-- Card that reveals a button on hover -->
<div class="group relative overflow-hidden rounded-xl">
  <img src="..." class="w-full transition-transform duration-300 group-hover:scale-105" />
  <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100
              transition-opacity duration-300 flex items-end p-4">
    <button class="text-white font-semibold">View details</button>
  </div>
</div>
`;

// PEER: style a sibling based on another sibling's state
//
//  1. Add `peer` to the sibling you want to watch (e.g. an input)
//  2. Use `peer-invalid:`, `peer-checked:`, `peer-focus:` on the element that reacts

const peerExample = `
<!-- Error message shown when input is invalid -->
<div class="space-y-1">
  <input
    type="email"
    class="peer w-full border rounded-lg px-3 py-2
           border-gray-300 focus:border-blue-500
           invalid:border-rose-500 invalid:focus:ring-rose-500"
    required
  />
  <p class="text-rose-500 text-sm hidden peer-invalid:block">
    Please enter a valid email address.
  </p>
</div>
`;

// ── Arbitrary values ─────────────────────────────────────
//
// When the design calls for a value not in the scale, use square brackets:
//
//  w-[347px]             → width: 347px
//  bg-[#1da1f2]          → background: #1da1f2
//  top-[117px]           → top: 117px
//  text-[0.8125rem]      → font-size: 0.8125rem
//  grid-cols-[200px_1fr_auto]  → custom column template
//  bg-[url('/hero.jpg')] → background-image: url('/hero.jpg')

// ── !important modifier ──────────────────────────────────
//
// Prefix ANY utility with ! to make it !important:
//  !text-red-500   →   color: rgb(239, 68, 68) !important
//
// Use cases: overriding third-party styles, utility override in edge cases.
// If you're using ! frequently, something is wrong with your specificity setup.

// ⚠️ GOTCHA: Stack variants left to right — responsive FIRST, then state.
//
// WRONG:   hover:md:bg-blue-600    (state before responsive — won't work as expected)
// CORRECT: md:hover:bg-blue-600    (responsive first, then state)
//
// Similarly: dark:hover:bg-gray-800, md:dark:hover:bg-gray-700
// The order is: responsive : dark-mode : state : utility

// ─────────────────────────────────────────────────────────
// 4. COMPONENT PATTERNS WITH TAILWIND
// ─────────────────────────────────────────────────────────

// ── Button with cva (see ButtonVariants.tsx in the demo) ─
//
// The production pattern: define variant schema once, get a typed function.
// Don't repeat class strings — compose them.

const buttonWithCvaPattern = `
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';

const buttonVariants = cva(
  // Base classes — always applied
  'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary:   'bg-indigo-600 text-white hover:bg-indigo-500',
        secondary: 'bg-slate-700  text-slate-200 hover:bg-slate-600',
        ghost:     'text-slate-300 hover:bg-slate-800',
        danger:    'bg-rose-600 text-white hover:bg-rose-500',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-5 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

function Button({ variant, size, className, ...props }) {
  return (
    <button
      className={twMerge(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

// Usage:
<Button variant="danger" size="lg">Delete account</Button>
<Button variant="ghost" className="w-full">Cancel</Button>
`;

// ── Card pattern ─────────────────────────────────────────

const cardPattern = `
<!-- Basic card -->
<div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
  <div class="aspect-video bg-gray-100">
    <img class="w-full h-full object-cover" src="..." />
  </div>
  <div class="p-5">
    <span class="text-xs font-medium text-indigo-600 uppercase tracking-wider">Category</span>
    <h3 class="mt-1 text-lg font-semibold text-gray-900 line-clamp-2">Card title</h3>
    <p class="mt-2 text-sm text-gray-500 line-clamp-3">Description text</p>
  </div>
  <div class="px-5 pb-5 flex items-center justify-between">
    <span class="text-sm text-gray-400">3 min read</span>
    <a class="text-sm font-medium text-indigo-600 hover:text-indigo-500">Read →</a>
  </div>
</div>
`;

// ── Form inputs with error state ─────────────────────────

const formInputPattern = `
<!-- Input with focus ring and error state -->
<div class="space-y-1">
  <label class="block text-sm font-medium text-gray-700">Email</label>
  <input
    type="email"
    class="w-full rounded-lg border px-3 py-2 text-sm
           border-gray-300 bg-white
           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
           disabled:opacity-50 disabled:bg-gray-50
           aria-[invalid=true]:border-rose-500 aria-[invalid=true]:ring-rose-500"
    aria-invalid="true"
  />
  <p class="text-sm text-rose-500">Invalid email address.</p>
</div>
`;

// ── Modal ─────────────────────────────────────────────────

const modalPattern = `
<!-- Modal overlay + centered content -->
<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
  <!-- Backdrop -->
  <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true"></div>
  <!-- Panel -->
  <div class="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
    <h2 class="text-lg font-semibold">Confirm action</h2>
    <p class="mt-2 text-sm text-gray-600">This cannot be undone.</p>
    <div class="mt-6 flex justify-end gap-3">
      <button class="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">
        Cancel
      </button>
      <button class="px-4 py-2 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-500">
        Delete
      </button>
    </div>
  </div>
</div>
`;

// ── Sticky navbar ─────────────────────────────────────────

const navbarPattern = `
<header class="sticky top-0 z-40 border-b border-gray-200
               bg-white/80 backdrop-blur-md">
  <div class="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between">
    <a class="font-bold text-xl tracking-tight">Brand</a>
    <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
      <a class="hover:text-gray-900 transition-colors">Products</a>
      <a class="hover:text-gray-900 transition-colors">Pricing</a>
    </nav>
    <button class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium
                   hover:bg-indigo-500 transition-colors">
      Get started
    </button>
  </div>
</header>
`;

// ── Badge / pill ──────────────────────────────────────────

const badgePattern = `
<!-- Status badges -->
<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
             bg-emerald-100 text-emerald-700">
  Active
</span>
<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
             bg-amber-100 text-amber-700">
  Pending
</span>
<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
             bg-rose-100 text-rose-700">
  Failed
</span>
`;

// ⚠️ GOTCHA: Don't reach for @apply when you repeat a class list.
// Extract a React component instead.
//
// BAD:
//   /* globals.css */
//   @layer components {
//     .btn-primary { @apply bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500; }
//   }
//
// PROBLEM: @apply defeats the purpose — you're back to naming things and writing CSS files.
// Refactoring means updating both the @apply rule AND every place you use .btn-primary.
// With a component, you refactor in ONE place.
//
// @apply is acceptable for: base tag styles in @layer base (e.g., h1, h2 base appearance),
// or integrating with third-party CSS you can't JSX-ify.

// ─────────────────────────────────────────────────────────
// 5. TAILWIND CONFIG (v3) AND @THEME (v4)
// ─────────────────────────────────────────────────────────

// ── tailwind.config.js / .ts (v3) ────────────────────────

const v3ConfigExample = `
// tailwind.config.ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],  // ← purge source
  darkMode: 'class',
  theme: {
    extend: {
      // Add to the palette without overwriting it
      colors: {
        brand: {
          50:  '#eef2ff',
          500: '#6366f1',
          900: '#312e81',
        },
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem',
      },
      fontFamily: {
        display: ['Cal Sans', 'system-ui', 'sans-serif'],
      },
      screens: {
        xs: '480px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
} satisfies Config;
`;

// After extending colors, you can use: bg-brand-500, text-brand-50, etc.
// After extending spacing, you get: p-18, m-22, etc.

// ── theme() function in CSS ──────────────────────────────

const themeFunctionExample = `
/* Use design tokens in plain CSS (e.g., for SVG or pseudo-elements) */
.custom-divider::after {
  background-color: theme('colors.brand.500');
  height: theme('spacing.px');         /* 1px */
}

/* Also works in arbitrary values */
<div class="bg-[theme(colors.brand.500)]">...</div>
`;

// ── @theme — Tailwind v4 ─────────────────────────────────

const v4ConfigFull = `
/* globals.css — Tailwind v4 — NO tailwind.config.js needed */
@import "tailwindcss";

@theme {
  /* Custom color tokens — accessible as bg-brand, text-brand-dark */
  --color-brand:      #6366f1;
  --color-brand-dark: #4f46e5;

  /* Custom spacing — accessible as p-18, m-22 */
  --spacing-18: 4.5rem;
  --spacing-22: 5.5rem;

  /* Custom breakpoint — accessible as xs: prefix */
  --breakpoint-xs: 30rem;

  /* Custom font family — accessible as font-display */
  --font-family-display: "Cal Sans", system-ui, sans-serif;
}
`;

// ── Plugins ───────────────────────────────────────────────
//
// @tailwindcss/forms
//   Adds sensible browser-default resets for form elements.
//   Makes <input>, <select>, <textarea> look consistent and styleable.
//   After installing, form elements respond to Tailwind classes predictably.
//
// @tailwindcss/typography
//   Adds a `prose` class that makes any HTML (Markdown-rendered, CMS content)
//   look beautiful with zero extra work.
//   <div class="prose prose-lg prose-indigo">{{ markdownContent }}</div>
//
// @tailwindcss/aspect-ratio
//   Older browser support for aspect ratios (v3 — Tailwind's native aspect-* handles it in v3.3+).

// ── Writing a custom plugin ──────────────────────────────

const customPluginExample = `
// tailwind.config.ts
import plugin from 'tailwindcss/plugin';

export default {
  plugins: [
    plugin(function ({ addUtilities, addComponents, matchUtilities, theme }) {
      // Add a custom utility
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
      });

      // Add a component class
      addComponents({
        '.card-base': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.xl'),
          padding: theme('spacing.6'),
          boxShadow: theme('boxShadow.sm'),
        },
      });
    }),
  ],
};
`;

// After this plugin, you get: className="scrollbar-hide" and className="card-base".

// ⚠️ GOTCHA: Don't put secrets in tailwind.config.js.
// The config is imported by your build tool, and its values (colors, spacing) can end up
// in the compiled CSS output or be analyzed by source-map tools.
// API keys, auth tokens, DB connection strings — none of these belong in config files
// that get bundled into the frontend.

// ─────────────────────────────────────────────────────────
// 6. ANIMATION IN TAILWIND
// ─────────────────────────────────────────────────────────
//
// Tailwind ships four built-in animations:

const builtInAnimations = `
<div class="animate-spin">...</div>     /* 360° spin, 1s linear infinite */
<div class="animate-ping">...</div>     /* scale+opacity pulse, used for notification dots */
<div class="animate-pulse">...</div>    /* opacity oscillation, skeleton loaders */
<div class="animate-bounce">...</div>  /* vertical bounce, scroll indicators */
`;

// All four animate transforms or opacity — GPU-accelerated, no layout thrashing.

// ── Transition utilities ──────────────────────────────────
//
// Two-step: what to transition + how long.

const transitionExamples = `
<!-- Hover scale with smooth transition -->
<div class="transition-transform duration-200 ease-out hover:scale-105">
  Hover me
</div>

<!-- Color transition -->
<button class="bg-indigo-600 transition-colors duration-150 hover:bg-indigo-500">
  Button
</button>

<!-- All properties transition (use sparingly — catches unexpected animations) -->
<div class="transition-all duration-300 ease-in-out">...</div>

<!-- With delay -->
<div class="transition-opacity duration-500 delay-150 opacity-0 hover:opacity-100">
  Fade in with delay
</div>
`;

// transition utilities:
//  transition          → transition-property: color, background-color, border-color, opacity, transform, ...
//  transition-colors   → only color-related properties
//  transition-transform → only transform
//  transition-opacity  → only opacity
//  transition-none     → remove all transitions
//
// duration:    duration-75 / 100 / 150 / 200 / 300 / 500 / 700 / 1000
// ease:        ease-linear / ease-in / ease-out / ease-in-out
// delay:       delay-75 / 100 / 150 / 200 / 300 / 500 / 700 / 1000

// ── Transform utilities ───────────────────────────────────
//
//  scale-75 / 90 / 95 / 100 / 105 / 110 / 125 / 150
//  scale-x-75 / scale-y-125
//  rotate-0 / 1 / 2 / 3 / 6 / 12 / 45 / 90 / 180
//  -rotate-3     → rotate(-3deg)
//  translate-x-4 / -translate-x-1/2
//  translate-y-2 / -translate-y-full
//  skew-x-2 / skew-y-2

const transformExamples = `
<!-- Card that lifts on hover -->
<div class="transition-all duration-200 ease-out
            hover:-translate-y-1 hover:shadow-lg">
  Card content
</div>

<!-- Checkbox checkmark with scale animation -->
<span class="transition-transform duration-150
             scale-0 peer-checked:scale-100">
  ✓
</span>
`;

// ── Custom animations in config ───────────────────────────

const customAnimationConfig = `
// tailwind.config.ts — extend with custom keyframes
theme: {
  extend: {
    keyframes: {
      shimmer: {
        '0%':   { transform: 'translateX(-100%)' },
        '100%': { transform: 'translateX(100%)' },
      },
      'fade-up': {
        '0%':   { opacity: '0', transform: 'translateY(10px)' },
        '100%': { opacity: '1', transform: 'translateY(0)' },
      },
      wiggle: {
        '0%, 100%': { transform: 'rotate(-3deg)' },
        '50%':      { transform: 'rotate(3deg)' },
      },
    },
    animation: {
      shimmer:  'shimmer 2s linear infinite',
      'fade-up': 'fade-up 0.4s ease-out',
      wiggle:   'wiggle 0.3s ease-in-out',
    },
  },
},
`;

// After this config: className="animate-shimmer", className="animate-fade-up"

const skeletonLoaderExample = `
<!-- Skeleton loader using custom shimmer animation -->
<div class="relative overflow-hidden bg-gray-200 rounded-lg h-48">
  <div class="absolute inset-0 -translate-x-full animate-shimmer
              bg-gradient-to-r from-transparent via-white/60 to-transparent">
  </div>
</div>
`;

// ── motion-safe: ─────────────────────────────────────────
//
// Some users have vestibular disorders — animations cause physical discomfort.
// The OS "Reduce Motion" preference maps to `prefers-reduced-motion: reduce` in CSS.
// Tailwind's motion-safe: variant applies ONLY when motion is NOT reduced.

const motionSafeExample = `
<!-- Only spin when user hasn't requested reduced motion -->
<div class="motion-safe:animate-spin">Loading...</div>

<!-- Alternatively, disable transitions for those who prefer it -->
<div class="transition-all motion-reduce:transition-none hover:scale-105 motion-reduce:hover:scale-100">
  Respectful hover
</div>
`;

// ⚠️ GOTCHA: animate-pulse and animate-ping change opacity and transform only — GPU-accelerated.
// Custom animations that animate width, height, top, left, or margin trigger LAYOUT
// (the browser must recalculate positions of ALL affected elements on every frame).
// This is the #1 cause of janky animations. Stick to: transform, opacity.
// If you need a "progress bar" animation, animate transform: scaleX(), not width.

// ─────────────────────────────────────────────────────────
// 7. clsx AND cva — THE RIGHT WAY TO COMPOSE CLASSES
// ─────────────────────────────────────────────────────────
//
// The problem: conditional classes in JSX get messy fast.
//
// BAD — string concatenation:
//   className={`btn ${isLoading ? 'btn-loading' : ''} ${variant === 'primary' ? 'btn-primary' : 'btn-secondary'} ${disabled ? 'btn-disabled' : ''}`}
//
// That's unreadable at 3 conditions. It breaks at 6.

// ── clsx ─────────────────────────────────────────────────
//
// clsx(base, condition && 'class', { 'class': bool })
// Handles: strings, objects, arrays, falsy values (ignores false/null/undefined).

const clsxExamples = `
import { clsx } from 'clsx';

// String — always applied
clsx('flex items-center')
// → 'flex items-center'

// Expression — applied when truthy
clsx('flex', isOpen && 'ring-2 ring-indigo-500')
// isOpen=true  → 'flex ring-2 ring-indigo-500'
// isOpen=false → 'flex'

// Object — key applied when value is truthy
clsx('btn', { 'opacity-50 cursor-not-allowed': disabled, 'w-full': fullWidth })

// Array of mixed types
clsx(['base-class', condition && 'conditional', { 'object-class': bool }])

// Real usage:
function Badge({ variant, className }) {
  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variant === 'success' && 'bg-emerald-100 text-emerald-700',
      variant === 'error'   && 'bg-rose-100 text-rose-700',
      variant === 'warning' && 'bg-amber-100 text-amber-700',
      className  // let callers override
    )}>
    </span>
  );
}
`;

// ── cva (class-variance-authority) ───────────────────────
//
// cva defines a SCHEMA of variants. You call it like a function to get the class string.
// TypeScript knows every valid variant and its values — typos become compile errors.

const cvaFullExample = `
import { cva, type VariantProps } from 'class-variance-authority';

const alertVariants = cva(
  // Base
  'flex items-start gap-3 rounded-lg border p-4 text-sm',
  {
    variants: {
      variant: {
        info:    'bg-blue-50 border-blue-200 text-blue-800',
        success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
        error:   'bg-rose-50 border-rose-200 text-rose-800',
      },
      size: {
        sm: 'p-3 text-xs',
        md: 'p-4 text-sm',
        lg: 'p-5 text-base',
      },
      dismissible: {
        true:  'pr-10',
        false: '',
      },
    },
    // Compound variants: apply classes only when multiple variants match
    compoundVariants: [
      {
        variant: 'error',
        size: 'lg',
        class: 'font-semibold',  // extra emphasis on large error alerts
      },
    ],
    defaultVariants: {
      variant: 'info',
      size: 'md',
      dismissible: false,
    },
  }
);

type AlertProps = VariantProps<typeof alertVariants> & {
  children: React.ReactNode;
  className?: string;
};

function Alert({ variant, size, dismissible, className, children }: AlertProps) {
  return (
    <div className={twMerge(alertVariants({ variant, size, dismissible }), className)}>
      {children}
    </div>
  );
}

// Usage — fully typed:
<Alert variant="error" size="lg">Payment failed.</Alert>
<Alert variant="success">Profile updated.</Alert>
`;

// ── twMerge ───────────────────────────────────────────────
//
// Problem: Tailwind applies classes in CSS cascade order, not JSX order.
// So className="p-4 p-6" — which wins? BOTH get applied, but in CSS,
// the one that appears later in the stylesheet wins. This is non-obvious and fragile.
//
// twMerge resolves conflicts intelligently:
//   twMerge('p-4', 'p-6')          → 'p-6'       (last padding wins)
//   twMerge('p-4 px-2', 'p-6')     → 'p-6'       (p-6 overrides all padding)
//   twMerge('text-sm text-lg')      → 'text-lg'
//   twMerge('bg-red-500 bg-blue-500') → 'bg-blue-500'

const twMergeExamples = `
import { twMerge } from 'tailwind-merge';

// Caller can safely override button padding:
function Button({ className, ...props }) {
  return (
    <button
      className={twMerge('px-4 py-2 rounded-lg', className)}
      {...props}
    />
  );
}

<Button className="px-8">Wide button</Button>
// Without twMerge: className="px-4 py-2 rounded-lg px-8"  → unpredictable
// With twMerge:    className="py-2 rounded-lg px-8"        → px-8 wins cleanly
`;

// ── cn helper ────────────────────────────────────────────
//
// Standard pattern across modern React codebases.
// Combine clsx (conditional logic) + twMerge (conflict resolution) in one function.

const cnHelper = `
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage everywhere:
import { cn } from '@/lib/utils';

function Card({ className, featured }) {
  return (
    <div className={cn(
      'rounded-xl border p-6 shadow-sm',
      featured && 'border-indigo-500 shadow-indigo-100',
      className  // caller override, conflicts resolved by twMerge
    )}>
    </div>
  );
}
`;

// ⚠️ GOTCHA: Without twMerge, conflicting Tailwind utilities both appear in className.
// The one that wins is the one defined LATER in Tailwind's stylesheet — not the one
// written later in your JSX. This is counterintuitive and causes bugs that are hard to trace.
// Example: twMerge is NOT included in clsx — you need both packages.
// The cn() helper pattern is the industry standard. Just copy it and use it everywhere.

// ─────────────────────────────────────────────────────────
// 8. TAILWIND AT SCALE — KEEPING IT MAINTAINABLE
// ─────────────────────────────────────────────────────────
//
// The "Tailwind spaghetti" problem: a div with 40+ classes.
// Real example from a real codebase:

const spaghetti = `
<div class="relative flex flex-col items-start justify-between gap-4 rounded-2xl border
            border-gray-200 bg-white p-6 shadow-sm transition-all duration-200
            hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2
            focus-within:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800
            dark:hover:border-gray-600 md:flex-row md:items-center lg:p-8">
`;

// That's 34 tokens. Readable? Debatable. The real problem is if this pattern appears in 12 places.

// ── Solution 1: Extract a component (always prefer this) ─

const componentExtraction = `
// Before: 34 classes copy-pasted across 12 files
// After: one component, zero duplication

function ListCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'relative flex flex-col items-start justify-between gap-4',
      'rounded-2xl border border-gray-200 bg-white p-6 shadow-sm',
      'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
      'dark:border-gray-700 dark:bg-gray-800',
      'md:flex-row md:items-center lg:p-8',
      className
    )}>
      {children}
    </div>
  );
}

// Now every usage is: <ListCard>content</ListCard>
// Refactor = update one file. Done.
`;

// ── Solution 2: @layer components + @apply ────────────────
//
// For truly global, non-component styles (base HTML element appearance,
// third-party widget overrides) where you can't create a React component.

const atLayerComponentsExample = `
/* globals.css */
@layer components {
  /* Applies to <a class="prose-link"> */
  .prose-link {
    @apply text-indigo-600 underline decoration-indigo-300 hover:decoration-indigo-600
           transition-colors duration-150;
  }

  /* Base input style for a design system */
  .input-base {
    @apply w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
           disabled:opacity-50 disabled:bg-gray-50;
  }
}
`;

// ── Linting & tooling ─────────────────────────────────────
//
// eslint-plugin-tailwindcss
//   - Enforces canonical class order (same order as Tailwind's stylesheet)
//   - Catches invalid class names
//   Install: npm i -D eslint-plugin-tailwindcss
//
// prettier-plugin-tailwindcss
//   - Auto-sorts Tailwind classes on save
//   - Eliminates class order debates in code review
//   Install: npm i -D prettier-plugin-tailwindcss
//   Config:  { "plugins": ["prettier-plugin-tailwindcss"] }  in .prettierrc
//
// VS Code: Tailwind CSS IntelliSense (extension ID: bradlc.vscode-tailwindcss)
//   - Autocomplete for every utility
//   - Hover to see the generated CSS
//   - Sort and lint classes in editor
//   This is non-negotiable for productivity. Install it before anything else.

// ── Content paths (purging) ───────────────────────────────
//
// Tailwind scans source files for class names and purges everything else.
// If a file containing Tailwind classes isn't in the content array, those
// classes won't make it into the bundle.

const contentConfig = `
// tailwind.config.ts
content: [
  './index.html',
  './src/**/*.{ts,tsx}',
  // If you have a separate UI package:
  '../../packages/ui/src/**/*.{ts,tsx}',
],
`;

// ── Safelist ─────────────────────────────────────────────
//
// Dynamic class names constructed from data (CMS content, API responses, DB values)
// are invisible to the scanner — they won't be in the bundle.

const safelistExample = `
// WRONG — Tailwind can't scan this:
const color = 'blue';
className={\`bg-\${color}-500\`}   // The string "bg-blue-500" never appears in source

// RIGHT option 1: explicit map
const colorMap = {
  blue: 'bg-blue-500',
  red:  'bg-red-500',
  green: 'bg-green-500',
};
className={colorMap[color]}

// RIGHT option 2: safelist in config (for CMS/API-driven values)
// tailwind.config.ts
safelist: [
  'bg-blue-500', 'bg-red-500', 'bg-green-500',
  // Or patterns:
  { pattern: /bg-(blue|red|green)-(500|700)/ },
],
`;

// ⚠️ GOTCHA: Dynamic class names from a CMS, API, or database won't be in your bundle.
// The Tailwind scanner reads source files as text — it finds literal strings like "bg-blue-500".
// Template literals like \`bg-\${color}-500\` produce a string at RUNTIME, not at build time.
// The scanner sees "bg-" and "${ }" — it can't infer "bg-blue-500".
// Fix: use object maps (option 1) or safelist (option 2).

// ─────────────────────────────────────────────────────────
// PRACTICE CHALLENGES
// ─────────────────────────────────────────────────────────

/*
Q1: Build a reusable Badge component with variants (success/warning/error/info) using cva.
    Requirements:
    - 4 color variants
    - 2 sizes (sm and md)
    - optional dot indicator
    - caller can add className overrides
*/

// A1:
const q1BadgeVariants = `
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-medium',
  {
    variants: {
      variant: {
        success: 'bg-emerald-100 text-emerald-700',
        warning: 'bg-amber-100 text-amber-700',
        error:   'bg-rose-100 text-rose-700',
        info:    'bg-blue-100 text-blue-700',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
      },
    },
    defaultVariants: { variant: 'info', size: 'md' },
  }
);

type BadgeProps = VariantProps<typeof badgeVariants> & {
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
};

const dotColor = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error:   'bg-rose-500',
  info:    'bg-blue-500',
} as const;

function Badge({ variant = 'info', size, dot, children, className }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)}>
      {dot && (
        <span className={\`h-1.5 w-1.5 rounded-full \${dotColor[variant]}\`} />
      )}
      {children}
    </span>
  );
}

// Usage:
<Badge variant="success" dot>Active</Badge>
<Badge variant="error" size="sm">Failed</Badge>
`;

/*
Q2: Create a card that lifts on hover and shows a hidden overlay — using only Tailwind + group.
    No JavaScript. The overlay should contain a "View details" button.
*/

// A2:
const q2CardOverlay = `
<article class="group relative overflow-hidden rounded-2xl bg-white shadow-sm
                transition-all duration-300 ease-out
                hover:-translate-y-1 hover:shadow-xl cursor-pointer">
  <!-- Image -->
  <div class="aspect-video overflow-hidden bg-gray-100">
    <img
      src="/product.jpg"
      alt="Product"
      class="h-full w-full object-cover transition-transform duration-500
             group-hover:scale-105"
    />
  </div>

  <!-- Overlay — hidden until parent hover -->
  <div class="absolute inset-0 flex items-center justify-center
              bg-black/50 backdrop-blur-sm
              opacity-0 transition-opacity duration-300
              group-hover:opacity-100">
    <button class="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-gray-900
                   transition-transform duration-200
                   scale-95 group-hover:scale-100">
      View details
    </button>
  </div>

  <!-- Content below image -->
  <div class="p-4">
    <h3 class="font-semibold text-gray-900">Product name</h3>
    <p class="mt-1 text-sm text-gray-500">$49.00</p>
  </div>
</article>

/* Key techniques:
   - group on the card, group-hover: on overlay and image
   - opacity-0 / group-hover:opacity-100 for the overlay fade
   - scale-95 / group-hover:scale-100 for button pop-in
   - transition + duration on each animated element separately */
`;

/*
Q3: A form input with: normal state (gray border), focus state (indigo ring),
    and error state shown via peer sibling styling — no JavaScript for the error toggle.
*/

// A3:
const q3FormInput = `
<div class="space-y-1">
  <label for="email" class="block text-sm font-medium text-gray-700">
    Email address
  </label>

  <!-- peer: input is the "sender" of state -->
  <input
    id="email"
    type="email"
    required
    placeholder="you@example.com"
    class="peer w-full rounded-lg border px-3 py-2 text-sm outline-none
           border-gray-300 placeholder:text-gray-400
           focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30
           invalid:border-rose-500 invalid:focus:ring-rose-500/30
           transition-shadow duration-150"
  />

  <!-- peer-invalid: shown when the peer input is :invalid -->
  <!-- hidden by default, block when peer is invalid -->
  <p class="text-sm text-rose-500 hidden peer-invalid:[&:not(:placeholder-shown)]:block">
    Please enter a valid email address.
  </p>
</div>

/* Breakdown:
   - invalid: state triggers on :invalid pseudo-class (bad value or required+empty)
   - peer-invalid: on sibling reacts to that state
   - :placeholder-shown avoids showing error before user types anything
   - focus:ring-2 ring-*-500/30 — /30 is opacity modifier (30% opacity ring) */
`;

/*
Q4: Responsive navbar:
    - Mobile: single row with logo + hamburger button (menu items hidden)
    - Desktop (md+): logo left, nav links center, CTA button right
    - Sticky to top, with backdrop blur and bottom border
    - Dark mode: dark background, white text
*/

// A4:
const q4Navbar = `
<header class="sticky top-0 z-50
               border-b border-gray-200 dark:border-gray-800
               bg-white/80 dark:bg-gray-900/80
               backdrop-blur-md">
  <div class="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
    <div class="flex h-16 items-center justify-between">

      <!-- Logo -->
      <a href="/" class="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
        <span class="h-8 w-8 rounded-lg bg-indigo-600" aria-hidden="true"></span>
        Brand
      </a>

      <!-- Desktop nav — hidden on mobile -->
      <nav class="hidden md:flex items-center gap-8">
        <a class="text-sm font-medium text-gray-600 hover:text-gray-900
                  dark:text-gray-300 dark:hover:text-white
                  transition-colors duration-150">
          Products
        </a>
        <a class="text-sm font-medium text-gray-600 hover:text-gray-900
                  dark:text-gray-300 dark:hover:text-white
                  transition-colors duration-150">
          Pricing
        </a>
        <a class="text-sm font-medium text-gray-600 hover:text-gray-900
                  dark:text-gray-300 dark:hover:text-white
                  transition-colors duration-150">
          Docs
        </a>
      </nav>

      <!-- Right side: CTA (desktop) + hamburger (mobile) -->
      <div class="flex items-center gap-4">
        <a class="hidden md:inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2
                  text-sm font-medium text-white hover:bg-indigo-500
                  transition-colors duration-150">
          Get started
        </a>

        <!-- Mobile hamburger — visible only on mobile -->
        <button class="md:hidden rounded-md p-2 text-gray-600 dark:text-gray-300
                       hover:bg-gray-100 dark:hover:bg-gray-800
                       transition-colors duration-150"
                aria-label="Open menu">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

    </div>
  </div>
</header>
`;

/*
Q5 — Debug: className={\`bg-\${color}-500\`}
    Why does this fail in production and how do you fix it?
*/

// A5:
const q5Debug = `
// THE PROBLEM:
function StatusDot({ color }: { color: 'blue' | 'green' | 'red' }) {
  // This looks correct. It outputs "bg-blue-500" at runtime.
  // But it FAILS in production — the element has no background.
  return <div className={\`bg-\${color}-500 h-3 w-3 rounded-full\`} />;
}

// WHY IT FAILS:
// Tailwind scans source files as TEXT before your code runs.
// It looks for literal strings like "bg-blue-500", "bg-green-500".
// It sees: "bg-" + variable + "-500" — and can't infer the full class names.
// Those classes never enter the CSS bundle. At runtime, the class appears in
// the DOM, but there's no CSS rule for it. No background. Silent failure.

// THE FIX — use an explicit map:
const colorClasses = {
  blue:  'bg-blue-500',
  green: 'bg-green-500',
  red:   'bg-red-500',
} as const;

function StatusDot({ color }: { color: keyof typeof colorClasses }) {
  return <div className={\`\${colorClasses[color]} h-3 w-3 rounded-full\`} />;
}

// The full class names "bg-blue-500", "bg-green-500", "bg-red-500" now
// appear as literal strings in your source — Tailwind finds them.

// ALTERNATIVE: safelist in tailwind.config.ts (use when values come from outside your code)
safelist: [
  { pattern: /bg-(blue|green|red)-500/ }
]
`;

// ─────────────────────────────────────────────────────────
// SELF-ASSESSMENT (10 questions)
// ─────────────────────────────────────────────────────────

const selfAssessment = [
  {
    q: "Q1: What does `p-6` compile to in CSS?",
    a: "padding: 1.5rem (24px at default font size). Scale: number × 0.25rem. p-6 = 6 × 0.25 = 1.5rem.",
  },
  {
    q: "Q2: You want a link that's gray normally, blue on hover, ONLY on md+ screens. What's the class?",
    a: "md:hover:text-blue-600 — responsive prefix first, then state variant.",
  },
  {
    q: "Q3: What's the difference between `group-hover:` and `peer-hover:`?",
    a: "group-hover: styles a child element when the PARENT (marked group) is hovered. peer-hover: styles a SIBLING element when the peer sibling is hovered.",
  },
  {
    q: "Q4: Why does `twMerge('p-4 px-2', 'p-6')` return 'p-6' and not 'p-4 px-2 p-6'?",
    a: "twMerge understands Tailwind's utility conflicts. p-6 overrides all padding (p-4 and px-2). Without twMerge, all three apply and the one defined later in Tailwind's stylesheet wins — unpredictable.",
  },
  {
    q: "Q5: You're building a skeleton loader. Should you animate `width` or `opacity + transform`? Why?",
    a: "Animate opacity and transform — they're GPU-composited and don't trigger layout recalculation. Animating width forces the browser to recalculate layout on every frame (layout thrashing), causing jank.",
  },
  {
    q: "Q6: What does `motion-safe:animate-bounce` do and why does it matter?",
    a: "It applies animate-bounce only when prefers-reduced-motion is not set. Users with vestibular disorders or motion sensitivity can disable animations via OS settings — this variant respects that preference.",
  },
  {
    q: "Q7: A color value comes from your CMS as the string 'purple'. You write className={`text-${color}-600`}. Will it work in production?",
    a: "No. Tailwind's scanner won't find 'text-purple-600' as a literal string, so it won't be in the bundle. Fix: use an object map { purple: 'text-purple-600' } or add it to the safelist in config.",
  },
  {
    q: "Q8: What's the difference between `@tailwindcss/forms` and `@tailwindcss/typography`?",
    a: "@tailwindcss/forms resets browser form element styles (input, select, textarea) to be fully styleable with Tailwind. @tailwindcss/typography provides the `prose` class that makes raw HTML (from Markdown, CMS) look polished without additional classes.",
  },
  {
    q: "Q9: When should you use `@apply` in Tailwind?",
    a: "Rarely. Valid use: @layer base for styling raw HTML elements (h1, h2, a) when you can't add className, or overriding third-party widgets where you can't modify the JSX. Avoid it for component styles — extract a React component instead.",
  },
  {
    q: "Q10: In Tailwind v4, where does theme configuration live instead of tailwind.config.js?",
    a: "In your CSS file using @theme { }. Example: `@theme { --color-brand: #6366f1; --spacing-18: 4.5rem; }` — tokens defined here are automatically available as Tailwind utilities (bg-brand, p-18 etc.).",
  },
];

// ─────────────────────────────────────────────────────────
// runDemo — reference card of key patterns
// ─────────────────────────────────────────────────────────

function runDemo(): void {
  console.log("\n╔══════════════════════════════════════════════════════════════════╗");
  console.log(  "║  CSS 04 · TAILWIND DEEP DIVE — Reference Card                   ║");
  console.log(  "╚══════════════════════════════════════════════════════════════════╝\n");

  console.log("── SPACING SCALE ────────────────────────────────────────────────────");
  const spacingScale = [
    { token: "p-1",  rem: "0.25rem",  px: "4px"  },
    { token: "p-2",  rem: "0.5rem",   px: "8px"  },
    { token: "p-3",  rem: "0.75rem",  px: "12px" },
    { token: "p-4",  rem: "1rem",     px: "16px" },
    { token: "p-6",  rem: "1.5rem",   px: "24px" },
    { token: "p-8",  rem: "2rem",     px: "32px" },
    { token: "p-12", rem: "3rem",     px: "48px" },
    { token: "p-16", rem: "4rem",     px: "64px" },
  ];
  spacingScale.forEach(({ token, rem, px }) => {
    console.log(`  ${token.padEnd(6)} → ${rem.padEnd(8)} (${px})`);
  });

  console.log("\n── VARIANT STACKING ORDER ───────────────────────────────────────────");
  console.log("  responsive : dark-mode : state : utility");
  console.log("  md:dark:hover:bg-gray-700");
  console.log("  lg:focus-visible:ring-2");
  console.log("  sm:group-hover:opacity-100");

  console.log("\n── BREAKPOINTS (mobile-first) ───────────────────────────────────────");
  const breakpoints = [
    { prefix: "(none)", min: "0px",    desc: "All screens" },
    { prefix: "sm:",    min: "640px",  desc: "Small tablet +" },
    { prefix: "md:",    min: "768px",  desc: "Tablet +" },
    { prefix: "lg:",    min: "1024px", desc: "Desktop +" },
    { prefix: "xl:",    min: "1280px", desc: "Large desktop +" },
    { prefix: "2xl:",   min: "1536px", desc: "Wide screen +" },
  ];
  breakpoints.forEach(({ prefix, min, desc }) => {
    console.log(`  ${prefix.padEnd(8)} min-width: ${min.padEnd(8)} ${desc}`);
  });

  console.log("\n── cn() HELPER (copy into every project) ────────────────────────────");
  console.log("  import { clsx, type ClassValue } from 'clsx';");
  console.log("  import { twMerge } from 'tailwind-merge';");
  console.log("  export const cn = (...i: ClassValue[]) => twMerge(clsx(i));");

  console.log("\n── cva SKELETON ─────────────────────────────────────────────────────");
  console.log("  const variants = cva(");
  console.log("    'base classes always applied',");
  console.log("    { variants: { variant: { a: 'cls', b: 'cls' }, size: { sm: 'cls', md: 'cls' } },");
  console.log("      defaultVariants: { variant: 'a', size: 'md' } }");
  console.log("  );");
  console.log("  type Props = VariantProps<typeof variants> & { className?: string };");
  console.log("  fn({ variant, size }) → string of resolved classes");

  console.log("\n── ANIMATION: GPU-SAFE vs LAYOUT-TRIGGERING ─────────────────────────");
  console.log("  GPU-SAFE (use):      transform, opacity");
  console.log("  LAYOUT-TRIGGERING:   width, height, top, left, margin, padding");
  console.log("  Built-ins:           animate-spin, animate-pulse, animate-ping, animate-bounce");
  console.log("  Transition:          transition-{all|colors|transform|opacity} duration-{150|200|300}");

  console.log("\n── DARK MODE SETUP ──────────────────────────────────────────────────");
  console.log("  tailwind.config.ts:  darkMode: 'class'");
  console.log("  Toggle:              document.documentElement.classList.toggle('dark')");
  console.log("  Persist:             localStorage.setItem('theme', isDark ? 'dark' : 'light')");

  console.log("\n── DYNAMIC CLASSES — THE FIX ────────────────────────────────────────");
  console.log("  WRONG:  `bg-\${color}-500`   ← scanner can't see it");
  console.log("  RIGHT:  { blue: 'bg-blue-500', red: 'bg-red-500' }[color]");
  console.log("  OR:     safelist: [{ pattern: /bg-(blue|red)-500/ }]  in config");

  console.log("\n── COMMON PATTERNS ──────────────────────────────────────────────────");
  const patterns = [
    ["Center a block",         "mx-auto max-w-screen-lg px-4"],
    ["Full-height page",       "min-h-screen flex flex-col"],
    ["Absolute overlay",       "absolute inset-0 bg-black/50"],
    ["Sticky header",          "sticky top-0 z-40 backdrop-blur-md"],
    ["Truncated text",         "truncate / line-clamp-2"],
    ["Focus ring (a11y)",      "focus-visible:ring-2 ring-indigo-500 ring-offset-2"],
    ["Aspect ratio",           "aspect-video / aspect-square overflow-hidden"],
    ["Divider between items",  "divide-y divide-gray-200"],
    ["Hide on mobile",         "hidden md:block"],
    ["Group hover child",      "group on parent, group-hover: on child"],
  ];
  patterns.forEach(([label, classes]) => {
    console.log(`  ${label.padEnd(26)} → ${classes}`);
  });

  console.log("\n── SELF-ASSESSMENT ──────────────────────────────────────────────────");
  selfAssessment.forEach((item, i) => {
    console.log(`\n  ${item.q}`);
    console.log(`  → ${item.a}`);
  });

  console.log("\n╔══════════════════════════════════════════════════════════════════╗");
  console.log(  "║  Score: 0-4 re-study | 5-7 progressing | 8-9 solid | 10 ready ║");
  console.log(  "╚══════════════════════════════════════════════════════════════════╝\n");
}

runDemo();

// ── suppress unused variable warnings — all const blocks are teaching examples ──
void v4ThemeExample;
void v3ConfigExample;
void v4ConfigFull;
void themeFunctionExample;
void customPluginExample;
void customAnimationConfig;
void spacingExamples;
void sizingExamples;
void typographyExamples;
void colorExamples;
void layoutExamples;
void stateVariantsExample;
void responsiveExample;
void darkModeExample;
void groupExample;
void peerExample;
void buttonWithCvaPattern;
void cardPattern;
void formInputPattern;
void modalPattern;
void navbarPattern;
void badgePattern;
void builtInAnimations;
void transitionExamples;
void transformExamples;
void skeletonLoaderExample;
void motionSafeExample;
void clsxExamples;
void cvaFullExample;
void twMergeExamples;
void cnHelper;
void spaghetti;
void componentExtraction;
void atLayerComponentsExample;
void contentConfig;
void safelistExample;
void q1BadgeVariants;
void q2CardOverlay;
void q3FormInput;
void q4Navbar;
void q5Debug;
