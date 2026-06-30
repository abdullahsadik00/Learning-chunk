// ════════════════════════════════════════════════════════
// CSS 05: DESIGN SYSTEMS · TOKENS · COMPONENT LIBRARY · ACCESSIBILITY  (Day 30)
// Vite demo: cd basics/css-design && npm run dev
// ════════════════════════════════════════════════════════
//
// HOW TO USE THIS FILE
//  1. Read a section, understand the concept
//  2. Open the Vite demo — TokenShowcase, ComponentGallery, AccessibilityDemo,
//     and Day30Page are all live at localhost:5173
//  3. Hit the PRACTICE CHALLENGES at the bottom
//  4. Score yourself on the SELF-ASSESSMENT
//
// CSS/HTML is shown as template literal strings or block comments.
// Your browser runs the real thing in the Vite demo.

// ─────────────────────────────────────────────────────────
// 1. WHAT IS A DESIGN SYSTEM?
// ─────────────────────────────────────────────────────────
//
// A design system is NOT a component library.
// That's like calling a city "a collection of bricks."
//
// A design system is the shared language between design and engineering.
// When a designer says "use the primary color," a developer knows exactly
// which hex value that means — and so does the design tool.
// No Slack threads. No "wait which blue is it again?"
//
// THREE LAYERS (from atomic to complex):
//
//  ┌──────────────────────────────────────┐
//  │  3. PATTERNS / RECIPES               │  ← "Log in with a form + social auth"
//  │  2. COMPONENTS                       │  ← Button, Input, Modal, Card
//  │  1. DESIGN TOKENS                    │  ← colors, spacing, type scale, shadows
//  └──────────────────────────────────────┘
//
// REAL-WORLD EXAMPLES you've probably used:
//
//   Material UI (MUI)   — Google's design language, huge ecosystem
//   Ant Design          — Alibaba-backed, enterprise-focused, opinionated
//   Radix UI            — Headless primitives, you bring your own CSS
//   shadcn/ui           — Copy-paste components built on Radix + Tailwind
//   Chakra UI           — Accessible, themeable, batteries included
//
// BUILD vs USE — the honest answer for 95% of teams:
//
//   USE an existing system.
//
//   "But our brand is unique!" — No it's not unique enough to justify 6+ months
//   of engineering time to build and maintain a component library.
//
//   BUILD when:
//   - You're Airbnb, Google, or Stripe (>1000 engineers, multiple products)
//   - Your design constraints genuinely can't be met by any existing system
//   - You have a dedicated design systems team (>2 people, full time)
//
//   USE when:
//   - You're a startup or mid-size company (you are)
//   - You want to ship product, not infrastructure
//
// THE SHADCN/UI APPROACH — the best of both worlds:
//
//   shadcn/ui is not a library. It's a CLI that COPIES components into your repo.
//   You own the code. You can edit every line. No dependency to update.
//   Built on Radix (accessible headless primitives) + Tailwind (styling).
//
//   npx shadcn-ui@latest add button
//   → copies src/components/ui/button.tsx into your project
//   → you can now edit it directly, it's your code
//
//   You'd use this when: you want battle-tested accessibility + full styling control.

// ⚠️ GOTCHA:
// A design system without ADOPTION is just a folder of components nobody uses.
// The hardest part of a design system is not building it — it's convincing
// your team to use it consistently. Document it. Lint for non-system colors.
// Make the right thing the easy thing.

// ─────────────────────────────────────────────────────────
// 2. DESIGN TOKENS
// ─────────────────────────────────────────────────────────
//
// Design tokens are the atomic named values of your system.
// Not "blue #3b82f6" — "brand primary."
// Not "16px" — "space-md."
// Not "bold 600" — "font-weight-heading."
//
// They are the single source of truth shared between Figma and code.
//
// THREE TOKEN TIERS — think of it like a phone book hierarchy:
//
//   TIER 1: PRIMITIVE (raw values, never used directly in components)
//   --color-blue-500: #3b82f6;
//   --color-red-600:  #dc2626;
//   --space-4:        1rem;      /* 16px */
//
//   TIER 2: SEMANTIC (maps purpose to a primitive)
//   --color-brand-primary:   var(--color-blue-500);
//   --color-danger:          var(--color-red-600);
//   --space-component-gap:   var(--space-4);
//
//   TIER 3: COMPONENT (maps a specific component property to a semantic token)
//   --button-bg:           var(--color-brand-primary);
//   --button-bg-hover:     var(--color-blue-600);      /* one tier down */
//   --form-error-color:    var(--color-danger);
//
// WHY THIS MATTERS for theming:
//   Want dark mode? Swap tier-2 values. That's it.
//   --color-brand-primary: var(--color-blue-400);  ← lighter blue for dark bg
//   Every component using --button-bg gets the new color automatically.
//
// CSS CUSTOM PROPERTIES AS TOKENS:

const primitiveTokensCSS = `
:root {
  /* ── Primitive color tokens ─────────── */
  --color-blue-400: #60a5fa;
  --color-blue-500: #3b82f6;
  --color-blue-600: #2563eb;
  --color-red-500:  #ef4444;
  --color-red-600:  #dc2626;
  --color-gray-50:  #f9fafb;
  --color-gray-900: #111827;
  --color-white:    #ffffff;

  /* ── Primitive spacing (4px base grid) ─ */
  --space-1:  0.25rem;   /* 4px  */
  --space-2:  0.5rem;    /* 8px  */
  --space-3:  0.75rem;   /* 12px */
  --space-4:  1rem;      /* 16px */
  --space-6:  1.5rem;    /* 24px */
  --space-8:  2rem;      /* 32px */
  --space-12: 3rem;      /* 48px */
  --space-16: 4rem;      /* 64px */

  /* ── Primitive type scale ───────────── */
  --font-size-sm:   0.875rem;   /* 14px */
  --font-size-base: 1rem;       /* 16px */
  --font-size-lg:   1.125rem;   /* 18px */
  --font-size-xl:   1.25rem;    /* 20px */
  --font-size-2xl:  1.5rem;     /* 24px */
  --font-size-4xl:  2.25rem;    /* 36px */

  /* ── Primitive shadows ──────────────── */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);

  /* ── Primitive radii ────────────────── */
  --radius-sm: 0.25rem;   /* 4px  */
  --radius-md: 0.375rem;  /* 6px  */
  --radius-lg: 0.5rem;    /* 8px  */
  --radius-xl: 0.75rem;   /* 12px */
  --radius-full: 9999px;

  /* ── Semantic tokens ────────────────── */
  --color-brand-primary:   var(--color-blue-500);
  --color-brand-hover:     var(--color-blue-600);
  --color-danger:          var(--color-red-600);
  --color-danger-subtle:   var(--color-red-500);
  --color-surface:         var(--color-white);
  --color-on-surface:      var(--color-gray-900);
  --space-xs: var(--space-1);
  --space-sm: var(--space-2);
  --space-md: var(--space-4);
  --space-lg: var(--space-6);
  --space-xl: var(--space-8);

  /* ── Component tokens ───────────────── */
  --button-bg:          var(--color-brand-primary);
  --button-bg-hover:    var(--color-brand-hover);
  --button-radius:      var(--radius-lg);
  --button-padding-x:   var(--space-md);
  --button-padding-y:   var(--space-2);
  --input-border-error: var(--color-danger);
}

/* Dark mode: only semantic tier needs to change */
[data-theme="dark"] {
  --color-brand-primary:   var(--color-blue-400);   /* lighter on dark bg */
  --color-surface:         #1e293b;
  --color-on-surface:      var(--color-gray-50);
}
`;

// JSON TOKENS with Style Dictionary:
// Style Dictionary is a tool that takes a JSON token file and
// compiles it to CSS custom properties, Sass variables, JS constants, iOS Swift, etc.
// One source → everywhere.

const styleDictionaryTokensJSON = `
{
  "color": {
    "brand": {
      "primary": { "value": "#3b82f6", "type": "color" },
      "hover":   { "value": "#2563eb", "type": "color" }
    },
    "danger": { "value": "#dc2626", "type": "color" }
  },
  "spacing": {
    "sm": { "value": "0.5rem",  "type": "dimension" },
    "md": { "value": "1rem",    "type": "dimension" },
    "lg": { "value": "1.5rem",  "type": "dimension" }
  }
}
`;
// Style Dictionary compiles this to:
//   --color-brand-primary: #3b82f6;
//   --color-brand-hover:   #2563eb;
//   --color-danger:        #dc2626;
//   --spacing-sm:          0.5rem;
//   (+ Sass, Swift, Kotlin, whatever you need)

// SPACING SCALE — stick to multiples of 4px:
//
//   xs   = 4px   (tight nudges, icon gaps)
//   sm   = 8px   (inner padding, icon-to-text gaps)
//   md   = 16px  (standard padding, item gaps)
//   lg   = 24px  (section gaps, card padding)
//   xl   = 32px  (between major sections)
//   2xl  = 48px  (hero spacing, page sections)
//   3xl  = 64px  (very spacious layouts)
//
// You'd use this when: building any new component. Always reach for a token,
// never a raw pixel value. If it's not in the scale, question whether you need it.

// ⚠️ GOTCHA:
// Token names should describe PURPOSE, not APPEARANCE.
//   WRONG:  --color-red       (what if brand changes to orange?)
//   WRONG:  --color-red-500   (too tied to implementation detail)
//   RIGHT:  --color-danger    (survives a rebrand, still makes semantic sense)
//
// Same with spacing:
//   WRONG:  --padding-16px    (brittle — what if the scale changes?)
//   RIGHT:  --space-md        (describes role in the scale, not raw value)

// ─────────────────────────────────────────────────────────
// 3. BUILDING A COMPONENT THE RIGHT WAY
// ─────────────────────────────────────────────────────────
//
// A good component has:
//   - A clean props API (what can callers configure?)
//   - Variants (visual flavors: primary, secondary, danger)
//   - Sizes (sm, md, lg)
//   - States (default, hover, focus, disabled, loading, error)
//   - Sensible defaults (shouldn't need 10 props for basic use)
//
// You'd use this when: designing any reusable UI component.

// ── ANATOMY OF A GOOD BUTTON ─────────────────────────────

const buttonComponentCode = `
import { forwardRef, type ButtonHTMLAttributes, type ElementType } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  // Polymorphic "as" prop — render as an <a> tag, <Link>, etc.
  as?: ElementType;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   'bg-[--button-bg] text-white hover:bg-[--button-bg-hover]',
  secondary: 'bg-slate-700 text-slate-200 hover:bg-slate-600',
  ghost:     'text-slate-300 hover:bg-slate-800',
  danger:    'bg-red-600 text-white hover:bg-red-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8  px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
};

// forwardRef: lets parent components attach a ref to the underlying DOM <button>
// You'd use this when: building form libraries, focus management, animations
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, as: Tag = 'button', children, className, disabled, ...props }, ref) => {
    return (
      <Tag
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        className={[
          'inline-flex items-center justify-center font-medium rounded-[--button-radius]',
          'transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(' ')}
        {...props}
      >
        {isLoading ? <span aria-hidden>...</span> : children}
      </Tag>
    );
  }
);
Button.displayName = 'Button';
`;

// ── COMPOUND COMPONENTS PATTERN ──────────────────────────
//
// Think of it like HTML's <select> + <option> relationship.
// <Tabs> owns state. <Tabs.List> and <Tabs.Panel> are satellites.
// Context wires them together invisibly.

const compoundComponentCode = `
import { createContext, useContext, useState } from 'react';

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tab components must be used inside <Tabs>');
  return ctx;
}

// Parent owns all state, exposes context
function Tabs({ defaultTab, children }: { defaultTab: string; children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div>{children}</div>
    </TabsContext.Provider>
  );
}

// Child reads context — no prop drilling
function TabList({ children }: { children: React.ReactNode }) {
  return <div role="tablist" className="flex gap-2 border-b">{children}</div>;
}

function Tab({ id, children }: { id: string; children: React.ReactNode }) {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === id;
  return (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={\`panel-\${id}\`}
      id={\`tab-\${id}\`}
      onClick={() => setActiveTab(id)}
      className={isActive ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}
    >
      {children}
    </button>
  );
}

function TabPanel({ id, children }: { id: string; children: React.ReactNode }) {
  const { activeTab } = useTabs();
  if (activeTab !== id) return null;
  return <div role="tabpanel" id={\`panel-\${id}\`} aria-labelledby={\`tab-\${id}\`}>{children}</div>;
}

// Attach as sub-components (clean public API)
Tabs.List  = TabList;
Tabs.Tab   = Tab;
Tabs.Panel = TabPanel;

// Usage:
// <Tabs defaultTab="profile">
//   <Tabs.List>
//     <Tabs.Tab id="profile">Profile</Tabs.Tab>
//     <Tabs.Tab id="settings">Settings</Tabs.Tab>
//   </Tabs.List>
//   <Tabs.Panel id="profile">Profile content</Tabs.Panel>
//   <Tabs.Panel id="settings">Settings content</Tabs.Panel>
// </Tabs>
`;

// ── CONTROLLED vs UNCONTROLLED ───────────────────────────
//
// Uncontrolled: component manages its own state internally (simplest)
//   <Input />   — you read the value via ref on submit
//
// Controlled: parent owns state, passes it as props
//   <Input value={email} onChange={e => setEmail(e.target.value)} />
//
// You'd use uncontrolled when: simple forms, no cross-field validation
// You'd use controlled when: real-time validation, dependent fields, form libraries
//
// Best practice: support BOTH with a single component
const controlledUncontrolledPattern = `
function Input({ value, defaultValue, onChange, ...props }) {
  // If value prop provided → controlled mode
  // If defaultValue provided → uncontrolled mode
  // React handles this natively on <input> elements
  return <input value={value} defaultValue={defaultValue} onChange={onChange} {...props} />;
}
`;

// ⚠️ GOTCHA:
// Don't export component internals.
// If you export TabsContext, callers will start importing and using it directly.
// Then you can never refactor the internals without a breaking change.
// Only expose what callers NEED to USE: the Tabs component and its sub-components.
// Everything else is private to the implementation.

// ─────────────────────────────────────────────────────────
// 4. ACCESSIBILITY (A11Y) FUNDAMENTALS
// ─────────────────────────────────────────────────────────
//
// Why does this matter?
// 1 in 4 adults in the US has a disability (CDC data).
// That's 61 million people who might be using your product.
//
// Also: legal. The ADA (Americans with Disabilities Act) applies to websites.
// Companies have been sued for inaccessible websites — Target, Domino's, Netflix.
// In the EU, EAA (European Accessibility Act) requires AA compliance by 2025.
//
// Beyond legal: accessible software is better software.
// Good contrast = easier to read in sunlight.
// Keyboard nav = faster for power users.
// Clear labels = better UX for everyone.
//
// WCAG 2.1 — the spec everyone references:
//
//   Level A   — minimum. Must have. Breaking these makes content unusable.
//   Level AA  — industry standard. What "accessible" means in practice.
//               Most legal requirements reference AA.
//   Level AAA — aspirational. Usually impractical to achieve everywhere.
//
// THE POUR PRINCIPLES — the four pillars of WCAG:
//
//   PERCEIVABLE    — can users perceive all content?
//                    (alt text for images, captions for video, sufficient contrast)
//
//   OPERABLE       — can users operate all UI?
//                    (keyboard access, no seizure-inducing flashes, enough time)
//
//   UNDERSTANDABLE — is it predictable and clear?
//                    (readable text, consistent nav, error messages that help)
//
//   ROBUST         — does it work with assistive tech?
//                    (semantic HTML, valid ARIA, works with screen readers)
//
// SEMANTIC HTML FIRST — this is 80% of accessibility:
//
//   Instead of:                   Use:
//   <div onclick="...">           <button>
//   <div class="nav">             <nav>
//   <div class="main">            <main>
//   <div class="article">         <article>
//   <div class="aside">           <aside>
//   <span onclick="...">          <button> or <a href>
//   <div class="header">          <header>
//   <div class="footer">          <footer>
//
// WHY? Because <button> comes with:
//   - keyboard activation (Enter, Space)
//   - focus management (browser handles Tab)
//   - role="button" for screen readers
//   - aria-disabled when disabled
//   - click event on Enter key
//   All for free. A <div> has none of that.
//
// SCREEN READER TESTING — the real test:
//
//   macOS/iOS:  VoiceOver — Cmd + F5 to enable, then navigate with Tab/arrows
//   Windows:    NVDA (free) — most widely used screen reader worldwide
//   Browser:    axe DevTools extension — automated audit in DevTools
//
// You'd use this when: before shipping any new component or page.
// Even 10 minutes of VoiceOver testing catches most obvious issues.

// ⚠️ GOTCHA:
// Building accessible UI with <div> and ARIA attributes is 10x more work
// than using the correct HTML element.
// <div role="button" tabindex="0" onKeyDown={handleKeyDown} onClick={handleClick}>
//   is NOT equivalent to <button onClick={handleClick}>
//   — it's more code, more fragile, and you'll still miss edge cases.
// Always start with the right element. Add ARIA only when HTML can't do it.

// ─────────────────────────────────────────────────────────
// 5. ARIA — WHEN AND HOW
// ─────────────────────────────────────────────────────────
//
// ARIA = Accessible Rich Internet Applications.
// It's a set of HTML attributes that make custom widgets understandable
// to screen readers when semantic HTML alone isn't enough.
//
// THE FIRST RULE OF ARIA:
//   Do NOT use ARIA if native HTML can do it.
//
//   <button>       already has role="button"    — don't add it
//   <input>        already has role="textbox"   — don't add it
//   <select>       already has role="listbox"   — don't add it
//   <a href="..."> already has role="link"      — don't add it
//
//   ARIA is for: custom dropdowns, comboboxes, date pickers, tree views,
//   data grids — widgets that HTML has no native equivalent for.
//
// ESSENTIAL ARIA ATTRIBUTES:

const ariaExamplesCode = `
{/* role — tells AT what kind of widget this is */}
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Confirm Delete</h2>
</div>

{/* aria-label — labels an element with no visible text */}
<button aria-label="Close dialog">
  <XIcon aria-hidden="true" />    {/* ← hide decorative icons from AT */}
</button>

{/* aria-labelledby — points to another element as the label */}
<section aria-labelledby="section-heading">
  <h2 id="section-heading">Recent Orders</h2>
</section>

{/* aria-describedby — additional description (like help text or error message) */}
<input
  id="email"
  aria-describedby="email-hint email-error"
  aria-invalid={hasError}
/>
<p id="email-hint">We'll never share your email</p>
<p id="email-error" role="alert">{errorMessage}</p>

{/* aria-expanded — for toggleable panels, dropdowns, accordions */}
<button aria-expanded={isOpen} aria-controls="menu-list">
  Options
</button>
<ul id="menu-list" hidden={!isOpen}>...</ul>

{/* aria-selected — for tabs, listboxes, tree items */}
<button role="tab" aria-selected={isActive}>Profile</button>

{/* aria-live — regions that update dynamically */}
<div aria-live="polite">   {/* announces changes after user is idle */}
  {statusMessage}
</div>
<div aria-live="assertive"> {/* interrupts immediately — only for critical errors */}
  {criticalError}
</div>

{/* aria-hidden — hides from screen readers (decorative content) */}
<span aria-hidden="true">★★★★☆</span>
<span className="sr-only">4 out of 5 stars</span>  {/* visible to AT only */}
`;

// LANDMARK ROLES — navigation aids for screen reader users:
//
//   role="banner"       → site header (the <header> element)
//   role="navigation"   → <nav> element
//   role="main"         → <main> element (one per page)
//   role="complementary"→ <aside> element
//   role="contentinfo"  → site footer (<footer>)
//   role="search"       → search form region
//
// Screen reader users can jump between landmarks with a single keystroke.
// If you use semantic HTML, you get these for free.

// sr-only UTILITY — visually hidden but accessible:
const srOnlyCSS = `
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
`;
// You'd use this when: you need text for screen readers but not visual users.
// Common uses: skip-to-content links, icon button labels, visually repeated headers.

// ⚠️ GOTCHA:
// aria-label overrides the visible text completely.
//   <button aria-label="Delete item 5">Delete</button>
//   Screen reader announces: "Delete item 5, button"
//   Visual user reads: "Delete"
//
// If they say different things, sighted + screen reader users have different experiences.
// Keep them consistent, or use aria-labelledby to reference visible text instead.
// Use aria-describedby for supplementary info, not a different label.

// ─────────────────────────────────────────────────────────
// 6. KEYBOARD NAVIGATION
// ─────────────────────────────────────────────────────────
//
// A keyboard-only user navigates with Tab, Shift+Tab, Enter, Space, arrow keys.
// If your UI doesn't work without a mouse, it's broken.
//
// TAB ORDER — follows DOM order:
//   Tab           → move to next focusable element
//   Shift+Tab     → move to previous focusable element
//   Focusable by default: <a>, <button>, <input>, <select>, <textarea>
//
// TABINDEX VALUES:
//
//   tabindex="0"   — add to tab order (useful for custom widgets: <div role="button">)
//   tabindex="-1"  — focusable via JavaScript (.focus()), not via Tab key
//   tabindex="2"   — DON'T USE. Overrides natural order, causes confusion.
//                    If your tab order is wrong, fix the DOM order instead.

const tabindexExamples = `
{/* Custom widget that needs to be focusable */}
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleClick()}
>
  Custom Button
</div>

{/* Focus a modal programmatically on open, not in tab order when closed */}
<div ref={modalRef} tabIndex={-1} role="dialog">
  ...
</div>
// On open: modalRef.current.focus()
// The modal itself is not in the tab order — its children are.
`;

// FOCUS TRAP IN MODALS:
// When a modal is open, Tab should cycle WITHIN the modal only.
// Escape should close the modal and return focus to the trigger.

const focusTrapPattern = `
import { useEffect, useRef } from 'react';

function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus the modal container when it opens
    modalRef.current?.focus();

    // Trap Tab/Shift+Tab within the modal
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;

      const focusable = modalRef.current?.querySelectorAll(
        'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0] as HTMLElement;
      const last  = focusable[focusable.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div ref={modalRef} tabIndex={-1} role="dialog" aria-modal="true">
      {children}
    </div>
  );
}
`;

// KEYBOARD SHORTCUTS BY WIDGET TYPE:
//
//   Buttons:       Enter / Space  → activate
//   Links:         Enter          → follow
//   Checkboxes:    Space          → toggle
//   Radio groups:  arrow keys     → move between options
//   Select:        arrow keys     → navigate options, Enter → select
//   Tabs:          arrow keys     → switch tabs
//   Menu:          arrow keys     → navigate, Escape → close
//   Dialog:        Escape         → close, Tab → cycle focus within
//
// FOCUS-VISIBLE CSS — show ring only for keyboard users:

const focusVisibleCSS = `
/* Don't remove outlines globally — that breaks keyboard users */
/* WRONG: * { outline: none; } */

/* RIGHT: only suppress outline on mouse click, not keyboard focus */
button:focus-visible {
  outline: 2px solid var(--color-brand-primary);
  outline-offset: 2px;
}

button:focus:not(:focus-visible) {
  outline: none;   /* mouse click — no visible ring */
}

/* Tailwind equivalent: */
/* focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 */
`;

// You'd use this when: writing any interactive component.
// Test by tabbing through your app with keyboard only — if you lose track
// of where focus is at any point, something is broken.

// ⚠️ GOTCHA:
// Never remove outline without providing a visible alternative.
//   * { outline: none; }  ← this is the single most common a11y mistake.
//
// Keyboard users lose all sense of where they are on the page.
// The correct escape hatch is :focus-visible — it hides the ring
// for mouse clicks while keeping it for keyboard navigation.
// If you must customize: change the color/style, never remove it entirely.

// ─────────────────────────────────────────────────────────
// 7. COLOR AND CONTRAST
// ─────────────────────────────────────────────────────────
//
// Contrast ratio = difference in luminance between foreground and background.
// Range: 1:1 (same color — invisible) to 21:1 (black on white — maximum).
//
// WCAG AA REQUIREMENTS:
//
//   Normal text (< 18px regular, < 14px bold):   4.5:1 minimum
//   Large text  (≥ 18px regular, ≥ 14px bold):   3:1 minimum
//   UI components, focus indicators, icons:       3:1 minimum
//   Decorative elements:                          no requirement
//
// COMMON FAILURE: light gray text on white background.
//   #767676 on white = 4.54:1 — barely passes AA for normal text
//   #999999 on white = 2.85:1 — FAILS. Very common in "elegant" designs.
//
// TOOLS:
//   Figma:          Contrast plugin (Able, Stark)
//   Web:            coolors.co/contrast-checker, webaim.org/resources/contrastchecker
//   Browser:        Chrome DevTools → Elements → computed → accessibility
//   VS Code:        axe Accessibility Linter extension
//
// DON'T CONVEY INFORMATION BY COLOR ALONE:
//
//   WRONG: red = error, green = success (colorblind users can't distinguish)
//   RIGHT: red + ❌ icon + "Error:" text prefix
//          green + ✓ icon + "Success:" text prefix
//
// Color blindness affects 8% of men, 0.5% of women.
// Types: red-green (most common), blue-yellow (rare), monochromacy (very rare).
//
// TESTING FOR COLOR BLINDNESS:
//   Chrome DevTools → Rendering → Emulate vision deficiencies
//   App: Sim Daltonism (Mac), NoCoffee (Chrome extension)
//
// DARK MODE CONTRAST:
//   Don't assume light-on-dark automatically passes.
//   --text-muted: #6b7280 on #1e293b = check it! It might fail.
//   Check BOTH themes before shipping.

const contrastExamples = `
/* ✓ PASSES — normal text */
color: #1e293b;     /* near-black */
background: #fff;   /* white — 16:1 ratio */

/* ✓ PASSES — large text (18px+) */
color: #6b7280;     /* gray-500 — 4.6:1 on white */
font-size: 1.125rem;

/* ✗ FAILS — too light for normal text */
color: #9ca3af;     /* gray-400 — 2.85:1 on white */

/* ✓ PASSES — form input border */
border-color: #6b7280;  /* 3:1 on white — UI component threshold */

/* ✓ PASSES — dark mode */
color: #e2e8f0;     /* slate-200 */
background: #0f172a; /* slate-900 — 13.4:1 ratio */
`;

// You'd use this when: choosing any text/background color combination.
// Make it a step in your design review process, not an afterthought.

// ⚠️ GOTCHA:
// The 3:1 ratio is only OK for LARGE text and UI components.
// Regular body text needs 4.5:1 — there is no exception.
//
// Also: WCAG AAA requires 7:1 for normal text. Useful to know,
// but don't block shipping over AAA — AA is the legal/industry standard.

// ─────────────────────────────────────────────────────────
// 8. TESTING AND AUDITING ACCESSIBILITY
// ─────────────────────────────────────────────────────────
//
// The brutal truth: automated tools catch about 30% of accessibility issues.
// The other 70% require manual testing by a human (ideally with a screen reader).
// But that 30% is still worth automating — catch the easy stuff early.
//
// AUTOMATED TOOLS:
//
//   axe-core        — the engine behind most a11y testing tools
//   Lighthouse      — Chrome's built-in audit (DevTools → Lighthouse → Accessibility)
//   axe DevTools    — Chrome extension, runs in the browser as you build
//   eslint-plugin-jsx-a11y — catches a11y issues in JSX at write time (use this!)
//
// MANUAL TESTING — the checklist:
//
//   1. Keyboard-only: unplug your mouse. Can you reach and use every feature?
//   2. VoiceOver/NVDA: does the screen reader announce the right things?
//   3. 200% zoom: does the layout survive? No horizontal scroll on main content?
//   4. No-CSS test: disable styles. Is the content still readable and logical?
//   5. High contrast mode: Windows high contrast, macOS increased contrast?
//
// TESTING LIBRARY — queries by role/label are inherently accessible:

const testingLibraryA11yCode = `
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// These queries ONLY work if your HTML is accessible:
const button = screen.getByRole('button', { name: /submit/i });
// getByRole('button') — finds <button>, not <div onclick>
// { name: /submit/i } — matches aria-label, visible text, or aria-labelledby

const input = screen.getByLabelText(/email address/i);
// Only finds an <input> with a proper <label for> or aria-labelledby

// If your test passes, your component is accessible.
// If it fails with "Unable to find role", your HTML structure is wrong.
`;

// JEST-AXE — automated WCAG checking in unit tests:
const jestAxeCode = `
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('Dropdown has no a11y violations', async () => {
  const { container } = render(
    <Dropdown label="Select country" options={['US', 'UK', 'CA']} />
  );
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
// axe will catch: missing labels, bad contrast, missing alt text,
// duplicate IDs, missing lang attribute, and ~80 other rules.
`;

// ESLint JSX-A11Y — catches issues at write time (best ROI):
const eslintA11yConfig = `
// .eslintrc.json
{
  "plugins": ["jsx-a11y"],
  "extends": ["plugin:jsx-a11y/recommended"],
  "rules": {
    "jsx-a11y/alt-text": "error",
    "jsx-a11y/anchor-has-content": "error",
    "jsx-a11y/aria-props": "error",
    "jsx-a11y/click-events-have-key-events": "warn",
    "jsx-a11y/no-static-element-interactions": "warn"
  }
}
// This catches the most common mistakes before they ship:
// <img> without alt, <a> without content, invalid ARIA attributes,
// onClick without keyboard handler, interactive events on non-interactive elements.
`;

// WCAG CHECKLIST APPROACH for real projects:
//
//   1. Pick your 10 most-used pages/flows
//   2. For each: run Lighthouse a11y audit, fix all "Failing" items
//   3. Tab through with keyboard, fix any broken nav
//   4. Run VoiceOver on at least 3 pages
//   5. Check contrast on all text + interactive elements
//   6. Document what you tested and when (for legal paper trail)

// ⚠️ GOTCHA:
// Automated tools only catch ~30% of accessibility issues.
// Lighthouse score of 100 does NOT mean your site is accessible.
// It means the automated checks passed. Manual testing is non-negotiable.
// A score of 100 with zero manual testing is false confidence.

// ═════════════════════════════════════════════════════════
// PRACTICE CHALLENGES
// ═════════════════════════════════════════════════════════

// ── Q1: TOKEN SYSTEM FOR LIGHT / DARK THEME ──────────────
//
// Create a semantic token system. Define primitive tokens, then semantic tokens
// for both light and dark mode. Include: colors, spacing, typography.
//
// ANSWER:

const q1AnswerCSS = `
:root {
  /* ── Primitives ─── */
  --color-white:      #ffffff;
  --color-black:      #0a0a0a;
  --color-blue-400:   #60a5fa;
  --color-blue-600:   #2563eb;
  --color-gray-50:    #f8fafc;
  --color-gray-100:   #f1f5f9;
  --color-gray-300:   #cbd5e1;
  --color-gray-600:   #475569;
  --color-gray-800:   #1e293b;
  --color-gray-900:   #0f172a;
  --color-red-500:    #ef4444;
  --color-green-500:  #22c55e;

  --font-size-sm:     0.875rem;
  --font-size-base:   1rem;
  --font-size-lg:     1.125rem;
  --font-size-xl:     1.25rem;
  --font-size-2xl:    1.5rem;

  --font-weight-normal:  400;
  --font-weight-medium:  500;
  --font-weight-bold:    700;

  --line-height-tight:   1.25;
  --line-height-normal:  1.5;

  --space-1:  0.25rem;
  --space-2:  0.5rem;
  --space-4:  1rem;
  --space-6:  1.5rem;
  --space-8:  2rem;
  --space-16: 4rem;

  /* ── Semantic (light mode) ─── */
  --color-bg-page:       var(--color-gray-50);
  --color-bg-surface:    var(--color-white);
  --color-bg-elevated:   var(--color-white);
  --color-text-primary:  var(--color-gray-900);
  --color-text-secondary:var(--color-gray-600);
  --color-text-disabled: var(--color-gray-300);
  --color-border:        var(--color-gray-300);
  --color-brand:         var(--color-blue-600);
  --color-brand-subtle:  var(--color-blue-400);
  --color-danger:        var(--color-red-500);
  --color-success:       var(--color-green-500);

  --font-size-body:      var(--font-size-base);
  --font-size-label:     var(--font-size-sm);
  --font-size-heading-sm:var(--font-size-xl);
  --font-size-heading-lg:var(--font-size-2xl);
  --font-weight-body:    var(--font-weight-normal);
  --font-weight-heading: var(--font-weight-bold);
  --line-height-body:    var(--line-height-normal);

  --space-xs:  var(--space-1);
  --space-sm:  var(--space-2);
  --space-md:  var(--space-4);
  --space-lg:  var(--space-6);
  --space-xl:  var(--space-8);
}

/* ── Semantic (dark mode) ─── */
[data-theme="dark"] {
  --color-bg-page:       var(--color-gray-900);
  --color-bg-surface:    var(--color-gray-800);
  --color-bg-elevated:   #334155;   /* slate-700 */
  --color-text-primary:  var(--color-gray-50);
  --color-text-secondary:#94a3b8;   /* slate-400 */
  --color-text-disabled: var(--color-gray-600);
  --color-border:        #334155;
  --color-brand:         var(--color-blue-400);   /* lighter for dark bg */
  --color-brand-subtle:  #1d4ed8;
  /* danger and success often stay the same */
}
`;

// ── Q2: MAKE A DIV-BUTTON ACCESSIBLE ─────────────────────
//
// Problem: <div class="btn" onclick="submit()">Submit</div>
// Fix it.
//
// ANSWER:

const q2AnswerJSX = `
{/* Option A — the RIGHT way: use a real <button> */}
<button
  type="submit"
  className="btn"
  onClick={submit}
>
  Submit
</button>
{/* Gets keyboard support, role, focus, aria-disabled for free */}

{/* Option B — if you truly can't use <button> (e.g. rendering constraints) */}
<div
  role="button"
  tabIndex={0}
  className="btn"
  onClick={submit}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();  // prevent Space from scrolling the page
      submit();
    }
  }}
>
  Submit
</div>
{/* More code, more fragile — only use when you truly can't use <button> */}
`;

// ── Q3: ACCESSIBLE MODAL ──────────────────────────────────
//
// Build an accessible modal:
//   - Focus trap (Tab cycles within)
//   - Escape to close
//   - aria-modal
//   - aria-labelledby pointing to the title
//
// ANSWER:

const q3AnswerCode = `
import { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function AccessibleModal({ isOpen, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef   = useRef<HTMLDivElement>(null);
  const titleId    = 'modal-title';

  useEffect(() => {
    if (!isOpen) return;

    // Focus the modal when it opens
    modalRef.current?.focus();

    // Remember what was focused before opening
    const previouslyFocused = document.activeElement as HTMLElement;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;

      const focusableSelectors =
        'a[href], button:not([disabled]), input:not([disabled]), ' +
        'textarea, select, [tabindex]:not([tabindex="-1"])';
      const focusables = Array.from(
        modalRef.current?.querySelectorAll<HTMLElement>(focusableSelectors) ?? []
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last  = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Return focus to trigger when modal closes
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // Backdrop — click outside to close, aria-hidden so AT ignores it
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center"
      onClick={(e) => e.target === overlayRef.current && onClose()}
      aria-hidden="true"
    >
      {/* The actual dialog */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}       {/* focusable by .focus(), not Tab */}
        className="bg-white rounded-xl p-6 max-w-md w-full"
        aria-hidden="false" {/* override parent aria-hidden */}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-xl font-bold mb-4">{title}</h2>
        <div>{children}</div>
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="mt-4 px-4 py-2 bg-gray-200 rounded"
        >
          Close
        </button>
      </div>
    </div>
  );
}
`;

// ── Q4: ACCESSIBLE FORM ───────────────────────────────────
//
// A form with: label association, error state + aria-describedby,
// required fields, success announcement via aria-live.
//
// ANSWER:

const q4AnswerCode = `
function AccessibleForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      setSuccess('');
    } else {
      setSuccess('Form submitted successfully!');
      setError('');
    }
  }

  const hasError = error.length > 0;

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* aria-live region for success messages — polite waits for silence */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {success}
      </div>

      <div>
        {/* htmlFor MUST match input id — this is what creates the label association */}
        <label htmlFor="email">
          Email address
          <span aria-hidden="true"> *</span>         {/* visual asterisk */}
          <span className="sr-only"> (required)</span> {/* spoken text */}
        </label>

        <input
          id="email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          aria-required="true"
          aria-invalid={hasError}
          aria-describedby={hasError ? 'email-error email-hint' : 'email-hint'}
        />

        <p id="email-hint" className="text-sm text-gray-500">
          We'll use this to send your receipt.
        </p>

        {/* role="alert" announces immediately when it appears */}
        {hasError && (
          <p id="email-error" role="alert" className="text-red-600 flex items-center gap-1">
            <span aria-hidden="true">⚠</span>
            {error}
          </p>
        )}
      </div>

      <button type="submit">Submit</button>
    </form>
  );
}
`;

// ── Q5: JEST-AXE TEST FOR A DROPDOWN ─────────────────────
//
// Write a complete test that uses jest-axe to verify a custom Dropdown
// has no WCAG violations, including both open and closed states.
//
// ANSWER:

const q5AnswerCode = `
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// The component we're testing
function Dropdown({ label, options }: { label: string; options: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const listboxId = 'dropdown-listbox';

  return (
    <div>
      <button
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={selected ? \`\${label}: \${selected}\` : label}
        onClick={() => setIsOpen(o => !o)}
      >
        {selected ?? label}
      </button>
      {isOpen && (
        <ul
          role="listbox"
          id={listboxId}
          aria-label={label}
        >
          {options.map(opt => (
            <li
              key={opt}
              role="option"
              aria-selected={selected === opt}
              onClick={() => { setSelected(opt); setIsOpen(false); }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Tests ──
describe('Dropdown a11y', () => {
  const props = { label: 'Choose country', options: ['US', 'UK', 'Canada'] };

  test('closed state has no a11y violations', async () => {
    const { container } = render(<Dropdown {...props} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  test('open state has no a11y violations', async () => {
    const { container } = render(<Dropdown {...props} />);
    await userEvent.click(screen.getByRole('button'));   // open it
    expect(await axe(container)).toHaveNoViolations();
  });

  test('is keyboard accessible', async () => {
    render(<Dropdown {...props} />);
    const button = screen.getByRole('button', { name: /choose country/i });

    // Can reach by Tab
    await userEvent.tab();
    expect(button).toHaveFocus();

    // Can activate by Enter
    await userEvent.keyboard('{Enter}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });
});
`;

// ═════════════════════════════════════════════════════════
// SELF-ASSESSMENT (10 questions)
// ═════════════════════════════════════════════════════════
//
// Score: 0–5 = review fundamentals | 6–8 = solid | 9–10 = ready to ship accessible UIs
//
// Q1. What are the three token tiers in a design system? Give an example value for each.
//
//     A: Primitive (--color-blue-500: #3b82f6),
//        Semantic (--color-brand-primary: var(--color-blue-500)),
//        Component (--button-bg: var(--color-brand-primary))
//
// Q2. What WCAG contrast ratio is required for normal body text at Level AA?
//
//     A: 4.5:1
//
// Q3. You have a custom dropdown built with <div>. What is the minimum you need
//     to make it keyboard accessible?
//
//     A: role="button" on the trigger, tabIndex={0},
//        onKeyDown handler for Enter/Space to open/close,
//        role="listbox" on the list, role="option" on items,
//        aria-expanded on the trigger, arrow key navigation within.
//
// Q4. What does aria-live="polite" do differently from aria-live="assertive"?
//
//     A: polite waits for the user to be idle before announcing changes.
//        assertive interrupts immediately — use only for critical errors.
//
// Q5. Why is tabindex="5" on a button a bad idea?
//
//     A: Positive tabindex values override natural DOM order, creating
//        a confusing tab flow that diverges from visual layout.
//        Fix the DOM order instead. Only use 0 or -1.
//
// Q6. What is the first rule of ARIA?
//
//     A: Don't use ARIA if a native HTML element can do the same thing.
//        <button>, <input>, <select>, <a> all have built-in roles and behavior.
//
// Q7. A designer says "use red for errors, green for success."
//     What accessibility concern do you raise?
//
//     A: 8% of men have red-green color blindness and can't distinguish them.
//        Color should never be the ONLY indicator. Add an icon + text label:
//        ❌ "Error: invalid email" and ✓ "Success: saved."
//
// Q8. What is the shadcn/ui approach and why might you prefer it over Material UI?
//
//     A: shadcn/ui copies component source code into your project (via CLI).
//        You own the code — no external dependency to update.
//        Material UI is an opinionated library you import; harder to customize deeply.
//        shadcn = full control. MUI = batteries included, but you're locked in.
//
// Q9. A jest-axe test passes. Does that mean your component is fully accessible?
//
//     A: No. Automated tools catch ~30% of issues. You still need manual testing:
//        keyboard-only nav, VoiceOver/NVDA testing, zoom test, screen reader flow.
//
// Q10. What should happen to focus when a modal closes?
//
//      A: Focus should return to the element that triggered the modal to open.
//         If focus is lost (lands on <body>), keyboard users have no idea where
//         they are in the page and have to start over from the top.

// ═════════════════════════════════════════════════════════
// DEMO RUNNER — reference card
// ═════════════════════════════════════════════════════════

function runDemo(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║   CSS DAY 30 — DESIGN SYSTEMS & ACCESSIBILITY REFERENCE CARD ║
╚══════════════════════════════════════════════════════════════╝

── DESIGN TOKEN NAMING ──────────────────────────────────────
  TIER 1 PRIMITIVE    --color-blue-500: #3b82f6
  TIER 2 SEMANTIC     --color-brand-primary: var(--color-blue-500)
  TIER 3 COMPONENT    --button-bg: var(--color-brand-primary)

  Spacing scale (4px base): xs=4 sm=8 md=16 lg=24 xl=32 2xl=48

── ESSENTIAL ARIA ATTRIBUTES ────────────────────────────────
  role="dialog"         → modal window
  role="button"         → custom interactive element
  role="listbox"        → dropdown list container
  role="option"         → dropdown item
  role="tab"            → tab component
  role="alert"          → immediate announcement (errors)
  aria-expanded         → open/closed state (dropdowns, accordions)
  aria-selected         → selected state (tabs, options)
  aria-invalid          → form field in error state
  aria-required         → required form field
  aria-label            → names an element (no visible text)
  aria-labelledby       → points to another element as label
  aria-describedby      → points to help text or error message
  aria-hidden="true"    → hide decorative elements from AT
  aria-live="polite"    → announce changes after silence
  aria-live="assertive" → announce immediately (use sparingly)
  aria-modal="true"     → dialog is a modal (AT ignores backdrop)

── WCAG AA CONTRAST RATIOS ──────────────────────────────────
  Normal text (< 18px):    4.5:1 minimum
  Large text  (≥ 18px):    3:1   minimum
  UI components & icons:   3:1   minimum
  Decorative elements:     no requirement
  WCAG AAA (aspirational): 7:1 for normal text

── KEYBOARD SHORTCUTS BY WIDGET ─────────────────────────────
  Button/Checkbox    Enter / Space  → activate / toggle
  Link               Enter          → follow
  Select / Listbox   ↑ / ↓          → navigate options
  Tabs               ← / →          → switch tabs
  Menu               ↑ / ↓ / Escape → navigate / close
  Modal              Escape          → close, Tab traps inside
  Date picker        ↑ / ↓ / ← / → → navigate calendar

── TABINDEX CHEAT SHEET ─────────────────────────────────────
  tabindex="0"    add to tab order (non-interactive elements)
  tabindex="-1"   focusable via .focus() only, skip in Tab
  tabindex=">0"   NEVER USE — breaks natural order

── TESTING CHECKLIST ────────────────────────────────────────
  □ eslint-plugin-jsx-a11y in dev (catches at write time)
  □ jest-axe in unit tests (automated WCAG scan)
  □ Lighthouse a11y audit (quick browser check)
  □ Keyboard-only navigation test (Tab through everything)
  □ VoiceOver / NVDA screen reader test
  □ 200% zoom — layout still usable?
  □ Contrast check on all text + UI components (both themes)
  □ Color blindness emulator test

── QUICK WINS ───────────────────────────────────────────────
  • Use <button> not <div onclick>
  • Every <img> needs alt="" or alt="description"
  • Every <input> needs a <label htmlFor>
  • Never outline: none without :focus-visible alternative
  • aria-live="polite" on success messages
  • role="alert" on error messages
  • Focus returns to trigger when modal closes
  • Don't rely on color alone for status

Vite demo: cd basics/css-design && npm run dev → localhost:5173
  TokenShowcase.tsx    → token tiers live demo
  ComponentGallery.tsx → component variants
  AccessibilityDemo.tsx→ a11y patterns
  Day30Page.tsx        → everything together
`);
}

runDemo();
