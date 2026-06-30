// ════════════════════════════════════════════════════════
// CSS 03: ARCHITECTURE — BEM · CSS MODULES · CSS-IN-JS · TAILWIND  (Day 28)
// Vite demo: cd basics/css-design && npm run dev
// ════════════════════════════════════════════════════════
//
// HOW TO USE THIS FILE
//  1. Read a section, understand the concept
//  2. Open the Vite demo — BEMExample, TailwindExample, Day28Page are all live
//  3. Hit the PRACTICE CHALLENGES at the bottom
//  4. Score yourself on the SELF-ASSESSMENT
//
// CSS is shown as template literal strings or block comment code blocks.
// Your browser runs the real thing in the Vite demo.

// ─────────────────────────────────────────────────────────
// 1. WHY CSS ARCHITECTURE MATTERS
// ─────────────────────────────────────────────────────────
//
// The cascade is a FEATURE, not a bug.
// Problem: without discipline, "cascade" becomes "append-only stylesheet."
// Every dev adds to the bottom, nothing gets deleted, specificity wars break out.
//
// Real-world warning sign: a PR that adds `!important` to 6 properties in a row.
// That's a codebase that lost the war.
//
// ── The "append-only" death spiral ──────────────────────
//
// Month 1:  .button { color: blue }
// Month 2:  .sidebar .button { color: red }           ← specificity bump
// Month 3:  .sidebar .card .button { color: green }   ← specificity bump again
// Month 4:  .button { color: blue !important }        ← someone gives up
// Month 5:  .sidebar .button { color: red !important} ← war declared
//
// ── Specificity refresher ────────────────────────────────
//
//  Inline style                 → 1-0-0-0   (highest)
//  #id                          → 0-1-0-0
//  .class / [attr] / :pseudo    → 0-0-1-0
//  element / ::pseudo-element   → 0-0-0-1   (lowest)
//
// When two rules have equal specificity, the LAST one in source order wins.
// That's the cascade at work — and why import order matters.
//
// ── The global scope problem ─────────────────────────────
//
// Plain CSS has one scope: the entire document.
// If Header.css and Footer.css both define `.button { color: red }`,
// whichever CSS file is imported last wins — silently.
// Rename `.button` to `.btn` in Header.css → Footer.css breaks. Nobody notices until QA.
//
// ── 4 goals every CSS architecture tries to achieve ─────
//
//  1. PREDICTABLE   — changing a class only affects what you expect
//  2. REUSABLE      — components look the same anywhere they appear
//  3. MAINTAINABLE  — delete a component, delete its styles, nothing else breaks
//  4. SCALABLE      — a new dev can add a feature without studying 5000 lines of CSS
//
// Real job context:
// Small projects survive without architecture. 3-dev teams shipping a B2B SaaS product
// need it on Day 1. You'll feel the pain around week 6 if you skip it.

// ⚠️ GOTCHA: No methodology is universally correct.
// Tailwind won't save a messy team. BEM won't fix a project that ignores it.
// Pick one approach, document it in the README, enforce it in code review.
// Half-BEM + half-Tailwind + half-CSS-Modules = three methodologies, zero benefits.

// ─────────────────────────────────────────────────────────
// 2. BEM (BLOCK ELEMENT MODIFIER)
// ─────────────────────────────────────────────────────────
//
// Analogy:
//  Block    = a complete LEGO set (e.g. the City Hospital)
//  Element  = a LEGO piece that belongs to that set (e.g. the ambulance door)
//  Modifier = a red version of that ambulance door — same shape, different state
//
// Syntax: .block__element--modifier
//  Block:    .card
//  Element:  .card__title         (double underscore)
//  Modifier: .card--featured      (double dash on the block)
//            .card__button--primary (double dash on an element)
//
// Real examples from the demo (see BEMExample.tsx):

const bemNaming = `
/* ── Block — standalone, reusable component ── */
.card { ... }
.button { ... }
.modal { ... }

/* ── Elements — parts of the block ── */
.card__header { ... }
.card__body { ... }
.card__footer { ... }
.card__title { ... }
.button__icon { ... }
.button__text { ... }
.modal__overlay { ... }
.modal__close-btn { ... }

/* ── Modifiers — variants or states ── */
.card--featured { border-left: 4px solid #6366f1; }
.card--loading { opacity: 0.5; pointer-events: none; }
.button--primary { background: #6366f1; color: white; }
.button--secondary { background: transparent; border: 1px solid #6366f1; }
.button--large { padding: 0.75rem 1.5rem; font-size: 1.125rem; }
.button--disabled { opacity: 0.45; cursor: not-allowed; }
`;

// ── Nesting rule: NEVER more than one level of __ ────────
//
// Wrong:  .nav__list__item__link  ← three underscores → unreadable
// Right:  .nav__link              ← flatten it; the context is already clear
//
// If you need two levels of nesting, it's usually a sign the inner thing
// should be its own block.
//
// ── BEM with SCSS (&__element shorthand) ─────────────────

const bemScss = `
/* SCSS — & refers to parent selector */
.card {
  background: white;
  border-radius: 8px;

  &__header {           /* compiles to: .card__header */
    padding: 1rem 1.25rem;
    border-bottom: 1px solid #e2e8f0;
  }

  &__body {             /* compiles to: .card__body */
    padding: 1rem 1.25rem;
  }

  &--featured {         /* compiles to: .card--featured */
    border-left: 4px solid #6366f1;
  }
}
`;

// ── When BEM makes sense vs when it's overkill ───────────
//
// USE BEM when:
//  - Plain HTML + CSS (no build tool, no framework)
//  - Legacy codebases where you can't add Webpack/Vite
//  - Large teams that need strict naming conventions
//  - Writing a CSS library others will consume (clear public API)
//
// SKIP BEM when:
//  - You're in a React app with CSS Modules (scoping solves the name collision problem)
//  - You're on a Tailwind project (no class names to invent)
//  - It's a weekend project with one dev — the overhead isn't worth it

// ⚠️ GOTCHA: BEM element selectors should NOT be nested inside .block in CSS.
// They're already namespaced — nesting adds specificity for no reason.
//
// Wrong (adds specificity):
//   .card { }
//   .card .card__header { }   ← now specificity is 0-0-2-0 instead of 0-0-1-0
//
// Right:
//   .card { }
//   .card__header { }         ← flat, low specificity, easy to override when needed

// ─────────────────────────────────────────────────────────
// 3. CSS MODULES
// ─────────────────────────────────────────────────────────
//
// How it works:
// You write normal CSS. The build tool (Vite, Webpack, Next.js) renames every
// class with a hash suffix so it's unique in the entire app.
//
//  You write:     .button-primary { ... }
//  Compiled to:   .button-primary_a3kx9 { ... }    ← unique, collision-free
//
// In React you import the CSS module as an object:

const cssModulesUsage = `
/* Button.module.css */
.root {
  display: inline-flex;
  align-items: center;
  border-radius: 6px;
  cursor: pointer;
}

.primary {
  background: #6366f1;
  color: white;
}

.secondary {
  background: transparent;
  border: 1px solid #6366f1;
  color: #6366f1;
}

/* composes — inherit styles from another class in the same file */
.primaryLarge {
  composes: primary;
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}

/* :global — escape the local scope for something truly global */
:global(.visually-hidden) {
  position: absolute;
  width: 1px;
  height: 1px;
  clip: rect(0, 0, 0, 0);
  overflow: hidden;
}
`;

// In the component file:
const cssModulesReactUsage = `
import styles from './Button.module.css';
import clsx from 'clsx';

function Button({ variant = 'primary', className, children }) {
  return (
    <button
      className={clsx(
        styles.root,
        variant === 'primary'   && styles.primary,
        variant === 'secondary' && styles.secondary,
        className                                     // escape hatch for callers
      )}
    >
      {children}
    </button>
  );
}
`;

// ── clsx / classnames library ────────────────────────────
//
// clsx joins class strings and filters out falsy values (false, null, undefined).
// Without it you end up with messy string concatenation and "undefined" in the DOM.
//
// npm install clsx
//
// clsx(['base', isPrimary && 'primary', isLarge && 'large'])
// → "base primary"  (when isPrimary = true, isLarge = false)
//
// When to use CSS Modules:
//  - React/Vue projects where each component owns its styles
//  - Teams comfortable with CSS but not sold on utility classes
//  - When you need full CSS power (animations, complex selectors) without global scope
//  - When your design doesn't map cleanly to a utility system

// ⚠️ GOTCHA: CSS Modules only scope CLASS names, not element selectors.
// button { font-size: 1rem } in a .module.css file is STILL GLOBAL.
// Only .button { } gets hashed. Always use class selectors inside module files.

// ─────────────────────────────────────────────────────────
// 4. CSS-IN-JS (styled-components / Emotion)
// ─────────────────────────────────────────────────────────
//
// Concept: write CSS as JavaScript template literals, attached to a React component.
// The library generates a unique class and injects a <style> tag at runtime.
// Styles are automatically scoped to the component — no modules needed.
//
// npm install styled-components
// npm install @emotion/react @emotion/styled

const styledComponentsExample = `
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';

/* createGlobalStyle — CSS reset or global overrides */
const GlobalStyle = createGlobalStyle\`
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, sans-serif; }
\`;

/* styled.button — create a component with baked-in styles */
const Button = styled.button<{ variant?: 'primary' | 'secondary' }>\`
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  border: none;

  /* Props-based branching — full JS power */
  background: \${({ variant }) => variant === 'secondary' ? 'transparent' : '#6366f1'};
  color:      \${({ variant }) => variant === 'secondary' ? '#6366f1'     : 'white'};

  /* Access theme values */
  border-color: \${({ theme }) => theme.colors.border};

  &:hover {
    opacity: 0.9;
  }
\`;

/* Extending a styled component */
const LargeButton = styled(Button)\`
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
\`;

/* css helper — reusable style blocks */
import { css } from 'styled-components';
const focusRing = css\`
  outline: 2px solid #6366f1;
  outline-offset: 2px;
\`;

/* ThemeProvider — inject design tokens to every styled component */
const theme = {
  colors: {
    primary: '#6366f1',
    border: '#e2e8f0',
  },
  spacing: {
    sm: '0.5rem',
    md: '1rem',
  },
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <Button variant="primary">Click me</Button>
      <Button variant="secondary">Cancel</Button>
    </ThemeProvider>
  );
}
`;

// ── Pros and cons ─────────────────────────────────────────
//
// PROS:
//  - Full JS power: conditionals, loops, theme access, all in one place
//  - Auto-scoped: no class name collisions, ever
//  - Co-located: styles live next to the component that owns them
//  - ThemeProvider = design tokens distributed without prop-drilling
//
// CONS:
//  - Runtime cost: styles are generated and injected at runtime
//  - No static extraction by default — larger JS bundles
//  - SSR complexity: hydration mismatches if not configured correctly
//  - Harder to debug: generated class names like `sc-abc123`
//
// Zero-runtime alternatives (same DX, no runtime):
//  - Linaria: uses Babel to extract CSS at build time
//  - vanilla-extract: TypeScript-first, statically extracted, excellent type safety
//
// When to use CSS-in-JS:
//  - Complex dynamic theming driven by runtime data (user-selected colors)
//  - Design-token-heavy systems (Material UI uses Emotion under the hood)
//  - Teams that prefer co-location of styles with components
//
// When to avoid:
//  - Performance-critical apps without SSR setup (runtime injection is measurable)
//  - Teams already comfortable with CSS Modules or Tailwind
//  - Static sites where build-time extraction wins every time

// ⚠️ GOTCHA: styled-components generates a NEW class on every render
// when you pass an inline function that accesses props.
//
// Slow (new class each render):
//   const Box = styled.div`color: ${props => props.color}`;
//   <Box color={dynamicColor} />
//
// Fast (static styles, pass color as a CSS variable or data attribute):
//   const Box = styled.div`color: var(--box-color)`;
//   <Box style={{ '--box-color': dynamicColor }} />
//
// Or: extract static variants outside the component.

// ─────────────────────────────────────────────────────────
// 5. TAILWIND CSS — HOW IT ACTUALLY WORKS
// ─────────────────────────────────────────────────────────
//
// Utility-first philosophy:
// Instead of naming things (.card__header) and writing CSS for them,
// you compose small, single-purpose utility classes directly in HTML/JSX.
//
//  "Don't invent a name, describe the style."
//
// Before Tailwind (you invented a name):
//   <div class="card-header">...</div>
//   .card-header { padding: 1rem 1.25rem; border-bottom: 1px solid #e2e8f0; }
//
// With Tailwind (you describe the style):
//   <div class="px-5 py-3.5 border-b border-slate-200">...</div>
//   (No CSS file needed at all)
//
// ── JIT (Just-in-Time) compiler ──────────────────────────
//
// Old Tailwind (v2-): generated a 3MB CSS file with every possible utility class.
// You'd ship 98% of classes you never used. Purging was manual and error-prone.
//
// New Tailwind (v3+ JIT): scans your source files on save.
// ONLY generates CSS for utility classes it actually finds in your code.
// Result: production CSS is typically 5–20KB — smaller than most custom CSS files.
//
// How the scanner works:
//  1. Read all files matching `content` globs in tailwind.config.js
//  2. Extract every string that could be a utility class (regex-based)
//  3. Generate only those classes
//  4. Done — no runtime, no JS overhead

const tailwindJit = `
/* tailwind.config.js */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',   // ← JIT scans these files
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          500: '#3b82f6',
          900: '#1e3a8a',
        },
      },
      spacing: {
        '18': '4.5rem',   // adds gap-18, p-18, m-18 etc.
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};
`;

// ── @apply — grouping utilities into a class ──────────────
//
// When the same 10 utility classes appear on 20 buttons, @apply extracts them.
// It's an escape hatch — don't overuse it or you lose Tailwind's main benefit.

const tailwindApply = `
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ✅ OK: extracting a repeated pattern into a reusable class */
@layer components {
  .btn {
    @apply inline-flex items-center justify-center
           font-medium rounded-lg transition-colors
           focus-visible:outline-none focus-visible:ring-2;
  }
  .btn-primary {
    @apply btn bg-indigo-600 text-white hover:bg-indigo-700;
  }
}

/* ❌ Bad: recreating a whole design system with @apply — you've just re-invented CSS */
`;

// ── theme() function vs CSS custom properties ─────────────
//
// theme() is a build-time function — it reads values from tailwind.config.js
// and bakes them into the compiled CSS. Not available at runtime.
//
// CSS custom properties (--color-brand) ARE available at runtime (dark mode, JS themes).
// Use CSS vars for anything that changes dynamically; theme() for static constants.

const tailwindThemeVsCssVars = `
/* theme() — build-time, reads tailwind.config.js */
.hero {
  background: theme(colors.brand.500);  /* replaced at build time */
}

/* CSS custom property — runtime, can be changed by JS */
:root {
  --color-brand: theme(colors.brand.500);  /* set once at build time */
}
.hero {
  background: var(--color-brand);       /* can change in dark mode */
}
`;

// Real job context:
// Tailwind is now the default in most new Next.js, Vite, and Remix projects.
// Learning to read it fluently (even if your project doesn't use it) saves you
// time when reading open-source components and UI kits.

// ⚠️ GOTCHA: Never build Tailwind class names with string concatenation.
// The JIT scanner is a regex, not a JavaScript runtime. It can't evaluate expressions.
//
// Wrong (JIT won't generate bg-primary or bg-secondary):
//   const color = isActive ? 'primary' : 'secondary';
//   <div className={`bg-${color}`} />
//
// Right (full class names are statically visible):
//   const cls = isActive ? 'bg-primary' : 'bg-secondary';
//   <div className={cls} />
//
// If you need truly dynamic classes (user-chosen color from a DB),
// use a safelist in tailwind.config.js — see Practice Q4.

// ─────────────────────────────────────────────────────────
// 6. TAILWIND vs CSS MODULES vs BEM — DECISION GUIDE
// ─────────────────────────────────────────────────────────
//
// ┌──────────────────┬──────────────┬─────────────┬──────────────┬───────────────────┐
// │                  │ BEM          │ CSS Modules │ Tailwind     │ CSS-in-JS         │
// ├──────────────────┼──────────────┼─────────────┼──────────────┼───────────────────┤
// │ Learning curve   │ Low          │ Low-Medium  │ Medium       │ High              │
// │ Build tool req.  │ No           │ Yes         │ Yes          │ Yes               │
// │ Runtime cost     │ None         │ None        │ None (JIT)   │ Yes (unless Linaria) │
// │ Dynamic styles   │ Via classes  │ Via classes │ Via clsx     │ Native (JS power) │
// │ Co-location      │ No (2 files) │ Yes (pairs) │ Yes (inline) │ Yes (same file)   │
// │ Team familiarity │ Universal    │ High        │ Growing fast │ Medium            │
// │ Debugging        │ Easy         │ Easy        │ Easy         │ Harder (hashed)   │
// │ Design tokens    │ Manual       │ Via vars    │ Config file  │ ThemeProvider     │
// └──────────────────┴──────────────┴─────────────┴──────────────┴───────────────────┘
//
// ── When Tailwind wins ───────────────────────────────────
//  - Rapid prototyping (no context-switching between files)
//  - Teams with a design system (Figma tokens → Tailwind config)
//  - Vite / Next.js projects starting from scratch
//  - UI component libraries (Shadcn/UI, DaisyUI are Tailwind-first)
//  - Smaller teams where "naming things" is the real bottleneck
//
// ── When CSS Modules win ─────────────────────────────────
//  - Team is CSS-confident but Tailwind adoption would slow everyone down
//  - Design that doesn't map to a utility grid (bespoke, heavily animated UIs)
//  - You need full CSS feature access (complex :has(), @container queries, animations)
//  - Adding React to an existing CSS codebase — modules are low-friction
//
// ── When BEM wins ───────────────────────────────────────
//  - No build tool (static HTML, WordPress themes, email templates)
//  - Legacy codebase where introducing a bundler isn't feasible
//  - Shared CSS library consumed by multiple non-React projects
//  - Clear, self-documenting class names are a hard requirement
//
// ── When CSS-in-JS wins ─────────────────────────────────
//  - Complex runtime theming (user selects brand colors from a palette)
//  - Already using Material UI or Chakra UI (both use Emotion internally)
//  - Styles depend heavily on component state/props in complex ways
//  - Design token injection system that needs to span SSR and client

// ⚠️ GOTCHA: Mixing methodologies in one project creates chaos.
// It's tempting to use Tailwind for layout and CSS Modules for "complex" components.
// The result is two mental models, two debugging flows, two sets of conventions.
// Agree on one approach per project before writing a line of CSS.
// (The one acceptable mix: Tailwind utilities + @layer components for extracted patterns.)

// ─────────────────────────────────────────────────────────
// 7. SCSS/SASS ESSENTIALS
// ─────────────────────────────────────────────────────────
//
// SCSS compiles to regular CSS. It adds variables, nesting, mixins, and more.
// You don't ship SCSS — your build tool processes it.
//
// ── Variables ────────────────────────────────────────────
//
// SCSS vars:   $color-primary: #3b82f6;    → compile-time constant
// CSS vars:    --color-primary: #3b82f6;   → runtime, can be changed by JS/dark mode
//
// Rule of thumb:
//  - CSS custom properties for THEMING (dark mode, user preferences)
//  - SCSS variables for BUILD-TIME constants (breakpoint values in @media queries,
//    because CSS vars don't work inside @media conditions)

const scssVariables = `
/* _variables.scss */
$color-primary:   #3b82f6;
$color-secondary: #8b5cf6;
$font-size-base:  1rem;
$spacing-unit:    0.25rem;  /* 4px base — multiply for scale */

/* Breakpoints — must be SCSS vars, CSS vars don't work in @media */
$bp-md: 768px;
$bp-lg: 1024px;

.container {
  padding: $spacing-unit * 4;   /* 1rem */

  @media (min-width: $bp-md) {
    padding: $spacing-unit * 6; /* 1.5rem */
  }
}
`;

// ── Nesting — max 3 levels, no more ─────────────────────

const scssNesting = `
/* ✅ Good — readable, max 3 levels */
.card {
  background: white;

  &__header {
    padding: 1rem;

    &:hover { background: #f8fafc; }   /* level 3 — stop here */
  }
}

/* ❌ Bad — specificity creep, unreadable compiled output */
.nav {
  .nav__list {
    .nav__item {
      .nav__link {
        &:hover { color: red; }   /* compiles to 4-class selector */
      }
    }
  }
}
`;

// ── @mixin and @include ───────────────────────────────────

const scssMixins = `
/* Define — parameterized style block */
@mixin flex-center($direction: row) {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: $direction;
}

@mixin truncate($lines: 1) {
  @if $lines == 1 {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  } @else {
    display: -webkit-box;
    -webkit-line-clamp: $lines;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

/* Use */
.hero {
  @include flex-center(column);
  height: 100vh;
}

.card__title {
  @include truncate(2);  /* 2-line clamp */
}
`;

// ── @extend — dangerous, prefer mixins ───────────────────
//
// @extend makes selector B inherit all rules from selector A.
// Sounds great. Problem: the compiled CSS adds selector B everywhere selector A appears,
// including inside @media queries. Can generate enormous, duplicate output.

const scssExtendWarning = `
/* ❌ Avoid @extend — unpredictable output size */
.button { padding: 0.5rem 1rem; border-radius: 4px; }
.cta-button { @extend .button; background: #6366f1; }
/* Compiled: .button, .cta-button { padding: ... }  — manageable here */
/* But inside @media blocks it duplicates everything — output blows up */

/* ✅ Use @mixin instead — predictable, contained */
@mixin button-base {
  padding: 0.5rem 1rem;
  border-radius: 4px;
}
.button     { @include button-base; }
.cta-button { @include button-base; background: #6366f1; }
`;

// ── @use and @forward (modern — replaces @import) ─────────
//
// @import is deprecated in Dart Sass (the current standard).
// It pollutes the global namespace and re-runs files on each import.
//
// @use: import a file into the current scope (prefixed access)
// @forward: re-export everything so a single index file exposes the whole system

const scssModuleSystem = `
/* _colors.scss */
$primary: #3b82f6;

/* _typography.scss */
$font-base: 1rem;

/* _index.scss — barrel export */
@forward 'colors';
@forward 'typography';

/* Component file */
@use '../tokens' as t;   /* t is the prefix */
.button {
  background: t.$primary;
  font-size: t.$font-base;
}
`;

// ── Partials ─────────────────────────────────────────────
//
// Files prefixed with _ are "partials" — they won't compile to their own .css file.
// They're meant to be imported (@used) into a main stylesheet.
//
// Convention:
//  styles/_variables.scss
//  styles/_mixins.scss
//  styles/_reset.scss
//  styles/main.scss   ← uses all the partials, compiles to main.css

// ⚠️ GOTCHA: SCSS @extend can silently double or triple your output CSS.
// A simple-looking @extend inside a component used 50 times creates 50 selector
// repetitions in the compiled output. Switch to @mixin — identical DX, safe output.

// ─────────────────────────────────────────────────────────
// 8. NAMING CONVENTIONS AND ORGANIZATION
// ─────────────────────────────────────────────────────────
//
// ── File/folder structure ─────────────────────────────────

const folderStructure = `
src/
  styles/
    base/
      _reset.scss       ← CSS reset, box-sizing, root font-size
      _typography.scss  ← body, h1-h6, p defaults
    tokens/
      _colors.scss      ← color palette (CSS custom properties)
      _spacing.scss     ← spacing scale
      _typography.scss  ← font sizes, weights, line heights
    components/
      _button.scss
      _card.scss
      _modal.scss
    utilities/
      _flex.scss        ← custom utility classes (if not using Tailwind)
      _visually-hidden.scss
    main.scss           ← @use all partials, compile target
`;

// ── Design token naming convention ───────────────────────
//
// Follow a category → variant → scale pattern.
// Anyone reading --color-brand-primary knows: category = color, variant = brand, scale = primary.

const designTokens = `
:root {
  /* Color tokens — category-variant-scale */
  --color-brand-primary:   #3b82f6;
  --color-brand-secondary: #8b5cf6;
  --color-neutral-100:     #f1f5f9;
  --color-neutral-900:     #0f172a;
  --color-semantic-error:  #ef4444;
  --color-semantic-success:#22c55e;

  /* Spacing tokens — matches 4px grid */
  --spacing-1:  0.25rem;   /* 4px  */
  --spacing-2:  0.5rem;    /* 8px  */
  --spacing-4:  1rem;      /* 16px */
  --spacing-8:  2rem;      /* 32px */
  --spacing-16: 4rem;      /* 64px */

  /* Typography tokens */
  --font-size-sm:   0.875rem;  /* 14px */
  --font-size-base: 1rem;      /* 16px */
  --font-size-lg:   1.125rem;  /* 18px */
  --font-size-xl:   1.25rem;   /* 20px */
  --font-size-2xl:  1.5rem;    /* 24px */

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;
}
`;

// ── Specificity cheat sheet ────────────────────────────────
//
//  Selector              Specificity     Example
//  ─────────────────────────────────────────────────────────
//  Inline style          1-0-0-0         style="color: red"
//  #id                   0-1-0-0         #header
//  .class                0-0-1-0         .button
//  [attribute]           0-0-1-0         [type="text"]
//  :pseudo-class         0-0-1-0         :hover, :focus, :nth-child()
//  element               0-0-0-1         button, h1, div
//  ::pseudo-element      0-0-0-1         ::before, ::after
//  :not() / :is()        inherits highest specificity of argument
//  !important            overrides all   (nuclear option)

// ── The !important rulebook ───────────────────────────────
//
// Legitimate uses (exactly two):
//  1. Utility classes that MUST always apply: .visually-hidden, .sr-only
//     because if specificity could defeat them, they'd silently break accessibility
//  2. Accessibility overrides: forced-colors media query, user stylesheet overrides
//
// NOT legitimate:
//  - Fixing a specificity war (fix the selector instead)
//  - Getting something to "just work" quickly (it will haunt you)
//  - Any selector that targets a specific component (use scoped styles)

// ── CSS reset vs normalize vs modern reset ────────────────
//
// Reset (Meyer):        Zeros everything — aggressive, requires rebuilding all defaults
// Normalize.css:        Preserves useful defaults, fixes browser inconsistencies
// Modern reset (recommended):

const modernReset = `
*, *::before, *::after {
  box-sizing: border-box;  /* padding/border don't add to width */
  margin: 0;               /* no surprise margins */
}

img, video { max-width: 100%; display: block; }

input, button, textarea, select { font: inherit; } /* fix form font inheritance */

p, h1, h2, h3, h4, h5, h6 { overflow-wrap: break-word; }
`;

// Real job context:
// Most frameworks (Next.js, Vite React templates) include a reset.
// Tailwind includes its own via `@tailwind base` (Preflight).
// You almost never need to add another reset on top.

// ⚠️ GOTCHA: id selectors in CSS are almost never needed.
// #submit-button { } has specificity 0-1-0-0 — it overrides any .class rule.
// If you later need to override it from a utility class, you can't without !important.
// Use classes everywhere. Reserve id attributes for JS hooks and accessibility (aria-labelledby).

// ═══════════════════════════════════════════════════════════
// PRACTICE CHALLENGES
// ═══════════════════════════════════════════════════════════

// Q1 — Convert this messy CSS to correct BEM naming
// ────────────────────────────────────────────────────────────────────
// The following CSS has no methodology. Rename everything to BEM.
//
// BROKEN CSS (before):
const q1BrokenCss = `
.navigation { display: flex; }
.navigation .link { color: gray; }
.navigation .link.active { color: blue; font-weight: bold; }
.navigation .link.active .icon { margin-right: 4px; }
.navigation.sticky { position: fixed; top: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
`;

// ANSWER ↓
const q1Answer = `
/* Block */
.nav { display: flex; }

/* Elements */
.nav__link       { color: gray; }
.nav__link-icon  { margin-right: 4px; }

/* Modifiers */
.nav__link--active { color: blue; font-weight: bold; }
.nav--sticky       { position: fixed; top: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }

/* Note: .nav__link-icon has one underscore pair — it's a child of .nav__link.
   Alternatively flatten to .nav__icon if icon only appears inside a link. */
`;

// Q2 — Create a Button component using CSS Modules with variants
// ────────────────────────────────────────────────────────────────────
// Write the CSS Module file and the React component that uses it.
// Variants: primary (indigo fill), secondary (outline), disabled (muted).
//
// ANSWER ↓
const q2CssModuleFile = `
/* Button.module.css */
.root {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.9375rem;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s, border-color 0.15s;
}

.primary {
  background: #6366f1;
  color: white;
}
.primary:hover { background: #4f46e5; }

.secondary {
  background: transparent;
  color: #6366f1;
  border-color: #6366f1;
}
.secondary:hover { background: #eff6ff; }

.disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}
`;

const q2ReactComponent = `
import styles from './Button.module.css';
import clsx from 'clsx';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  children: React.ReactNode;
}

function Button({ variant = 'primary', disabled = false, children }: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={clsx(
        styles.root,
        variant === 'primary'   && styles.primary,
        variant === 'secondary' && styles.secondary,
        disabled                && styles.disabled,
      )}
    >
      {children}
    </button>
  );
}
`;

// Q3 — The same Button using Tailwind utility classes with clsx
// ────────────────────────────────────────────────────────────────────
// No CSS file. Compose everything inline with Tailwind + clsx.
//
// ANSWER ↓
const q3TailwindButton = `
import clsx from 'clsx';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  children: React.ReactNode;
}

function Button({ variant = 'primary', disabled = false, children }: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={clsx(
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',

        variant === 'primary'   && 'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800',
        variant === 'secondary' && 'bg-transparent text-indigo-600 border border-indigo-600 hover:bg-indigo-50',

        disabled && 'opacity-45 cursor-not-allowed pointer-events-none',
      )}
    >
      {children}
    </button>
  );
}
`;

// Q4 — Write a Tailwind safelist config entry and explain when it's needed
// ────────────────────────────────────────────────────────────────────
//
// Scenario: Your app fetches a user's chosen brand color from an API.
// The color name ('red', 'blue', 'green') comes from the DB — unknown at build time.
// You want to apply bg-red-500, bg-blue-500, or bg-green-500 dynamically.
//
// Problem: The JIT scanner won't see `bg-${color}-500` — it's a runtime expression.
// The classes will not be generated and won't exist in the output CSS.
//
// ANSWER ↓
const q4Safelist = `
/* tailwind.config.js */
export default {
  content: ['./src/**/*.{ts,tsx}'],

  safelist: [
    /* Pattern: generate bg-{color}-500 for every color listed */
    {
      pattern: /bg-(red|blue|green|yellow|purple)-500/,
    },
    /* Or explicit list for a small, known set */
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    /* You can also safelist text and border variants */
    {
      pattern: /text-(red|blue|green)-500/,
    },
  ],
};

/* In your component — full class names never appear in source,
   but safelist guarantees they're in the output CSS */
function BrandBadge({ color }: { color: 'red' | 'blue' | 'green' }) {
  return (
    <span className={\`bg-\${color}-500 text-white px-2 py-1 rounded\`}>
      {color}
    </span>
  );
}
`;
// When safelist is needed:
// - Colors, themes, or variants chosen by users at runtime
// - Classes built from CMS content or database values
// - Third-party plugins that inject class names dynamically
// Use it sparingly — it adds to bundle size. For large dynamic sets,
// use CSS custom properties (--brand-color: red) instead.

// Q5 — Debug this Tailwind class: bg-${'primary'} — why doesn't it work?
// ────────────────────────────────────────────────────────────────────
//
// BROKEN CODE:
const q5BrokenCode = `
const color = 'primary';
<div className={\`bg-\${color}\`} />
/* renders: class="bg-primary" in the DOM */
/* but: NO bg-primary rule in the CSS — the div has no background */
`;
//
// WHY IT BREAKS:
// The JIT scanner reads source files as TEXT — it does not run JavaScript.
// It uses a regex to find strings that match the utility class pattern.
// \`bg-\${color}\` never matches that regex because it's a template expression.
// The scanner never sees "bg-primary" as a string — it only sees the backtick expression.
//
// ANSWER — Three fixes:
const q5Fix = `
/* Fix 1: Use the full class name in a conditional (most common) */
const cls = isActive ? 'bg-primary' : 'bg-secondary';
<div className={cls} />

/* Fix 2: Use an object map — full class names are statically visible */
const colorMap = {
  primary:   'bg-indigo-600',
  secondary: 'bg-slate-700',
  danger:    'bg-red-600',
};
<div className={colorMap[color]} />

/* Fix 3: Safelist (when class name is truly dynamic at runtime) */
// In tailwind.config.js:
safelist: ['bg-primary', 'bg-secondary', 'bg-danger']
// Then the string concatenation is safe — the classes exist in output CSS
`;

// ═══════════════════════════════════════════════════════════
// SELF-ASSESSMENT (10 questions)
// Score: 0–4 re-study | 5–7 progressing | 8–9 solid | 10 ready to advance
// ═══════════════════════════════════════════════════════════

const selfAssessment = [
  {
    q: "Q1. What does BEM stand for, and what does each part represent?",
    a: "Block, Element, Modifier. Block = standalone component (.card). " +
       "Element = part of the block, double underscore (.card__title). " +
       "Modifier = variant or state, double dash (.card--featured).",
  },
  {
    q: "Q2. Why should BEM element selectors NOT be nested inside their block in CSS?",
    a: "They're already namespaced by the block prefix (.card__header), so nesting " +
       "inside .card { .card__header { } } raises specificity to 0-0-2-0 for no benefit. " +
       "Flat selectors keep specificity low and are easier to override.",
  },
  {
    q: "Q3. How does CSS Modules scope class names? What does the compiled output look like?",
    a: "The build tool appends a hash to every class name in the .module.css file. " +
       ".button in source becomes .button_a3kx9 in the output. " +
       "This makes the class unique across the entire app — no collisions.",
  },
  {
    q: "Q4. CSS Modules only scope class names — not element selectors. Why does this matter?",
    a: "A rule like button { font-size: 1rem } inside a .module.css file is NOT scoped — " +
       "it applies globally. Only class selectors get the hash treatment. " +
       "Always use class selectors inside module files.",
  },
  {
    q: "Q5. Name two pros and two cons of CSS-in-JS (styled-components / Emotion).",
    a: "Pros: (1) Full JS power for dynamic styles based on props/theme. " +
       "(2) Auto-scoped — no class collisions, no separate file. " +
       "Cons: (1) Runtime cost — styles generated and injected at runtime, larger JS. " +
       "(2) SSR complexity — hydration mismatches if not configured correctly.",
  },
  {
    q: "Q6. What is Tailwind's JIT compiler and why does it make production bundles small?",
    a: "JIT (Just-in-Time) scans your source files for utility class strings at build time " +
       "and ONLY generates CSS for classes it actually finds. " +
       "In production you ship 5–20KB of CSS instead of a 3MB full utility class file.",
  },
  {
    q: "Q7. Why does `bg-${color}` not work in Tailwind and how do you fix it?",
    a: "The JIT scanner reads source as text using a regex — it never runs JS. " +
       "Template expressions are invisible to the scanner. " +
       "Fix: use full class names in a ternary or object map so the scanner can see them. " +
       "Alternatively, add the needed classes to the safelist in tailwind.config.js.",
  },
  {
    q: "Q8. When would you choose CSS custom properties over SCSS variables for theming?",
    a: "CSS custom properties when styles need to change at RUNTIME — dark mode toggles, " +
       "user-selected themes, JS-driven updates. " +
       "SCSS variables when values are needed only at build time — especially inside @media " +
       "conditions, where CSS vars are not supported.",
  },
  {
    q: "Q9. Why is @extend in SCSS considered dangerous and what should you use instead?",
    a: "@extend duplicates the extending selector everywhere the base selector appears, " +
       "including inside @media blocks, causing output CSS to balloon unpredictably. " +
       "Use @mixin + @include instead — same DX, output is always contained and predictable.",
  },
  {
    q: "Q10. Name the only two legitimate uses of !important in CSS.",
    a: "(1) Utility/helper classes that MUST always apply regardless of specificity " +
       "— e.g., .visually-hidden (accessibility). " +
       "(2) Accessibility overrides in forced-colors or prefers-reduced-motion media queries. " +
       "Using !important to resolve specificity wars means fixing the architecture instead.",
  },
];

// ─────────────────────────────────────────────────────────
// DEMO RUNNER — reference card + methodology comparison
// ─────────────────────────────────────────────────────────

function runDemo(): void {
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log(  "║     CSS ARCHITECTURE — DAY 28 REFERENCE CARD               ║");
  console.log(  "╚══════════════════════════════════════════════════════════════╝\n");

  console.log("── BEM SYNTAX ──────────────────────────────────────────────────");
  console.log("  .block                   standalone component (.card)");
  console.log("  .block__element          part of the block, double underscore (.card__title)");
  console.log("  .block--modifier         variant/state, double dash (.card--featured)");
  console.log("  .block__element--mod     element variant (.card__button--primary)");
  console.log("  Rule: never more than one __ level. Flatten deeply nested elements.\n");

  console.log("── CSS MODULES ─────────────────────────────────────────────────");
  console.log("  import styles from './Component.module.css'");
  console.log("  className={styles.button}            → .button_a3kx9 in output");
  console.log("  className={clsx(styles.a, styles.b)} → multiple scoped classes");
  console.log("  composes: base from './base.css'     → inherit another class");
  console.log("  :global(.classname)                  → opt out of scoping");
  console.log("  Gotcha: element selectors are NOT scoped — classes only.\n");

  console.log("── CSS-IN-JS (styled-components) ───────────────────────────────");
  console.log("  const Btn = styled.button`padding: 1rem; background: ${p => p.bg}`;`");
  console.log("  <ThemeProvider theme={tokens}>...</ThemeProvider>");
  console.log("  createGlobalStyle — CSS reset / global overrides");
  console.log("  Gotcha: inline functions generate a new class per render.");
  console.log("  Zero-runtime: Linaria, vanilla-extract.\n");

  console.log("── TAILWIND JIT ─────────────────────────────────────────────────");
  console.log("  JIT scans source as text — never evaluates JS expressions");
  console.log("  Safe:    const cls = isPrimary ? 'bg-indigo-600' : 'bg-slate-700'");
  console.log("  Broken:  `bg-${color}`  ← JIT can't see this");
  console.log("  @apply   → extract repeated utilities into a named class");
  console.log("  safelist → include classes that are always dynamic");
  console.log("  theme()  → build-time value from config; CSS vars for runtime.\n");

  console.log("── SCSS ESSENTIALS ──────────────────────────────────────────────");
  console.log("  $var → build-time; --var → runtime");
  console.log("  @mixin / @include  → safe reusable blocks");
  console.log("  @extend            → avoid (output bloat)");
  console.log("  @use / @forward    → modern module system (replaces @import)");
  console.log("  Partials: _file.scss — won't compile standalone\n");

  console.log("── METHODOLOGY COMPARISON ───────────────────────────────────────");

  const methodologies = [
    { name: "BEM",         buildTool: "No",  runtime: "None",    bestFor: "Plain HTML, legacy, CSS libraries"     },
    { name: "CSS Modules", buildTool: "Yes", runtime: "None",    bestFor: "React/Vue, component-scoped CSS"        },
    { name: "Tailwind",    buildTool: "Yes", runtime: "None",    bestFor: "Rapid prototyping, design systems"      },
    { name: "CSS-in-JS",   buildTool: "Yes", runtime: "Yes",     bestFor: "Dynamic theming, MUI/Chakra ecosystems" },
    { name: "Linaria",     buildTool: "Yes", runtime: "None",    bestFor: "CSS-in-JS DX, zero runtime cost"        },
  ];

  console.log(
    "  " + "Method".padEnd(14) + "Build Tool".padEnd(12) + "Runtime".padEnd(10) + "Best For"
  );
  console.log("  " + "─".repeat(62));
  methodologies.forEach(m => {
    console.log(
      "  " +
      m.name.padEnd(14) +
      m.buildTool.padEnd(12) +
      m.runtime.padEnd(10) +
      m.bestFor
    );
  });

  console.log("\n── SPECIFICITY CHEAT SHEET ──────────────────────────────────────");
  console.log("  Inline style      1-0-0-0   (always wins, avoid)");
  console.log("  #id               0-1-0-0   (almost never in CSS)");
  console.log("  .class / :pseudo  0-0-1-0   (use this — classes only)");
  console.log("  element           0-0-0-1   (resets and base styles)");
  console.log("  !important        nuclear   (util classes + a11y only)\n");

  console.log("── TOKEN NAMING CONVENTION ──────────────────────────────────────");
  console.log("  --color-brand-primary   --spacing-4   --font-size-lg");
  console.log("  pattern: category-variant-scale\n");

  console.log("── MODERN CSS RESET (minimal) ───────────────────────────────────");
  console.log("  *, *::before, *::after { box-sizing: border-box; margin: 0; }");
  console.log("  img, video { max-width: 100%; display: block; }");
  console.log("  input, button, textarea, select { font: inherit; }\n");

  console.log("── SELF-ASSESSMENT ──────────────────────────────────────────────");
  selfAssessment.forEach((item, i) => {
    console.log(`\n  ${item.q}`);
    console.log(`  → ${item.a}`);
  });

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log(  "║  Score: 0-4 re-study | 5-7 progressing | 8-9 solid | 10 ✓ ║");
  console.log(  "╚══════════════════════════════════════════════════════════════╝\n");
}

runDemo();

// Suppress unused variable warnings — all const blocks are teaching examples
void q1BrokenCss;
void q1Answer;
void q2CssModuleFile;
void q2ReactComponent;
void q3TailwindButton;
void q4Safelist;
void q5BrokenCode;
void q5Fix;
void bemNaming;
void bemScss;
void cssModulesUsage;
void cssModulesReactUsage;
void styledComponentsExample;
void tailwindJit;
void tailwindApply;
void tailwindThemeVsCssVars;
void scssVariables;
void scssNesting;
void scssMixins;
void scssExtendWarning;
void scssModuleSystem;
void folderStructure;
void designTokens;
void modernReset;
