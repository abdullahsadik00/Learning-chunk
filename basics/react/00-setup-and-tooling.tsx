// ═══════════════════════════════════════════════════════════════
// REACT 00: SETUP & TOOLING  (Reference)
// Read this once — covers everything you need to bootstrap and
// configure any React + TypeScript project from scratch.
// Type-check: npm run check  |  Run: npm run dev
// ═══════════════════════════════════════════════════════════════
//
// WHY THIS FILE EXISTS
//  Every other teaching file (01 onward) drops you into React
//  concepts, but none explains HOW the project itself is wired up.
//  This file fills that gap. It covers:
//    • Choosing a build tool (Vite vs CRA vs Next.js)
//    • Scaffolding a project from scratch
//    • Folder structure conventions (small and large apps)
//    • vite.config.ts in depth
//    • tsconfig.json every field explained
//    • ESLint + Prettier setup
//    • Environment variables (.env files, VITE_ prefix, type safety)
//    • package.json scripts and what each does
//    • CSS strategies compared
//    • dependencies vs devDependencies for React projects

import React from 'react';

// ───────────────────────────────────────────────────────────────
// 1. VITE vs CRA vs NEXT.JS — WHEN TO USE EACH
// ───────────────────────────────────────────────────────────────
//
// ┌─────────────────┬──────────────────────────────────┬─────────────────────────────────┬──────────────────────────────────┐
// │ Feature         │ Vite + React                     │ Create React App (CRA)          │ Next.js                          │
// ├─────────────────┼──────────────────────────────────┼─────────────────────────────────┼──────────────────────────────────┤
// │ Maintained?     │ ✅ Active (2024)                  │ ❌ Effectively unmaintained      │ ✅ Very active (Vercel)           │
// │ Dev startup     │ Instant (<300 ms)                │ 10–30 s (webpack)               │ 1–3 s (Turbopack in v15)         │
// │ HMR speed       │ Near-instant (native ESM)        │ 3–8 s (webpack bundle)          │ Fast (Next.js HMR)               │
// │ Build tool      │ Rollup (esbuild for transforms)  │ webpack                         │ webpack / Turbopack              │
// │ Rendering       │ CSR only (SPA)                   │ CSR only (SPA)                  │ CSR, SSR, SSG, ISR, RSC          │
// │ Routing         │ None built-in (add React Router) │ None built-in                   │ File-system routing              │
// │ Bundle size     │ Optimally code-split             │ Large baseline                  │ Depends on pages                 │
// │ Config          │ vite.config.ts — simple, typed   │ Buried in react-scripts          │ next.config.js — opinionated     │
// │ TypeScript      │ First-class (--template react-ts)│ Works but slow TS checks         │ First-class                      │
// │ Learning curve  │ Low                              │ Very low (zero-config)          │ Medium (server concepts)         │
// │ Ideal for       │ SPAs, dashboards, learning       │ Legacy projects only            │ Marketing sites, SEO, full-stack │
// └─────────────────┴──────────────────────────────────┴─────────────────────────────────┴──────────────────────────────────┘
//
// DECISION RULE (simple):
//  • Building a SPA / dashboard / internal tool?               → Vite
//  • Need SSR, SEO, or file-system routing?                    → Next.js
//  • Maintaining an old project you can't migrate?             → CRA (stay put)
//  • Learning React for the first time?                        → Vite (fastest feedback loop)
//
// WHY CRA IS DEAD:
//  The core team stopped accepting feature PRs in 2022. It ships
//  webpack 4 (webpack 5 is current), React 18 support was shaky,
//  and cold-start times are 10-30x slower than Vite. CRA's only
//  remaining use is legacy projects that can't afford a migration.
//
// WHY NOT ALWAYS NEXT.JS:
//  Next.js is a framework with opinions about routing, data
//  fetching, and deployment (Vercel-first). For a pure SPA — a
//  React dashboard, a component library, a learning project —
//  that extra complexity has no payoff. Use the simplest tool
//  that solves your problem.

// ───────────────────────────────────────────────────────────────
// 2. SCAFFOLDING — npm create vite@latest
// ───────────────────────────────────────────────────────────────
//
// STEP-BY-STEP:
//
//   $ npm create vite@latest my-app -- --template react-ts
//   $ cd my-app
//   $ npm install
//   $ npm run dev
//
// The double-dash (--) separates npm's args from Vite's args.
// --template react-ts gives you: React 18 + TypeScript + Vite.
//
// OTHER TEMPLATES (--template <name>):
//   react        React without TypeScript
//   react-ts     React + TypeScript  ← the one you want
//   react-swc    React + SWC (faster transpiler, no TS by default)
//   react-swc-ts React + SWC + TypeScript  ← also good
//   vue, svelte, preact, lit, vanilla, …
//
// ── WHAT EACH GENERATED FILE DOES ──────────────────────────────
//
//  my-app/
//  ├── index.html              ← The single HTML page. Vite reads this as the entry
//  │                             point. Contains <div id="root"> and a <script> tag
//  │                             pointing to src/main.tsx. Do NOT rename without
//  │                             updating vite.config.ts.
//  │
//  ├── vite.config.ts          ← Vite configuration (plugins, aliases, proxy, build).
//  │                             Covered in Section 4.
//  │
//  ├── tsconfig.json           ← TypeScript config for the whole project.
//  │                             Covered in Section 5.
//  │
//  ├── tsconfig.node.json      ← Separate TS config for Node.js files (vite.config.ts
//  │                             itself). Uses "module: ESNext" + "moduleResolution:
//  │                             bundler". Referenced by tsconfig.json via "references".
//  │
//  ├── package.json            ← Project metadata, deps, scripts.
//  │
//  ├── .gitignore              ← Ignores node_modules, dist, .env.local, etc.
//  │
//  └── src/
//      ├── main.tsx            ← App entry point. Calls ReactDOM.createRoot().render().
//      │                         This is where you add global providers (Router, QueryClient).
//      ├── App.tsx             ← Root component. Start your app here.
//      ├── App.css             ← Styles scoped to App.tsx (or delete + use Tailwind).
//      ├── index.css           ← Global styles. Import in main.tsx.
//      ├── vite-env.d.ts       ← Triple-slash ref to vite/client. Gives you
//      │                         import.meta.env types and asset import types.
//      └── assets/
//          └── react.svg       ← Example static asset. Import as a URL.
//
// ── src/main.tsx — THE ENTRY POINT ──────────────────────────────
//
//   import React from 'react'
//   import ReactDOM from 'react-dom/client'
//   import App from './App.tsx'
//   import './index.css'
//
//   ReactDOM.createRoot(document.getElementById('root')!).render(
//     <React.StrictMode>
//       <App />
//     </React.StrictMode>
//   )
//
// React.StrictMode: double-invokes renders and effects in dev to
// surface side-effect bugs. Has zero effect on production builds.
// Keep it — it catches real bugs.

// ───────────────────────────────────────────────────────────────
// 3. FOLDER STRUCTURE CONVENTIONS
// ───────────────────────────────────────────────────────────────
//
// ── TYPE-BASED (small-to-medium apps) ───────────────────────────
//
//  src/
//  ├── components/        Presentational / dumb / "UI" components.
//  │   ├── Button.tsx     Pure components: take props, return JSX.
//  │   ├── Modal.tsx      No API calls, no global state.
//  │   └── index.ts       Barrel export (re-exports all components).
//  │
//  ├── pages/             (also called views/ or routes/)
//  │   ├── HomePage.tsx   One file per route. Composed of components.
//  │   ├── ProfilePage.tsx
//  │   └── NotFoundPage.tsx
//  │
//  ├── hooks/             Custom hooks — logic extracted from components.
//  │   ├── useAuth.ts     Each hook is a plain TS file (no JSX needed).
//  │   ├── useDebounce.ts
//  │   └── usePagination.ts
//  │
//  ├── utils/             Pure functions with no React dependency.
//  │   ├── formatDate.ts  No hooks, no components. Easy to unit-test.
//  │   ├── validators.ts
//  │   └── cn.ts          (className utility — merges clsx + tailwind-merge)
//  │
//  ├── context/           React Context providers.
//  │   ├── AuthContext.tsx
//  │   └── ThemeContext.tsx
//  │
//  ├── api/               (also called services/)
//  │   ├── client.ts      Base axios/fetch instance with base URL + interceptors.
//  │   ├── users.ts       Functions that call the users API.
//  │   └── products.ts
//  │
//  ├── types/             Shared TypeScript types and interfaces.
//  │   ├── user.ts        Types used across multiple files live here.
//  │   ├── api.ts         API response shapes.
//  │   └── index.ts       Barrel export.
//  │
//  ├── assets/            Images, fonts, SVGs imported into components.
//  │   ├── logo.svg
//  │   └── fonts/
//  │
//  ├── main.tsx           Entry point.
//  └── App.tsx            Root component + router setup.
//
// ── FEATURE-BASED (large apps — 10+ features or 5+ devs) ────────
//
//  src/
//  ├── features/
//  │   ├── auth/
//  │   │   ├── components/     LoginForm.tsx, SignupForm.tsx
//  │   │   ├── hooks/          useLogin.ts, useSignup.ts
//  │   │   ├── api/            authApi.ts
//  │   │   ├── types/          auth.ts
//  │   │   └── index.ts        Public API of this feature (what other features can import)
//  │   │
//  │   ├── dashboard/
//  │   │   ├── components/
//  │   │   ├── hooks/
//  │   │   └── index.ts
//  │   │
//  │   └── products/
//  │       ├── components/
//  │       ├── hooks/
//  │       └── index.ts
//  │
//  ├── shared/            Truly cross-cutting (Button, Modal, useDebounce)
//  │   ├── components/
//  │   ├── hooks/
//  │   └── utils/
//  │
//  ├── main.tsx
//  └── App.tsx
//
// WHY FEATURE-BASED FOR LARGE APPS:
//  When a product feature spans components + hooks + API calls,
//  type-based structure forces you to hunt across 4 folders for
//  related code. Feature-based collocates everything for "auth"
//  in one place — one folder to open, one folder to delete.
//  The tradeoff: it requires discipline on the index.ts boundary
//  (features should only import from each other's public API,
//  never reach into another feature's internals).
//
// BARREL EXPORTS (index.ts) — PROS AND CONS:
//  ✅ Clean imports: import { Button, Modal } from '@/components'
//  ❌ Can hurt tree-shaking in very large bundles (Vite usually handles this fine)
//  ❌ Circular import risk grows with barrel files
//  Rule of thumb: use barrels in shared/components, skip them inside features.

// ───────────────────────────────────────────────────────────────
// 4. vite.config.ts — IN DEPTH
// ───────────────────────────────────────────────────────────────
//
// Vite's config is a TypeScript file — fully typed, no JSON quirks.
//
//   import { defineConfig } from 'vite'
//   import react from '@vitejs/plugin-react'
//   import path from 'path'
//
//   export default defineConfig({
//
//     // ── PLUGINS ──────────────────────────────────────────────
//     plugins: [
//       react(),
//       // react() does two things:
//       //   1. Injects the React fast-refresh runtime (HMR without full reload)
//       //   2. Handles the JSX transform (no need to import React in every file)
//       //
//       // Optional: react({ babel: { plugins: ['styled-components'] } })
//       // for Babel-level transforms.
//     ],
//
//     // ── RESOLVE ALIASES ──────────────────────────────────────
//     resolve: {
//       alias: {
//         '@': path.resolve(__dirname, './src'),
//         // After this, import { Button } from '@/components/Button'
//         // resolves to src/components/Button.tsx — works everywhere.
//         //
//         // Add more aliases for common paths:
//         // '@components': path.resolve(__dirname, './src/components'),
//         // '@hooks':      path.resolve(__dirname, './src/hooks'),
//       },
//     },
//
//     // ── DEV SERVER ───────────────────────────────────────────
//     server: {
//       port: 3000,           // default: 5173
//       open: true,           // auto-open browser on npm run dev
//       proxy: {
//         // Forward /api/* to your backend during development.
//         // Avoids CORS issues — your React app thinks it's same-origin.
//         '/api': {
//           target: 'http://localhost:8080',
//           changeOrigin: true,
//           // rewrite: (path) => path.replace(/^\/api/, '')
//           // ↑ use this if your backend doesn't expect /api prefix
//         },
//       },
//     },
//
//     // ── BUILD OPTIONS ────────────────────────────────────────
//     build: {
//       outDir: 'dist',       // default: 'dist'
//       sourcemap: true,      // generate .map files for production debugging
//                             // set to false if you don't want source exposed
//       rollupOptions: {
//         output: {
//           // Manual chunk splitting — put large deps in their own chunk
//           // so they can be cached independently by the browser.
//           manualChunks: {
//             react:  ['react', 'react-dom'],
//             router: ['react-router-dom'],
//           },
//         },
//       },
//       // chunkSizeWarningLimit: 1000,  // warn when chunk > 1000 kB (default: 500)
//     },
//
//     // ── PREVIEW SERVER (after build) ─────────────────────────
//     preview: {
//       port: 4173,           // default port for npm run preview
//     },
//
//   })
//
// NOTES:
//  • __dirname is not available in ESM by default. Either keep
//    "type": "module" and use import.meta.url + fileURLToPath, or
//    add to tsconfig.node.json: "moduleResolution": "bundler".
//    Vite 5's default template handles this correctly.
//  • For path aliases to work in TypeScript IDE (VSCode red squiggles),
//    you ALSO need to add them to tsconfig.json "paths". See Section 5.

// ───────────────────────────────────────────────────────────────
// 5. tsconfig.json FOR REACT — EVERY IMPORTANT FIELD
// ───────────────────────────────────────────────────────────────
//
// The tsconfig.json in this repo (basics/react/tsconfig.json) is
// already the production-ready config. Here is every field explained:
//
//   {
//     "compilerOptions": {
//
//       // ── TARGET & MODULE ────────────────────────────────────
//       "target": "ES2020",
//       // What JS version to emit (or what to type-check against).
//       // ES2020 gives you: Promise.allSettled, BigInt, optional chaining,
//       // nullish coalescing, dynamic import. Safe for all modern browsers.
//       // ES2022 adds: Array.at(), Object.hasOwn(). Both are fine.
//
//       "module": "ESNext",
//       // Module format for imports. ESNext = native ES modules.
//       // Required for Vite (which uses native ESM in dev).
//       // Do NOT use "CommonJS" in a Vite project.
//
//       "moduleResolution": "bundler",
//       // How TypeScript resolves imports. "bundler" (TS 5.0+) matches
//       // Vite/webpack/esbuild behaviour — allows extensionless imports
//       // and .tsx extensions in imports. Alternative: "node16" or "nodenext"
//       // (stricter, requires .js extensions — annoying in React).
//
//       // ── LIB ───────────────────────────────────────────────
//       "lib": ["ES2020", "DOM", "DOM.Iterable"],
//       // Which built-in type definitions to include.
//       // ES2020     → Promise, Map, Set, Symbol, etc.
//       // DOM        → window, document, HTMLElement, fetch, etc.
//       // DOM.Iterable → NodeList is iterable (for...of on querySelectorAll)
//       // If you're targeting Node.js (backend), replace DOM with "node" types.
//
//       // ── JSX ───────────────────────────────────────────────
//       "jsx": "react-jsx",
//       // How TypeScript handles JSX syntax.
//       //
//       // "react"      (old)  Requires `import React from 'react'` in every file.
//       //                     Compiles JSX to React.createElement(...) calls.
//       //
//       // "react-jsx"  (new)  Auto-imports from 'react/jsx-runtime'. You do NOT
//       //                     need `import React` at the top of every component.
//       //                     This is the default since React 17.
//       //
//       // "react-jsxdev"      Same as react-jsx but includes dev-only info
//       //                     (stack traces). Usually set by Vite in dev mode.
//       //
//       // "preserve"         Keeps JSX syntax as-is (for Babel to handle later).
//       //
//       // → Always use "react-jsx" in new projects. Zero boilerplate.
//
//       // ── STRICT MODE ───────────────────────────────────────
//       "strict": true,
//       // Enables the following checks all at once:
//       //   strictNullChecks       — null/undefined are not assignable to other types
//       //   noImplicitAny          — variables must have explicit or inferred types
//       //   strictFunctionTypes    — function parameter types are checked strictly
//       //   strictBindCallApply    — bind/call/apply are type-checked
//       //   strictPropertyInitialization — class properties must be initialized
//       //   noImplicitThis         — 'this' must have a known type
//       //   alwaysStrict           — adds "use strict" to every emitted file
//       //
//       // ALWAYS use strict: true. It catches real bugs at compile time.
//       // Turning it off is a code smell.
//
//       // ── PATHS (aliases) ───────────────────────────────────
//       "baseUrl": ".",
//       // Root for non-relative imports. Required when using "paths".
//       // "." means the project root (where tsconfig.json lives).
//
//       "paths": {
//         "@/*": ["./src/*"]
//         // Now `import { Button } from '@/components/Button'` works
//         // in TypeScript (IDE autocomplete + error checking).
//         // Must match the alias you set in vite.config.ts resolve.alias.
//       },
//
//       // ── OUTPUT CONTROL ────────────────────────────────────
//       "noEmit": true,
//       // TypeScript does NOT write output files. Vite handles transpilation
//       // (via esbuild — much faster than tsc). TypeScript only type-checks.
//       // This is correct for all Vite projects.
//
//       // ── INTEROP ───────────────────────────────────────────
//       "esModuleInterop": true,
//       // Allows: import express from 'express'  (CommonJS module as default import)
//       // Without it you'd need: import * as express from 'express'
//       // Always enable this — most npm packages are still CJS.
//
//       "allowImportingTsExtensions": true,
//       // Allows: import App from './App.tsx'  (explicit .tsx extension in import)
//       // Required when "noEmit": true. Not valid when emitting JS files.
//
//       "resolveJsonModule": true,
//       // Allows: import data from './data.json'
//       // Vite supports this natively; the TS flag makes the IDE happy.
//
//       "isolatedModules": true,
//       // Enforces that each file can be transpiled independently.
//       // Required for esbuild/Babel transforms (which don't do whole-program
//       // analysis). Catches issues like: 'export type' not marked as such.
//
//       // ── SKIP LIB CHECK ────────────────────────────────────
//       "skipLibCheck": true,
//       // Skips type-checking of .d.ts files in node_modules.
//       //
//       // WHY IT'S SAFE:
//       //   Many npm packages have slightly incorrect or conflicting .d.ts
//       //   files. Without skipLibCheck you'd get errors from packages you
//       //   don't control. This flag says: "trust the type definitions,
//       //   just check my code."
//       //
//       // WHEN IT'S RISKY:
//       //   If you're writing a library that other people will consume (and
//       //   your .d.ts files ship to npm), turn this off to ensure your
//       //   type declarations are valid.
//       //
//       // For applications: always true. For published libraries: false.
//
//       "forceConsistentCasingInFileNames": true
//       // Prevents import './Button' when the file is Button.tsx.
//       // Catches case-insensitive filesystem bugs that bite on Linux CI.
//     },
//
//     "include": ["src", "*.tsx", "*.ts", "vite.config.ts"],
//     // Files/directories TypeScript should check.
//
//     "exclude": ["node_modules", "dist"]
//     // node_modules is excluded by default, but explicit is clearer.
//   }

// ───────────────────────────────────────────────────────────────
// 6. ESLINT + PRETTIER
// ───────────────────────────────────────────────────────────────
//
// ESLint catches code problems; Prettier enforces formatting.
// They're complementary — you want both.
//
// ── INSTALL ─────────────────────────────────────────────────────
//
//   npm install -D eslint \
//     @typescript-eslint/parser \
//     @typescript-eslint/eslint-plugin \
//     eslint-plugin-react \
//     eslint-plugin-react-hooks \
//     eslint-plugin-jsx-a11y \
//     prettier \
//     eslint-config-prettier \
//     eslint-plugin-prettier
//
// ── .eslintrc.cjs (or eslint.config.js for ESLint 9 flat config) ─
//
//   module.exports = {
//     root: true,
//     env: { browser: true, es2020: true },
//     parser: '@typescript-eslint/parser',
//     parserOptions: {
//       ecmaVersion: 'latest',
//       sourceType: 'module',
//       ecmaFeatures: { jsx: true },
//     },
//     plugins: [
//       '@typescript-eslint',
//       'react',
//       'react-hooks',
//       'jsx-a11y',
//     ],
//     extends: [
//       'eslint:recommended',
//       'plugin:@typescript-eslint/recommended',
//       'plugin:react/recommended',
//       'plugin:react/jsx-runtime',   // ← disables "React must be in scope" for react-jsx
//       'plugin:react-hooks/recommended',
//       'plugin:jsx-a11y/recommended',
//       'prettier',                   // ← MUST be last: disables ESLint formatting rules
//     ],
//     settings: {
//       react: { version: 'detect' },
//     },
//     rules: {
//       // Customize as needed:
//       '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
//       '@typescript-eslint/no-explicit-any': 'warn',
//       'react-hooks/rules-of-hooks': 'error',   // Hooks only at top level
//       'react-hooks/exhaustive-deps': 'warn',   // Missing dependency arrays
//     },
//   }
//
// ── WHAT EACH PLUGIN DOES ───────────────────────────────────────
//
//   @typescript-eslint/parser         Lets ESLint understand TypeScript syntax.
//   @typescript-eslint/eslint-plugin  Rules for TS-specific issues (no-explicit-any, etc.)
//   eslint-plugin-react               Rules for React (no unknown props, key prop, etc.)
//   eslint-plugin-react-hooks         Enforces Rules of Hooks + exhaustive deps.
//   eslint-plugin-jsx-a11y            Accessibility rules (alt text, aria, roles).
//   eslint-config-prettier            Turns OFF all ESLint rules that clash with Prettier.
//   eslint-plugin-prettier            Runs Prettier as an ESLint rule (optional — many
//                                     teams just run Prettier separately).
//
// ── .prettierrc ─────────────────────────────────────────────────
//
//   {
//     "semi": true,
//     "singleQuote": true,
//     "trailingComma": "es5",
//     "tabWidth": 2,
//     "printWidth": 100,
//     "arrowParens": "always",
//     "endOfLine": "lf"
//   }
//
//   "endOfLine": "lf"  — critical for teams mixing macOS + Windows.
//                        Windows developers get CRLF by default; LF keeps
//                        git diffs clean.
//
// ── .vscode/settings.json (per-project) ─────────────────────────
//
//   {
//     "editor.formatOnSave": true,
//     "editor.defaultFormatter": "esbenp.prettier-vscode",
//     "[typescript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
//     "[typescriptreact]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
//     "editor.codeActionsOnSave": {
//       "source.fixAll.eslint": "explicit"
//     }
//   }
//
//   Commit this file (it's project configuration, not personal preference).
//   Add .vscode/extensions.json to recommend ESLint + Prettier extensions.
//
// ── HOW THEY WORK TOGETHER ──────────────────────────────────────
//
//   Prettier handles: indentation, quotes, semicolons, line length, trailing commas
//   ESLint handles:   real bugs, bad patterns, accessibility, React rules
//
//   Without 'prettier' in extends, ESLint would fight with Prettier over
//   formatting (e.g. ESLint says semi required, Prettier removes it).
//   eslint-config-prettier silences all formatting-only ESLint rules.

// ───────────────────────────────────────────────────────────────
// 7. ENVIRONMENT VARIABLES
// ───────────────────────────────────────────────────────────────
//
// ── THE FILES ───────────────────────────────────────────────────
//
//   .env                 Loaded always. Commit to git for non-secrets.
//                        Example: VITE_APP_NAME=MyApp
//
//   .env.local           Loaded always, NEVER committed to git.
//                        Use for secrets: API keys, tokens.
//                        Vite's default .gitignore includes this.
//
//   .env.development     Loaded in development (npm run dev) only.
//   .env.production      Loaded in production (npm run build) only.
//   .env.test            Loaded when NODE_ENV=test (Vitest).
//
//   .env.development.local   Local overrides for development. Not committed.
//   .env.production.local    Local overrides for production. Not committed.
//
// PRIORITY (highest to lowest):
//   .env.[mode].local > .env.[mode] > .env.local > .env
//
// ── THE VITE_ PREFIX ────────────────────────────────────────────
//
//   VITE_API_URL=https://api.example.com    ← ✅ exposed to browser
//   SECRET_KEY=abc123                        ← ❌ NOT exposed (stays on server)
//
// WHY:
//   Vite statically replaces import.meta.env.VITE_* at build time
//   (like a find-and-replace). Variables WITHOUT the prefix are
//   intentionally stripped — they might be Node.js server secrets
//   (database passwords, private keys) that must never reach the browser.
//   The prefix is a deliberate opt-in to exposure.
//
// ── ACCESSING IN CODE ───────────────────────────────────────────
//
//   const apiUrl = import.meta.env.VITE_API_URL;   // string | undefined
//   const isDev  = import.meta.env.DEV;             // boolean, built-in
//   const isProd = import.meta.env.PROD;            // boolean, built-in
//   const mode   = import.meta.env.MODE;            // "development" | "production"
//   const base   = import.meta.env.BASE_URL;        // base path (from vite config)
//
// ── TYPE SAFETY — vite-env.d.ts ─────────────────────────────────
//
//   Vite generates src/vite-env.d.ts with:
//     /// <reference types="vite/client" />
//
//   This gives you types for import.meta.env (DEV, PROD, MODE, BASE_URL).
//   For your custom VITE_* vars, extend the interface:
//
//     // src/vite-env.d.ts
//     /// <reference types="vite/client" />
//
//     interface ImportMetaEnv {
//       readonly VITE_API_URL: string;
//       readonly VITE_FEATURE_FLAG_DARK_MODE: string;
//       // Add all your VITE_ variables here.
//       // Use string (Vite always provides strings; parse numbers yourself).
//     }
//
//     interface ImportMeta {
//       readonly env: ImportMetaEnv;
//     }
//
//   After this, import.meta.env.VITE_API_URL is typed as string (not any),
//   and you'll get a TypeScript error if you typo the variable name.
//
// ── NEVER COMMIT SECRETS ────────────────────────────────────────
//
//   Rule: if it's a secret (API key, DB password, OAuth secret),
//   put it in .env.local ONLY and ensure .gitignore has:
//     .env*.local
//   Vite's scaffolded .gitignore already includes this.

// ───────────────────────────────────────────────────────────────
// 8. package.json SCRIPTS
// ───────────────────────────────────────────────────────────────
//
//   {
//     "scripts": {
//
//       "dev": "vite"
//       // Starts the Vite dev server (usually localhost:5173).
//       // Uses native ES modules — no bundling step. Changes reflect
//       // immediately via HMR (Hot Module Replacement).
//       // Run when: developing locally.
//
//       "build": "tsc && vite build"
//       // First runs TypeScript type-check (tsc from tsconfig.json),
//       // then Vite bundles the app for production (outputs to dist/).
//       // tsc fails the build if there are type errors — good.
//       // Run when: deploying to production, or checking if the app
//       // is fully correct (type errors + bundle).
//       //
//       // NOTE: Some teams separate these:
//       //   "typecheck": "tsc --noEmit"
//       //   "build": "vite build"
//       // so the build can proceed even if there are type warnings.
//
//       "preview": "vite preview"
//       // Serves the production build from dist/ on a local server.
//       // Run AFTER npm run build.
//       // Use to: verify the production build behaves like dev,
//       // catch issues with base paths, env vars, lazy loading.
//       // This is NOT a dev server — no HMR, no source maps in browser.
//
//       "check": "tsc --noEmit"
//       // Type-checks all TypeScript files without emitting output.
//       // Faster than the full build for catching type errors during dev.
//       // Run when: you want to validate types without rebuilding.
//       // IDE already does this live, but this is useful in CI.
//
//       "lint": "eslint . --ext ts,tsx"
//       // Runs ESLint on all .ts and .tsx files.
//       // Add --fix to auto-fix fixable issues: eslint . --ext ts,tsx --fix
//       // Run when: pre-commit, pre-push, or in CI pipeline.
//
//       "test": "vitest"
//       // Runs Vitest in watch mode (re-runs on file changes).
//       // Use during development.
//
//       "test:run": "vitest run"
//       // Runs Vitest once (no watch). Use in CI.
//
//       "test:ui": "vitest --ui"
//       // Opens the Vitest UI in the browser — visual test runner.
//     }
//   }
//
// WHEN TO RUN EACH:
//
//   Daily dev:        npm run dev
//   Before commit:    npm run check && npm run lint
//   Before push:      npm run build  (catches type errors + bundle issues)
//   Verify deploy:    npm run build && npm run preview
//   In CI pipeline:   npm run build && npm run test:run && npm run lint

// ───────────────────────────────────────────────────────────────
// 9. CSS STRATEGY — COMPARISON
// ───────────────────────────────────────────────────────────────
//
// ┌──────────────────┬──────────────────────────────────────────────────┬──────────────────────────────────┐
// │ Approach         │ Pros                                             │ Cons                             │
// ├──────────────────┼──────────────────────────────────────────────────┼──────────────────────────────────┤
// │ CSS Modules      │ Zero runtime cost. Scoped classes (no collisions)│ Verbose: styles.button syntax.   │
// │ (Button.module   │ Works with any CSS syntax. Ships no extra JS.    │ Harder to use dynamic values.    │
// │  .css)           │ Good for: component libraries, design systems.   │ Less co-location with component. │
// ├──────────────────┼──────────────────────────────────────────────────┼──────────────────────────────────┤
// │ Tailwind CSS v4  │ Design system built-in (spacing, colors, typo).  │ HTML/JSX gets verbose (long      │
// │                  │ No context switching (styles in JSX). Tiny final │ className strings). Requires     │
// │                  │ bundle (purges unused classes). v4: no config    │ learning ~200 utility names.     │
// │                  │ file needed, pure CSS @theme. Very fast builds.  │ Hard to scan visually at first.  │
// │                  │ Good for: apps, dashboards, rapid prototyping.   │                                  │
// ├──────────────────┼──────────────────────────────────────────────────┼──────────────────────────────────┤
// │ styled-          │ True co-location (styles inside component file). │ Runtime CSS injection (small     │
// │ components /     │ Dynamic styles via props. Full TypeScript support│ perf cost). Larger bundle.       │
// │ Emotion          │ Good for: design systems with prop-driven themes.│ RSC incompatible (client-only).  │
// ├──────────────────┼──────────────────────────────────────────────────┼──────────────────────────────────┤
// │ Vanilla CSS      │ No build step, no dependencies. Always works.    │ Global scope (collisions).       │
// │ (index.css)      │ Simplest mental model.                           │ No variables (without custom     │
// │                  │ Good for: tiny projects, prototypes.             │ properties). Hard to scale.      │
// └──────────────────┴──────────────────────────────────────────────────┴──────────────────────────────────┘
//
// THIS REPO USES: Tailwind CSS v4 (via @tailwindcss/vite plugin).
//
// TAILWIND v4 SETUP (what's already done in this project):
//   npm install tailwindcss @tailwindcss/vite
//   In vite.config.ts: plugins: [react(), tailwindcss()]
//   In index.css (or any CSS file): @import "tailwindcss";
//   That's it. No tailwind.config.js needed for basic use.
//
// CSS MODULES SETUP (if you prefer):
//   Zero config — Vite handles it. Just name your file Button.module.css.
//   import styles from './Button.module.css'
//   <button className={styles.button}>
//
// PRACTICAL RECOMMENDATION:
//   • New app from scratch         → Tailwind CSS (most productive after day 2)
//   • Component library            → CSS Modules (consumers bring their own CSS)
//   • Design system with JS themes → styled-components or Emotion
//   • Micro frontend, tiny project → Vanilla CSS

// ───────────────────────────────────────────────────────────────
// 10. DEPENDENCIES vs DEVDEPENDENCIES
// ───────────────────────────────────────────────────────────────
//
// In a React app (not a library), the distinction matters less for
// end users (npm install always installs both), but matters for:
//   • Clarity — tells other devs what's needed at runtime vs build
//   • Docker / CI caching — npm ci --omit=dev skips devDeps
//   • Bundle size auditing — tools report wrong numbers if miscategorized
//
// ── DEPENDENCIES (npm install <pkg>) — needed at runtime ────────
//
//   react                    Core library — renders components
//   react-dom                DOM-specific renderer
//   react-router-dom         Routing — used in the running app
//   @tanstack/react-query    Data fetching — used in the running app
//   zustand                  State management — used in the running app
//   immer                    Immutable updates — used in state logic
//   axios / ky               HTTP client — makes API calls at runtime
//   date-fns / dayjs         Date utilities — called in components
//   zod                      Runtime validation — validates user input
//   lucide-react             Icon components — rendered in JSX
//
// ── DEVDEPENDENCIES (npm install -D <pkg>) — build/test only ────
//
//   vite                     Build tool — only runs during dev/build
//   @vitejs/plugin-react     Vite plugin — build time only
//   typescript               Compiler — type checking at build time
//   @types/react             TS type definitions — IDE + type-check only
//   @types/react-dom         TS type definitions — IDE + type-check only
//   tailwindcss              CSS generation — build time only
//   @tailwindcss/vite        Tailwind Vite plugin — build time only
//   eslint + plugins         Linting — dev/CI only
//   prettier                 Formatting — dev only
//   vitest                   Test runner — test time only
//   @testing-library/react   Test utilities — test time only
//   msw                      API mocking — test time only
//   jsdom                    DOM simulation — test time only
//
// GREY AREA: zod, date-fns
//   These run in the browser, so technically runtime. But if you're
//   doing server-side validation only, move them to devDependencies.
//   Rule: if the bundled app calls it, it's a dependency.
//
// THE EXCEPTION — CSS frameworks:
//   tailwindcss goes in devDependencies — it generates CSS at build
//   time; the output is plain CSS, not a JS runtime dependency.
//   (styled-components goes in dependencies — it runs in the browser.)

// ═══════════════════════════════════════════════════════════════
// PRACTICE Q&A
// ═══════════════════════════════════════════════════════════════

// Q1: What's the difference between .env and .env.local?
// ─────────────────────────────────────────────────────────────
// A: .env is committed to git and shared across the whole team.
//    Use it for non-sensitive config like VITE_APP_NAME or VITE_API_URL
//    in non-production environments where the URL isn't a secret.
//
//    .env.local is NEVER committed to git (it's in .gitignore by default).
//    Use it for secrets: personal API keys, tokens, credentials. It
//    overrides .env — so a developer can set VITE_API_URL=http://localhost:8080
//    in .env.local to override the team's shared .env without affecting others.
//    Think of .env as "shared defaults", .env.local as "my machine overrides".

// Q2: Why do Vite env vars need the VITE_ prefix?
// ─────────────────────────────────────────────────────────────
// A: Because Vite statically inlines VITE_* variables into the browser
//    bundle at build time. Variables without the prefix stay invisible
//    to client-side code — this prevents accidentally shipping server
//    secrets (DB passwords, private API keys) to the browser. The prefix
//    is an explicit opt-in: "I know this value will be public in the bundle."
//    Non-VITE_ vars can still be read in vite.config.ts via process.env,
//    but they never reach import.meta.env in the component code.

// Q3: What does "jsx": "react-jsx" in tsconfig enable vs "react"?
// ─────────────────────────────────────────────────────────────
// A: "react" (old transform, pre-React 17) compiles JSX to
//    React.createElement() calls. This means every file using JSX
//    must have `import React from 'react'` at the top — even if
//    React is never referenced directly in your code.
//
//    "react-jsx" (new automatic transform, React 17+) auto-imports
//    from 'react/jsx-runtime' behind the scenes. You no longer need
//    the React import boilerplate. It also produces slightly smaller
//    output because jsx() calls in the new runtime are more optimized
//    than createElement() for static children.
//
//    You also need `plugin:react/jsx-runtime` in your ESLint config
//    so it doesn't flag the missing React import as an error.

// Q4: When would you use feature-based folder structure over type-based?
// ─────────────────────────────────────────────────────────────
// A: Switch to feature-based when:
//    1. You have 10+ distinct product features (auth, billing, dashboard…)
//    2. Multiple developers work on the same codebase simultaneously
//    3. You find yourself editing 4–5 folders to make one feature change
//    4. Features need to be independently deployable (micro-frontends)
//
//    Type-based (components/, hooks/, utils/) works well when the app is
//    small enough that any developer knows every file. Feature-based
//    enforces boundaries — you only import from a feature's public API
//    (its index.ts), never reach into its internals. This prevents the
//    spaghetti coupling that kills large codebases.
//
//    Practical signal: if your components/ folder has more than ~20 files
//    and you can group them into product domains, go feature-based.

// Q5: What does skipLibCheck: true do and when is it safe?
// ─────────────────────────────────────────────────────────────
// A: skipLibCheck: true tells TypeScript to skip type-checking of all
//    .d.ts files in node_modules. Without it, TypeScript validates every
//    type declaration file it encounters — including third-party packages.
//
//    Many npm packages have subtly wrong .d.ts files, or packages conflict
//    with each other's type declarations (two packages that each declare
//    a global type slightly differently). These errors are outside your
//    control and just create noise.
//
//    SAFE TO USE when: building an application (the final consumer). You
//    care that your code is correct; you trust that the packages you're
//    importing work at runtime.
//
//    RISKY when: you're the author of a library whose .d.ts files will be
//    shipped to npm and used by others. In that case, disable skipLibCheck
//    so TypeScript catches problems in your own exported type declarations.

// ═══════════════════════════════════════════════════════════════
// DEMO COMPONENT — Visual Reference Card
// ═══════════════════════════════════════════════════════════════

const card: React.CSSProperties = {
    background: '#0f172a',
    color: '#e2e8f0',
    fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
    padding: '32px',
    borderRadius: '12px',
    maxWidth: '900px',
    margin: '32px auto',
    lineHeight: 1.6,
    fontSize: '13px',
};

const section: React.CSSProperties = {
    marginBottom: '28px',
};

const heading: React.CSSProperties = {
    color: '#38bdf8',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: '12px',
    borderBottom: '1px solid #1e3a5f',
    paddingBottom: '6px',
};

const grid: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
};

const codeBlock: React.CSSProperties = {
    background: '#1e293b',
    borderRadius: '6px',
    padding: '12px 16px',
    fontSize: '12px',
    lineHeight: 1.7,
    overflowX: 'auto',
    whiteSpace: 'pre',
};

const pill = (color: string): React.CSSProperties => ({
    display: 'inline-block',
    background: color,
    color: '#fff',
    borderRadius: '4px',
    padding: '1px 7px',
    fontSize: '11px',
    fontWeight: 600,
    marginRight: '6px',
});

const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
};

const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '6px 10px',
    background: '#1e3a5f',
    color: '#7dd3fc',
    fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
    padding: '5px 10px',
    borderBottom: '1px solid #1e293b',
    verticalAlign: 'top',
};

function FolderTree() {
    const entries: [string, string, string][] = [
        ['src/components/', '#86efac', 'Presentational / UI components (no API calls)'],
        ['src/pages/',      '#fde68a', 'One file per route, composed of components'],
        ['src/hooks/',      '#c4b5fd', 'Custom hooks — logic extracted from components'],
        ['src/utils/',      '#fb923c', 'Pure functions — no hooks, easy to unit test'],
        ['src/context/',    '#67e8f9', 'React Context providers'],
        ['src/api/',        '#f9a8d4', 'HTTP calls — axios/fetch wrappers per resource'],
        ['src/types/',      '#a3e635', 'Shared TypeScript interfaces and types'],
        ['src/assets/',     '#94a3b8', 'Images, SVGs, fonts — imported into components'],
    ];
    return (
        <div style={section}>
            <div style={heading}>Folder Structure (type-based)</div>
            {entries.map(([path, color, desc]) => (
                <div key={path} style={{ display: 'flex', gap: '12px', marginBottom: '4px', alignItems: 'baseline' }}>
                    <span style={{ color, minWidth: '200px', fontWeight: 600 }}>{path}</span>
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>{desc}</span>
                </div>
            ))}
        </div>
    );
}

function TsconfigCard() {
    const fields: [string, string, string][] = [
        ['"target"',              '"ES2020"',         'JS version to type-check against'],
        ['"module"',              '"ESNext"',          'Native ES modules — required for Vite'],
        ['"moduleResolution"',    '"bundler"',         'Matches Vite/esbuild resolution (TS 5+)'],
        ['"lib"',                 '["ES2020","DOM",…]','Built-in types: DOM APIs, iterables'],
        ['"jsx"',                 '"react-jsx"',       'No `import React` needed in every file'],
        ['"strict"',              'true',              'All strict checks (nulls, implicit any, …)'],
        ['"noEmit"',              'true',              'TS only type-checks; Vite does the build'],
        ['"skipLibCheck"',        'true',              'Skip .d.ts checks in node_modules'],
        ['"isolatedModules"',     'true',              'Each file transpilable independently'],
        ['"baseUrl" + "paths"',   '{ "@/*": … }',      'Path aliases — match vite.config resolve'],
    ];
    return (
        <div style={section}>
            <div style={heading}>tsconfig.json — Key Fields</div>
            <div style={codeBlock}>
                {fields.map(([key, value, note]) => (
                    <div key={key} style={{ display: 'flex', gap: '12px', marginBottom: '3px' }}>
                        <span style={{ color: '#7dd3fc', minWidth: '210px' }}>{key}:</span>
                        <span style={{ color: '#86efac', minWidth: '130px' }}>{value}</span>
                        <span style={{ color: '#64748b' }}>// {note}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ViteConfigCard() {
    return (
        <div style={section}>
            <div style={heading}>vite.config.ts — Shape</div>
            <div style={codeBlock}>
                <span style={{ color: '#94a3b8' }}>{'import { defineConfig } from '}</span>
                <span style={{ color: '#fde68a' }}>'vite'</span>
                {'\n'}
                <span style={{ color: '#94a3b8' }}>{'import react from '}</span>
                <span style={{ color: '#fde68a' }}>'@vitejs/plugin-react'</span>
                {'\n\n'}
                <span style={{ color: '#38bdf8' }}>{'export default defineConfig({'}</span>
                {'\n'}
                {'  '}<span style={{ color: '#c4b5fd' }}>plugins</span>
                <span style={{ color: '#94a3b8' }}>{': [react()],'}</span>
                <span style={{ color: '#475569' }}>{'           // HMR + JSX transform'}</span>
                {'\n'}
                {'  '}<span style={{ color: '#c4b5fd' }}>resolve</span>
                <span style={{ color: '#94a3b8' }}>{': { alias: { \'@\': \'./src\' } },'}</span>
                <span style={{ color: '#475569' }}>{'  // @/… imports'}</span>
                {'\n'}
                {'  '}<span style={{ color: '#c4b5fd' }}>server</span>
                <span style={{ color: '#94a3b8' }}>{': { port: 3000, proxy: { \'/api\': … } },'}</span>
                {'\n'}
                {'  '}<span style={{ color: '#c4b5fd' }}>build</span>
                <span style={{ color: '#94a3b8' }}>{': { sourcemap: true, outDir: \'dist\' },'}</span>
                {'\n'}
                <span style={{ color: '#38bdf8' }}>{'});'}</span>
            </div>
        </div>
    );
}

function EnvCard() {
    const files: [string, string, string][] = [
        ['.env',                  '#86efac', 'Committed. Shared defaults. Non-secrets only.'],
        ['.env.local',            '#f87171', 'NOT committed. Personal secrets + overrides.'],
        ['.env.development',      '#fde68a', 'Committed. Dev-only config.'],
        ['.env.production',       '#fb923c', 'Committed. Prod-only config.'],
        ['.env.development.local','#94a3b8', 'NOT committed. Local dev overrides.'],
    ];
    return (
        <div style={section}>
            <div style={heading}>Environment Variables</div>
            {files.map(([name, color, note]) => (
                <div key={name} style={{ display: 'flex', gap: '12px', marginBottom: '5px', alignItems: 'baseline' }}>
                    <span style={{ color, fontWeight: 600, minWidth: '220px' }}>{name}</span>
                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>{note}</span>
                </div>
            ))}
            <div style={{ ...codeBlock, marginTop: '12px' }}>
                <span style={{ color: '#f87171' }}>VITE_API_URL</span>
                <span style={{ color: '#94a3b8' }}>=https://api.example.com   </span>
                <span style={{ color: '#475569' }}>// ✅ exposed to browser</span>
                {'\n'}
                <span style={{ color: '#475569' }}>SECRET_KEY</span>
                <span style={{ color: '#94a3b8' }}>=abc123                    </span>
                <span style={{ color: '#475569' }}>// ❌ stripped — never reaches browser</span>
                {'\n\n'}
                <span style={{ color: '#94a3b8' }}>{'const url = '}</span>
                <span style={{ color: '#7dd3fc' }}>{'import.meta.env'}</span>
                <span style={{ color: '#94a3b8' }}>.VITE_API_URL;</span>
            </div>
        </div>
    );
}

function CssStrategyTable() {
    const rows: [string, string, string][] = [
        ['CSS Modules',    'Zero runtime, scoped, any CSS syntax',        'Verbose, dynamic values awkward'],
        ['Tailwind v4',    'Design system built-in, tiny bundle, fast',   'Long classNames, learning curve'],
        ['styled-components','Co-location, prop-driven dynamic styles',   'Runtime cost, RSC incompatible'],
        ['Vanilla CSS',    'Zero config, simplest mental model',          'Global scope, hard to scale'],
    ];
    return (
        <div style={section}>
            <div style={heading}>CSS Strategies</div>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Approach</th>
                        <th style={thStyle}>Pros</th>
                        <th style={thStyle}>Cons</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(([name, pros, cons]) => (
                        <tr key={name}>
                            <td style={{ ...tdStyle, color: '#fde68a', fontWeight: 600 }}>{name}</td>
                            <td style={{ ...tdStyle, color: '#86efac' }}>{pros}</td>
                            <td style={{ ...tdStyle, color: '#f87171' }}>{cons}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function DepCategoriesCard() {
    return (
        <div style={{ ...section, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
                <div style={{ ...heading, color: '#86efac' }}>dependencies (runtime)</div>
                <div style={codeBlock}>
                    {[
                        'react, react-dom',
                        'react-router-dom',
                        '@tanstack/react-query',
                        'zustand, immer',
                        'axios / ky',
                        'zod (if validating in browser)',
                        'date-fns / dayjs',
                        'lucide-react',
                    ].map(d => (
                        <div key={d} style={{ color: '#86efac', marginBottom: '2px' }}>+ {d}</div>
                    ))}
                </div>
            </div>
            <div>
                <div style={{ ...heading, color: '#f87171' }}>devDependencies (build/test)</div>
                <div style={codeBlock}>
                    {[
                        'vite, @vitejs/plugin-react',
                        'typescript',
                        '@types/react, @types/react-dom',
                        'tailwindcss, @tailwindcss/vite',
                        'eslint + plugins',
                        'prettier',
                        'vitest, @testing-library/react',
                        'msw, jsdom',
                    ].map(d => (
                        <div key={d} style={{ color: '#f87171', marginBottom: '2px' }}>- {d}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ScriptsCard() {
    const scripts: [string, string, string][] = [
        ['dev',       'vite',            'Dev server + HMR — daily development'],
        ['build',     'tsc && vite build','Type-check then bundle for production'],
        ['preview',   'vite preview',    'Serve the dist/ build locally to verify'],
        ['check',     'tsc --noEmit',    'Type-check only, no build output'],
        ['lint',      'eslint . --ext ts,tsx', 'Lint all TS/TSX files'],
        ['test',      'vitest',          'Run tests in watch mode'],
        ['test:run',  'vitest run',      'Run tests once (CI)'],
    ];
    return (
        <div style={section}>
            <div style={heading}>package.json Scripts</div>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Script</th>
                        <th style={thStyle}>Command</th>
                        <th style={thStyle}>When to run</th>
                    </tr>
                </thead>
                <tbody>
                    {scripts.map(([name, cmd, when]) => (
                        <tr key={name}>
                            <td style={{ ...tdStyle, color: '#7dd3fc', fontWeight: 700 }}>npm run {name}</td>
                            <td style={{ ...tdStyle, color: '#86efac' }}>{cmd}</td>
                            <td style={{ ...tdStyle, color: '#94a3b8' }}>{when}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function BuildToolsTable() {
    const rows: [string, string, string, string][] = [
        ['Vite',    '✅ Active',    'CSR SPA / dashboard / learning', 'Instant HMR, simple config'],
        ['Next.js', '✅ Active',    'SSR, SEO, file-system routing',  'Full-stack, Vercel-optimised'],
        ['CRA',     '❌ Unmaintained', 'Legacy projects only',        'webpack 4, 10-30s cold start'],
    ];
    return (
        <div style={section}>
            <div style={heading}>Build Tool Comparison</div>
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Tool</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Use when</th>
                        <th style={thStyle}>Highlight</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(([tool, status, use, note]) => (
                        <tr key={tool}>
                            <td style={{ ...tdStyle, color: '#fde68a', fontWeight: 700 }}>{tool}</td>
                            <td style={{ ...tdStyle, color: status.startsWith('✅') ? '#86efac' : '#f87171' }}>{status}</td>
                            <td style={{ ...tdStyle, color: '#94a3b8' }}>{use}</td>
                            <td style={{ ...tdStyle, color: '#94a3b8' }}>{note}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function SetupAndToolingDemo() {
    return (
        <div style={card}>
            {/* Header */}
            <div style={{ marginBottom: '28px' }}>
                <div style={{ color: '#38bdf8', fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
                    React 00 — Setup & Tooling
                </div>
                <div style={{ color: '#64748b', fontSize: '12px' }}>
                    Reference card · read the file comments for full explanations
                </div>
            </div>

            {/* Badge row */}
            <div style={{ marginBottom: '24px' }}>
                <span style={pill('#0ea5e9')}>Vite 5</span>
                <span style={pill('#8b5cf6')}>React 18</span>
                <span style={pill('#3b82f6')}>TypeScript 5</span>
                <span style={pill('#10b981')}>Tailwind v4</span>
                <span style={pill('#f59e0b')}>ESLint + Prettier</span>
            </div>

            {/* Scaffold command */}
            <div style={section}>
                <div style={heading}>Scaffold Command</div>
                <div style={{ ...codeBlock, color: '#86efac' }}>
                    {'npm create vite@latest my-app -- --template react-ts\ncd my-app && npm install && npm run dev'}
                </div>
            </div>

            <BuildToolsTable />
            <FolderTree />

            {/* Two column: tsconfig + vite */}
            <div style={{ ...grid, marginBottom: '28px' }}>
                <div><TsconfigCard /></div>
                <div><ViteConfigCard /></div>
            </div>

            <EnvCard />
            <ScriptsCard />
            <CssStrategyTable />
            <DepCategoriesCard />

            {/* Footer */}
            <div style={{ marginTop: '24px', borderTop: '1px solid #1e293b', paddingTop: '16px', color: '#475569', fontSize: '11px' }}>
                See file comments for: full tsconfig field explanations · ESLint/Prettier config · .env type safety ·
                feature-based vs type-based folder structure · full Practice Q&A
            </div>
        </div>
    );
}
