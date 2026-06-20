# Day 22 Assessment — System Design Framework · Component Architecture · State Management · Patterns

**Theme:** You are a senior frontend engineer tasked with architecting a large-scale SaaS dashboard from scratch. The product has a public marketing site, an authenticated analytics dashboard, a real-time notification system, and a settings page. Your tech lead asks you to document design decisions, component patterns, and state management strategy before the team starts coding.

---

### Q1 — The 4-Phase System Design Framework ⭐

**Scenario:** Your team is starting a greenfield analytics dashboard for an enterprise SaaS product. Before writing any code, your tech lead asks you to walk through the system design process.

**Task:** Describe the four phases of the frontend system design framework and what artifacts you produce in each phase. Apply each phase concretely to the analytics dashboard.

**Acceptance Criteria:**
- [ ] Names and orders all four phases correctly: Requirements → High-Level Design → Deep Dive → Trade-offs
- [ ] Requirements phase distinguishes functional requirements (what the system does) from non-functional requirements (performance, accessibility, offline support)
- [ ] HLD phase produces a component tree diagram and identifies the main state layers
- [ ] Deep Dive phase addresses at least two specific hard problems (e.g., real-time updates, large dataset rendering)
- [ ] Trade-offs phase explicitly compares at least two architectural choices with pros and cons
- [ ] Applies the framework concretely to the analytics dashboard scenario rather than abstractly

---

### Q2 — Component Hierarchy Levels ⭐

**Scenario:** A junior engineer on your team keeps putting everything into `src/components/`. Page layout code, business logic hooks, and raw buttons all live in the same folder. The codebase is six months old and nobody can find anything.

**Task:** Explain the five component hierarchy levels and reorganize the project structure around them. Show where each existing component type belongs.

**Acceptance Criteria:**
- [ ] Names all five levels: App Shell, Page, Feature, Component, Primitive
- [ ] Defines each level's responsibility in one sentence (App Shell = layout chrome, Page = route boundary, Feature = self-contained business slice, Component = reusable UI, Primitive = unstyled building block)
- [ ] Gives a concrete example of each level for the analytics dashboard (e.g., `DashboardShell`, `AnalyticsPage`, `MetricsWidget`, `LineChart`, `Button`)
- [ ] Explains why mixing levels in one folder causes the "find anything" problem
- [ ] Proposes a corrected folder structure mapping each level to a directory

---

### Q3 — Choosing the Right State Layer ⭐

**Scenario:** The analytics dashboard has four distinct state needs: (1) the currently authenticated user, (2) the list of charts fetched from the API, (3) a date-range filter the user sets, (4) whether a tooltip is currently visible.

**Task:** Assign each state need to the correct layer (useState, Zustand, React Query, URL state) and justify every decision.

**Acceptance Criteria:**
- [ ] Correctly assigns tooltip visibility to local useState — it does not need to survive navigation or be shared
- [ ] Correctly assigns chart data to React Query — it is server state, needs caching, staleTime, and background refetch
- [ ] Correctly assigns the date-range filter to URL state (query params) — it should be bookmarkable and shareable
- [ ] Correctly assigns the authenticated user to Zustand (or React Context) — it is global client state, not server state
- [ ] Explains what makes server state different from client state
- [ ] Names at least one anti-pattern (e.g., putting API data into useState, putting filter into Zustand instead of URL)

---

### Q4 — Feature-Based Folder Structure ⭐

**Scenario:** Your codebase started with `src/components/AuthLogin.tsx`, `src/components/AuthRegister.tsx`, `src/hooks/useAuth.ts`, `src/services/authService.ts`, and `src/store/authSlice.ts`. As the product grew, every new engineer added to the same flat folders and cross-imports got out of control.

**Task:** Redesign the folder structure around features. Show the before and after directory trees. Explain the colocation principle.

**Acceptance Criteria:**
- [ ] Shows before-tree with flat `components/`, `hooks/`, `services/`, `store/` folders
- [ ] Shows after-tree with `src/features/auth/` containing `components/`, `hooks/`, `services/`, `store/` as sub-folders
- [ ] Explains that colocation means "things that change together live together"
- [ ] Identifies what belongs in `src/shared/` vs `src/features/` (shared = used by 2+ features, feature = used by exactly one)
- [ ] Mentions a barrel file (`index.ts`) as the feature's public API surface
- [ ] Explains how this structure prevents cross-feature import spaghetti

---

### Q5 — Compound Component Pattern ⭐⭐

**Scenario:** Your design system needs a `Tabs` component. A junior engineer implemented it with a single `<Tabs activeTab={0} tabLabels={[...]} tabContents={[...]} />` prop-based API. The API is rigid — designers keep asking for custom tab triggers with icons, badges, and disabled states that can't fit into string arrays.

**Task:** Implement a `Tabs` compound component with `TabsList`, `TabsTrigger`, and `TabsContent` sub-components using React context internally. Show the public API and the implementation.

**Acceptance Criteria:**
- [ ] Creates a `TabsContext` with `createContext` holding `activeTab` and `setActiveTab`
- [ ] `Tabs` is the context provider; it accepts `defaultValue` and optional `value`/`onChange` for controlled mode
- [ ] `TabsList` renders a `<div role="tablist">` and is purely a layout wrapper — no logic
- [ ] `TabsTrigger` reads context, accepts a `value` prop, renders `<button role="tab">`, sets `aria-selected`
- [ ] `TabsContent` reads context, accepts a `value` prop, only renders children when `value === activeTab`
- [ ] Demonstrates the consumer API: `<Tabs><TabsList><TabsTrigger value="a">A</TabsTrigger></TabsList><TabsContent value="a">…</TabsContent></Tabs>`
- [ ] Explains why compound components are more composable than monolithic prop APIs

---

### Q6 — Render Props Pattern ⭐⭐

**Scenario:** The dashboard needs a `MouseTracker` utility that multiple chart components will use to show a crosshair tooltip at the cursor position. Each chart renders the tooltip differently — one shows coordinates, another shows a formatted data label.

**Task:** Implement `MouseTracker` using the render props pattern so consumers control what gets rendered at `{x, y}`.

**Acceptance Criteria:**
- [ ] `MouseTracker` accepts a `render` prop (or `children` as a function) that receives `{ x: number, y: number }`
- [ ] Uses `useState` to track `{ x, y }` and `onMouseMove` event handler on a wrapper `<div>`
- [ ] Calls the render prop with current coordinates on every mouse move
- [ ] Shows two different consumer usages that render differently with the same tracker
- [ ] Explains when render props are still preferable over custom hooks (cross-cutting DOM concerns, testing, visual composition)
- [ ] Notes that hooks have largely replaced render props for logic sharing, but render props still solve "what to render at position X"

---

### Q7 — Polymorphic Component ⭐⭐

**Scenario:** The design system's `Text` component is hard-coded to render a `<p>`. Designers want to use the same typographic styles for headings (`<h1>`, `<h2>`), labels (`<label>`), and inline spans — but without duplicating the style logic into `Heading`, `Label`, and `Span` components.

**Task:** Implement a fully-typed polymorphic `Text` component in TypeScript that accepts `as?: 'p' | 'h1' | 'h2' | 'span' | 'label'` and forwards all native HTML props correctly.

**Acceptance Criteria:**
- [ ] Defines a generic `PolymorphicProps<T extends ElementType>` type that merges component props with the element's native props
- [ ] `Text` defaults to rendering a `<p>` when `as` is not provided
- [ ] Uses `React.ElementType` and `React.ComponentPropsWithoutRef` to type the forwarded props correctly
- [ ] Handles the `ref` case with `forwardRef` or notes why it complicates the generic and offers a simpler alternative
- [ ] Demonstrates usage: `<Text as="h1" className="..." onClick={...}>Title</Text>`
- [ ] TypeScript rejects invalid props for the chosen element (e.g., `htmlFor` on a non-label)
- [ ] Explains the trade-off: polymorphic components are powerful but add TypeScript complexity

---

### Q8 — Zustand Store Design ⭐⭐

**Scenario:** The SaaS dashboard has a real-time notification system. Notifications arrive from a WebSocket, can be marked as read individually, and can all be cleared at once. The notification bell shows the unread count. Multiple components across the page tree consume this store.

**Task:** Design and implement a `useNotificationStore` Zustand store with the full action set.

**Acceptance Criteria:**
- [ ] Store state includes `notifications: Notification[]` where `Notification` has `id`, `message`, `read: boolean`, `createdAt`
- [ ] Implements `addNotification(notification)` — prepends to the list
- [ ] Implements `removeNotification(id)` — filters out by id
- [ ] Implements `markRead(id)` — sets `read: true` on matching notification
- [ ] Implements `clearAll()` — resets notifications to `[]`
- [ ] Derives `unreadCount` either as a computed selector or a derived value in the store
- [ ] Shows how a component subscribes to only `unreadCount` without re-rendering on every notification add (selector usage)
- [ ] Uses `immer` middleware or manual immutable updates correctly

---

### Q9 — State Colocation ⭐⭐

**Scenario:** A new engineer put every piece of UI state into the global Zustand store: tooltip visibility, search input value, accordion open state, and modal open/close. Components re-render constantly and the store is 400 lines.

**Task:** Define the colocation principle and redesign where each type of state belongs. Use the dashboard as the example.

**Acceptance Criteria:**
- [ ] Defines colocation: "state should live as close to where it is used as possible"
- [ ] Identifies the four levels in descending order: component local state → feature context → global store → URL
- [ ] Correctly moves tooltip, accordion, and modal state to local `useState` (used by one component)
- [ ] Correctly moves search input to local `useState` with debounce before hitting React Query (not global)
- [ ] Identifies that global store is appropriate only for cross-feature, cross-route state (auth, notifications, theme)
- [ ] Explains why over-globalizing state causes unnecessary re-renders and hard-to-trace bugs

---

### Q10 — Controlled vs Uncontrolled Components ⭐⭐

**Scenario:** You are evaluating whether to use Radix UI or build a custom `Select` component. Your tech lead asks: "Why do headless UI libraries like Radix prefer uncontrolled-by-default components, and when should we control them?"

**Task:** Explain the controlled vs uncontrolled trade-off and design a `Select` that supports both modes.

**Acceptance Criteria:**
- [ ] Defines controlled: parent owns state, passes `value` + `onChange`; uncontrolled: component owns state internally via `defaultValue`
- [ ] Explains why uncontrolled-by-default reduces boilerplate for consumers who do not need to observe intermediate state
- [ ] Describes the "open/closed principle" for uncontrolled: library handles the when, consumer handles the what
- [ ] Shows a dual-mode implementation pattern using an internal `useControllableState` hook (or equivalent logic)
- [ ] Lists scenarios requiring controlled mode: syncing two components, validating on every change, programmatic reset
- [ ] Mentions that form libraries (React Hook Form, Formik) often prefer uncontrolled components via `ref` for performance

---

### Q11 — System Design: Analytics Dashboard ⭐⭐⭐

**Scenario:** The interviewer says: "Design the frontend for an analytics dashboard that shows real-time KPI metrics, historical trend charts, a filterable data table with 100k rows, and a notification panel. 50k daily active users."

**Task:** Walk through all four design phases. Produce a component hierarchy, state layer map, real-time strategy, and identify the top three performance risks.

**Acceptance Criteria:**
- [ ] Requirements phase lists at least 4 functional requirements and 3 non-functional requirements (latency, bundle size, accessibility)
- [ ] HLD names the major component hierarchy: Shell → DashboardPage → KPISection, ChartSection, TableSection, NotificationPanel
- [ ] State layer map assigns each data type to the correct layer (WebSocket data → Zustand, API data → React Query, filters → URL params)
- [ ] Real-time strategy chooses between WebSocket and SSE, justifies the choice, and describes how updates flow into the UI
- [ ] Identifies virtualization as necessary for the 100k-row table and names a library (TanStack Virtual)
- [ ] Identifies code splitting as necessary to keep initial bundle under 200KB
- [ ] Identifies memoization requirements: charts should not re-render on notification updates

---

### Q12 — Compound vs HOC vs Render Props vs Hooks ⭐⭐⭐

**Scenario:** Your team has four engineers. Each has a different favorite pattern: Alice uses HOCs for everything, Bob uses render props, Carol uses compound components, Dan uses custom hooks. You need to write the team's pattern guide.

**Task:** Compare all four patterns on: composability, TypeScript ergonomics, testability, and when each is the right choice.

**Acceptance Criteria:**
- [ ] HOC: explains the "wrapper hell" problem, prop collision risk, and that HOCs are best for cross-cutting concerns that wrap the whole component (auth guard, analytics tracking)
- [ ] Render props: explains they solve "what to render at this position" — still valid for render-slot composition even though hooks replaced logic sharing
- [ ] Compound components: explains they are best when consumers need to customize structure but not logic — the Tabs/Select/Accordion use case
- [ ] Custom hooks: explains they are the default choice for logic sharing — composable, tree-shaking-friendly, TypeScript-native
- [ ] Provides a decision flowchart or clear rule: "If sharing logic → hook. If sharing render structure → compound. If adding cross-cutting behavior → HOC. If delegating render to consumer → render prop."
- [ ] Notes that these patterns compose: a compound component can use a custom hook internally

---

### Q13 — Design a Component Library Structure ⭐⭐⭐

**Scenario:** The company is building an internal design system that will be consumed by five product teams. It needs a token system, variant support, accessibility, and a testing strategy. You are the lead architect.

**Task:** Design the complete structure of the component library: token system, component API conventions, accessibility requirements, forwardRef policy, and testing approach.

**Acceptance Criteria:**
- [ ] Token system uses CSS custom properties (`--color-primary-500`) organized by category: color, spacing, typography, radius, shadow
- [ ] Component API convention: every component accepts `className`, `style`, and spreads remaining props onto the root element
- [ ] Variant props use a discriminated approach: `variant: 'solid' | 'outline' | 'ghost'` not separate `isSolid` / `isOutline` booleans
- [ ] All interactive components use `forwardRef` so consumers can access the DOM node
- [ ] Accessibility requirements listed: keyboard navigation, ARIA roles, focus visible ring, reduced-motion support
- [ ] Testing strategy: unit tests with Testing Library asserting on ARIA roles, not class names; visual regression with Storybook + Chromatic
- [ ] Explains how the library exposes its public API via an `index.ts` barrel and why internal components are not exported

---

### Q14 — Children as Slot vs Named Slots ⭐⭐

**Scenario:** A Next.js engineer asks: "Why can I pass a Server Component as the `children` of a Client Component? Isn't everything in a Client Component rendered on the client?"

**Task:** Explain the children-as-slot pattern and why Server Components can be passed through Client Components as props.

**Acceptance Criteria:**
- [ ] Explains that Client Components receive `children` as an already-rendered React element (a prop), not as source code to re-execute
- [ ] Clarifies that the Server Component is rendered on the server; the result (a React element tree) is passed down as the `children` prop
- [ ] Distinguishes this from importing a Server Component inside a Client Component — that is what is forbidden
- [ ] Shows the correct pattern: `<ClientWrapper>{/* Server Component here */}</ClientWrapper>` in a Server Component parent
- [ ] Explains how this pattern enables the "donut" architecture: Client Component shell with Server Component interior
- [ ] Contrasts with named slots: passing server components as named props like `header={<ServerHeader />}` works for the same reason

---

### Q15 — Reviewing an Anti-Pattern-Heavy Component Tree ⭐⭐⭐

**Scenario:** You are code-reviewing a PR. The component tree has: a user object prop-drilled through 5 component levels, business logic (price calculations) inside a `ProductCard` presentational component, no error boundaries anywhere, inline `style={{ color: '#FF0000' }}` throughout, and all display strings hardcoded in English inside JSX.

**Task:** Identify each anti-pattern, explain why it is harmful, and prescribe the exact fix for each.

**Acceptance Criteria:**
- [ ] Prop drilling fix: introduce a `UserContext` or move user to Zustand; components below the fold subscribe directly
- [ ] Business logic in presentation layer fix: extract price calculation to a `usePricing(product)` custom hook or a pure utility function; `ProductCard` receives already-computed values
- [ ] Missing error boundaries fix: add an `<ErrorBoundary>` at the route level and around each async data section; explains what happens without one (entire tree unmounts on throw)
- [ ] Inline styles fix: replace with design token CSS classes or a `cn()` utility; inline styles block CSS cascade, prevent theming, hurt readability
- [ ] Hardcoded strings fix: extract to an i18n system (`react-i18next` or similar) or at minimum a `constants/strings.ts` file; explains why hardcoding breaks internationalization
- [ ] Proposes a prioritized order for applying the fixes (error boundaries first — they are a safety net)
