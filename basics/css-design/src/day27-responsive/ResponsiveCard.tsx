import { useState } from 'react';

interface CardProps {
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
  image: string;
}

type PreviewSize = 'mobile' | 'tablet' | 'desktop';

const PREVIEW_SIZES: { label: string; key: PreviewSize; maxWidth: string; icon: string }[] = [
  { label: 'Mobile',  key: 'mobile',  maxWidth: '360px',  icon: '📱' },
  { label: 'Tablet',  key: 'tablet',  maxWidth: '640px',  icon: '📟' },
  { label: 'Desktop', key: 'desktop', maxWidth: '100%',   icon: '🖥️' },
];

const SAMPLE_POST: CardProps = {
  title: 'Mastering CSS Grid: From Basics to Advanced Layouts',
  excerpt:
    'CSS Grid is the most powerful layout system available in CSS. In this deep dive, we explore auto-placement, named areas, and responsive strategies that eliminate media queries.',
  author: 'Alex Rivera',
  date: 'Jun 18, 2026',
  category: 'CSS',
  image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
};

function BlogCard({ title, excerpt, author, date, category, image }: CardProps) {
  return (
    <article className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden hover:border-indigo-500 transition-all duration-300 group flex flex-col sm:flex-row">
      {/* Image */}
      <div className="sm:w-48 sm:shrink-0 lg:w-64 overflow-hidden bg-slate-700">
        <img
          src={image}
          alt={title}
          className="w-full h-48 sm:h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      {/* Content */}
      <div className="flex flex-col justify-between p-4 md:p-5 lg:p-8 flex-1">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-900/50 px-2 py-1 rounded-md uppercase tracking-wider">
              {category}
            </span>
          </div>

          <h3 className="text-base md:text-lg lg:text-xl font-bold text-slate-100 mb-2 group-hover:text-indigo-300 transition-colors leading-snug">
            {title}
          </h3>

          <p className="text-slate-400 text-sm md:text-base leading-relaxed line-clamp-3">
            {excerpt}
          </p>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
              {author[0]}
            </div>
            <span className="text-sm text-slate-300 font-medium">{author}</span>
          </div>
          <span className="text-xs text-slate-500">{date}</span>
        </div>
      </div>
    </article>
  );
}

export function ResponsiveCard() {
  const [previewSize, setPreviewSize] = useState<PreviewSize>('desktop');
  const maxWidth = PREVIEW_SIZES.find((s) => s.key === previewSize)!.maxWidth;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Responsive Card</h2>
        <p className="text-slate-400">
          A blog post card that adapts from a stacked mobile layout to a side-by-side desktop layout
          using Tailwind responsive prefixes — no media query CSS needed.
        </p>
      </div>

      {/* Preview size switcher */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400 mr-1">Preview as:</span>
        {PREVIEW_SIZES.map((s) => (
          <button
            key={s.key}
            onClick={() => setPreviewSize(s.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              previewSize === s.key
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700'
            }`}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Card preview */}
      <div
        className="transition-all duration-500 overflow-hidden"
        style={{ maxWidth }}
      >
        <BlogCard {...SAMPLE_POST} />
      </div>

      {/* Responsive class explanation */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
        <h3 className="text-lg font-semibold text-slate-200">Responsive Prefix Breakdown</h3>
        <div className="space-y-3">
          {[
            {
              prefix: '(none)',
              applies: 'All sizes — mobile first',
              example: 'flex-col, p-4, text-base',
              color: 'text-slate-400',
            },
            {
              prefix: 'sm:',
              applies: '≥ 640px — large phones, small tablets',
              example: 'sm:flex-row, sm:w-48, sm:h-full',
              color: 'text-orange-400',
            },
            {
              prefix: 'md:',
              applies: '≥ 768px — tablets',
              example: 'md:text-lg, md:p-5',
              color: 'text-amber-400',
            },
            {
              prefix: 'lg:',
              applies: '≥ 1024px — laptops and above',
              example: 'lg:w-64, lg:p-8, lg:text-xl',
              color: 'text-emerald-400',
            },
          ].map((row) => (
            <div key={row.prefix} className="grid grid-cols-3 gap-4 text-sm">
              <code className={`font-mono font-bold ${row.color}`}>{row.prefix}</code>
              <span className="text-slate-400">{row.applies}</span>
              <code className="font-mono text-slate-500 text-xs">{row.example}</code>
            </div>
          ))}
        </div>
      </div>

      {/* Code snippet */}
      <div className="bg-slate-900 rounded-xl p-5 border border-slate-700">
        <p className="text-sm font-medium text-slate-400 mb-3">Key responsive classes used</p>
        <pre className="font-mono text-sm text-emerald-400 overflow-x-auto whitespace-pre">{`<article className="
  flex flex-col        // mobile: stacked
  sm:flex-row          // ≥640px: side by side
">
  <div className="
    sm:w-48            // fixed sidebar width on tablet+
    lg:w-64            // wider on desktop
  ">...</div>

  <div className="
    p-4                // mobile padding
    md:p-5             // tablet padding
    lg:p-8             // desktop padding
  ">
    <h3 className="
      text-base        // mobile
      md:text-lg       // tablet
      lg:text-xl       // desktop
    ">...</h3>
  </div>
</article>`}</pre>
      </div>
    </div>
  );
}
