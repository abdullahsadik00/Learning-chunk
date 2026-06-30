// ═══════════════════════════════════════════════════════════════
// TYPESCRIPT 00: SETUP & TOOLING  (Reference)
// Run: npx ts-node 00-setup-and-tooling.ts
// ═══════════════════════════════════════════════════════════════
//
// This file covers everything BEFORE you write your first type:
//  • Installing TypeScript (global vs local)
//  • tsconfig.json — every field that matters
//  • @types/* packages and DefinitelyTyped
//  • TypeScript with Node.js (ts-node, tsx, tsc + node)
//  • TypeScript with a bundler (Vite / webpack)
//  • TypeScript in a monorepo
//  • Useful CLI commands
//  • Common mistakes
//
// The other files (01-fundamentals.ts onward) teach the type
// system itself. Read THIS file first if you want to understand
// the toolchain those files run on.

// ───────────────────────────────────────────────────────────────
// 1. INSTALLING TYPESCRIPT
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Installing TypeScript ===");

/*
  TWO WAYS TO INSTALL
  ───────────────────
  Global install:
    npm install -g typescript
    tsc --version        ← works anywhere in your shell

  Local install (PREFERRED):
    npm install --save-dev typescript
    npx tsc --version    ← uses the version locked in this project

  WHY LOCAL IS PREFERRED
  ──────────────────────
  A global install means every project on your machine shares the
  same tsc version. When one project needs TS 4.x and another
  needs TS 5.x you'll get silent, hard-to-debug mismatches.

  A local install pins the exact version in package.json, so:
    • Every developer on the team runs the same compiler.
    • CI runs exactly what your package.json says.
    • You can upgrade per-project without affecting others.

  INITIALISE A PROJECT
  ─────────────────────
    npx tsc --init

  This writes a tsconfig.json with every option commented out.
  You then uncomment and set the ones you need.

  THE THREE EXECUTION TOOLS
  ──────────────────────────
  1. tsc          — the official TypeScript compiler (ships with typescript).
                    Reads tsconfig.json, type-checks, emits .js files.
                    Usage:  npx tsc
                    Does NOT run the output. You need node dist/index.js after.

  2. ts-node      — compile + run in one step (no .js files written to disk).
                    Usage:  npx ts-node src/index.ts
                    Great for scripts, REPLs, and this learning repo.
                    Slower on large projects because it compiles on every run.
                    Requires a separate package: npm i -D ts-node

  3. tsx           — a faster drop-in replacement for ts-node.
                    Usage:  npx tsx src/index.ts
                    Built on esbuild (transpile-only — does NOT type-check).
                    Supports ESM natively.
                    Best for quick iteration; run tsc --noEmit separately to
                    catch type errors.
                    Requires: npm i -D tsx

  WHEN TO USE EACH
  ─────────────────
  • Learning / scripts → ts-node or tsx (run directly)
  • Production Node.js  → tsc to emit, then node dist/
  • React / Vite app    → bundler handles transpilation,
                          tsc --noEmit for type-checking only
*/

// Illustrative: nothing to execute here, but the runtime
// representation of "what tool am I in?" can be checked:
const execEnv: string = process.env.npm_lifecycle_event ?? "direct";
console.log("  Execution environment hint:", execEnv);

// ───────────────────────────────────────────────────────────────
// 2. tsconfig.json — EVERY FIELD THAT MATTERS
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. tsconfig.json fields ===");

/*
  A minimal but production-ready tsconfig.json for a Node.js project:

  {
    "compilerOptions": {
      "target":            "ES2022",
      "module":            "CommonJS",
      "moduleResolution":  "node",
      "lib":               ["ES2022"],
      "outDir":            "./dist",
      "rootDir":           "./src",
      "strict":            true,
      "esModuleInterop":   true,
      "resolveJsonModule": true,
      "skipLibCheck":      true,
      "declaration":       true,
      "declarationMap":    true,
      "sourceMap":         true
    },
    "include": ["src/\*\*\/*"],
    "exclude": ["node_modules", "dist"]
  }

  Below, every important field is explained.
*/

// ── 2a. strict ────────────────────────────────────────────────
/*
  "strict": true

  This is an UMBRELLA flag. It turns on a whole group of checks
  that are all off by default. Setting strict: true is equivalent
  to individually enabling:

    noImplicitAny         — error when TS infers `any` because you
                            didn't annotate a parameter.
                            Without this: function f(x) { }  ← x is any silently
                            With this:    must write f(x: string)

    strictNullChecks      — null and undefined are NOT assignable to
                            other types. Forces you to handle them.
                            Without: let s: string = null;  ← allowed!
                            With:    must use  string | null

    strictFunctionTypes   — enforces contravariance on function
                            parameter types (prevents unsafe callbacks).

    strictBindCallApply   — .bind(), .call(), .apply() are type-checked
                            against the actual function signature.

    strictPropertyInitialization — class properties must be assigned
                            in the constructor or given a definite
                            assignment assertion (!).

    noImplicitThis        — error when `this` inside a function has
                            type `any`.

    alwaysStrict          — emits "use strict" in every output file.

  RECOMMENDATION: always start with "strict": true.
  Turning it off removes half the value of TypeScript.
*/

// Example of what strictNullChecks prevents:
function greetUser(name: string | null): string {
    // Without strictNullChecks you could skip this check and
    // get a runtime crash. With it, TS forces you to handle null.
    if (name === null) {
        return "Hello, stranger!";
    }
    return `Hello, ${name}!`;
}
console.log("  greetUser:", greetUser(null));

// ── 2b. target ────────────────────────────────────────────────
/*
  "target": "ES2015" | "ES2020" | "ES2022" | "ESNext"

  Controls what JavaScript syntax the compiler OUTPUTS.
  It does NOT affect which syntax you can write in your .ts files
  (the lib field controls that).

  ES2015 → async/await is downlevelled to __awaiter generators.
            Arrow functions may be kept or transpiled.
  ES2020 → Optional chaining (?.) and nullish coalescing (??)
            are emitted as-is (no polyfill needed in modern runtimes).
  ES2022 → Class fields, top-level await, Array.at().
  ESNext → Always the latest syntax. Only use when you fully
            control the runtime version.

  RULE OF THUMB:
    Node 18+       → "ES2022"
    Node 16        → "ES2020"
    Browser (Vite) → set in Vite's build.target, not tsconfig
*/

// ── 2c. module ────────────────────────────────────────────────
/*
  "module": "CommonJS" | "ESNext" | "NodeNext" | "Node16"

  Controls the MODULE FORMAT of the emitted .js files.

  CommonJS  → require() / module.exports
              Use for: Node.js packages that aren't pure ESM,
              ts-node scripts, Jest (without transform config).

  ESNext    → import / export (static ES modules)
              Use for: browser bundles consumed by a bundler
              (Vite, webpack, Rollup). The bundler handles the rest.

  NodeNext  → Modern Node.js ESM support. Requires .js extensions
  Node16     in import paths even inside .ts files. Stricter but
              correct for native Node ESM projects.

  COMMON PAIR:
    Node app (CJS):  "module": "CommonJS", "moduleResolution": "node"
    Browser / Vite:  "module": "ESNext",   "moduleResolution": "bundler"
*/

// ── 2d. moduleResolution ─────────────────────────────────────
/*
  "moduleResolution": "node" | "bundler" | "node16" | "nodenext"

  This is SEPARATE from module. It controls HOW TypeScript
  FINDS type definitions for imports — not what it emits.

  "node"     → Classic Node.js algorithm: look in node_modules,
               try .ts → .d.ts → index.ts.
               Missing: it won't resolve "exports" field in
               package.json (the modern way packages publish types).

  "bundler"  → Added in TS 5.0. Understands package.json "exports",
               does NOT require .js extensions on relative imports.
               Best choice for projects using Vite/webpack/Rollup.

  "node16" /
  "nodenext" → For projects using Node.js native ESM. Requires
               explicit .js extensions on all relative imports.

  THE CLASSIC BUG:
    You use a library that ships an "exports" map (e.g. Remix,
    Next.js internals). With "node" resolution TS can't find
    the types and gives "Module not found". Switch to "bundler"
    or "node16" to fix it.
*/

// ── 2e. lib ───────────────────────────────────────────────────
/*
  "lib": ["ES2022", "DOM", "DOM.Iterable"]

  Tells TypeScript which built-in API declarations to include.
  These are ONLY type declarations — they don't polyfill anything
  at runtime.

  Common values:
    "ES2020"       → Promise.allSettled, BigInt, globalThis, etc.
    "ES2022"       → Array.at(), Object.hasOwn(), Error.cause
    "DOM"          → window, document, fetch, HTMLElement, etc.
    "DOM.Iterable" → for...of on NodeList, HTMLCollection, etc.
    "ESNext.Intl"  → Intl.ListFormat, Intl.Segmenter, etc.

  NOTE: When you set "target", TypeScript also infers a default
  lib. Setting "lib" explicitly OVERRIDES those defaults, so you
  must list everything you need.

  For a Node.js project (no browser globals):
    "lib": ["ES2022"]

  For a React / browser project:
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
*/

// ── 2f. outDir / rootDir ─────────────────────────────────────
/*
  "outDir": "./dist"
  "rootDir": "./src"

  outDir  → where compiled .js (and .d.ts, .map) files go.
  rootDir → where your source .ts files live.

  TypeScript mirrors the rootDir folder structure inside outDir.
  Example:
    src/utils/helper.ts  → dist/utils/helper.js
    src/index.ts         → dist/index.js

  If you omit rootDir, TS infers it from your source files —
  but it can be fragile when your tree is complex, so set it
  explicitly.
*/

// ── 2g. baseUrl + paths ───────────────────────────────────────
/*
  "baseUrl": ".",
  "paths": {
    "@/*": ["src/*"],
    "@utils/*": ["src/utils/*"]
  }

  This lets you write:
    import { formatDate } from "@utils/date";
  instead of:
    import { formatDate } from "../../utils/date";

  IMPORTANT: paths in tsconfig only satisfy the TypeScript
  COMPILER. At runtime (Node.js / ts-node) you also need
  tsconfig-paths to resolve these aliases:

    npm i -D tsconfig-paths
    ts-node -r tsconfig-paths/register src/index.ts

  Bundlers (Vite, webpack) have their own alias config that must
  MATCH your tsconfig paths:
    // vite.config.ts
    resolve: { alias: { "@": path.resolve(__dirname, "src") } }
*/

// ── 2h. skipLibCheck ─────────────────────────────────────────
/*
  "skipLibCheck": true

  Tells the compiler to skip type-checking all .d.ts files in
  node_modules. This is a SPEED optimisation.

  WHEN IT'S SAFE:
    Most of the time. Library type bugs are the library author's
    problem, and checking them adds compile time without helping
    your code.

  WHEN IT'S DANGEROUS:
    If your own code generates .d.ts files AND you have a bug in
    your own ambient declarations, skipLibCheck silences it.
    In a library you're publishing, turn it off before release to
    validate your own declarations.
*/

// ── 2i. noEmit ────────────────────────────────────────────────
/*
  "noEmit": true

  Tells tsc to type-check but NOT write any output files.

  USE CASE — Vite / webpack projects:
    The bundler handles transpilation (much faster than tsc).
    You run tsc --noEmit only to get type errors.
    The two jobs are completely separate:
      npm run dev    → Vite serves, no type errors shown in terminal
      npm run check  → tsc --noEmit, fails on type errors
      npm run build  → Vite bundles; CI also runs check separately

  If noEmit is true and someone accidentally runs tsc, nothing
  breaks — no stale dist/ files are written.
*/

// ── 2j. declaration + declarationMap + sourceMap ─────────────
/*
  "declaration":    true  → emit .d.ts files alongside .js
  "declarationMap": true  → emit .d.ts.map (maps types back to .ts source)
  "sourceMap":      true  → emit .js.map (maps runtime errors back to .ts)

  FOR LIBRARY AUTHORS:
    Without "declaration: true", consumers of your npm package
    get no type information — they see `any` everywhere.
    Always set this when publishing a package.

  declarationMap lets IDEs "Go to definition" and land on your
  .ts source (not the compiled .d.ts), which is crucial for
  debugging a library you're actively developing.

  sourceMap is for runtime debugging. Node.js, browsers, and
  error-tracking services (Sentry etc.) use .map files to show
  the original TypeScript line numbers in stack traces.

  FOR APP DEVELOPERS (not publishing a package):
    declaration is optional (you won't consume your own .d.ts).
    sourceMap is still valuable for production error tracking.
*/

// ── 2k. esModuleInterop ───────────────────────────────────────
/*
  "esModuleInterop": true

  PROBLEM IT SOLVES:
    CommonJS modules export via module.exports = { ... }.
    When you import them with ES module syntax:
      import express from "express";
    TypeScript used to require:
      import * as express from "express";
    which is ugly and wrong (express is not a namespace object).

  With esModuleInterop: true, TypeScript adds a small helper that
  wraps the CommonJS default export so the natural syntax works:
      import express from "express";  // ✅ now works

  ALSO enables: allowSyntheticDefaultImports (implicitly set to
  true). That flag alone just suppresses the error; esModuleInterop
  also emits the actual glue code.

  RECOMMENDATION: always true for Node.js projects. Most starter
  templates (CRA, Vite, ts-node) set it automatically.
*/

// ── 2l. resolveJsonModule ─────────────────────────────────────
/*
  "resolveJsonModule": true

  Allows importing .json files directly:
    import data from "./data.json";
    console.log(data.version);  // fully typed!

  TypeScript infers the shape of the JSON at compile time, so
  you get full autocomplete and type safety on JSON imports.

  Without this flag, the import causes a compile error.
*/

// Demonstrating JSON module usage in principle:
// (actual import would be: import pkg from "../../package.json";)
const exampleJsonData: { version: string; name: string } = {
    version: "1.0.0",
    name: "learning-chunk",
};
console.log("  example JSON data:", exampleJsonData.version);

// ── 2m. include / exclude ─────────────────────────────────────
/*
  "include": ["src/\*\*\/*"],
  "exclude": ["node_modules", "dist", "\*\*\/*.spec.ts"]

  include: glob patterns for files TypeScript compiles.
           Default: all .ts/.tsx/.d.ts in the project (minus exclude).
           Explicit include is safer — avoids accidentally compiling
           test helpers or generated files.

  exclude: glob patterns for files TypeScript should NOT compile.
           node_modules and dist are excluded by default even if
           you don't list them (but listing them is harmless).

  NOTE: "exclude" does NOT prevent a file from being compiled if
  it is referenced by an included file via import. It only
  prevents the file from being compiled as a root entry point.
*/

// ── 2n. references (project references) ──────────────────────
/*
  "references": [{ "path": "../shared" }]   ← in consuming project
  "composite": true                          ← in referenced project

  FOR MONOREPOS / LARGE PROJECTS
  ────────────────────────────────
  Project references let you split a codebase into sub-projects
  that are compiled independently. tsc can then build only the
  parts that changed (incremental builds).

  Detailed example in Section 6 (monorepo).
*/

// ───────────────────────────────────────────────────────────────
// 3. @types/* PACKAGES AND DEFINITELYTYPED
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. @types/* packages ===");

/*
  WHAT IS DEFINITELYTYPED?
  ─────────────────────────
  Many older npm packages were written in plain JavaScript and
  ship no TypeScript type declarations. DefinitelyTyped
  (github.com/DefinitelyTyped/DefinitelyTyped) is a community
  repo of hand-written type declarations for those packages.
  They are published under the @types/ scope on npm.

  EXAMPLES:
    npm i -D @types/node       ← types for Node.js built-ins (fs, path, etc.)
    npm i -D @types/express    ← types for the express package
    npm i -D @types/jest       ← types for jest globals (describe, it, expect)

  WHY @types/node SPECIFICALLY?
  ──────────────────────────────
  When you use Node.js APIs like process, Buffer, __dirname,
  require, etc. TypeScript needs to know their types. They don't
  live in the browser DOM types ("lib": ["DOM"]) — they're in
  @types/node. Without it, `process.env` is an error.

  HOW TYPESCRIPT FINDS TYPES
  ───────────────────────────
  1. It looks inside node_modules/@types/ automatically.
     No tsconfig change needed — just install the package.

  2. You can customise this with:
     "typeRoots": ["./node_modules/@types", "./my-types"]
       → only look in these directories (overrides auto-discovery)
     "types": ["node", "jest"]
       → only include these specific @types packages

     Tip: don't set "types" unless you need to exclude something —
     it's easy to forget a package and wonder why its globals vanish.

  PACKAGES THAT SHIP THEIR OWN TYPES
  ────────────────────────────────────
  Modern packages written in TypeScript (or that explicitly
  maintain .d.ts files) include their types in the package itself.
  Look for a "types" or "typings" field in their package.json.

  Examples that DON'T need @types/:
    axios, zod, prisma, next, vite, @tanstack/query-core, zustand

  You can tell by checking:
    cat node_modules/axios/package.json | grep '"types"'

  WRITING YOUR OWN AMBIENT DECLARATIONS
  ──────────────────────────────────────
  When a package has no types at all (no @types/ either), you can
  declare it yourself with a .d.ts file:

    // src/types/untyped-lib.d.ts
    declare module "some-untyped-library" {
      export function doThing(x: string): void;
    }

  Or to silence the error with a broad type:
    declare module "some-untyped-library";   // typed as `any`

  You can also augment global scope:
    // src/types/globals.d.ts
    declare global {
      interface Window {
        myCustomFlag: boolean;
      }
    }
    export {};  // needed to make this a module, not a script
*/

// Type-only demonstration (no runtime effect):
type NodeVersion = {
    major: number;
    minor: number;
    patch: number;
};
const nodeVer: NodeVersion = { major: 18, minor: 19, patch: 0 };
console.log("  Node version example:", `${nodeVer.major}.${nodeVer.minor}.${nodeVer.patch}`);

// ───────────────────────────────────────────────────────────────
// 4. TYPESCRIPT WITH NODE.JS
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. TypeScript with Node.js ===");

/*
  OPTION A — ts-node (development only)
  ───────────────────────────────────────
  npm install --save-dev ts-node typescript @types/node

  Run a file:
    npx ts-node src/index.ts

  With path aliases (baseUrl + paths in tsconfig):
    npm install --save-dev tsconfig-paths
    npx ts-node -r tsconfig-paths/register src/index.ts

  Pros:  simple, no build step, great for scripts
  Cons:  slow on large codebases (compiles on every run),
         struggles with native ESM ("module": "ESNext")

  OPTION B — tsx (faster, ESM-friendly)
  ───────────────────────────────────────
  npm install --save-dev tsx

  Run a file:
    npx tsx src/index.ts

  Watch mode (auto-restart on change):
    npx tsx watch src/index.ts

  tsx uses esbuild internally — it's transpile-only (strips types,
  no type-checking). Run tsc --noEmit separately for type safety.

  OPTION C — tsc compile + node (PRODUCTION)
  ────────────────────────────────────────────
  This is the only option that gives you a real Node.js process
  running plain JavaScript — suitable for production deployments.

  Build:
    npx tsc              ← emits to outDir (e.g. dist/)

  Run:
    node dist/index.js

  Combined in package.json:
    "scripts": {
      "build": "tsc",
      "start": "node dist/index.js",
      "dev":   "tsx watch src/index.ts"
    }

  OPTION D — nodemon + ts-node (dev watch)
  ──────────────────────────────────────────
  npm install --save-dev nodemon ts-node

  nodemon.json (or package.json "nodemonConfig"):
    {
      "watch": ["src"],
      "ext": "ts",
      "exec": "ts-node src/index.ts"
    }

  Run:  npx nodemon
  Auto-restarts when any .ts file in src/ changes.

  Prefer "tsx watch" if you're starting fresh — it's faster.
*/

function demonstrateProcessAPI(): void {
    // These APIs are only typed because @types/node is installed:
    console.log("  Node.js version:", process.version);
    console.log("  Platform:", process.platform);
}
demonstrateProcessAPI();

// ───────────────────────────────────────────────────────────────
// 5. TYPESCRIPT WITH A BUNDLER (VITE / WEBPACK)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. TypeScript with a bundler ===");

/*
  THE KEY INSIGHT
  ────────────────
  In a Vite or webpack project, the BUNDLER handles transpilation.
  TypeScript's job is TYPE-CHECKING ONLY. These are two separate
  tools doing two separate jobs.

  This is why Vite projects set "noEmit": true in tsconfig —
  tsc should never write files, only report errors.

  TYPICAL VITE + TS PROJECT SETUP
  ─────────────────────────────────
  tsconfig.json:
    {
      "compilerOptions": {
        "target":           "ESNext",
        "module":           "ESNext",
        "moduleResolution": "bundler",   // ← TS 5.0+, understands exports maps
        "lib":              ["ES2022", "DOM", "DOM.Iterable"],
        "jsx":              "react-jsx",  // if using React
        "strict":           true,
        "noEmit":           true,         // bundler emits, not tsc
        "skipLibCheck":     true,
        "paths": {
          "@/*": ["./src/*"]
        }
      },
      "include": ["src"]
    }

  package.json scripts:
    "dev":   "vite"              ← no type checking, fastest feedback
    "check": "tsc --noEmit"      ← type check only, no output
    "build": "tsc --noEmit && vite build"   ← fail on type errors then bundle

  WHY tsc ERRORS DON'T STOP VITE'S DEV SERVER
  ─────────────────────────────────────────────
  Vite uses esbuild (like tsx) — it strips types and transpiles at
  native speed, but does NO type checking. If you have a type error,
  Vite's dev server still serves the page. The error only appears
  in the terminal when you run `tsc --noEmit`.

  This is intentional: type errors shouldn't block your hot-reload
  feedback loop during development. Run the type check in CI.

  WEBPACK
  ────────
  ts-loader and babel-loader (with @babel/preset-typescript) are
  the two common approaches. Both strip types during the build;
  use fork-ts-checker-webpack-plugin to run type-checking in a
  separate process without blocking the build.
*/

// Structural demo of the "two-job" split:
interface BundlerRole {
    tool: string;
    job: string;
    outputsFiles: boolean;
}

const roles: BundlerRole[] = [
    { tool: "Vite (esbuild)", job: "Transpile + bundle",  outputsFiles: true  },
    { tool: "tsc --noEmit",   job: "Type-check only",     outputsFiles: false },
];

console.log("  Bundler + tsc role split:");
roles.forEach(r =>
    console.log(`    ${r.tool.padEnd(20)} → ${r.job} (emits: ${r.outputsFiles})`)
);

// ───────────────────────────────────────────────────────────────
// 6. TYPESCRIPT IN A MONOREPO
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. TypeScript in a monorepo ===");

/*
  A MONOREPO holds multiple packages in one repo:
    /packages
      /shared     ← utilities used by everyone
      /api        ← backend
      /web        ← frontend

  PATTERN 1 — tsconfig.base.json + extends
  ──────────────────────────────────────────
  Keep shared options in a root file:

  // tsconfig.base.json (root)
  {
    "compilerOptions": {
      "strict":          true,
      "esModuleInterop": true,
      "skipLibCheck":    true,
      "declaration":     true,
      "declarationMap":  true,
      "sourceMap":       true
    }
  }

  Each package extends it and adds its own target/module:

  // packages/api/tsconfig.json
  {
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
      "target": "ES2022",
      "module": "CommonJS",
      "outDir": "./dist",
      "rootDir": "./src"
    },
    "include": ["src"]
  }

  // packages/web/tsconfig.json
  {
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
      "target": "ESNext",
      "module": "ESNext",
      "moduleResolution": "bundler",
      "noEmit": true
    },
    "include": ["src"]
  }

  PATTERN 2 — Project References
  ────────────────────────────────
  For large monorepos where you want incremental compilation
  (only rebuild packages that changed):

  // packages/shared/tsconfig.json — MUST add "composite"
  {
    "compilerOptions": {
      "composite": true,    // enables project references
      "outDir": "./dist",
      "rootDir": "./src"
    }
  }

  // packages/api/tsconfig.json — references shared
  {
    "compilerOptions": { ... },
    "references": [{ "path": "../shared" }]
  }

  Build with:
    tsc --build packages/api    ← builds shared first if stale, then api
    tsc --build --clean         ← delete all build outputs

  "composite: true" requirements:
    • rootDir must be set
    • declaration must be true (auto-enabled)
    • All input files must be listed in include/files

  PATH ALIASES IN A MONOREPO
  ───────────────────────────
  Each package's tsconfig can have its own paths:
    "@shared/*": ["../shared/src/*"]

  With project references the module resolution happens at
  compile time via the .d.ts files in shared/dist/ — you don't
  need runtime alias resolution for the shared package.
*/

interface MonorepoPackage {
    name: string;
    composite: boolean;
    noEmit: boolean;
}

const packages: MonorepoPackage[] = [
    { name: "shared", composite: true,  noEmit: false },
    { name: "api",    composite: false, noEmit: false },
    { name: "web",    composite: false, noEmit: true  },
];

console.log("  Example monorepo tsconfig roles:");
packages.forEach(p =>
    console.log(`    ${p.name.padEnd(10)} composite:${String(p.composite).padEnd(6)} noEmit:${p.noEmit}`)
);

// ───────────────────────────────────────────────────────────────
// 7. USEFUL CLI COMMANDS
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. CLI commands ===");

/*
  TYPE-CHECK WITHOUT EMITTING OUTPUT
  ────────────────────────────────────
  npx tsc --noEmit
    Type-check the whole project. Exit code 0 = no errors.
    Used in CI pipelines and pre-commit hooks.

  WATCH MODE
  ───────────
  npx tsc --watch
    Re-runs type-check (and emits if noEmit is false) every time
    a .ts file changes. Lower latency than rerunning tsc manually.

  SEE WHAT FILES TS IS COMPILING
  ────────────────────────────────
  npx tsc --listFiles
    Prints every file TypeScript includes in the compilation.
    Useful to confirm your include/exclude globs are correct,
    and to spot accidentally included node_modules or test files.

  DEBUG MODULE RESOLUTION
  ────────────────────────
  npx tsc --traceResolution 2>&1 | grep -A3 "some-module"
    Prints the full lookup sequence TypeScript uses for every
    import. When you get "Module 'X' not found", run this to
    see exactly where TS looked and why it failed.

  SEE THE EFFECTIVE CONFIG (AFTER extends)
  ──────────────────────────────────────────
  npx tsc --showConfig
    Prints the final merged tsconfig.json after all "extends"
    chains are resolved. Removes the guesswork of "which base
    file is overriding what?".

  INCREMENTAL BUILD
  ──────────────────
  npx tsc --incremental
    Saves a .tsbuildinfo file and only recompiles changed files
    on subsequent runs. Dramatically faster on large codebases.
    Can also be set in tsconfig: "incremental": true.

  BUILD WITH PROJECT REFERENCES
  ──────────────────────────────
  npx tsc --build             ← build this project and its references
  npx tsc --build --force     ← rebuild everything regardless of cache
  npx tsc --build --clean     ← delete all emitted files
  npx tsc --build --verbose   ← show which packages are being rebuilt

  INIT
  ─────
  npx tsc --init
    Write a new tsconfig.json with all options commented out.
    Safe to run even if tsconfig.json already exists — it won't
    overwrite.
*/

const cliCommands: { cmd: string; purpose: string }[] = [
    { cmd: "tsc --noEmit",          purpose: "Type-check only (no output)" },
    { cmd: "tsc --watch",           purpose: "Watch mode" },
    { cmd: "tsc --listFiles",       purpose: "Show compiled files" },
    { cmd: "tsc --traceResolution", purpose: "Debug import resolution" },
    { cmd: "tsc --showConfig",      purpose: "Show merged tsconfig" },
    { cmd: "tsc --incremental",     purpose: "Cache-based fast rebuilds" },
    { cmd: "tsc --build",           purpose: "Build with project references" },
    { cmd: "tsc --init",            purpose: "Create starter tsconfig.json" },
];

console.log("  Quick reference:");
cliCommands.forEach(c =>
    console.log(`    npx ${c.cmd.padEnd(30)} → ${c.purpose}`)
);

// ───────────────────────────────────────────────────────────────
// 8. COMMON tsconfig MISTAKES
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. Common mistakes ===");

/*
  MISTAKE 1 — Omitting "strict": true
  ──────────────────────────────────────
  TypeScript's default is "strict: false", meaning noImplicitAny
  and strictNullChecks are OFF. You can write:
    function f(x) { }        ← x is silently any
    let s: string = null;    ← allowed
  and TypeScript won't complain. This defeats the purpose.
  Always start with "strict": true.

  MISTAKE 2 — Using `any` as an escape hatch everywhere
  ────────────────────────────────────────────────────────
  any completely disables type checking for that value AND
  everything downstream of it. One `any` can silently infect a
  whole chain of function calls.
  Better alternatives:
    unknown       → type-safe "I don't know the type" (must narrow)
    as Type       → explicit cast (at least it's visible in code review)
    @ts-ignore    → suppresses one line (but leaves a paper trail)
    @ts-expect-error → like @ts-ignore but errors if the line is NOT broken

  MISTAKE 3 — Mismatched module + moduleResolution
  ──────────────────────────────────────────────────
  "module": "ESNext" with "moduleResolution": "node" is a common
  mismatch. node resolution doesn't understand package.json
  "exports" maps that are required for many ESM-first packages.
  Modern correct pairings:
    CJS Node.js:      "CommonJS"   +  "node"
    ESM Node.js:      "NodeNext"   +  "nodenext"
    Bundler project:  "ESNext"     +  "bundler"

  MISTAKE 4 — skipLibCheck: true hiding your own declaration bugs
  ────────────────────────────────────────────────────────────────
  If you are a LIBRARY AUTHOR and your build generates .d.ts files,
  "skipLibCheck: true" skips checking those too. Before publishing
  to npm, run tsc once with skipLibCheck: false to validate your
  exported type declarations.

  MISTAKE 5 — Forgetting to match Vite alias config with tsconfig paths
  ────────────────────────────────────────────────────────────────────────
  tsconfig paths only affect TypeScript's resolution. If your
  bundler doesn't know about the same aliases, the build succeeds
  type-check but fails at runtime. Always keep these in sync:
    tsconfig.json "paths"  ↔  vite.config.ts resolve.alias

  MISTAKE 6 — Not installing @types/node in a Node.js project
  ─────────────────────────────────────────────────────────────
  If process, Buffer, __dirname, setTimeout (Node's version), etc.
  give "Cannot find name" errors, you need:
    npm install --save-dev @types/node
  Then add "node" to "types" in tsconfig (or leave types unset
  to let TypeScript auto-discover it).

  MISTAKE 7 — Setting "target" but forgetting runtime support
  ─────────────────────────────────────────────────────────────
  "target": "ESNext" makes tsc output modern syntax unchanged.
  If your runtime (an old Node version or an old browser) doesn't
  understand that syntax, you get runtime errors — not TypeScript
  errors. Match target to the oldest runtime you must support.
*/

// Illustrate the `unknown` vs `any` distinction:
function parseInput(raw: unknown): string {
    // Must narrow — TypeScript forces safety
    if (typeof raw === "string") return raw.toUpperCase();
    if (typeof raw === "number") return raw.toString();
    return String(raw);
}

console.log("  parseInput unknown:", parseInput(42));
console.log("  parseInput unknown:", parseInput("hello"));

// ───────────────────────────────────────────────────────────────
// PRACTICE Q&A
// ───────────────────────────────────────────────────────────────

/*
  Q1: What does "strict: true" actually enable? Name 3 sub-flags.
  ───────────────────────────────────────────────────────────────
  A: "strict: true" is a shorthand that enables this group:
     • noImplicitAny          — unannotated params cannot be inferred as any
     • strictNullChecks        — null/undefined are distinct types, must handle them
     • strictFunctionTypes     — function param types are checked contravariantly
     • strictBindCallApply     — .bind()/.call()/.apply() are fully type-checked
     • strictPropertyInitialization — class fields must be set in the constructor
     • noImplicitThis          — `this` in plain functions must be typed
     • alwaysStrict            — emits "use strict" in every output file

  Q2: You're using Vite + React. Should "noEmit" be true or false?
  ───────────────────────────────────────────────────────────────
  A: TRUE. Vite handles transpilation via esbuild. TypeScript's
     only job is type-checking. Setting noEmit: true prevents tsc
     from accidentally writing files to disk and keeps the two
     responsibilities separate. Your scripts look like:
       "check": "tsc --noEmit"
       "build": "tsc --noEmit && vite build"

  Q3: What's the difference between ts-node and tsx?
  ───────────────────────────────────────────────────────────────
  A: Both let you run .ts files directly without a separate compile
     step. The key differences:
     • ts-node — uses the TypeScript compiler (tsc) internally.
       It performs full type-checking by default, which makes it
       slower. Supports tsconfig.json fully including complex
       options.
     • tsx — uses esbuild internally. Transpile-only (strips types,
       no type errors reported). Much faster. Supports native ESM.
       You must run tsc --noEmit separately to catch type errors.
     Use tsx for speed in development, ts-node when you need
     TypeScript's compiler checks during execution.

  Q4: You write `import data from './data.json'`. What tsconfig flag
      enables this?
  ───────────────────────────────────────────────────────────────
  A: "resolveJsonModule": true
     Without it, TypeScript reports an error on the import. With
     it, TypeScript reads the JSON file at compile time, infers
     the object shape, and gives you full autocomplete and type
     safety on every key.

  Q5: What does "moduleResolution: bundler" fix vs "node"?
  ───────────────────────────────────────────────────────────────
  A: Modern npm packages use the "exports" field in package.json
     to define multiple entry points (e.g. separate CJS and ESM
     builds, separate type definitions). The classic "node"
     resolution algorithm predates this and ignores "exports".
     "bundler" resolution (added in TS 5.0) understands the
     "exports" map the same way Vite, webpack, and Node 12+ do.
     This fixes "Module not found" or missing type errors when
     using libraries like Remix, Next.js internals, or any package
     with conditional exports.
*/

// ───────────────────────────────────────────────────────────────
// REFERENCE CARD — printed by runDemo()
// ───────────────────────────────────────────────────────────────

function printReferenceCard(): void {
    const line = "─".repeat(60);
    console.log(`\n${"═".repeat(60)}`);
    console.log("  TYPESCRIPT TOOLCHAIN REFERENCE CARD");
    console.log("═".repeat(60));

    console.log("\n  INSTALL");
    console.log(line);
    console.log("  npm i -D typescript ts-node tsx @types/node");
    console.log("  npx tsc --init               ← create tsconfig.json");

    console.log("\n  RUN A FILE");
    console.log(line);
    console.log("  npx ts-node src/index.ts     ← compile + run (type-checked)");
    console.log("  npx tsx src/index.ts         ← transpile + run (no type check)");
    console.log("  npx tsx watch src/index.ts   ← watch mode");
    console.log("  npx tsc && node dist/index   ← build then run (production)");

    console.log("\n  KEY tsconfig FLAGS");
    console.log(line);
    const flags: [string, string][] = [
        ["strict",            "Enable all safety checks (ALWAYS set this)"],
        ["target",            "Output JS syntax (ES2022 for Node 18+)"],
        ["module",            "Output module format (CommonJS / ESNext)"],
        ["moduleResolution",  "How imports are resolved (node / bundler)"],
        ["lib",               "Built-in type declarations (ES2022, DOM)"],
        ["outDir / rootDir",  "Input → output folder mapping"],
        ["noEmit",            "Type-check only, no output (use with bundlers)"],
        ["skipLibCheck",      "Skip .d.ts checks in node_modules (speed)"],
        ["esModuleInterop",   "Fix default imports from CJS packages"],
        ["resolveJsonModule", "Allow import from .json files"],
        ["declaration",       "Emit .d.ts files (library authors)"],
        ["sourceMap",         "Map runtime errors to .ts line numbers"],
        ["baseUrl + paths",   "Path aliases (@/* → src/*)"],
        ["composite",         "Enable project references in monorepos"],
    ];
    flags.forEach(([flag, desc]) =>
        console.log(`  ${flag.padEnd(22)} → ${desc}`)
    );

    console.log("\n  USEFUL CLI COMMANDS");
    console.log(line);
    const cmds: [string, string][] = [
        ["tsc --noEmit",          "Type-check without writing files"],
        ["tsc --watch",           "Watch + recheck on save"],
        ["tsc --listFiles",       "Show all files in compilation"],
        ["tsc --traceResolution", "Debug import resolution failures"],
        ["tsc --showConfig",      "Print merged tsconfig after extends"],
        ["tsc --incremental",     "Fast rebuilds via .tsbuildinfo cache"],
        ["tsc --build",           "Build project references"],
        ["tsc --build --clean",   "Delete all build outputs"],
    ];
    cmds.forEach(([cmd, desc]) =>
        console.log(`  npx ${cmd.padEnd(28)} → ${desc}`)
    );

    console.log("\n  @types/ CHEAT SHEET");
    console.log(line);
    console.log("  npm i -D @types/node     ← process, Buffer, fs, path ...");
    console.log("  npm i -D @types/express  ← req, res, next, Router ...");
    console.log("  npm i -D @types/jest     ← describe, it, expect ...");
    console.log("  (axios, zod, vite already ship their own types — no @types needed)");

    console.log("\n  COMMON MISTAKES");
    console.log(line);
    console.log("  ✗ Forgetting strict:true          → half of TS is off");
    console.log("  ✗ Using any as an escape hatch     → use unknown + narrow");
    console.log("  ✗ Mismatched module+moduleRes      → 'Module not found' errors");
    console.log("  ✗ skipLibCheck hiding your bugs    → turn off before publishing");
    console.log("  ✗ tsconfig paths ≠ bundler aliases → runtime resolution failures");
    console.log("  ✗ Missing @types/node              → process/Buffer errors");

    console.log(`\n${"═".repeat(60)}\n`);
}

// ───────────────────────────────────────────────────────────────
// DEFAULT EXPORT — runDemo()
// ───────────────────────────────────────────────────────────────

export default function runDemo(): void {
    console.log("\n╔══════════════════════════════════════════════════════════╗");
    console.log("║   TypeScript 00: Setup & Tooling — Demo                  ║");
    console.log("╚══════════════════════════════════════════════════════════╝");

    // Re-run mini-demos with clear labels:
    console.log("\n[1] Execution environment:");
    demonstrateProcessAPI();

    console.log("\n[2] Bundler role split:");
    roles.forEach(r =>
        console.log(`  ${r.tool.padEnd(20)} → ${r.job}`)
    );

    console.log("\n[3] unknown narrowing:");
    console.log("  parseInput(42)     →", parseInput(42));
    console.log("  parseInput('hi')   →", parseInput("hi"));
    console.log("  parseInput(true)   →", parseInput(true));

    printReferenceCard();
}

// Run automatically when executed directly with ts-node / tsx
runDemo();

export { printReferenceCard };
