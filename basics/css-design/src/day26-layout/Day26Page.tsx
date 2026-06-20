import { FlexboxPlayground } from './FlexboxPlayground';
import { GridPlayground } from './GridPlayground';
import { BoxModelDemo } from './BoxModelDemo';
import { CascadeDemo } from './CascadeDemo';

export default function Day26Page() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white">Day 26 — CSS Layout Fundamentals</h1>
        <p className="text-slate-400 mt-2 text-sm">
          Interactive playgrounds for the core CSS layout systems and cascade mechanics.
        </p>
      </div>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-2">1. Flexbox</h2>
        <p className="text-slate-400 text-sm mb-6">
          Flexbox is a one-dimensional layout model — it arranges items along a main axis (row or
          column). Use it for navigation bars, card rows, centering, and any layout where items
          share a single axis. Adjust the controls to see how each property reshapes the container.
        </p>
        <FlexboxPlayground />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-2">2. CSS Grid</h2>
        <p className="text-slate-400 text-sm mb-6">
          Grid is a two-dimensional layout model — it manages both rows and columns simultaneously.
          It excels at page-level layouts, image galleries, and any design that needs items to align
          across both axes. Notice how{' '}
          <code className="bg-slate-800 px-1 rounded text-indigo-300 text-xs">auto-fill</code>{' '}
          creates a truly responsive grid with no media queries.
        </p>
        <GridPlayground />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-2">3. Box Model</h2>
        <p className="text-slate-400 text-sm mb-6">
          Every element is a rectangular box with four layers: content, padding, border, and margin.
          Understanding{' '}
          <code className="bg-slate-800 px-1 rounded text-indigo-300 text-xs">
            box-sizing: border-box
          </code>{' '}
          is critical — it makes width declarations predictable by including padding and border
          inside the declared size. Almost all modern CSS resets apply it globally.
        </p>
        <BoxModelDemo />
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-2">4. Cascade &amp; Specificity</h2>
        <p className="text-slate-400 text-sm mb-6">
          When multiple CSS rules target the same element, the cascade decides which wins.
          Specificity is scored as three numbers: ID selectors → class/attribute/pseudo-class
          selectors → element/pseudo-element selectors. Higher scores beat lower ones. Ordering and{' '}
          <code className="bg-slate-800 px-1 rounded text-indigo-300 text-xs">!important</code>{' '}
          can override specificity entirely. Inheritance lets some properties (color, font) flow
          down to children automatically.
        </p>
        <CascadeDemo />
      </section>
    </div>
  );
}
