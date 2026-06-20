import { clsx } from 'clsx';
import { useState } from 'react';

// ---------------------------------------------------------------------------
// Section heading helper
// ---------------------------------------------------------------------------

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">{children}</h3>
  );
}

// ---------------------------------------------------------------------------
// 1. Hover effects
// ---------------------------------------------------------------------------

interface HoverCardProps {
  title: string;
  description: string;
  className?: string;
  iconClassName?: string;
  icon?: React.ReactNode;
}

function HoverCard({ title, description, className, iconClassName, icon }: HoverCardProps) {
  return (
    <div
      className={clsx(
        'group bg-slate-800 ring-1 ring-slate-700 rounded-xl p-5 cursor-pointer',
        className
      )}
    >
      {icon && (
        <div className={clsx('h-10 w-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 mb-4', iconClassName)}>
          {icon}
        </div>
      )}
      <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
      <p className="text-xs text-slate-400">{description}</p>
    </div>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={clsx('h-5 w-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function HoverEffects() {
  return (
    <section>
      <SectionTitle>Hover effects</SectionTitle>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Scale */}
        <HoverCard
          title="Scale"
          description="hover:scale-105 transition-transform duration-200"
          className="hover:scale-105 transition-transform duration-200"
          icon={<StarIcon />}
        />

        {/* Glow */}
        <HoverCard
          title="Glow shadow"
          description="hover:shadow-lg hover:shadow-indigo-500/25"
          className="hover:shadow-xl hover:shadow-indigo-500/30 transition-shadow duration-300"
          icon={<StarIcon />}
        />

        {/* Lift */}
        <HoverCard
          title="Lift"
          description="hover:-translate-y-1 hover:shadow-xl"
          className="hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/40 transition-all duration-200"
          icon={<StarIcon />}
        />

        {/* Border reveal underline */}
        <div className="group relative bg-slate-800 ring-1 ring-slate-700 rounded-xl p-5 cursor-pointer overflow-hidden">
          <span className="absolute bottom-0 left-0 h-0.5 bg-indigo-500 w-0 group-hover:w-full transition-all duration-300 ease-out" />
          <div className="h-10 w-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 mb-4">
            <StarIcon />
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">Border reveal</h4>
          <p className="text-xs text-slate-400">Bottom line slides in on hover</p>
        </div>

        {/* Color shift */}
        <div className="group bg-slate-800 ring-1 ring-slate-700 rounded-xl p-5 cursor-pointer hover:bg-indigo-600 hover:ring-indigo-500 transition-all duration-300">
          <div className="h-10 w-10 rounded-lg bg-slate-700 group-hover:bg-indigo-500 flex items-center justify-center text-slate-300 group-hover:text-white mb-4 transition-colors duration-300">
            <StarIcon />
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">Color shift</h4>
          <p className="text-xs text-slate-400 group-hover:text-indigo-200 transition-colors duration-300">Background changes on hover</p>
        </div>

        {/* Rotate icon */}
        <div className="group bg-slate-800 ring-1 ring-slate-700 rounded-xl p-5 cursor-pointer hover:shadow-md transition-shadow">
          <div className="h-10 w-10 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 mb-4">
            <StarIcon className="group-hover:rotate-12 group-hover:text-amber-400 transition-all duration-300" />
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">Rotate icon</h4>
          <p className="text-xs text-slate-400">group-hover:rotate-12 on inner element</p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 2. Skeleton shimmer
// ---------------------------------------------------------------------------

function SkeletonLine({ width = 'w-full', height = 'h-3' }: { width?: string; height?: string }) {
  return (
    <div
      className={clsx(
        height,
        width,
        'rounded-md bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 bg-[length:200%_100%] animate-shimmer'
      )}
    />
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'rounded-lg bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 bg-[length:200%_100%] animate-shimmer',
        className
      )}
    />
  );
}

function SkeletonLoading() {
  return (
    <section>
      <SectionTitle>Skeleton shimmer loading</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Text block */}
        <div className="bg-slate-800 ring-1 ring-slate-700 rounded-xl p-5 space-y-3">
          <p className="text-xs text-slate-500 mb-3 font-medium">Text skeleton</p>
          <SkeletonLine height="h-4" width="w-3/4" />
          <SkeletonLine height="h-3" />
          <SkeletonLine height="h-3" width="w-5/6" />
          <SkeletonLine height="h-3" width="w-4/5" />
          <SkeletonLine height="h-3" width="w-2/3" />
        </div>

        {/* Image + text */}
        <div className="bg-slate-800 ring-1 ring-slate-700 rounded-xl p-5">
          <p className="text-xs text-slate-500 mb-3 font-medium">Image card skeleton</p>
          <SkeletonBlock className="h-32 w-full mb-4" />
          <div className="space-y-2">
            <SkeletonLine height="h-4" width="w-2/3" />
            <SkeletonLine height="h-3" />
            <SkeletonLine height="h-3" width="w-4/5" />
          </div>
        </div>

        {/* Avatar + content */}
        <div className="bg-slate-800 ring-1 ring-slate-700 rounded-xl p-5">
          <p className="text-xs text-slate-500 mb-3 font-medium">Profile skeleton</p>
          <div className="flex gap-3 items-start">
            <SkeletonBlock className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <SkeletonLine height="h-3" width="w-1/2" />
              <SkeletonLine height="h-2.5" width="w-1/3" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <SkeletonLine height="h-3" />
            <SkeletonLine height="h-3" width="w-5/6" />
            <SkeletonLine height="h-3" width="w-3/4" />
          </div>
        </div>

        {/* Stat card */}
        <div className="bg-slate-800 ring-1 ring-slate-700 rounded-xl p-5">
          <p className="text-xs text-slate-500 mb-3 font-medium">Stat card skeleton</p>
          <SkeletonLine height="h-2.5" width="w-1/3" />
          <SkeletonLine height="h-8" width="w-1/2" />
          <div className="flex justify-between items-end mt-4">
            <SkeletonLine height="h-4" width="w-16" />
            <SkeletonBlock className="h-7 w-20" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 3. Entrance animations
// ---------------------------------------------------------------------------

function EntranceAnimations() {
  const [fadeItems, setFadeItems] = useState<number[]>([]);
  const [slideItems, setSlideItems] = useState<number[]>([]);

  function addFade() {
    const id = Date.now();
    setFadeItems((prev) => [...prev.slice(-4), id]);
  }

  function addSlide() {
    const id = Date.now();
    setSlideItems((prev) => [...prev.slice(-4), id]);
  }

  return (
    <section>
      <SectionTitle>Entrance animations</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Fade in */}
        <div className="bg-slate-800 ring-1 ring-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-white">animate-fade-in</h4>
              <p className="text-xs text-slate-400">fadeIn 0.3s ease-out</p>
            </div>
            <button
              onClick={addFade}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Trigger
            </button>
          </div>
          <div className="space-y-2 min-h-[80px]">
            {fadeItems.map((id) => (
              <div key={id} className="animate-fade-in bg-indigo-600/20 border border-indigo-500/30 rounded-lg px-3 py-2 text-xs text-indigo-300">
                Faded in at {new Date(id).toLocaleTimeString()}
              </div>
            ))}
          </div>
        </div>

        {/* Slide up */}
        <div className="bg-slate-800 ring-1 ring-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-semibold text-white">animate-slide-up</h4>
              <p className="text-xs text-slate-400">slideUp 0.3s ease-out</p>
            </div>
            <button
              onClick={addSlide}
              className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              Trigger
            </button>
          </div>
          <div className="space-y-2 min-h-[80px]">
            {slideItems.map((id) => (
              <div key={id} className="animate-slide-up bg-violet-600/20 border border-violet-500/30 rounded-lg px-3 py-2 text-xs text-violet-300">
                Slid up at {new Date(id).toLocaleTimeString()}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 4. Infinite animations
// ---------------------------------------------------------------------------

function InfiniteAnimations() {
  return (
    <section>
      <SectionTitle>Infinite animations</SectionTitle>
      <div className="flex flex-wrap gap-6 items-center">
        {/* Spinning loader */}
        <div className="bg-slate-800 ring-1 ring-slate-700 rounded-xl p-5 flex flex-col items-center gap-3 w-36">
          <svg
            className="animate-spin h-10 w-10 text-indigo-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-xs text-slate-400">animate-spin</span>
        </div>

        {/* Slow spin */}
        <div className="bg-slate-800 ring-1 ring-slate-700 rounded-xl p-5 flex flex-col items-center gap-3 w-36">
          <svg
            className="animate-spin-slow h-10 w-10 text-violet-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
          </svg>
          <span className="text-xs text-slate-400">animate-spin-slow</span>
        </div>

        {/* Pulsing badge */}
        <div className="bg-slate-800 ring-1 ring-slate-700 rounded-xl p-5 flex flex-col items-center gap-3 w-36">
          <div className="relative flex items-center justify-center h-10 w-10">
            <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-6 w-6 rounded-full bg-rose-500 items-center justify-center">
              <span className="text-white text-xs font-bold">3</span>
            </span>
          </div>
          <span className="text-xs text-slate-400">animate-ping</span>
        </div>

        {/* Pulsing skeleton */}
        <div className="bg-slate-800 ring-1 ring-slate-700 rounded-xl p-5 flex flex-col items-center gap-3 w-36">
          <div className="h-10 w-10 rounded-full bg-slate-600 animate-pulse" />
          <span className="text-xs text-slate-400">animate-pulse</span>
        </div>

        {/* Bouncing indicator */}
        <div className="bg-slate-800 ring-1 ring-slate-700 rounded-xl p-5 flex flex-col items-center gap-3 w-36">
          <div className="flex gap-1 items-end h-10">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2.5 rounded-full bg-emerald-400 animate-bounce"
                style={{ height: '16px', animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <span className="text-xs text-slate-400">animate-bounce</span>
        </div>

        {/* Shimmer bar */}
        <div className="bg-slate-800 ring-1 ring-slate-700 rounded-xl p-5 flex flex-col items-center gap-3 w-48">
          <div className="w-full h-8 rounded-lg bg-gradient-to-r from-slate-700 via-slate-500 to-slate-700 bg-[length:200%_100%] animate-shimmer" />
          <span className="text-xs text-slate-400">animate-shimmer</span>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function AnimationDemo() {
  return (
    <div className="space-y-12">
      <HoverEffects />
      <SkeletonLoading />
      <EntranceAnimations />
      <InfiniteAnimations />
    </div>
  );
}
