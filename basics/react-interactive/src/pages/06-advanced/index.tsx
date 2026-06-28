import { useState, useEffect, useCallback, Component } from 'react';
import { createPortal } from 'react-dom';
import DemoPanel from '../../components/DemoPanel';
import { useLog } from '../../hooks/useLog';

const btn = 'px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors';
const btnGray = 'px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors';

// ─── Error Boundary ───────────────────────────────────────────────────────────
interface EBState { hasError: boolean; error: string }
class ErrorBoundary extends Component<{ children: React.ReactNode; label?: string }, EBState> {
  state: EBState = { hasError: false, error: '' };

  static getDerivedStateFromError(err: Error): EBState {
    return { hasError: true, error: err.message };
  }

  componentDidCatch(err: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', err, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="border border-red-300 bg-red-50 rounded-lg p-4">
          <p className="text-red-700 font-semibold text-sm">💥 {this.props.label ?? 'Error Boundary'} caught an error</p>
          <p className="text-red-600 text-xs mt-1 font-mono">{this.state.error}</p>
          <button onClick={() => this.setState({ hasError: false, error: '' })} className="mt-2 text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
            Reset
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function BombComponent({ shouldExplode }: { shouldExplode: boolean }) {
  if (shouldExplode) throw new Error('Component deliberately crashed!');
  return <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">✓ Component is healthy</div>;
}

function ErrorBoundaryDemo() {
  const { entries: log, add, clear } = useLog();
  const [crash, setCrash] = useState(false);
  const [innerCrash, setInnerCrash] = useState(false);

  return (
    <DemoPanel
      title="Error Boundaries"
      badge="Error Boundary"
      badgeColor="red"
      description="Error Boundaries are class components that catch render errors in their subtree. Without one, a single component crash takes down the entire app. Place them strategically."
      log={log}
      onReset={() => { clear(); setCrash(false); setInnerCrash(false); }}
      code={`class ErrorBoundary extends Component {
  static getDerivedStateFromError(err) {
    return { hasError: true, error: err.message };
  }
  componentDidCatch(err, info) { /* log to monitoring */ }
  render() {
    if (this.state.hasError) return <Fallback />;
    return this.props.children;
  }
}`}
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Single top-level boundary — one crash takes the whole section</p>
          <div className="flex gap-2 mb-2">
            <button onClick={() => { setCrash(c => !c); add(crash ? 'Recovered' : 'Crashed component!'); }} className={crash ? btnGray : 'px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700'}>
              {crash ? '↩ Recover' : '💥 Crash'}
            </button>
          </div>
          <ErrorBoundary label="Top-Level Boundary">
            <BombComponent shouldExplode={crash} />
          </ErrorBoundary>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Multi-level boundaries — inner crash isolated, outer stays healthy</p>
          <div className="flex gap-2 mb-2">
            <button onClick={() => { setInnerCrash(c => !c); add(innerCrash ? 'Inner widget recovered' : 'Inner widget crashed — outer still running!'); }} className={innerCrash ? btnGray : 'px-3 py-1.5 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600'}>
              {innerCrash ? '↩ Recover inner' : '💥 Crash inner widget'}
            </button>
          </div>
          <ErrorBoundary label="Outer Boundary">
            <div className="border border-gray-200 rounded-lg p-3 space-y-2">
              <p className="text-sm text-gray-600">Outer section — stays alive</p>
              <ErrorBoundary label="Inner Widget Boundary">
                <BombComponent shouldExplode={innerCrash} />
              </ErrorBoundary>
            </div>
          </ErrorBoundary>
        </div>
      </div>
    </DemoPanel>
  );
}

// ─── Portal: Modal ────────────────────────────────────────────────────────────
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900">Portal Modal</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>
        {children}
        <p className="text-xs text-gray-400 mt-4">Press Escape or click backdrop to close</p>
      </div>
    </div>,
    document.body
  );
}

function PortalDemo() {
  const { entries: log, add, clear } = useLog();
  const [open, setOpen] = useState(false);
  const [eventLog, setEventLog] = useState<string[]>([]);

  const logEvent = (e: React.MouseEvent, label: string) => {
    setEventLog(prev => [`${label} — target: ${(e.target as HTMLElement).tagName}`, ...prev].slice(0, 5));
  };

  return (
    <DemoPanel
      title="Portals — Render Outside Parent DOM"
      badge="Portal"
      badgeColor="purple"
      description="createPortal renders children into a different DOM node (usually document.body) while keeping them in the React component tree. Events bubble through the React tree, not the DOM tree."
      log={log}
      onReset={() => { clear(); setOpen(false); setEventLog([]); }}
      code={`// Renders into document.body, NOT into parent div
createPortal(
  <Modal />,
  document.body
)
// Despite being in body DOM-wise, events and context
// still flow through the React component tree.`}
    >
      <div className="space-y-3" onClick={e => logEvent(e, 'React tree click bubbled to parent')}>
        <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-2">This is an overflow:hidden container (modal would be clipped normally)</p>
          <button onClick={() => { setOpen(true); add('Modal opened via portal → rendered in document.body'); }} className={btn}>
            Open Modal (Portal)
          </button>
        </div>

        <Modal open={open} onClose={() => { setOpen(false); add('Modal closed'); }}>
          <p className="text-sm text-gray-600 mb-3">
            This modal is rendered directly in <code className="bg-gray-100 px-1 rounded">document.body</code> — not inside the parent container. It escapes any overflow:hidden, z-index, or clip constraints.
          </p>
          <p className="text-sm text-gray-600">But React context and event bubbling still work normally through the React tree.</p>
        </Modal>

        {eventLog.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-600 mb-1">Event bubbling log (React tree):</p>
            {eventLog.map((e, i) => <p key={i} className="text-xs text-gray-500 font-mono">{e}</p>)}
          </div>
        )}
      </div>
    </DemoPanel>
  );
}

// ─── Toast System (Portal + auto-dismiss) ─────────────────────────────────────
type Toast = { id: number; message: string; type: 'success' | 'error' | 'info' };

let toastId = 0;

function ToastSystem() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const colors: Record<Toast['type'], string> = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };

  return (
    <DemoPanel
      title="Toast Notifications (Portal)"
      badge="Portal"
      badgeColor="purple"
      description="Toast notifications rendered in document.body via portal — they float above all content regardless of stacking context. Each auto-dismisses after 3 seconds."
      code={`// Each toast rendered via createPortal into document.body
// setTimeout removes it from state after 3s
const addToast = (msg, type) => {
  const id = ++toastId;
  setToasts(prev => [...prev, { id, msg, type }]);
  setTimeout(() => remove(id), 3000);
};`}
    >
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => add('Profile saved successfully!', 'success')} className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700">
            Success toast
          </button>
          <button onClick={() => add('Network error — retrying…', 'error')} className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700">
            Error toast
          </button>
          <button onClick={() => add('3 new notifications', 'info')} className={btn}>
            Info toast
          </button>
        </div>
        <p className="text-xs text-gray-500">Toasts appear in the top-right corner (portal to document.body). Auto-dismiss in 3s.</p>

        {createPortal(
          <div className="fixed top-4 right-4 space-y-2 z-50">
            {toasts.map(t => (
              <div key={t.id} className={`${colors[t.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-64 animate-in`}>
                <span className="text-sm flex-1">{t.message}</span>
                <button onClick={() => remove(t.id)} className="text-white/70 hover:text-white text-lg font-bold leading-none">×</button>
              </div>
            ))}
          </div>,
          document.body
        )}
      </div>
    </DemoPanel>
  );
}

export default function AdvancedPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Error Boundaries & Portals</h2>
        <p className="text-gray-500 mt-1">Day 15b — Catching render errors, portal modals, toast systems</p>
      </div>
      <ErrorBoundaryDemo />
      <PortalDemo />
      <ToastSystem />
    </div>
  );
}
