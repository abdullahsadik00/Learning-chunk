// ════════════════════════════════════════════════════════
// CSS 02: CSS VARIABLES · RESPONSIVE DESIGN · DARK MODE  (Day 27)
// Vite demo: cd basics/css-design && npm run dev
// ════════════════════════════════════════════════════════
//
// HOW TO USE THIS FILE
//  1. Read a section, understand the concept
//  2. Open the Vite demo — CSSVariablesDemo, BreakpointVisualizer,
//     DarkModeToggle, and ResponsiveCard are all running live
//  3. Hit the PRACTICE CHALLENGES at the bottom
//  4. Score yourself on the SELF-ASSESSMENT
//
// CSS is shown as template literal strings — your browser runs the real thing.

// ─────────────────────────────────────────────────────────
// 1. CSS CUSTOM PROPERTIES (VARIABLES)
// ─────────────────────────────────────────────────────────
//
// Analogy: CSS variables are like constants at the top of a file.
// Change the constant once, every place that uses it updates automatically.
// Without them you're doing find-and-replace across 400 lines every time
// the designer changes a brand color.
//
// When you'd actually use this in a real project:
//  - Color palettes (brand primary, secondary, neutrals, semantic colors)
//  - Spacing scales (4px, 8px, 16px, 24px, 32px — one source of truth)
//  - Transition durations so "fast" and "slow" mean the same thing everywhere
//  - Border radii and shadow presets
//  - Typography scale

const cssVariables = `
/* ── Define on :root — available to every element ── */
:root {
  /* Color palette */
  --color-primary:   #3b82f6;  /* blue-500 */
  --color-secondary: #8b5cf6;  /* violet-500 */
  --color-surface:   #ffffff;
  --color-text:      #1e293b;
  --color-muted:     #64748b;
  --color-border:    #e2e8f0;

  /* Spacing scale — multiples of 4px */
  --space-1: 0.25rem;  /* 4px  */
  --space-2: 0.5rem;   /* 8px  */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */

  /* Transition durations */
  --duration-fast:   150ms;
  --duration-base:   250ms;
  --duration-slow:   400ms;

  /* Border radius */
  --radius-sm:  4px;
  --radius-md:  8px;
  --radius-lg:  16px;
  --radius-full: 9999px;
}

/* ── Consuming variables ── */
.btn-primary {
  background: var(--color-primary);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  transition: opacity var(--duration-fast) ease;
}

/* ── Fallback: second argument to var() ── */
/* If --color-accent is undefined, it falls back to #f59e0b */
.badge {
  color: var(--color-accent, #f59e0b);
}

/* ── Scope: override in a child selector ── */
/* Variables cascade just like regular CSS properties. */
/* A child can shadow the parent's value for its own subtree. */
.danger-zone {
  --color-primary: #ef4444; /* red — only inside .danger-zone */
}
.danger-zone .btn-primary {
  background: var(--color-primary); /* picks up red, not blue */
}
`;

// JavaScript interop — read and write CSS variables from JS:
const jsVariableInterop = `
const root = document.documentElement;

// Write — triggers an immediate visual update
root.style.setProperty('--color-primary', '#ef4444');

// Read — returns the live computed value
const primary = getComputedStyle(root).getPropertyValue('--color-primary').trim();
console.log(primary); // '#ef4444'

// You can also target any element, not just :root
const card = document.querySelector('.card') as HTMLElement;
card.style.setProperty('--color-surface', '#1e293b');
`;

// ⚠️ GOTCHA: CSS variables are CASE-SENSITIVE.
// --Color-Primary and --color-primary are two different variables.
// Pick a convention (all-lowercase-kebab is standard) and stick to it.
// Also: variables don't work inside media query CONDITIONS —
// @media (min-width: var(--bp-md)) doesn't work. Only inside rule bodies.

// ─────────────────────────────────────────────────────────
// 2. RESPONSIVE DESIGN PHILOSOPHY
// ─────────────────────────────────────────────────────────
//
// Analogy: mobile-first is writing a short story before a novel.
// You force yourself to decide what's essential. Then you expand.
// Desktop-first is writing the novel and then cutting — much harder.
//
// When you'd actually use this in a real project:
//  - Every project. Responsive isn't a feature — it's the baseline.
//  - Mobile-first when building greenfield (cleaner media queries)
//  - Desktop-first when retrofitting an old desktop-only site

const responsivePhilosophy = `
/* ── Mobile-first: write base styles for mobile, then ADD complexity ── */
/* Progressive enhancement: start minimal, layer on features for larger screens */

.container {
  /* Mobile: single column, full width, small padding */
  padding: 1rem;
  width: 100%;
}

@media (min-width: 768px) {
  .container {
    /* Tablet: cap width, bigger padding */
    max-width: 960px;
    padding: 2rem;
    margin: 0 auto;
  }
}

@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
    padding: 3rem;
  }
}

/* ── Desktop-first (what NOT to do for new projects) ── */
/* You end up writing max-width queries and constantly undoing desktop styles */
.card-bad {
  display: grid;
  grid-template-columns: 1fr 1fr; /* start desktop */
}
@media (max-width: 767px) {
  .card-bad {
    display: block; /* undo everything — this gets messy fast */
  }
}

/* ── The viewport meta tag — without this, mobile browsers lie to you ── */
/* Put this in your <head>. Without it, mobile zooms out to fake a desktop. */
/* <meta name="viewport" content="width=device-width, initial-scale=1"> */

/* ── Viewport units ── */
.full-height-naive   { height: 100vh;  } /* WRONG on mobile — includes browser toolbar */
.full-height-safe    { height: 100svh; } /* small viewport height — excludes toolbar */
.full-height-dynamic { height: 100dvh; } /* updates as toolbar shows/hides */
.full-height-large   { height: 100lvh; } /* largest possible viewport (toolbar hidden) */

/* svh/dvh/lvh browser support: Chrome 108+, Safari 15.4+, Firefox 101+ */
/* Safe fallback: */
.hero {
  height: 100vh;         /* old browsers */
  height: 100svh;        /* modern — last declaration wins */
}
`;

// Content-first breakpoints:
// Don't pick breakpoints because "that's where iPhone ends."
// Pick them because YOUR content breaks at that width.
// Resize the browser slowly — when the layout looks awkward, THAT is your breakpoint.

// ⚠️ GOTCHA: 100vh on iOS Safari includes the address bar in its calculation.
// A "full-screen" hero section gets cut off at the bottom.
// Use 100svh instead. If you need to support Safari < 15.4, use a JS fallback:
// document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
// then use calc(var(--vh, 1vh) * 100) as your height.

// ─────────────────────────────────────────────────────────
// 3. MEDIA QUERIES
// ─────────────────────────────────────────────────────────
//
// Analogy: media queries are if/else conditions for CSS.
// "If the screen is at least 768px wide, do this instead."
//
// When you'd actually use this in a real project:
//  - Changing layout (1-column to 2-column to 3-column)
//  - Hiding/showing elements by screen size
//  - Adjusting font sizes, spacing, padding
//  - Disabling hover effects on touch devices
//  - Respecting user accessibility preferences (motion, color scheme)

const mediaQueries = `
/* ── Common breakpoints (mobile-first = min-width) ── */
/* sm:  480px  — large phones, landscape */
/* md:  768px  — tablets */
/* lg:  1024px — small laptops */
/* xl:  1280px — desktop */
/* 2xl: 1536px — wide desktop */

/* ── Width-based ── */
@media (min-width: 480px)  { /* sm: small phone → up */ }
@media (min-width: 768px)  { /* md: tablet → up      */ }
@media (min-width: 1024px) { /* lg: laptop → up      */ }
@media (min-width: 1280px) { /* xl: desktop → up     */ }

/* ── Orientation ── */
@media (orientation: portrait)  { /* phone held vertically   */ }
@media (orientation: landscape) { /* phone held horizontally */ }

/* ── Pointer and hover — critical for touch UX ── */
/* hover: hover — only devices with a REAL cursor (mouse/trackpad) */
/* Prevents sticky hover states on phones that can't "un-hover" */
@media (hover: hover) {
  .btn:hover {
    background: var(--color-primary-dark);
  }
}

/* pointer: coarse = finger (imprecise), pointer: fine = mouse */
@media (pointer: coarse) {
  .btn {
    min-height: 44px; /* Apple's minimum tap target — comfortable for fingers */
    min-width: 44px;
  }
}

/* ── Accessibility preferences ── */
@media (prefers-color-scheme: dark) {
  :root {
    --color-surface: #0f172a;
    --color-text:    #f1f5f9;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* ── Modern range syntax (Chrome 104+, Firefox 63+, Safari 16.4+) ── */
/* Old:    @media (min-width: 768px) and (max-width: 1023px) */
/* Modern: @media (768px <= width < 1024px) */
@media (768px <= width < 1024px) {
  /* tablet-only styles */
}
`;

// ⚠️ GOTCHA: media queries don't increase specificity.
// If you write @media (min-width: 768px) { .card { color: blue } }
// and later in the stylesheet (outside any query) .card { color: red },
// the red wins because it comes AFTER — even though the media query "matched."
// Order your CSS: base → sm → md → lg (mobile-first cascade).

// ─────────────────────────────────────────────────────────
// 4. FLUID TYPOGRAPHY AND SPACING
// ─────────────────────────────────────────────────────────
//
// Analogy: instead of snapping between sizes at breakpoints,
// clamp() is like a rubber band with hard stops.
// It stretches between a minimum and maximum, scaling smoothly in between.
//
// When you'd actually use this in a real project:
//  - Headings that look right at every width without multiple media queries
//  - Fluid padding/margin on hero sections and containers
//  - Section spacing that breathes on desktop but stays tight on mobile

const fluidTypography = `
/* ── clamp(min, preferred, max) — the most powerful CSS function ── */
/* preferred is usually a vw-based value that scales with viewport width */

h1 {
  /* 1.75rem on tiny phones, scales up, caps at 3.5rem on wide screens */
  font-size: clamp(1.75rem, 4vw, 3.5rem);
}

h2 {
  /* Adding a base (rem) to a viewport unit gives a nicer curve */
  /* 2.5vw + 1rem = scales with viewport but has a minimum baseline */
  font-size: clamp(1.25rem, 2.5vw + 1rem, 2.25rem);
}

body {
  /* Body text: 14px minimum, fluid, 18px maximum */
  font-size: clamp(0.875rem, 1vw + 0.5rem, 1.125rem);
}

/* ── Fluid spacing ── */
.section {
  /* Padding breathes on desktop, stays compact on mobile */
  padding-block: clamp(2rem, 8vw, 6rem);
}

.container {
  /* Gutters that grow with the screen */
  padding-inline: clamp(1rem, 5vw, 3rem);
}

/* ── calc() — mix any units ── */
.sidebar-layout {
  /* Main content = everything except the 280px sidebar and a 24px gap */
  width: calc(100% - 280px - 24px);
}

.card-grid {
  /* Column count that isn't possible with fr alone */
  grid-template-columns: repeat(auto-fill, minmax(calc(250px + 2vw), 1fr));
}

/* ── min() and max() — single-value clamp edges ── */
.image {
  /* Never wider than 800px, but shrinks with the container */
  width: min(800px, 100%);
}

.sidebar {
  /* At least 200px wide, up to 25% of container */
  width: max(200px, 25%);
}
`;

// ⚠️ GOTCHA: the "preferred" value in clamp() is computed at render time,
// not at a specific width. clamp(1rem, 2.5vw, 2rem) at 800px viewport gives
// 2.5 * 800 / 100 = 20px = 1.25rem — which is between min and max, so 1.25rem wins.
// Don't try to reverse-engineer exact pixel breakpoints — test in the browser.
// Also: clamp() preferred value MUST evaluate to a length — no unitless numbers.

// ─────────────────────────────────────────────────────────
// 5. CONTAINER QUERIES
// ─────────────────────────────────────────────────────────
//
// Analogy: media queries ask "how big is the window?"
// Container queries ask "how big is MY BOX?"
//
// Why this matters: a card component might live in a full-width
// hero section (wide), OR inside a 3-column sidebar (narrow).
// A media query would see the same viewport width and apply the
// same styles in both cases. Container queries let the card
// decide based on its OWN available space. Component-level responsiveness.
//
// When you'd actually use this in a real project:
//  - Card components that appear in both grid layouts and sidebars
//  - Navigation components used in different page regions
//  - Any reusable component that doesn't know where it'll be placed

const containerQueries = `
/* ── Step 1: declare the container on the PARENT ── */
.card-wrapper {
  container-type: inline-size; /* only watches width (most common) */
  /* container-type: size — watches both width AND height */
}

/* ── Step 2: query the container from CHILDREN ── */
@container (min-width: 400px) {
  /* When .card-wrapper is at least 400px wide, show horizontal layout */
  .card {
    display: flex;
    flex-direction: row;
    gap: 1rem;
  }
  .card__image {
    flex: 0 0 200px;
  }
}

/* Below 400px — the default (no query needed): vertical stack */
.card {
  display: grid;
}

/* ── Named containers — for nested container scenarios ── */
.product-grid {
  container-type: inline-size;
  container-name: product-grid;
}

.sidebar {
  container-type: inline-size;
  container-name: sidebar;
}

/* Target a specific container by name */
@container product-grid (min-width: 600px) {
  .product-card { grid-template-columns: 1fr 1fr; }
}

@container sidebar (min-width: 250px) {
  .product-card { grid-template-columns: 1fr; }
}

/* ── Container query units (cqw, cqh, cqi, cqb) ── */
/* cqw = 1% of container width — like vw but container-relative */
.card__title {
  font-size: clamp(1rem, 4cqw, 1.5rem);
}
`;

// ⚠️ GOTCHA: container queries are relative to the nearest NAMED or TYPED ancestor.
// If you nest containers, the inner query targets the inner container — not the outer one.
// Also: an element CANNOT query its own size — the container-type must be on the PARENT.
// Trying to put container-type and @container rules on the same element doesn't work.
// Browser support: Chrome 105+, Safari 16+, Firefox 110+ — safe for production now.

// ─────────────────────────────────────────────────────────
// 6. DARK MODE
// ─────────────────────────────────────────────────────────
//
// Analogy: dark mode is just a variable swap. You define a color palette once.
// Then you maintain TWO sets of variable values — light and dark.
// The component code itself never changes.
//
// When you'd actually use this in a real project:
//  - Every serious app in 2024 should support dark mode
//  - The CSS variable approach gives you manual toggle + OS sync for free
//  - localStorage persistence so the preference survives page reload

const darkMode = `
/* ── Approach 1: OS-only (no manual toggle) ── */
/* Reads prefers-color-scheme from the operating system */
:root {
  --bg:   #ffffff;
  --text: #1e293b;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg:   #0f172a;
    --text: #f1f5f9;
  }
}

/* ── Approach 2: CSS variable swap with data-theme (recommended) ── */
/* Define light defaults on :root, dark overrides on [data-theme="dark"] */
/* This allows BOTH OS detection AND a manual toggle */

:root {
  --color-bg:      #ffffff;
  --color-surface: #f8fafc;
  --color-text:    #1e293b;
  --color-muted:   #64748b;
  --color-border:  #e2e8f0;
  --color-primary: #3b82f6;
}

[data-theme="dark"] {
  --color-bg:      #0f172a;
  --color-surface: #1e293b;
  --color-text:    #f1f5f9;
  --color-muted:   #94a3b8;
  --color-border:  #334155;
  --color-primary: #60a5fa;  /* lighter blue for dark bg contrast */
}

/* All components just use the variables — they never mention light or dark */
body {
  background: var(--color-bg);
  color: var(--color-text);
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

/* ── color-scheme property — tells the BROWSER's native UI to adapt ── */
/* Scrollbars, form inputs, browser chrome all switch to dark appearance */
:root {
  color-scheme: light dark;
}
[data-theme="dark"] {
  color-scheme: dark;
}
`;

// JavaScript toggle with localStorage persistence:
const darkModeToggleJs = `
const STORAGE_KEY = 'theme';
const root = document.documentElement;

function getStoredTheme(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

function getSystemTheme(): 'dark' | 'light' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: 'dark' | 'light'): void {
  root.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

function toggleTheme(): void {
  const current = root.getAttribute('data-theme') ?? getSystemTheme();
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

// On page load: use stored preference, fall back to OS setting
const initial = (getStoredTheme() ?? getSystemTheme()) as 'dark' | 'light';
applyTheme(initial);

// Listen for OS theme changes (user switches system theme while page is open)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!getStoredTheme()) {
    // Only follow OS if user hasn't manually overridden
    applyTheme(e.matches ? 'dark' : 'light');
  }
});
`;

// ⚠️ GOTCHA: prefers-color-scheme respects the OS setting.
// If you use ONLY the media query approach, you have no way to let users override.
// A manual dark mode toggle MUST use data-theme (or a class) on the root element —
// JavaScript cannot change what the OS reports to the media query.
// Also watch out for flash of wrong theme (FWOT): if you apply the theme
// in a React useEffect, there's a brief flash of light mode on dark-mode users.
// Fix: put a blocking <script> in <head> that reads localStorage and sets
// data-theme BEFORE the page renders.

// ─────────────────────────────────────────────────────────
// 7. RESPONSIVE IMAGES AND MEDIA
// ─────────────────────────────────────────────────────────
//
// Analogy: unoptimized images are like shipping a 40-inch TV in a
// padded envelope. You're sending way more data than the container can use.
//
// When you'd actually use this in a real project:
//  - Hero images, product photos, blog post covers
//  - Any image that needs to fill its container without distortion
//  - Performance-conscious projects (Core Web Vitals / LCP)

const responsiveImages = `
/* ── The universal image rule — always write this ── */
img, video, svg {
  max-width: 100%;  /* never overflow the container */
  height: auto;     /* maintain aspect ratio */
  display: block;   /* eliminate mystery bottom gap (images are inline by default) */
}

/* ── aspect-ratio — reserves space before the image loads ── */
/* Prevents Cumulative Layout Shift (CLS) — a Core Web Vitals metric */
.card__image {
  aspect-ratio: 16 / 9;
  width: 100%;
  overflow: hidden;
}

.avatar {
  aspect-ratio: 1;  /* 1:1 square */
  width: 48px;
}

/* ── object-fit — controls how image content fills its box ── */
/* Think: background-size but for <img> elements */
.card__img {
  width: 100%;
  height: 200px;
  object-fit: cover;    /* fills box, CROPS to fit (no distortion) */
}
/* object-fit: contain  — fits entirely inside box, letterboxed */
/* object-fit: fill     — stretches to fill (DISTORTS) — almost never right */
/* object-fit: none     — original size, clipped */

/* object-position: where to anchor the crop */
.card__img {
  object-fit: cover;
  object-position: center top; /* keep faces in frame, not feet */
}

/* ── picture element — art direction by screen size ── */
/*
<picture>
  <source media="(min-width: 1024px)" srcset="hero-desktop.webp">
  <source media="(min-width: 768px)"  srcset="hero-tablet.webp">
  <img src="hero-mobile.webp" alt="Hero image"
       width="800" height="600">  ← ALWAYS include width + height
</picture>
*/

/* ── srcset + sizes — same image, different resolutions ── */
/*
<img
  src="photo-800.jpg"
  srcset="photo-400.jpg 400w, photo-800.jpg 800w, photo-1600.jpg 1600w"
  sizes="(min-width: 1024px) 800px, (min-width: 768px) 50vw, 100vw"
  alt="..."
  width="800"
  height="600"
  loading="lazy"
>
*/
/* The browser picks the most appropriate file. No JS needed. */
`;

// ⚠️ GOTCHA: always include width and height HTML attributes on <img>.
// Without them, the browser doesn't know the image dimensions until it downloads
// the file, causing layout shift as content jumps around.
// With them, the browser reserves exactly the right space before the image arrives.
// This is one of the most impactful CLS fixes — zero effort, big gain.
// Also: loading="lazy" defers offscreen images — use it everywhere except above-the-fold.

// ─────────────────────────────────────────────────────────
// 8. ANIMATIONS AND MOTION
// ─────────────────────────────────────────────────────────
//
// Analogy: transitions are for state changes (hover, active, open/closed).
// Animations are for things that run on their own (loading spinner, entrance).
// Use transform — never animate width/height/top/left for performance.
//
// When you'd actually use this in a real project:
//  - Button hover states, focus rings, dropdown reveals
//  - Loading spinners, skeleton screens
//  - Page transitions, modal entrances, toast notifications
//  - Animated icons (hamburger → X, chevron rotation)

const animations = `
/* ── transition: what to animate when a property changes ── */
/* Syntax: property duration easing delay */
.btn {
  background: var(--color-primary);
  transform: translateY(0);
  box-shadow: none;

  /* Animate background AND transform when they change */
  transition:
    background-color var(--duration-fast, 150ms) ease,
    transform        var(--duration-fast, 150ms) ease,
    box-shadow       var(--duration-fast, 150ms) ease;
}

.btn:hover {
  background: #2563eb;
  transform: translateY(-2px);      /* lifts up — GPU-accelerated */
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* ── animation: runs on its own (keyframe-driven) ── */
/* Syntax: name duration easing iteration fill-mode */
.spinner {
  animation: spin 800ms linear infinite;
}

/* ── @keyframes ── */
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

/* ── fill-mode: what state to hold before/after the animation ── */
.toast {
  animation: fadeIn 300ms ease forwards;
  /* forwards: element keeps the final keyframe state after animation ends */
  /* without it, the element snaps back to pre-animation state */
}

/* ── CSS easing functions ── */
/* ease           — starts fast, slows down (default, natural feel) */
/* ease-in        — starts slow, ends fast (entering feels mechanical) */
/* ease-out       — starts fast, ends slow (best for EXIT animations) */
/* ease-in-out    — slow-fast-slow (polished, good for state toggles)  */
/* linear         — constant speed (spinners, progress bars)           */
/* cubic-bezier   — custom curve: cubic-bezier(0.34, 1.56, 0.64, 1)   */
/* steps(n)       — snaps through n frames (sprite animations, digits) */

/* ── transform properties — GPU-accelerated, NO layout reflow ── */
/* Safe to animate: transform (translate/scale/rotate/skew), opacity  */
/* NEVER animate: width, height, top, left, margin, padding           */
/* (Those trigger reflow = the browser recalculates ALL layout)       */
.card {
  transition: transform 250ms ease, opacity 250ms ease;
}
.card:hover {
  transform: scale(1.02); /* NOT: width: 102% */
}

/* ── prefers-reduced-motion — non-negotiable accessibility ── */
/* Some users get motion sickness or have vestibular disorders. */
/* ALWAYS wrap decorative animations in this media query. */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Better pattern: design for reduced-motion first, add motion for the rest */
.animated-card {
  /* Default: no animation — safe for everyone */
  transition: none;
}

@media (prefers-reduced-motion: no-preference) {
  .animated-card {
    /* Only people who haven't said "please no motion" get the animation */
    transition: transform 250ms ease, box-shadow 250ms ease;
  }
  .animated-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }
}
`;

// ⚠️ GOTCHA: animating width/height causes REFLOW — the most expensive
// browser operation. The browser must recalculate position of EVERY affected
// element on the page for every frame. On complex pages this tanks to 15fps.
// Instead: animate transform: scale() for size changes, transform: translate()
// for position. The GPU handles these in its own compositing layer — no reflow.
// Exception: animating opacity is also GPU-composited and safe to animate.

// ═══════════════════════════════════════════════════════════
// PRACTICE CHALLENGES
// ═══════════════════════════════════════════════════════════

const challenge1_ColorThemeSystem = `
/*
  Q1: Build a color theme system using CSS variables — light/dark switchable
  Requirement: works with both OS preference AND a manual toggle button
*/

/* ── CSS ── */
:root {
  --bg:           #ffffff;
  --surface:      #f1f5f9;
  --text-primary: #1e293b;
  --text-muted:   #64748b;
  --border:       #e2e8f0;
  --accent:       #3b82f6;
  --accent-hover: #2563eb;

  color-scheme: light dark;
}

[data-theme="dark"] {
  --bg:           #0f172a;
  --surface:      #1e293b;
  --text-primary: #f1f5f9;
  --text-muted:   #94a3b8;
  --border:       #334155;
  --accent:       #60a5fa;
  --accent-hover: #93c5fd;

  color-scheme: dark;
}

/* All components use variables — zero duplication */
body    { background: var(--bg);      color: var(--text-primary); }
.card   { background: var(--surface); border: 1px solid var(--border); }
.btn    { background: var(--accent);  }
.btn:hover { background: var(--accent-hover); }
`;

// JS for the toggle button:
const challenge1JS = `
// Detect stored or OS preference
const stored = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const initial = stored ?? (prefersDark ? 'dark' : 'light');
document.documentElement.setAttribute('data-theme', initial);

// Toggle button handler
document.querySelector('#theme-toggle')?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') ?? 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});
`;

const challenge2_FluidFontSize = `
/*
  Q2: Font size that's 14px on mobile, scales up to 18px at 1280px using clamp()

  At 320px viewport:  font-size should be ~14px (0.875rem)
  At 1280px viewport: font-size should be ~18px (1.125rem)

  Solving for the slope:
    range: 1280 - 320 = 960px viewport range
    size delta: 18 - 14 = 4px
    slope: 4 / 960 = 0.00417 → ~0.417vw

  Solving for the intercept (y = mx + b):
    14 = 0.417 * 32 + b  (at 320px)
    14 = 13.33 + b
    b ≈ 0.67px → we use rem so ÷ 16 ≈ 0.042rem

  Simpler approximation that reads well:
*/

body {
  font-size: clamp(0.875rem, 0.42vw + 0.73rem, 1.125rem);
}

/*
  Verify: at 320px viewport → 0.42 * 3.2 + 0.73 = 1.344 + 0.73 = ~14px ✓
          at 1280px         → 0.42 * 12.8 + 0.73 = 5.376 + 0.73 = ~18px ✓
          below 320px → clamped to 0.875rem = 14px ✓
          above 1280px → clamped to 1.125rem = 18px ✓
*/
`;

const challenge3_ContainerQuery = `
/*
  Q3: A card component that changes layout when it's in a narrow vs wide column

  Wide container (≥ 480px): horizontal — image left, text right
  Narrow container (< 480px): vertical — image on top, text below
*/

/* Parent containers */
.wide-column  { container-type: inline-size; width: 100%; }
.narrow-column { container-type: inline-size; width: 280px; }

/* Card: vertical by default (mobile-first) */
.product-card {
  display: grid;
  grid-template-rows: auto 1fr;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border, #e2e8f0);
}

.product-card__image {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

.product-card__body {
  padding: 1rem;
}

/* When the card's CONTAINER is at least 480px → horizontal layout */
@container (min-width: 480px) {
  .product-card {
    grid-template-rows: none;
    grid-template-columns: 200px 1fr;
  }

  .product-card__image {
    aspect-ratio: 1;     /* square thumbnail in horizontal layout */
    height: 100%;
  }
}
`;

const challenge4_HeroHeight = `
/*
  Q4: A hero section with full viewport height that works on mobile
      (no content hidden behind browser toolbar)
*/

.hero {
  /* Fallback for browsers that don't support svh */
  height: 100vh;
  /* Correct value: small viewport height excludes the browser toolbar */
  height: 100svh;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: clamp(1rem, 5vw, 3rem);

  background: var(--bg);
  color: var(--text-primary);
}

/* If you need to support Safari < 15.4, add this JS workaround too: */
/*
  const setVh = () => {
    document.documentElement.style.setProperty(
      '--vh', \`\${window.innerHeight * 0.01}px\`
    );
  };
  setVh();
  window.addEventListener('resize', setVh);

  Then in CSS: height: calc(var(--vh, 1vh) * 100);
*/
`;

const challenge5_AnimatedButton = `
/*
  Q5: An animated button that respects prefers-reduced-motion

  Strategy: no animation by default — add animation only when user hasn't
  opted out. Safer than animating everything and then removing it.
*/

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: var(--accent, #3b82f6);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;

  /* Safe baseline: instant state changes, no animation */
  transition: none;
}

/* Only users who haven't said "I prefer no motion" get the animation */
@media (prefers-reduced-motion: no-preference) {
  .btn {
    transition:
      transform        200ms cubic-bezier(0.34, 1.56, 0.64, 1),
      background-color 150ms ease,
      box-shadow       150ms ease;
  }

  .btn:hover {
    transform: translateY(-2px) scale(1.02);
    background: var(--accent-hover, #2563eb);
    box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
  }

  .btn:active {
    transform: translateY(0) scale(0.98);
    transition-duration: 80ms; /* snappy on click */
  }
}

/* Focus ring — always visible, not hidden behind motion preferences */
.btn:focus-visible {
  outline: 2px solid var(--accent, #3b82f6);
  outline-offset: 3px;
}
`;

// ═══════════════════════════════════════════════════════════
// SELF-ASSESSMENT  (10 questions)
// ═══════════════════════════════════════════════════════════
//
// Score yourself after working through the sections.
// 0–3:  Re-read the sections and redo the demos.
// 4–6:  Solid start. Re-do the practice challenges.
// 7–8:  Good. Build the demo app without looking at this file.
// 9–10: Ready to move on.

const selfAssessment = [
  {
    q: "Q1. What's wrong with this CSS? "
      + "`--Color-Brand: #3b82f6;` then `color: var(--color-brand);`",
    a: "Nothing renders the variable — CSS variables are case-sensitive. "
      + "`--Color-Brand` ≠ `--color-brand`. The color will be empty (or fall back to initial).",
  },
  {
    q: "Q2. You write `height: 100vh` on a hero section. "
      + "On iOS Safari, the bottom of the section is cut off. Why?",
    a: "100vh on iOS includes the address bar in its calculation, "
      + "so the hero is taller than the visible area. Fix: use `height: 100svh` "
      + "(small viewport height, which excludes the browser chrome).",
  },
  {
    q: "Q3. You have a media query `@media (min-width: 768px) { .card { color: blue } }` "
      + "and later in the file `.card { color: red }`. On a 1024px screen, "
      + "which color wins and why?",
    a: "Red wins. Media queries don't increase specificity — they just gate the rule. "
      + "Both selectors have the same specificity, so cascade order decides: "
      + "the later `.card { color: red }` overrides the media query rule. "
      + "Always write breakpoints in ascending order (mobile-first) to avoid this.",
  },
  {
    q: "Q4. Write a clamp() expression for a font size that is 16px at 375px viewport "
      + "and 24px at 1440px viewport.",
    a: "clamp(1rem, 0.75vw + 0.72rem, 1.5rem)\n"
      + "Check: at 375px → 0.75*3.75 + 0.72*16 ≈ 14px — min clamp applies, 16px ✓\n"
      + "       at 1440px → 0.75*14.4 + 11.52 ≈ 22.3px — near max, ✓\n"
      + "Tip: use https://clamp.font-size.app for exact values.",
  },
  {
    q: "Q5. What's the difference between `@media (prefers-color-scheme: dark)` "
      + "and `[data-theme='dark']`? When would you use each?",
    a: "prefers-color-scheme reads the OS setting — you can't override it with JS. "
      + "[data-theme='dark'] is set by JavaScript and lets users manually toggle. "
      + "Best practice: use both. Set variables in [data-theme] so JS can toggle, "
      + "and also detect prefers-color-scheme in JS to set the initial data-theme value.",
  },
  {
    q: "Q6. Why do container queries require `container-type` on the PARENT "
      + "rather than the element itself?",
    a: "An element's own size is determined by its content and container. "
      + "If the element could query itself, you'd have a circular dependency: "
      + "the size depends on the styles, the styles depend on the size. "
      + "Putting container-type on the parent breaks the cycle.",
  },
  {
    q: "Q7. Animating `width: 100px → 200px` vs `transform: scaleX(2)` — "
      + "which is faster and why?",
    a: "transform: scaleX(2) is faster. Width changes trigger REFLOW — the browser "
      + "must recalculate layout for every affected element on every frame. "
      + "Transform is handled by the GPU compositor — no layout recalculation, "
      + "no reflow, smooth 60fps even on complex pages.",
  },
  {
    q: "Q8. You build a responsive card that shows a 2-column layout when "
      + "the screen is wider than 768px. Then you put the card in a 300px sidebar "
      + "on a 1200px screen. The card shows the 2-column layout. "
      + "How do you fix this?",
    a: "Switch from a media query to a container query. "
      + "Set `container-type: inline-size` on the sidebar/card wrapper. "
      + "Then use `@container (min-width: 400px)` instead of "
      + "`@media (min-width: 768px)`. Now the layout responds to the CARD's "
      + "available space, not the viewport width.",
  },
  {
    q: "Q9. What does `color-scheme: light dark` do and why would you set it?",
    a: "It tells the browser that your page supports both light and dark modes. "
      + "The browser then applies its own dark styles to native UI elements "
      + "(scrollbars, form inputs, select dropdowns, checkboxes) matching the "
      + "OS preference. Without it, you get a dark background but bright-white "
      + "native form controls — jarring contrast.",
  },
  {
    q: "Q10. A user reports your hero animation is making them dizzy. "
      + "What's the correct CSS pattern to handle this?",
    a: "Wrap all decorative animations in `@media (prefers-reduced-motion: no-preference)` "
      + "so they only run for users who haven't opted out. The safer pattern is "
      + "no animation by default, add it for no-preference — rather than animating "
      + "everything and stripping it for `prefers-reduced-motion: reduce`. "
      + "This ensures accessibility even in old browsers that don't support the query.",
  },
];

// ═══════════════════════════════════════════════════════════
// REFERENCE CARD
// ═══════════════════════════════════════════════════════════

function runDemo(): void {
  const line = (label: string, value: string) =>
    `  ${label.padEnd(28)} ${value}`;

  const sections = [
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    " CSS 02 — Variables · Responsive · Dark Mode  (Day 27)",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    "  ── CSS Variables ────────────────────────────────────",
    line("Define",   "--name: value  on :root or any selector"),
    line("Use",      "var(--name, fallback)"),
    line("JS write", "el.style.setProperty('--name', 'val')"),
    line("JS read",  "getComputedStyle(el).getPropertyValue('--name')"),
    line("Gotcha",   "case-sensitive: --Color ≠ --color"),
    "",
    "  ── Responsive Philosophy ────────────────────────────",
    line("Approach",  "Mobile-first (min-width queries)"),
    line("Full height","height: 100svh  (not 100vh on mobile)"),
    line("Breakpoints","480 / 768 / 1024 / 1280 / 1536"),
    line("Gotcha",    "100vh includes iOS toolbar — use 100svh"),
    "",
    "  ── Media Queries ─────────────────────────────────────",
    line("Layout",   "@media (min-width: 768px)"),
    line("Hover",    "@media (hover: hover)"),
    line("Motion",   "@media (prefers-reduced-motion: reduce)"),
    line("Dark OS",  "@media (prefers-color-scheme: dark)"),
    line("Gotcha",   "no specificity boost — order matters"),
    "",
    "  ── Fluid Typography ──────────────────────────────────",
    line("clamp",    "clamp(min, preferred, max)"),
    line("Example",  "clamp(1rem, 2.5vw + 1rem, 2rem)"),
    line("calc",     "calc(100% - 280px - 24px)"),
    line("min/max",  "min(800px, 100%)  /  max(200px, 25%)"),
    line("Gotcha",   "preferred is computed, not at a fixed px"),
    "",
    "  ── Container Queries ─────────────────────────────────",
    line("Setup",    "container-type: inline-size  on parent"),
    line("Query",    "@container (min-width: 400px) { }"),
    line("Named",    "container-name: card  → @container card"),
    line("Units",    "cqw / cqh (like vw/vh but container-relative)"),
    line("Gotcha",   "element can't query itself — needs parent"),
    "",
    "  ── Dark Mode ──────────────────────────────────────────",
    line("CSS vars",  "[data-theme='dark'] { --bg: #0f172a }"),
    line("JS toggle", "root.setAttribute('data-theme', 'dark')"),
    line("Persist",   "localStorage.setItem('theme', 'dark')"),
    line("Native UI", "color-scheme: light dark"),
    line("Gotcha",    "media query can't be overridden by JS"),
    "",
    "  ── Images ────────────────────────────────────────────",
    line("Universal", "max-width: 100%; height: auto"),
    line("No shift",  "aspect-ratio: 16/9 on wrapper"),
    line("Crop fit",  "object-fit: cover"),
    line("Attr",      "<img width='800' height='600'> — always!"),
    line("Gotcha",    "missing width/height → layout shift (CLS)"),
    "",
    "  ── Animations ────────────────────────────────────────",
    line("Transition","property duration easing delay"),
    line("Animation", "name duration easing iteration fill-mode"),
    line("GPU-safe",  "transform / opacity only"),
    line("Reflow",    "never animate width/height/top/left"),
    line("A11y",      "@media (prefers-reduced-motion: no-preference)"),
    line("Gotcha",    "animate transform:scale, NOT width"),
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "  Demo: cd basics/css-design && npm run dev",
    "  Files: src/day27-responsive/",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
  ];

  console.log(sections.join("\n"));

  console.log("\n  SELF-ASSESSMENT ANSWERS\n");
  selfAssessment.forEach(({ q, a }, i) => {
    console.log(`  ${i + 1}. ${q}`);
    console.log(`     → ${a}\n`);
  });
}

runDemo();

// Export so ts-node can verify types without a side-effect import
export {
  cssVariables,
  jsVariableInterop,
  responsivePhilosophy,
  mediaQueries,
  fluidTypography,
  containerQueries,
  darkMode,
  darkModeToggleJs,
  responsiveImages,
  animations,
  challenge1_ColorThemeSystem,
  challenge1JS,
  challenge2_FluidFontSize,
  challenge3_ContainerQuery,
  challenge4_HeroHeight,
  challenge5_AnimatedButton,
  selfAssessment,
};
