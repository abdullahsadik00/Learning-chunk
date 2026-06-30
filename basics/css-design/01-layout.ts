// ════════════════════════════════════════════════════════
// CSS 01: LAYOUT — BOX MODEL · FLEXBOX · GRID  (Day 26)
// Vite demo: cd basics/css-design && npm run dev
// ════════════════════════════════════════════════════════
//
// HOW TO USE THIS FILE
//  1. Read a section, understand the concept
//  2. Open the Vite demo — the interactive playgrounds make it click
//  3. Hit the PRACTICE CHALLENGES at the bottom
//  4. Score yourself on the SELF-ASSESSMENT
//
// This file shows CSS as string literals — your browser runs the real thing.

// ─────────────────────────────────────────────────────────
// 1. BOX MODEL
// ─────────────────────────────────────────────────────────
//
// Every element is wrapped like an Amazon package:
//
//   ┌─────────────────────────────┐
//   │  MARGIN  (space on the shelf) │
//   │  ┌───────────────────────┐  │
//   │  │  BORDER  (cardboard)  │  │
//   │  │  ┌─────────────────┐  │  │
//   │  │  │ PADDING (bubble  │  │  │
//   │  │  │   wrap)         │  │  │
//   │  │  │  ┌───────────┐  │  │  │
//   │  │  │  │  CONTENT  │  │  │  │
//   │  │  │  └───────────┘  │  │  │
//   │  │  └─────────────────┘  │  │
//   │  └───────────────────────┘  │
//   └─────────────────────────────┘
//
// Use when: literally every element — you can't avoid the box model

const boxModel = `
/* ── The basics ── */
.card {
  width: 300px;
  padding: 16px;       /* inner breathing room */
  border: 2px solid #e2e8f0;
  margin: 24px;        /* outer spacing from siblings */
}

/* ── box-sizing: border-box — set this GLOBALLY, always ── */
/* Without it: width = content only. Padding + border get added ON TOP.
   A 300px box with 16px padding becomes 332px wide. Nightmare. */
/* With border-box: width INCLUDES padding + border. 300px stays 300px. */

*, *::before, *::after {
  box-sizing: border-box; /* paste this in every project, forever */
}

/* ── Margin collapse — the rule nobody tells you ── */
/* Two vertical margins between sibling blocks don't ADD — the BIGGER one wins */
.section-a { margin-bottom: 32px; }
.section-b { margin-top: 16px; }
/* Space between them = 32px (not 48px) */

/* ── Horizontal centering a block element ── */
.centered {
  width: 800px;
  margin: 0 auto; /* splits leftover space equally left and right */
}

/* ── outline vs border ── */
/* border: affects layout (adds to box size unless border-box)
   outline: purely visual, zero layout impact — great for focus rings */
button:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px; /* gap between element edge and outline */
}
`;

// ⚠️ GOTCHA: margin: auto only horizontally centers BLOCK elements.
// It does nothing for inline elements, and vertical auto margin is
// ignored by normal flow (flexbox is the exception).

// ─────────────────────────────────────────────────────────
// 2. DISPLAY VALUES
// ─────────────────────────────────────────────────────────
//
// Use when: controlling how an element participates in layout

const displayValues = `
/* block — takes full width, stacks vertically, respects all margin/padding */
/* When: divs, sections, headings, paragraphs */
.full-width-banner { display: block; }

/* inline — flows with text, width/height ignored, top/bottom margin ignored */
/* When: <span>, <a>, <strong> inside a sentence */
.text-highlight { display: inline; }

/* inline-block — flows with text BUT respects width, height, all margin */
/* When: buttons, badges, small pill elements that sit inside text */
.badge {
  display: inline-block;
  padding: 2px 8px;
  width: 60px; /* works! unlike pure inline */
}

/* none — element removed from layout entirely, screen readers skip it */
/* visibility: hidden — element invisible but still takes up space */
.hidden    { display: none; }       /* gone — no space */
.invisible { visibility: hidden; }  /* there — still occupies space */

/* contents — element itself generates no box, children render as if unwrapped */
/* When: stripping a wrapper div from flex/grid context without touching HTML */
.layout-passthrough { display: contents; }
`;

// ⚠️ GOTCHA: inline elements ignore top/bottom margin and padding.
// Adding margin-top to a <span> does nothing. Switch to inline-block
// if you need vertical spacing control.

// ─────────────────────────────────────────────────────────
// 3. POSITION
// ─────────────────────────────────────────────────────────
//
// Use when: you need to pull an element out of normal flow
//           or layer things on top of each other

const positioning = `
/* static — default, no offset properties apply, not a positioned ancestor */
.normal { position: static; }

/* relative — stays in normal flow, offsets from WHERE IT WOULD BE */
/* When: nudging something a few pixels, creating a positioned ancestor for children */
.nudged {
  position: relative;
  top: 4px; /* 4px DOWN from its normal spot */
}

/* absolute — removed from flow, positioned relative to nearest positioned ancestor */
/* If no ancestor is positioned, it crawls all the way up to <html> */
/* When: tooltips, dropdowns, badges over icons, overlays inside a card */
.parent-card  { position: relative; } /* anchor for the badge */
.corner-badge {
  position: absolute;
  top: 8px;
  right: 8px;
}

/* fixed — removed from flow, stays fixed relative to the VIEWPORT */
/* When: sticky navbars, floating action buttons, cookie banners */
.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

/* sticky — hybrid: acts like relative until threshold, then like fixed */
/* When: table headers, section headings that stick while scrolling */
.sidebar-header {
  position: sticky;
  top: 0; /* sticks when it would scroll past this edge */
}

/* z-index — controls stacking order among positioned elements */
/* Higher number = on top. Only works when position != static */
.modal    { position: fixed; z-index: 200; }
.dropdown { position: absolute; z-index: 150; }
.nav      { position: fixed; z-index: 100; }

/* Stacking context — created by transforms, opacity < 1, filters, etc. */
/* Elements inside a stacking context can't escape it with z-index */
.transformed {
  transform: translateZ(0); /* now creates its own stacking context */
}
`;

// ⚠️ GOTCHA: absolute positioning anchors to the nearest POSITIONED ancestor
// — not the nearest parent. If the parent has position: static (default),
// CSS keeps looking up the tree. Always add position: relative to the
// intended parent or your tooltip ends up in a completely different spot.

// ─────────────────────────────────────────────────────────
// 4. FLEXBOX
// ─────────────────────────────────────────────────────────
//
// Think: items arranged along a single conveyor belt (row or column)
// Use when: navbars, card rows, centering, distributing space in one direction

const flexbox = `
/* ── Container properties — go on the PARENT ── */
.flex-container {
  display: flex;

  flex-direction: row;          /* row | row-reverse | column | column-reverse */
  justify-content: space-between; /* main axis: start | end | center | space-between | space-around | space-evenly */
  align-items: center;          /* cross axis: stretch | start | end | center | baseline */
  align-content: flex-start;    /* multiple lines: only matters when flex-wrap is wrap */
  flex-wrap: wrap;              /* nowrap | wrap | wrap-reverse */
  gap: 16px;                    /* space between items (row-gap / column-gap) */
}

/* ── Item properties — go on the CHILDREN ── */
.flex-item {
  flex-grow: 1;    /* how much it expands to fill space (0 = don't grow) */
  flex-shrink: 1;  /* how much it shrinks when space is tight (0 = don't shrink) */
  flex-basis: 0%;  /* starting size before grow/shrink kicks in */

  /* shorthand: flex: grow shrink basis */
  flex: 1;         /* same as flex: 1 1 0% — "take an equal share of available space" */
  flex: 0 0 200px; /* rigid — always exactly 200px */
  flex: none;      /* same as flex: 0 0 auto — sized by content, won't flex */

  align-self: flex-end; /* overrides align-items just for this item */
  order: 2;             /* reorder visually without touching HTML (default: 0) */
}

/* ── Pattern: Center anything in the viewport ── */
.fullscreen-center {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

/* ── Pattern: Equal columns ── */
.equal-cols > * {
  flex: 1; /* every child gets an equal share */
}

/* ── Pattern: Push last item to the end ── */
.nav {
  display: flex;
  align-items: center;
  gap: 16px;
}
.nav .spacer { flex: 1; } /* or: .nav .logout { margin-left: auto; } */
`;

// ⚠️ GOTCHA: justify-content operates along the MAIN AXIS — and the main axis
// changes with flex-direction. With flex-direction: column, justify-content
// aligns vertically and align-items aligns horizontally — the opposite of row.

// ─────────────────────────────────────────────────────────
// 5. CSS GRID
// ─────────────────────────────────────────────────────────
//
// Think: a spreadsheet — define rows AND columns, place items in cells
// Use when: page layouts, image galleries, anything 2-dimensional

const cssGrid = `
/* ── Defining the grid ── */
.grid-container {
  display: grid;

  /* fr = fractional unit: split REMAINING space proportionally */
  grid-template-columns: 1fr 1fr 1fr;      /* 3 equal columns */
  grid-template-columns: repeat(3, 1fr);   /* same, shorthand */
  grid-template-columns: 200px 1fr 1fr;    /* fixed sidebar, two flexible columns */

  /* minmax(min, max) — column can flex between two sizes */
  grid-template-columns: repeat(3, minmax(200px, 1fr));

  grid-template-rows: auto 1fr auto; /* header auto, main grows, footer auto */
  gap: 24px;                         /* gap between all rows and columns */
  row-gap: 16px;
  column-gap: 24px;
}

/* ── Placing items manually ── */
.hero {
  grid-column: 1 / 3;  /* spans from line 1 to line 3 (two columns wide) */
  grid-row: 1 / 2;
}
.sidebar {
  grid-column: 3 / 4;   /* or: grid-column: 3; (one column) */
  grid-row: 1 / 3;      /* spans two rows */
}
.span-full {
  grid-column: 1 / -1; /* -1 means "the last line" — full width shortcut */
}

/* ── Named grid areas — ASCII art layout ── */
.page {
  display: grid;
  grid-template-areas:
    "header  header  header"
    "sidebar main    main  "
    "footer  footer  footer";
  grid-template-columns: 240px 1fr 1fr;
  grid-template-rows: 60px 1fr 48px;
}
.page-header  { grid-area: header; }
.page-sidebar { grid-area: sidebar; }
.page-main    { grid-area: main; }
.page-footer  { grid-area: footer; }

/* ── Auto-placement ── */
/* Items that aren't manually placed flow into the next available cell */
.auto-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-flow: row;   /* default: fills rows left-to-right */
  /* grid-auto-flow: column — fills columns top-to-bottom instead */
  grid-auto-rows: 150px; /* height for auto-generated rows */
}
`;

// ⚠️ GOTCHA: fr units distribute REMAINING space after fixed sizes are taken.
// grid-template-columns: 200px 1fr 1fr — the 200px column is reserved first,
// then the leftover is split. 1fr is NOT "100% divided by columns".
// If the container is 800px, each fr column gets (800-200)/2 = 300px.

// ─────────────────────────────────────────────────────────
// 6. RESPONSIVE LAYOUT PATTERNS
// ─────────────────────────────────────────────────────────
//
// Use when: you want the layout to adapt to different screen sizes

const responsive = `
/* ── Mobile-first: write base styles for mobile, add complexity for larger screens ── */
/* Easier to scale UP than to undo styles written for desktop */

/* Base = mobile */
.card-grid {
  display: grid;
  grid-template-columns: 1fr; /* single column on mobile */
  gap: 16px;
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* ── Common breakpoints ── */
/* 640px  — large phones, small landscape */
/* 768px  — tablets */
/* 1024px — laptops */
/* 1280px — wide desktops */

/* ── auto-fill vs auto-fit ── */
/* auto-fill: creates as many columns as fit, even if empty columns remain */
/* auto-fit: collapses empty columns, letting filled columns expand */
.auto-responsive {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  /* responsive grid with NO media queries — cards expand to fill space */
}

/* ── clamp() — fluid sizing between a min and max ── */
.fluid-text {
  font-size: clamp(1rem, 2.5vw, 2rem);
  /* never smaller than 1rem, never larger than 2rem,
     scales with viewport width in between */
}

.fluid-padding {
  padding: clamp(16px, 4vw, 48px);
}

/* ── Container queries (modern CSS) ── */
/* Unlike media queries (which check viewport), container queries check the PARENT */
@container sidebar (min-width: 300px) {
  .widget { display: grid; grid-template-columns: 1fr 1fr; }
}
.sidebar { container-type: inline-size; container-name: sidebar; }
`;

// ⚠️ GOTCHA: mobile-first means min-width queries — you start small and ADD styles.
// If you write max-width queries, you're fighting CSS specificity: later rules
// need to undo earlier ones. Min-width + cascade = clean, additive overrides.

// ─────────────────────────────────────────────────────────
// 7. COMMON LAYOUT PATTERNS IN CODE
// ─────────────────────────────────────────────────────────
//
// Patterns you'll write on every project

const layoutPatterns = `
/* ── 1. Holy Grail layout — header / footer + main with sidebars ── */
.holy-grail {
  display: grid;
  grid-template-areas:
    "header header  header"
    "nav    main    aside "
    "footer footer  footer";
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: 60px 1fr 48px;
  min-height: 100vh;
}

/* ── 2. Card grid that auto-wraps — no media queries needed ── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

/* ── 3. Sticky sidebar — sidebar stays put, content scrolls ── */
.layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 32px;
  align-items: start; /* without this, sidebar stretches full height */
}
.sidebar {
  position: sticky;
  top: 80px; /* accounts for fixed header height */
  max-height: calc(100vh - 80px);
  overflow-y: auto;
}

/* ── 4. Centered content with max-width (the standard page wrapper) ── */
.page-content {
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  padding: 0 24px; /* side padding on small screens */
}

/* ── 5. Navbar — logo left, links right ── */
.navbar {
  display: flex;
  align-items: center;
  padding: 0 24px;
  height: 64px;
  background: #1e293b;
}
.navbar .logo {
  margin-right: auto; /* pushes everything else to the right */
}
.navbar .links {
  display: flex;
  align-items: center;
  gap: 32px;
}

/* ── 6. Stack with equal spacing (the utility you'll use constantly) ── */
.stack > * + * {
  margin-top: 16px; /* add top margin to every child EXCEPT the first */
}

/* ── 7. Aspect-ratio locked box (video embeds, thumbnails) ── */
.video-wrapper {
  aspect-ratio: 16 / 9;
  width: 100%;
  overflow: hidden;
}
`;

// ─────────────────────────────────────────────────────────
// 8. STACKING AND OVERFLOW
// ─────────────────────────────────────────────────────────
//
// Use when: content escapes its box, or elements overlap in unexpected ways

const stackingAndOverflow = `
/* ── overflow controls what happens when content is bigger than its box ── */
.card {
  overflow: visible; /* default — content bleeds outside (no clipping) */
  overflow: hidden;  /* clips content, also hides scrollbar */
  overflow: scroll;  /* always shows scrollbar */
  overflow: auto;    /* scrollbar appears only when needed (use this) */
}

/* Control each axis independently */
.code-block {
  overflow-x: auto;   /* horizontal scrollbar for wide code */
  overflow-y: hidden; /* no vertical scrollbar */
}

/* ── text-overflow: ellipsis — truncate to one line with "..." ── */
/* Requires all THREE properties — each one alone does nothing */
.truncated {
  white-space: nowrap;       /* 1. prevent line wrapping */
  overflow: hidden;          /* 2. clip the overflow */
  text-overflow: ellipsis;   /* 3. show "..." at the clip point */
  /* width or max-width must be set — ellipsis needs a boundary */
  max-width: 200px;
}

/* ── z-index and stacking contexts ── */
/* z-index only works on positioned elements (anything except static) */
.modal-backdrop { position: fixed; z-index: 900; }
.modal-dialog   { position: fixed; z-index: 901; }

/* These elements CREATE a new stacking context (their children can't
   escape with z-index — they only compete WITHIN the context):
     • transform (any value except none)
     • opacity < 1
     • filter (any value)
     • will-change: transform
     • isolation: isolate   ← use this to intentionally create a context */
.card-with-effect {
  transform: translateY(-2px); /* now a stacking context — children stay inside */
}

/* isolation: isolate — cleanly create a context without visual side effects */
.dropdown-wrapper {
  isolation: isolate; /* z-index wars inside here stay inside here */
}
`;

// ⚠️ GOTCHA: overflow: hidden on a parent clips absolutely positioned children
// ONLY if the parent has a position other than static.
// If parent is position: static (default), absolutely positioned children
// ignore the overflow clipping and render outside the parent box anyway.
// Fix: add position: relative to the clipping parent.

// ─────────────────────────────────────────────────────────
// PRACTICE CHALLENGES
// ─────────────────────────────────────────────────────────

const practiceChallenges = `
/*
Q1 — CENTER A DIV three different ways
──────────────────────────────────────
Task: Center .box both horizontally and vertically inside .container

Way 1: Flexbox (most common, cleanest)
  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }

Way 2: Grid
  .container {
    display: grid;
    place-items: center;  /* shorthand for align-items + justify-items */
    height: 100vh;
  }

Way 3: Absolute + transform (useful when container height is unknown)
  .container { position: relative; height: 100vh; }
  .box {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
*/

/*
Q2 — RESPONSIVE CARD GRID (1 col mobile, 2 tablet, 3 desktop)
──────────────────────────────────────────────────────────────
Option A — Media queries (explicit control):
  .grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
  @media (min-width: 768px)  { .grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .grid { grid-template-columns: repeat(3, 1fr); } }

Option B — auto-fit + minmax (no media queries):
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }
  /* Cards naturally go 1 → 2 → 3 columns as viewport widens */
*/

/*
Q3 — STICKY HEADER
──────────────────
  header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: white; /* important — content scrolls BEHIND it */
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  /* No JS, no scroll listeners — pure CSS */
*/

/*
Q4 — HOLY GRAIL LAYOUT (header / footer / main + two sidebars)
──────────────────────────────────────────────────────────────
  .page {
    display: grid;
    grid-template-areas:
      "header  header  header"
      "nav     main    aside "
      "footer  footer  footer";
    grid-template-columns: 220px 1fr 220px;
    grid-template-rows: 64px 1fr 48px;
    min-height: 100vh;
  }
  header { grid-area: header; }
  nav    { grid-area: nav; }
  main   { grid-area: main; }
  aside  { grid-area: aside; }
  footer { grid-area: footer; }
*/

/*
Q5 — TRUNCATE TEXT TO ONE LINE WITH ELLIPSIS
────────────────────────────────────────────
  .title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 240px;
  }
  /* All three are required — remove any one and it breaks */
*/
`;

// ─────────────────────────────────────────────────────────
// SELF-ASSESSMENT  (10 questions)
// ─────────────────────────────────────────────────────────
//
// Scoring: 0-5 re-read the sections  |  6-8 solid foundation  |  9-10 ready to ship

const selfAssessment = `
Q1. What does this CSS produce — and why is the result surprising?
  .parent { margin-bottom: 40px; }
  .child  { margin-top: 20px; }
  The gap between .parent and the next sibling is ________.

  Answer: 40px. Vertical margins between siblings collapse to the LARGER value.
  The 20px and 40px do NOT add together.

Q2. Fix the bug — the text is not truncating with "..."
  .title {
    text-overflow: ellipsis;
    max-width: 200px;
  }

  Answer: Missing two required properties. Full fix:
  .title {
    white-space: nowrap;       /* missing */
    overflow: hidden;          /* missing */
    text-overflow: ellipsis;
    max-width: 200px;
  }

Q3. Why doesn't the z-index work here?
  .tooltip { z-index: 999; }

  Answer: z-index only works on POSITIONED elements (position != static).
  Fix: add position: relative (or absolute/fixed) to .tooltip.

Q4. A card is 400px wide with padding: 20px. What is the content width
    with box-sizing: content-box? With border-box?

  Answer:
  content-box (default): content = 400px, total box = 440px
  border-box:            content = 360px (400 - 20 - 20), total box = 400px

Q5. When would you use Grid over Flexbox?

  Answer: Grid when you need TWO-dimensional control (rows AND columns),
  or for page-level layouts. Flexbox when items flow in one direction —
  nav links, a row of cards, a form field with a label.

Q6. What does flex: 1 actually mean?
  Expand it to its three component values.

  Answer: flex: 1 expands to flex: 1 1 0%.
  grow=1 (will expand), shrink=1 (will compress), basis=0% (starts from 0, not content size).
  Multiple flex: 1 siblings share remaining space equally.

Q7. Fix the broken flex layout — items should be right-aligned but aren't:
  .nav {
    display: flex;
    align-items: right; /* wrong */
  }

  Answer: align-items controls the CROSS axis (vertical in row layout)
  and doesn't accept "right". To push items right:
    justify-content: flex-end;  /* aligns items at the end of the main axis */
  Or for one item: margin-left: auto on the item you want pushed right.

Q8. What happens to an absolutely positioned child if no ancestor has position set?

  Answer: It escapes all the way up to the initial containing block (the viewport / <html>).
  The position is calculated from the top-left corner of the page, not the parent.

Q9. What is the difference between auto-fill and auto-fit in grid?
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  grid-template-columns: repeat(auto-fit,  minmax(200px, 1fr));

  Answer: Both create as many 200px+ columns as fit.
  auto-fill: keeps empty track slots — columns don't expand into them.
  auto-fit:  collapses empty tracks — filled columns stretch to fill the row.
  With few items: auto-fit stretches them wider; auto-fill leaves blank space.

Q10. When would you choose position: sticky over position: fixed?

  Answer: sticky when the element should scroll WITH its parent container
  until it hits the threshold — then stick. Fixed when the element should
  always be visible regardless of where you scroll on the page.
  Sticky stops sticking when the parent scrolls past. Fixed never stops.
`;

// ─────────────────────────────────────────────────────────
// REFERENCE CARD
// ─────────────────────────────────────────────────────────

function runDemo(): void {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║         CSS LAYOUT — QUICK REFERENCE CARD                 ║
╠═══════════════════════════════════════════════════════════╣
║  BOX MODEL                                                ║
║  *, *::before, *::after { box-sizing: border-box; }      ║
║  margin: 0 auto  → horizontal center (needs width set)   ║
║  outline: ...    → no layout impact                      ║
╠═══════════════════════════════════════════════════════════╣
║  DISPLAY                                                  ║
║  block       → full width, stacks, all spacing works     ║
║  inline      → text flow, ignores width/h/top margin     ║
║  inline-block → text flow + respects all box properties  ║
║  none        → gone (no space)   vs   visibility:hidden  ║
╠═══════════════════════════════════════════════════════════╣
║  POSITION                                                 ║
║  static   → normal flow (default, not a positioned el)   ║
║  relative → offsets from own normal position             ║
║  absolute → nearest POSITIONED ancestor (not parent!)    ║
║  fixed    → viewport — always visible                    ║
║  sticky   → relative until threshold, then fixed         ║
║  z-index only works on positioned elements               ║
╠═══════════════════════════════════════════════════════════╣
║  FLEXBOX (container)                                      ║
║  display: flex                                           ║
║  flex-direction: row | column                            ║
║  justify-content: main axis distribution                 ║
║  align-items: cross axis alignment                       ║
║  gap: 16px                                               ║
║  flex-wrap: wrap                                         ║
║                                                          ║
║  FLEXBOX (item)                                          ║
║  flex: 1          → equal share of space                 ║
║  flex: 0 0 200px  → rigid, never flex                   ║
║  margin-left: auto → push to far end                    ║
║  align-self: ...  → override align-items per item       ║
╠═══════════════════════════════════════════════════════════╣
║  GRID (container)                                         ║
║  grid-template-columns: repeat(3, 1fr)                   ║
║  grid-template-columns: repeat(auto-fit, minmax(250px,1fr))║
║  grid-template-areas: "header header"                    ║
║                        "nav    main  "                   ║
║  gap: 24px                                               ║
║  place-items: center  → shorthand align+justify         ║
║                                                          ║
║  GRID (item)                                             ║
║  grid-column: 1 / 3   → span two columns                ║
║  grid-column: 1 / -1  → full row                        ║
║  grid-area: header    → use named area                  ║
╠═══════════════════════════════════════════════════════════╣
║  RESPONSIVE                                               ║
║  Mobile-first: use min-width queries                     ║
║  640px / 768px / 1024px / 1280px breakpoints            ║
║  clamp(1rem, 2.5vw, 2rem)  → fluid sizing               ║
║  auto-fit + minmax → responsive grid, 0 media queries   ║
╠═══════════════════════════════════════════════════════════╣
║  OVERFLOW & STACKING                                      ║
║  overflow: auto    → scrollbar when needed               ║
║  overflow: hidden  → clip (clips abs children only if    ║
║                      parent is positioned)               ║
║  text-overflow: ellipsis  → needs: overflow:hidden +     ║
║                             white-space:nowrap + width   ║
║  Stacking contexts: transform / opacity<1 / filter /     ║
║                     isolation:isolate                    ║
╚═══════════════════════════════════════════════════════════╝

  See the demos live: cd basics/css-design && npm run dev
  `);
}

runDemo();

export {
  boxModel,
  displayValues,
  positioning,
  flexbox,
  cssGrid,
  responsive,
  layoutPatterns,
  stackingAndOverflow,
  practiceChallenges,
  selfAssessment,
};
