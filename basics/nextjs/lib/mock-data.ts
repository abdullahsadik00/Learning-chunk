export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  category: 'tech' | 'business' | 'design';
  views: number;
}

export const POSTS: Post[] = [
  {
    slug: 'understanding-react-server-components',
    title: 'Understanding React Server Components',
    excerpt: 'A deep dive into how RSCs work under the hood and when to use them.',
    content: `React Server Components represent a paradigm shift in how we think about rendering. Unlike traditional React components that always run on the client, RSCs execute exclusively on the server. This means they can directly access databases, file systems, and internal services without exposing credentials to the browser.

The component tree is serialized into a special React flight format and streamed to the client, where it is hydrated with minimal JavaScript overhead. The key insight is that RSCs never re-render on the client — they are static from the browser's perspective, which dramatically reduces bundle size and improves Time to First Byte.

The composition rule follows naturally: a Server Component can render a Client Component (passing it serialisable props), but a Client Component cannot render a Server Component directly — because it cannot reach back to the server mid-render. The children-as-slot pattern is the escape hatch: wrap a Client Component around Server Component children by passing them as props.`,
    author: 'Sadik S.',
    publishedAt: '2026-06-01',
    category: 'tech',
    views: 12500,
  },
  {
    slug: 'typescript-generics-in-practice',
    title: 'TypeScript Generics in Practice',
    excerpt: 'Real-world patterns for writing reusable, type-safe generic functions.',
    content: `Generics are one of TypeScript's most powerful features, yet they're often underutilised or misunderstood. At their core, generics let you write a function or class that works across multiple types while preserving type information. Rather than reaching for \`any\`, a generic type parameter acts as a variable for the type itself.

Patterns like generic constraints (\`extends\`), conditional types, and mapped types unlock a whole class of utility types — the kind you see in the TypeScript standard library: \`Partial<T>\`, \`Record<K, V>\`, \`ReturnType<F>\`. Awaited<T> unwraps nested Promise types, essential when typing async chains. NoInfer<T> (added in TS 5.4) prevents TypeScript from using a type argument for inference, letting you lock down a specific overload.

In practice, mastering generics means you stop copying logic for every input shape and instead write it once with full type safety.`,
    author: 'Sadik S.',
    publishedAt: '2026-05-28',
    category: 'tech',
    views: 8300,
  },
  {
    slug: 'next-js-15-app-router-guide',
    title: 'Next.js 15 App Router: Complete Guide',
    excerpt: 'Everything you need to know about the App Router in Next.js 15.',
    content: `The App Router introduced in Next.js 13 has matured into the default and recommended way to build Next.js applications. The core idea is simple: every folder inside \`app/\` maps to a URL segment, and special filenames (\`page.tsx\`, \`layout.tsx\`, \`loading.tsx\`, \`error.tsx\`) define the UI for each segment.

What makes the App Router powerful is its deep integration with React Server Components — layouts and pages are RSCs by default, fetching data directly without prop drilling. Key changes in Next.js 15 include async request APIs (cookies, headers, params, searchParams are all now Promises), fetch defaulting to no-store, and \`unstable_cache\` replacing the old per-request cache.

Dynamic segments use bracket syntax (\`[slug]\`), parallel routes use \`@\` prefixes, and intercepting routes use \`(.)\` notation to layer modals over pages without losing navigation context.`,
    author: 'Sadik S.',
    publishedAt: '2026-05-20',
    category: 'tech',
    views: 22100,
  },
  {
    slug: 'zustand-vs-redux-2026',
    title: 'Zustand vs Redux in 2026',
    excerpt: 'Which state management library should you choose for your React app?',
    content: `State management in React has evolved significantly since the days of Redux boilerplate. In 2026, the two most prominent choices for complex client state are Redux Toolkit and Zustand.

Zustand wins on simplicity. A store is a function, a slice is a property on that function, and you select with a hook. No boilerplate. No provider. For small-to-medium apps with a handful of global state slices it is hard to beat. Redux Toolkit has dramatically improved DX with \`createSlice\` and RTK Query, but still requires more ceremony. For large teams that need strict unidirectional data flow, Redux Toolkit's devtools and middleware ecosystem remain hard to beat.

The hybrid pattern — Zustand for UI state (sidebar open, selected tab) and TanStack Query for server state — is increasingly common and arguably the best of both worlds.`,
    author: 'Sadik S.',
    publishedAt: '2026-05-15',
    category: 'tech',
    views: 15700,
  },
  {
    slug: 'building-design-systems',
    title: 'Building Scalable Design Systems',
    excerpt: 'How to build a component library that scales with your team.',
    content: `A well-designed component library is the foundation of a consistent product. The mistake most teams make is treating it as a UI kit rather than a contract between design and engineering. The contract lives in design tokens — named values for color, spacing, typography, and elevation that flow from your design tool into CSS custom properties and into component props.

Each component should have a single responsibility, a clear API surface, and variants driven by props rather than CSS overrides. Storybook serves as the living specification: if a story doesn't exist for a variant, that variant doesn't exist. Accessibility is not an afterthought — it's a component property tested with jest-axe on every CI run.

Semantic tokens (\`--color-action-primary\`) should reference primitive tokens (\`--color-indigo-600\`) rather than raw values. This lets you swap themes — dark mode, brand variants — by reassigning semantic tokens without touching component code.`,
    author: 'Sadik S.',
    publishedAt: '2026-05-10',
    category: 'design',
    views: 9200,
  },
  {
    slug: 'web-vitals-optimization',
    title: 'Web Vitals Optimization Guide',
    excerpt: 'Practical techniques to improve LCP, FID, and CLS scores.',
    content: `Core Web Vitals are metrics that Google uses as ranking signals and that directly correlate with user experience quality.

Largest Contentful Paint (LCP) measures how quickly the largest above-the-fold element loads — the fastest path is preloading the hero image with \`<link rel="preload">\` and ensuring your server responds in under 200ms. Interaction to Next Paint (INP), which replaced FID, measures responsiveness to user input; long JavaScript tasks on the main thread are the primary culprit, fixed by breaking work into chunks with \`scheduler.yield()\`.

Cumulative Layout Shift (CLS) is caused by images or embeds without explicit dimensions — always set \`width\` and \`height\` on every \`<img>\` tag, or use \`next/image\` which handles this automatically. Target LCP under 2.5s, INP under 200ms, and CLS under 0.1 to pass the "Good" threshold for all three.`,
    author: 'Sadik S.',
    publishedAt: '2026-05-05',
    category: 'tech',
    views: 18400,
  },
  {
    slug: 'saas-pricing-strategies',
    title: 'SaaS Pricing Strategies That Work',
    excerpt: 'Data-driven approaches to pricing your software product.',
    content: `Pricing is one of the most impactful levers in a SaaS business, yet most founders set prices based on gut feel or competitor comparison. The research-backed approach starts with value metrics — what unit does your product deliver value in? Storage, seats, API calls, or outcomes? Align your pricing axis to that metric and you immediately reduce churn from customers who feel overcharged at low usage.

Per-seat pricing is the default because it's simple to understand, but usage-based pricing drives better expansion revenue and aligns incentives. A hybrid model — a base platform fee plus usage — smooths revenue predictability while capturing expansion.

Freemium works when a meaningful slice of users can get value at zero marginal cost to you and when the upgrade trigger is organic. Whatever you choose, test it: even a 20% price increase often has less churn impact than founders expect.`,
    author: 'Sadik S.',
    publishedAt: '2026-04-28',
    category: 'business',
    views: 6100,
  },
  {
    slug: 'api-design-best-practices',
    title: 'REST API Design Best Practices',
    excerpt: 'How to design APIs that developers love to use.',
    content: `A well-designed API is a joy to work with and a poorly designed one is a productivity drain that compounds over years. The fundamentals: use nouns for resources (\`/posts\`), HTTP verbs for actions (GET, POST, PUT, PATCH, DELETE), and nested routes sparingly — two levels deep is the practical maximum.

Return consistent error shapes with a \`code\`, \`message\`, and \`details\` field so clients can handle errors programmatically. Versioning belongs in the URL path (\`/v1/\`) not headers — it's easier to cache and log. Pagination should be cursor-based for large collections to avoid the offset drift problem.

Document with OpenAPI 3.1, generate client SDKs from the spec, and treat breaking changes as a last resort with a deprecation window of at least six months.`,
    author: 'Sadik S.',
    publishedAt: '2026-04-20',
    category: 'tech',
    views: 11300,
  },
];

export function getPost(slug: string): Post | undefined {
  return POSTS.find(p => p.slug === slug);
}

export function getTopPosts(n: number): Post[] {
  return [...POSTS].sort((a, b) => b.views - a.views).slice(0, n);
}

export function getRelatedPosts(current: Post, max = 3): Post[] {
  return POSTS.filter(
    p => p.slug !== current.slug && p.category === current.category,
  ).slice(0, max);
}
