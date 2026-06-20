import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import { useState, useEffect, useRef, useCallback, useId } from 'react';

// ============================================================================
// Badge
// ============================================================================

export const badgeVariants = cva(
  'inline-flex items-center font-semibold rounded-full transition-colors',
  {
    variants: {
      variant: {
        default:  'bg-slate-700 text-slate-300',
        primary:  'bg-indigo-600/20 text-indigo-400 ring-1 ring-inset ring-indigo-500/30',
        success:  'bg-emerald-600/20 text-emerald-400 ring-1 ring-inset ring-emerald-500/30',
        warning:  'bg-amber-600/20 text-amber-400 ring-1 ring-inset ring-amber-500/30',
        danger:   'bg-rose-600/20 text-rose-400 ring-1 ring-inset ring-rose-500/30',
        outline:  'ring-1 ring-inset ring-slate-600 text-slate-300',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px] gap-1',
        md: 'px-2.5 py-0.5 text-xs gap-1.5',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
);

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;
export type BadgeSize    = NonNullable<VariantProps<typeof badgeVariants>['size']>;

export interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({ variant, size, dot, children, className }: BadgeProps) {
  return (
    <span className={twMerge(badgeVariants({ variant, size }), className)}>
      {dot && (
        <span
          className={clsx('h-1.5 w-1.5 rounded-full shrink-0', {
            'bg-slate-400':   variant === 'default' || variant === 'outline',
            'bg-indigo-400':  variant === 'primary',
            'bg-emerald-400': variant === 'success',
            'bg-amber-400':   variant === 'warning',
            'bg-rose-400':    variant === 'danger',
          })}
        />
      )}
      {children}
    </span>
  );
}

// ============================================================================
// Alert
// ============================================================================

const alertStyles = {
  info:    { bg: 'bg-blue-600/10 ring-blue-500/30', icon: 'text-blue-400', title: 'text-blue-300', body: 'text-blue-200' },
  success: { bg: 'bg-emerald-600/10 ring-emerald-500/30', icon: 'text-emerald-400', title: 'text-emerald-300', body: 'text-emerald-200' },
  warning: { bg: 'bg-amber-600/10 ring-amber-500/30', icon: 'text-amber-400', title: 'text-amber-300', body: 'text-amber-200' },
  error:   { bg: 'bg-rose-600/10 ring-rose-500/30', icon: 'text-rose-400', title: 'text-rose-300', body: 'text-rose-200' },
};

function AlertIcon({ type }: { type: keyof typeof alertStyles }) {
  if (type === 'info') return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  );
  if (type === 'success') return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
  if (type === 'warning') return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  );
}

export interface AlertProps {
  type?: keyof typeof alertStyles;
  title: string;
  children?: React.ReactNode;
  dismissible?: boolean;
}

export function Alert({ type = 'info', title, children, dismissible }: AlertProps) {
  const [visible, setVisible] = useState(true);
  const style = alertStyles[type];

  if (!visible) return null;

  return (
    <div className={clsx('flex gap-3 p-4 rounded-xl ring-1', style.bg, 'animate-fade-in')}>
      <span className={style.icon}><AlertIcon type={type} /></span>
      <div className="flex-1 min-w-0">
        <p className={clsx('text-sm font-semibold', style.title)}>{title}</p>
        {children && <p className={clsx('text-sm mt-0.5', style.body)}>{children}</p>}
      </div>
      {dismissible && (
        <button
          onClick={() => setVisible(false)}
          className={clsx('shrink-0 transition-opacity hover:opacity-75', style.icon)}
          aria-label="Dismiss"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Toast system
// ============================================================================

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  variant: ToastVariant;
  message: string;
}

const toastStyles: Record<ToastVariant, { bg: string; icon: React.ReactNode }> = {
  success: {
    bg: 'bg-emerald-600',
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
  },
  error: {
    bg: 'bg-rose-600',
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  },
  info: {
    bg: 'bg-indigo-600',
    icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
};

let toastCounter = 0;
type ToastDispatch = (variant: ToastVariant, message: string) => void;
const listeners: Set<ToastDispatch> = new Set();

export const toast = {
  success: (msg: string) => listeners.forEach((fn) => fn('success', msg)),
  error:   (msg: string) => listeners.forEach((fn) => fn('error', msg)),
  info:    (msg: string) => listeners.forEach((fn) => fn('info', msg)),
};

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dispatch = useCallback<ToastDispatch>((variant, message) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, variant, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    listeners.add(dispatch);
    return () => { listeners.delete(dispatch); };
  }, [dispatch]);

  return toasts;
}

export function ToastContainer() {
  const toasts = useToast();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const style = toastStyles[t.variant];
        return (
          <div
            key={t.id}
            className={clsx(
              'flex items-center gap-2.5 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-2xl pointer-events-auto animate-slide-up',
              style.bg
            )}
          >
            {style.icon}
            {t.message}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Modal
// ============================================================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative bg-slate-800 ring-1 ring-slate-700 rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        {title && (
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-700">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-md"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ============================================================================
// Tooltip
// ============================================================================

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-900 text-white text-xs rounded-lg whitespace-nowrap ring-1 ring-slate-700 animate-fade-in z-50">
          {content}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </span>
      )}
    </span>
  );
}

// ============================================================================
// Dropdown menu
// ============================================================================

export interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  separator?: boolean;
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
}

export function DropdownMenu({ trigger, items }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [focusIdx, setFocusIdx] = useState(-1);
  const focusableItems = items.filter((i) => !i.separator);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setFocusIdx(-1);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown')) {
      e.preventDefault();
      setOpen(true);
      setFocusIdx(0);
      return;
    }
    if (!open) return;
    if (e.key === 'Escape') { setOpen(false); setFocusIdx(-1); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx((i) => Math.min(i + 1, focusableItems.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && focusIdx >= 0) {
      focusableItems[focusIdx]?.onClick?.();
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative inline-block">
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => { setOpen((o) => !o); setFocusIdx(-1); }}
        onKeyDown={onKeyDown}
        className="cursor-pointer"
      >
        {trigger}
      </div>
      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-52 bg-slate-800 ring-1 ring-slate-700 rounded-xl shadow-2xl py-1 animate-slide-up z-50">
          {items.map((item, i) => {
            if (item.separator) {
              return <div key={i} className="my-1 border-t border-slate-700" />;
            }
            const idx = focusableItems.indexOf(item);
            return (
              <button
                key={i}
                role="menuitem"
                data-focused={idx === focusIdx ? 'true' : undefined}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left focus-visible:outline-none',
                  item.danger
                    ? 'text-rose-400 hover:bg-rose-600/10'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white',
                  idx === focusIdx && (item.danger ? 'bg-rose-600/10' : 'bg-slate-700')
                )}
                onClick={() => { item.onClick?.(); setOpen(false); }}
              >
                {item.icon && <span className="h-4 w-4 shrink-0">{item.icon}</span>}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Gallery demo
// ============================================================================

const BADGE_VARIANTS: BadgeVariant[] = ['default', 'primary', 'success', 'warning', 'danger', 'outline'];

function BadgeSection() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {BADGE_VARIANTS.map((v) => (
          <Badge key={v} variant={v}>{v}</Badge>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {BADGE_VARIANTS.map((v) => (
          <Badge key={v} variant={v} dot>{v} with dot</Badge>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {BADGE_VARIANTS.map((v) => (
          <Badge key={v} variant={v} size="sm">{v} sm</Badge>
        ))}
      </div>
    </div>
  );
}

function AlertSection() {
  return (
    <div className="max-w-xl space-y-3">
      <Alert type="info" title="New feature available" dismissible>
        Check out the brand-new analytics dashboard in your settings panel.
      </Alert>
      <Alert type="success" title="Changes saved" dismissible>
        Your profile has been updated successfully.
      </Alert>
      <Alert type="warning" title="Approaching limit">
        You&apos;ve used 87% of your monthly API quota.
      </Alert>
      <Alert type="error" title="Deployment failed" dismissible>
        Step 4 of 6 exited with code 1. Check the logs for details.
      </Alert>
    </div>
  );
}

function ToastSection() {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => toast.success('Changes saved successfully!')}
        className="text-sm bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors"
      >
        toast.success()
      </button>
      <button
        onClick={() => toast.error('Something went wrong. Please retry.')}
        className="text-sm bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg transition-colors"
      >
        toast.error()
      </button>
      <button
        onClick={() => toast.info('Deployment is queued and will start shortly.')}
        className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors"
      >
        toast.info()
      </button>
    </div>
  );
}

function ModalSection() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors"
      >
        Open modal
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Confirm action">
        <p className="text-sm text-slate-300 mb-5">
          Are you sure you want to delete this item? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setOpen(false)}
            className="text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { setOpen(false); toast.success('Item deleted.'); }}
            className="text-sm bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}

function TooltipSection() {
  return (
    <div className="flex flex-wrap gap-4 pt-4">
      <Tooltip content="This is a tooltip!">
        <button className="text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg transition-colors">
          Hover me
        </button>
      </Tooltip>
      <Tooltip content="Keyboard shortcut: ⌘ + K">
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-300 border border-slate-600 px-3 py-1.5 rounded-lg cursor-help">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" /></svg>
          Search
        </span>
      </Tooltip>
      <Tooltip content="128,540 total views this month">
        <span className="text-sm font-semibold text-indigo-400 cursor-help underline underline-offset-2 decoration-dotted">
          128k views
        </span>
      </Tooltip>
    </div>
  );
}

const DROPDOWN_ITEMS: DropdownItem[] = [
  {
    label: 'Edit profile',
    icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>,
    onClick: () => toast.info('Edit profile clicked'),
  },
  {
    label: 'View settings',
    icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    onClick: () => toast.info('Settings clicked'),
  },
  { separator: true, label: '' },
  {
    label: 'Delete account',
    danger: true,
    icon: <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>,
    onClick: () => toast.error('Delete account — not actually deleting!'),
  },
];

function DropdownSection() {
  return (
    <DropdownMenu
      trigger={
        <button className="inline-flex items-center gap-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
          Options
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      }
      items={DROPDOWN_ITEMS}
    />
  );
}

// ============================================================================
// Main export
// ============================================================================

interface GallerySectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function GallerySection({ title, description, children }: GallerySectionProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="bg-slate-800/50 ring-1 ring-slate-700 rounded-xl p-5">
        {children}
      </div>
    </div>
  );
}

export function ComponentGallery() {
  return (
    <div className="space-y-8">
      <ToastContainer />

      <GallerySection title="Badge" description="Status labels with semantic color variants. Supports dot indicator and two sizes.">
        <BadgeSection />
      </GallerySection>

      <GallerySection title="Alert" description="Contextual feedback messages. Dismissible via the X button.">
        <AlertSection />
      </GallerySection>

      <GallerySection title="Toast" description="Click to fire a toast notification. Auto-dismisses after 3 seconds.">
        <ToastSection />
      </GallerySection>

      <GallerySection title="Modal" description="Animated entrance, backdrop click to close, Escape key to close.">
        <ModalSection />
      </GallerySection>

      <GallerySection title="Tooltip" description="Hover-triggered tooltip positioned above the trigger element.">
        <TooltipSection />
      </GallerySection>

      <GallerySection title="Dropdown menu" description="Click or keyboard (↑↓ Enter Escape) to navigate. Supports separators and danger items.">
        <DropdownSection />
      </GallerySection>
    </div>
  );
}
