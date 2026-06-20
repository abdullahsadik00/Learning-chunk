import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import { useState } from 'react';

// ---------------------------------------------------------------------------
// CVA variant definition
// ---------------------------------------------------------------------------

export const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 focus-visible:ring-indigo-500 shadow-sm',
        secondary:
          'bg-slate-700 text-slate-200 hover:bg-slate-600 active:bg-slate-800 focus-visible:ring-slate-500',
        outline:
          'border border-slate-600 text-slate-200 hover:bg-slate-800 hover:border-slate-500 focus-visible:ring-slate-500',
        ghost:
          'text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:ring-slate-500',
        danger:
          'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 focus-visible:ring-rose-500',
        success:
          'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 focus-visible:ring-emerald-500',
      },
      size: {
        xs: 'h-7 px-2.5 text-xs gap-1',
        sm: 'h-8 px-3 text-sm gap-1.5',
        md: 'h-10 px-4 text-sm gap-2',
        lg: 'h-11 px-5 text-base gap-2',
        xl: 'h-12 px-6 text-base gap-2.5',
      },
      fullWidth: { true: 'w-full', false: '' },
      loading: { true: 'cursor-wait', false: '' },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
      loading: false,
    },
  }
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>['size']>;

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
  };

// ---------------------------------------------------------------------------
// LoadingSpinner
// ---------------------------------------------------------------------------

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Icon helpers (simple inline SVGs)
// ---------------------------------------------------------------------------

export function IconPlus({ className }: { className?: string }) {
  return (
    <svg className={clsx('h-4 w-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

export function IconTrash({ className }: { className?: string }) {
  return (
    <svg className={clsx('h-4 w-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

export function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg className={clsx('h-4 w-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={clsx('h-4 w-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function IconDownload({ className }: { className?: string }) {
  return (
    <svg className={clsx('h-4 w-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Button component
// ---------------------------------------------------------------------------

export function Button({
  variant,
  size,
  fullWidth,
  loading,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={twMerge(buttonVariants({ variant, size, fullWidth, loading }), className)}
      disabled={disabled || loading === true}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {!loading && leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Demo
// ---------------------------------------------------------------------------

const ALL_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success'];
const ALL_SIZES: ButtonSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

export function ButtonVariantsDemo() {
  const [loadingVariant, setLoadingVariant] = useState<string | null>(null);

  function handleLoadingClick(v: string) {
    setLoadingVariant(v);
    setTimeout(() => setLoadingVariant(null), 2000);
  }

  return (
    <div className="space-y-10">
      {/* Variant grid */}
      <section>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          All variants × sizes
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-xs text-slate-500 font-medium pb-3 pr-4">Variant</th>
                {ALL_SIZES.map((s) => (
                  <th key={s} className="text-center text-xs text-slate-500 font-medium pb-3 px-2">
                    {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {ALL_VARIANTS.map((v) => (
                <tr key={v}>
                  <td className="py-3 pr-4 text-sm text-slate-400 font-mono">{v}</td>
                  {ALL_SIZES.map((s) => (
                    <td key={s} className="py-3 px-2 text-center">
                      <Button variant={v} size={s}>
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </Button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* With icons */}
      <section>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          With icons
        </h3>
        <div className="flex flex-wrap gap-3">
          <Button leftIcon={<IconPlus />}>New item</Button>
          <Button variant="danger" leftIcon={<IconTrash />}>Delete</Button>
          <Button variant="success" leftIcon={<IconCheck />} rightIcon={<IconArrowRight />}>
            Confirm &amp; continue
          </Button>
          <Button variant="outline" rightIcon={<IconDownload />}>Export</Button>
          <Button variant="ghost" leftIcon={<IconPlus />} size="sm">Add</Button>
        </div>
      </section>

      {/* Loading states */}
      <section>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Loading states — click to trigger
        </h3>
        <div className="flex flex-wrap gap-3">
          {ALL_VARIANTS.map((v) => (
            <Button
              key={v}
              variant={v}
              loading={loadingVariant === v}
              onClick={() => handleLoadingClick(v)}
            >
              {loadingVariant === v ? 'Loading…' : v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </div>
      </section>

      {/* Full width */}
      <section>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Full width
        </h3>
        <div className="max-w-sm space-y-2">
          <Button fullWidth>Full-width primary</Button>
          <Button fullWidth variant="outline">Full-width outline</Button>
        </div>
      </section>

      {/* Disabled */}
      <section>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
          Disabled
        </h3>
        <div className="flex flex-wrap gap-3">
          {ALL_VARIANTS.map((v) => (
            <Button key={v} variant={v} disabled>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Button>
          ))}
        </div>
      </section>
    </div>
  );
}
