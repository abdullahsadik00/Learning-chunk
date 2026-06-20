import type { Post } from '@/types';

const TECH_CONTENTS: string[] = [
  'Just shipped a new feature using React Server Components. The performance gains are incredible — TTFB dropped by 40%. Thread below on what we learned 🧵',
  'Hot take: TypeScript strict mode should be the default for all new projects. The upfront investment pays off within the first sprint. Fight me.',
  'Spent the morning debugging a race condition in our WebSocket handler. Lesson learned: always cancel your async operations in useEffect cleanup. The devil is in the details.',
  'TanStack Query v5 just clicked for me. Separating query options from the hook was a great decision. `queryOptions()` helper is chef\'s kiss.',
  'We replaced Redux with Zustand last quarter. Codebase is 30% smaller, developer happiness up 100%. Sometimes simple is better.',
  'Virtualization saved our feed from collapsing under 10k rows. @tanstack/react-virtual makes it almost trivial. Highly recommend.',
  'Reminder: `await Promise.all()` is your friend. Don\'t serialize async calls that can run in parallel. Free performance gains on every network-heavy page.',
  'Deep diving into the V8 internals this week. Hidden classes and inline caches explain so much about why certain patterns are slow. JS engines are remarkable pieces of engineering.',
  'CSS container queries are now baseline. Time to stop reaching for JS for layout decisions that CSS can handle natively.',
  'The best code review feedback I ever got: "This is clever. Can you make it boring?" Boring code is maintainable code.',
  'Building a CRDT-based collaborative editor from scratch. Operational transforms gave me nightmares; CRDTs are so much more approachable.',
  'If your team is still on webpack 4, the migration to Vite will feel like removing a boulder from your backpack. Our cold start went from 45s → 800ms.',
  'Zustand\'s `immer` middleware + TypeScript = the most ergonomic state management I\'ve used. Mutations that feel like mutations without the footguns.',
  'Accessibility is not a nice-to-have. Screen reader testing should be part of your definition of done. Start with VoiceOver and NVDA.',
  'GraphQL subscriptions + React Query = a surprisingly clean real-time data story. Invalidate on event, re-fetch in background. Simple.',
  'My mental model for when to use `useMemo`: if the computation shows up in a profiler flame chart, memoize it. Otherwise, don\'t bother.',
  'New blog post: "Why We Migrated from REST to tRPC" — type-safe APIs end-to-end changed how fast we can ship. Link in bio.',
  'The `@layer` CSS rule is the most underrated feature of modern CSS. Specificity wars are a solved problem if you set your layer order correctly.',
  'Node.js 22 native `fetch` + `--watch` flag makes little scripts so much nicer to write. The runtime is maturing beautifully.',
  'Spent 3 hours on a bug that turned out to be floating-point arithmetic. `0.1 + 0.2 !== 0.3` bites again. Use integer cents for money, always.',
  'Our biggest perf win this year: lazy-loading route components. Webpack chunk analysis showed we were shipping 800KB of code for the login page.',
  'Interesting problem today: infinite scroll + browser history + back-button. TanStack Query\'s `keepPreviousData` made this surprisingly manageable.',
  'DX tip: configure your editor to run ESLint + Prettier on save. Eliminate the "lint failed in CI" surprise forever.',
  'React 19 concurrent features are landing in production for us. `useTransition` for search is a game-changer for perceived performance.',
  'The best architecture decision is the one you can explain to a junior dev in 5 minutes. Complexity has a cost.',
  'Migrated our monolith to a monorepo with Turborepo. Build caching alone cut CI time by 60%. Setup was a weekend project.',
  'Web Workers for heavy computation: still underused by most React devs. Offload your PDF generation, your CSV parsing, your image processing.',
  'I\'ve been writing TypeScript for 4 years and I still learn something new about the type system every week. It\'s genuinely deep.',
  'Stale-while-revalidate is the UX pattern that makes apps feel instant. TanStack Query does this automatically. Ship it everywhere.',
  'Our design system now has 47 components. The lesson: invest in documentation early. A component no one knows about is a component no one uses.',
  'Recharts vs Nivo vs D3 direct — we benchmarked all three for our dashboard. D3 won on customisation, Recharts won on time-to-ship.',
  'Server-sent events are having a renaissance thanks to AI streaming. Simpler than WebSockets for unidirectional streams. Don\'t overlook them.',
  'Just released an open-source hook: `useSyncedLocalStorage` — keeps state in sync across tabs using BroadcastChannel. Check the repo.',
  'Type narrowing via discriminated unions is one of TypeScript\'s superpowers. `switch (action.type)` with exhaustive checks = zero runtime surprises.',
  'Our Playwright E2E suite went from 12 minutes to 3 by parallelising across 4 workers. CI infrastructure is worth investing in.',
  'Stop putting everything in useEffect. Ask yourself: does this need to run after every render, or just once? Most side effects belong somewhere else.',
  'Next.js App Router mental model: Server Components are for data fetching, Client Components are for interactivity. Keep that boundary clean.',
  'Zod + react-hook-form is the validation combo I reach for on every new form. Schema-first, type-safe, minimal boilerplate.',
  'Database indexes explained simply: they\'re sorted copies of your data. They make reads fast at the cost of writes. Index what you query, nothing more.',
  'Content Security Policy headers are free security. Set them up in your CDN config and sleep better at night.',
  'The Intersection Observer API turned our analytics event tracking from a scroll-listener disaster into something I\'m actually proud of.',
  'Remix\'s progressive enhancement model is philosophically sound. Forms that work without JS should be the baseline, not the exception.',
  'We added OpenTelemetry traces to our API last month. The first time you see a distributed trace end-to-end is genuinely magical.',
  'Soft skills are hard skills. The ability to write a clear technical spec saves more engineering hours than any clever algorithm.',
  'Using `structuredClone` for deep copies in 2024. No more `JSON.parse(JSON.stringify())` hacks. Baseline in all modern browsers.',
  'Module federation is either the best or worst idea depending on how disciplined your teams are. Strong opinions welcome.',
  'The difference between a senior and a junior engineer isn\'t syntax — it\'s knowing when NOT to write code.',
  'Our chat feature uses Yjs for CRDT-based collaborative state. Real-time sync without a central coordinator. Remarkable technology.',
  'Finally got around to reading "A Philosophy of Software Design". Every engineering lead should read it. Complexity is the root of all software evil.',
  'Shipped dark mode today using CSS custom properties + `prefers-color-scheme`. No JS required, no flash, works on first paint.',
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const AUTHORS = [
  { name: 'Alex Rivera', handle: 'alexrivera_dev' },
  { name: 'Sam Chen', handle: 'samchen_ts' },
  { name: 'Morgan Blake', handle: 'morganblake' },
  { name: 'Jordan Kim', handle: 'jordankim_eng' },
  { name: 'Taylor Nguyen', handle: 'taylornguyen' },
  { name: 'Casey Park', handle: 'caseypark_io' },
  { name: 'Drew Santos', handle: 'drewsantos' },
  { name: 'Riley Okafor', handle: 'rileyokafor' },
  { name: 'Quinn Patel', handle: 'quinnpatel' },
  { name: 'Avery Zhang', handle: 'averyzhang' },
];

const BASE_DATE = new Date('2026-06-20T12:00:00Z');

export const MOCK_POSTS: Post[] = Array.from({ length: 50 }, (_, i) => {
  const postNumber = i + 1;
  const author = AUTHORS[i % AUTHORS.length];
  const authorId = `author-${(i % AUTHORS.length) + 1}`;
  const minutesAgo = randomInt(1, 1440 * 7); // up to 7 days ago
  const timestamp = new Date(BASE_DATE.getTime() - minutesAgo * 60 * 1000).toISOString();

  return {
    id: `post-${postNumber}`,
    author: {
      id: authorId,
      name: author.name,
      handle: author.handle,
      avatar: `https://i.pravatar.cc/40?u=${authorId}`,
    },
    content: TECH_CONTENTS[i],
    likes: randomInt(0, 9999),
    retweets: randomInt(0, 2000),
    replies: randomInt(0, 500),
    liked: false,
    retweeted: false,
    timestamp,
  };
});
