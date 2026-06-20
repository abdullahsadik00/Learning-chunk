# Day 24 Assessment — Code Splitting · Virtualization · Image Optimization · Render Optimization

**Theme:** You are the performance lead for a social media app. The bundle is 2MB, the feed lags with 1000 posts, images load slowly, and unnecessary re-renders are causing jank. Fix everything.

---

### Q1 — React.lazy + Suspense for Route-Level Code Splitting ⭐

**Scenario:** The app's main bundle includes every page: Home, Profile, Settings, Notifications, and a heavy Admin panel used by 0.1% of users. The bundle is 2MB. First Contentful Paint is 4 seconds on a mobile connection.

**Task:** Explain how `React.lazy` and `Suspense` enable route-level code splitting, what goes in the fallback, and apply it to the five pages.

**Acceptance Criteria:**
- [ ] Explains that `React.lazy(() => import('./Page'))` creates a dynamic import — the page's JS is fetched only when first rendered
- [ ] Shows wrapping lazy components in `<Suspense fallback={<PageSkeleton />}>` at the router level
- [ ] Explains that the fallback is shown while the dynamic chunk is loading — should be a skeleton, not a spinner, for layout stability
- [ ] Applies lazy loading to all five pages; notes Admin panel is the highest-priority split since it is rarely used
- [ ] Explains that each lazy component becomes a separate webpack/Vite chunk with its own hash for long-term caching
- [ ] Notes that the initial bundle now contains only the router and shared code; each page chunk is fetched on demand
- [ ] Mentions that nested `Suspense` boundaries can show fine-grained fallbacks within a page

---

### Q2 — When to Virtualize ⭐

**Scenario:** The social feed renders 1000 `<PostCard>` components in a scrollable container. Each card contains an image, text, like count, and comment thread. The page stutters when scrolling and takes 3 seconds to first paint after data loads.

**Task:** Explain what DOM node count causes performance issues, how virtualization fixes it, and how `@tanstack/react-virtual` (react-virtual) conceptually works.

**Acceptance Criteria:**
- [ ] Explains that browsers struggle beyond roughly 1000–3000 complex DOM nodes — layout, paint, and scroll all degrade
- [ ] Explains that virtualization renders only the visible items plus a small overscan buffer — the DOM node count stays constant at ~20–30 regardless of list length
- [ ] Describes react-virtual's approach: it calculates which items are in the visible viewport window based on scroll position and item sizes
- [ ] Explains that the container has a fixed total height (sum of all item heights) while only rendering a slice
- [ ] Notes that `overscan` renders extra items above and below the viewport to prevent flicker during fast scrolling
- [ ] Identifies that virtualization also fixes the 3-second first paint: fewer DOM nodes means faster initial layout

---

### Q3 — Lazy Image Loading ⭐

**Scenario:** The feed has 1000 posts, each with a full-resolution image. On page load, all 1000 images fire simultaneously, saturating the network and delaying above-the-fold content. Developers disagree: one wants `IntersectionObserver`, another says just use `loading="lazy"`.

**Task:** Compare `IntersectionObserver` and the native `loading="lazy"` attribute. Explain when each is appropriate.

**Acceptance Criteria:**
- [ ] Explains `loading="lazy"`: a native HTML attribute that tells the browser not to load the image until it is near the viewport — zero JavaScript required
- [ ] Explains `IntersectionObserver`: a JavaScript API that fires a callback when an element enters/exits the viewport — gives full programmatic control
- [ ] Recommends `loading="lazy"` as the default for standard `<img>` tags — it has broad browser support and zero overhead
- [ ] Notes that `IntersectionObserver` is still needed for: custom placeholders, blur-up transitions, lazy-loading non-img content (videos, iframes), progressive enhancement
- [ ] Explains that `loading="lazy"` has a browser-specific threshold (typically 1200px from viewport) that cannot be customized — `IntersectionObserver` allows custom thresholds
- [ ] Notes that above-the-fold images should use `loading="eager"` or no attribute to load immediately (they are LCP candidates)

---

### Q4 — React.memo ⭐

**Scenario:** A team member added `React.memo` to every single component in the codebase "to prevent re-renders." The app is now slower than before. A performance profiler shows the memoization overhead is exceeding the cost of the re-renders it prevents.

**Task:** Explain what `React.memo` does, when it genuinely helps, and when it hurts.

**Acceptance Criteria:**
- [ ] Explains that `React.memo` wraps a component and does a shallow comparison of props before re-rendering — skips the render if props are reference-equal
- [ ] Explains when it helps: expensive render functions with stable props that would otherwise re-render due to a parent's unrelated state change
- [ ] Explains when it hurts: the memo comparison itself costs CPU; for cheap components the comparison is more expensive than just re-rendering
- [ ] Identifies that memoizing a component with object/array/function props passed inline is useless — those always create new references
- [ ] Explains that `React.memo` is meaningless if the component's parent re-renders and passes new references every time (requires `useMemo`/`useCallback` on the parent too)
- [ ] Provides a rule of thumb: profile first, memoize only when the profiler shows a specific component as a hotspot

---

### Q5 — Implement lazyWithPreload ⭐⭐

**Scenario:** The app's route to the `<EditorPage>` involves a 300KB chunk. Users who hover over the "New Post" button almost always navigate to the editor. You want the chunk preloaded on hover so the navigation feels instant, without changing how `React.lazy` is used everywhere else.

**Task:** Implement a `lazyWithPreload` utility that wraps `React.lazy` and adds a `.preload()` method. Show the hover integration.

**Acceptance Criteria:**
- [ ] `lazyWithPreload` calls `React.lazy(factory)` internally and stores the factory reference
- [ ] Adds a `.preload()` static method that calls the factory function imperatively — this triggers the dynamic import without rendering
- [ ] The returned component is a standard lazy component usable in `<Suspense>` — no change to usage
- [ ] Shows the hover integration: `onMouseEnter={() => EditorPage.preload()}`
- [ ] Explains that calling `.preload()` twice is safe — the browser caches the module, the second call resolves from cache
- [ ] Notes that `preload()` is also useful on `onFocus`, in route `loader` functions, or after `setTimeout` on link render

---

### Q6 — Implement VirtualizedList ⭐⭐

**Scenario:** The feed must render 10,000 posts. Each `PostCard` has variable height (short text posts ~80px, posts with images ~320px). A fixed-height virtualizer would show too many gaps. You need dynamic height estimation.

**Task:** Implement a `VirtualizedFeed` using `@tanstack/react-virtual` with variable item heights, overscan, and a loading sentinel for infinite scroll.

**Acceptance Criteria:**
- [ ] Uses `useVirtualizer` from `@tanstack/react-virtual` with `count`, `getScrollElement`, and `estimateSize`
- [ ] `estimateSize` returns a reasonable default estimate (e.g., 150px) — react-virtual measures actual heights on first render and corrects
- [ ] Sets `overscan: 5` to pre-render 5 items above and below the viewport
- [ ] Renders the outer container with `ref={parentRef}` and `style={{ height: 'calc(100vh - 64px)', overflowY: 'auto' }}`
- [ ] Renders the inner container with `style={{ height: virtualizer.getTotalSize() + 'px', position: 'relative' }}`
- [ ] Each item uses `style={{ position: 'absolute', top: item.start + 'px' }}` for positioning
- [ ] Appends a sentinel item at the end that triggers `fetchNextPage` when it enters the viewport

---

### Q7 — Progressive Image Loading ⭐⭐

**Scenario:** Product images take 2–3 seconds to load on slow connections. Currently users see a blank white rectangle until the full image loads. The UX team wants a blur-up effect: show a tiny blurred placeholder immediately, then transition to the full image when loaded.

**Task:** Implement a `ProgressiveImage` component that shows a blurred low-resolution placeholder and crossfades to the full image on load.

**Acceptance Criteria:**
- [ ] Accepts `src` (full URL), `placeholder` (tiny base64 or low-res URL), and `alt` props
- [ ] Uses `useState` to track `loaded: boolean`, initialized to `false`
- [ ] Renders the placeholder as a background-image on a wrapper div with `filter: blur(8px)` and `transform: scale(1.05)` (to hide blur edges)
- [ ] Renders the full `<img>` with `opacity: 0` initially; sets `opacity: 1` via CSS transition on `onLoad`
- [ ] Applies `transition: opacity 0.3s ease-in-out` for the crossfade
- [ ] Does NOT use `loading="lazy"` on the placeholder (it is tiny and should load immediately)
- [ ] Notes that the placeholder can be a 20px base64 JPEG — only adds ~300 bytes to the HTML

---

### Q8 — useMemo vs useCallback ⭐⭐

**Scenario:** A junior engineer is confused about the difference between `useMemo` and `useCallback`. They added `useMemo` around an event handler and `useCallback` around a computation result. Both usages are wrong.

**Task:** Explain the distinct use cases for `useMemo` and `useCallback`, their cost, and when to skip both.

**Acceptance Criteria:**
- [ ] `useMemo(fn, deps)` memoizes the return value of `fn` — use for expensive calculations that should not rerun on every render
- [ ] `useCallback(fn, deps)` memoizes the function reference itself — use when passing a function as a prop to a memoized child component
- [ ] Explains the junior's mistakes: `useMemo` around a handler returns the function (same as `useCallback`); `useCallback` around a computation returns the function, not the computed value
- [ ] Explains the cost: every `useMemo`/`useCallback` call allocates memory and runs a dependency comparison — this is overhead for cheap operations
- [ ] Provides the "when to skip" rule: skip memoization if (1) the component re-renders rarely, (2) the computation is trivial (< 1ms), or (3) the memoized value is not passed to a `React.memo` child
- [ ] Notes that the React compiler (React Forget) aims to automate memoization — manual `useMemo`/`useCallback` may become less common

---

### Q9 — Bundle Analysis ⭐⭐

**Scenario:** The app's production bundle is 2MB. Nobody knows why. You have `webpack-bundle-analyzer` (or `vite-bundle-visualizer`) available.

**Task:** Explain what the bundle analyzer shows, how to identify problematic dependencies, and how to fix the three most common causes of bloated bundles.

**Acceptance Criteria:**
- [ ] Explains that the analyzer renders a treemap where rectangle size represents byte size (gzipped or parsed)
- [ ] Identifies the three common culprits: (1) moment.js with all locales (~280KB), (2) lodash imported as `import _ from 'lodash'` (~70KB), (3) a heavy charting library on every route
- [ ] Fix for moment.js: replace with `date-fns` (tree-shakeable) or `day.js` (~2KB)
- [ ] Fix for lodash: use named imports `import { debounce } from 'lodash-es'` which enables tree-shaking
- [ ] Fix for heavy chart library: dynamic import so it only loads on the chart route
- [ ] Explains the difference between gzipped size (what travels over network) and parsed size (what the browser must parse) — both matter
- [ ] Notes that `source-map-explorer` is an alternative that works with any bundler

---

### Q10 — Code Splitting a Heavy Chart Library ⭐⭐

**Scenario:** The `recharts` library is 450KB. It is used only on the Analytics page, but it is in the main bundle because it was imported at the top of `AnalyticsPage.tsx`. The app's initial load is penalized even for users who never visit Analytics.

**Task:** Split `recharts` into a lazy-loaded chunk. Show the dynamic import, the loading skeleton, and address the SSR concern.

**Acceptance Criteria:**
- [ ] Converts the static `import { LineChart } from 'recharts'` to a dynamic import inside a lazy component wrapper
- [ ] Creates a `LazyLineChart` component using `React.lazy(() => import('./charts/LineChart'))` where `LineChart.tsx` re-exports from `recharts`
- [ ] Wraps usage in `<Suspense fallback={<ChartSkeleton />}>` — skeleton has the same dimensions as the chart to prevent layout shift
- [ ] Explains that this moves `recharts` from the main chunk to a separate `charts.[hash].js` chunk
- [ ] Addresses SSR: `React.lazy` requires `Suspense` and does not work on the server in standard React — use `dynamic(() => import(...), { ssr: false })` in Next.js
- [ ] Notes that the `recharts` chunk will be cached by the browser after first visit — repeat visits to Analytics are instant

---

### Q11 — Profiling Re-renders with React DevTools ⭐⭐

**Scenario:** Users report that typing in the search box makes the whole page feel sluggish. You open React DevTools Profiler to investigate.

**Task:** Explain how to use the Profiler, what a flame chart shows, and how to identify components that are wasting renders.

**Acceptance Criteria:**
- [ ] Explains how to start a recording: click Record, interact with the app, click Stop — DevTools captures every render that occurred
- [ ] Explains the flame chart: each bar is a component render; bar width = render duration; color = how "hot" (slow) it is
- [ ] Explains the "ranked chart": sorts components by render time — the longest bars are the biggest offenders
- [ ] Identifies a "wasted render": a component that re-rendered but produced identical output — DevTools marks these as gray in some views
- [ ] Describes the investigation: find that `<FeedList>` re-renders on every keystroke in the search box even though search results haven't changed
- [ ] Explains the fix: the search input state should be local to the search box component; the feed should only re-render when debounced search results change
- [ ] Notes that the "Why did this render?" feature in DevTools shows which prop or state changed to trigger the render

---

### Q12 — Fix a Slow List ⭐⭐⭐

**Scenario:** The feed has 10,000 items. There is no virtualization. There is a search box above the feed — every keystroke fires a synchronous filter over all 10,000 items and causes every `<PostCard>` to re-render. The page is unusable.

**Task:** Provide the complete fix: virtualization, debounced search, and memoization. Explain how each layer contributes.

**Acceptance Criteria:**
- [ ] Identifies the three compounding problems: no virtualization (10k DOM nodes), no debounce (filter on every keystroke), no memoization (every card re-renders on filter change)
- [ ] Fix 1 — virtualization: replaces the flat map with `useVirtualizer`, limits DOM nodes to ~30, fixes scrolling jank
- [ ] Fix 2 — debounce: wraps the search input's `onChange` with a 300ms debounce; the filter computation and re-render fire at most once per 300ms
- [ ] Fix 3 — memoization: moves the filtered list computation into `useMemo([items, debouncedSearch])` so it only recomputes when the debounced value changes
- [ ] Fix 4 — React.memo on PostCard: each card only re-renders if its specific post data changes (only new/updated posts)
- [ ] Explains the cumulative result: keystrokes feel instant because no work happens during typing; the list updates smoothly 300ms after the user stops
- [ ] Notes the ordering: debounce first is the highest-ROI fix; virtualization second; memo last (lowest individual impact)

---

### Q13 — Image Optimization Strategy ⭐⭐⭐

**Scenario:** The social feed has images. The Lighthouse report shows LCP = 5.8s and the images are the culprit. Images are served as full-resolution JPEGs, no responsive sizes, no modern formats. Mobile users download desktop-sized images.

**Task:** Design a comprehensive image optimization strategy covering srcSet/sizes, format selection (WebP/AVIF), LCP optimization, and priority loading.

**Acceptance Criteria:**
- [ ] Implements `srcSet` with multiple resolutions: `srcSet="img-400.webp 400w, img-800.webp 800w, img-1200.webp 1200w"`
- [ ] Uses `sizes` to tell the browser which source to pick: `sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"`
- [ ] Explains format selection: AVIF offers ~50% better compression than JPEG; WebP offers ~30%; use `<picture>` with `<source type="image/avif">` → `<source type="image/webp">` → `<img>` fallback
- [ ] Identifies the LCP image (the largest above-the-fold image) and adds `loading="eager"` and `fetchpriority="high"` to it
- [ ] Explains that every other image uses `loading="lazy"` and `fetchpriority="low"`
- [ ] Sets an LCP budget target (e.g., < 2.5s as per Core Web Vitals) and explains how format + size + priority combine to achieve it
- [ ] Notes that CDNs like Cloudinary or imgix can serve srcSet and format variants automatically without manual image generation

---

### Q14 — React 18 Automatic Batching ⭐⭐⭐

**Scenario:** Before React 18, calling two `setState` calls inside a `setTimeout` triggered two separate re-renders. A junior engineer is confused because their code now only triggers one re-render in React 18. A different engineer needs to force a synchronous render to update the DOM before an animation.

**Task:** Explain React 18 automatic batching, when to use `flushSync`, and how batching affects render count.

**Acceptance Criteria:**
- [ ] Explains that React 18 batches all state updates regardless of where they occur: event handlers, `setTimeout`, `Promise.then`, native DOM events
- [ ] Explains that React 17 only batched state updates inside React synthetic event handlers — `setTimeout` and promises caused separate renders
- [ ] Shows that two `setState` calls in a `setTimeout` now trigger one re-render in React 18 (batched) vs two in React 17
- [ ] Explains `flushSync(() => setState(...))`: forces React to flush the update synchronously before returning — useful when you need the DOM to update before starting an animation or measuring layout
- [ ] Warns that `flushSync` is an escape hatch and overusing it defeats the purpose of batching
- [ ] Notes that automatic batching is enabled by default in React 18 with `createRoot` — legacy `ReactDOM.render` does not enable it
- [ ] Mentions `startTransition` as a related API for marking non-urgent updates that can be interrupted

---

### Q15 — Performance Audit a Component Tree ⭐⭐⭐

**Scenario:** Code review reveals three issues in a PR: (1) a `ThemeContext` that updates every second triggers every context consumer to re-render, even components that only use `theme.colors` which never change; (2) a `<FeedList>` renders 500 items without keys (uses array index); (3) a `<UserProfile>` component reads `localStorage.getItem('userPrefs')` synchronously during every render.

**Task:** Identify the exact bug in each case, explain its performance impact, and prescribe the exact fix.

**Acceptance Criteria:**
- [ ] Context re-render bug: the context value is a new object on every second tick — even stable slices look changed due to reference inequality; fix by memoizing the context value `useMemo(() => ({ colors, spacing }), [colors, spacing])` or splitting context into separate providers
- [ ] Missing keys bug: using array index as key causes React to re-use DOM nodes incorrectly when items are reordered or filtered — fix by using a stable unique `id` from the data as the key
- [ ] Synchronous localStorage bug: `localStorage.getItem` is a synchronous I/O call that blocks the main thread during every render — fix by reading in `useEffect` (after mount) or in a `useMemo` with an empty dep array (once per mount)
- [ ] Quantifies the context impact: if 50 components consume the context, each re-renders every second = 50 renders/second = 3000 renders/minute from a single timer
- [ ] Explains why index keys cause bugs: when a new item is prepended, every item's index shifts by 1, and React sees N changed keys instead of 1 new key
- [ ] Proposes a profiling step before each fix to confirm the hypothesis and measure the improvement after
