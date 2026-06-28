import { useState, useContext, createContext } from 'react';
import DemoPanel from '../../components/DemoPanel';

const btn = 'px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors';
const btnGray = 'px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors';

// ─── Counter component (matches testing file) ─────────────────────────────────
function Counter({ initialCount = 0 }: { initialCount?: number }) {
  const [count, setCount] = useState(initialCount);
  return (
    <div>
      <p data-testid="count">Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={() => setCount(c => c - 1)}>Decrement</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

// ─── LoginForm component ──────────────────────────────────────────────────────
function LoginForm({ onSubmit }: { onSubmit: (email: string, password: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!email.includes('@')) e.email = 'Invalid email';
    if (password.length < 6) e.password = 'Min 6 characters';
    return e;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    setSubmitted(true);
    onSubmit(email, password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="border border-gray-200 rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:border-blue-400" placeholder="user@example.com" />
        {errors.email && <p role="alert" className="text-red-600 text-xs mt-1">{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="border border-gray-200 rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:border-blue-400" placeholder="••••••" />
        {errors.password && <p role="alert" className="text-red-600 text-xs mt-1">{errors.password}</p>}
      </div>
      <button type="submit" className={btn}>Log in</button>
      {submitted && <p className="text-green-600 text-sm font-medium">✓ Form submitted!</p>}
    </form>
  );
}

// ─── Context consumer ─────────────────────────────────────────────────────────
const ThemeCtx = createContext<'light' | 'dark'>('light');
function ThemedButton({ children }: { children: React.ReactNode }) {
  const theme = useContext(ThemeCtx);
  return (
    <button className={`px-3 py-1.5 rounded-md text-sm font-medium ${theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
      {children} (theme: {theme})
    </button>
  );
}

// ─── Query priority reference ─────────────────────────────────────────────────
const QUERIES = [
  { name: 'getByRole', priority: '1st', color: 'bg-green-100 text-green-800', why: 'Matches what screen readers see. Most accessible and reliable query.' },
  { name: 'getByLabelText', priority: '2nd', color: 'bg-green-100 text-green-800', why: 'Form inputs associated with a label. Tests accessibility correctly.' },
  { name: 'getByPlaceholderText', priority: '3rd', color: 'bg-yellow-100 text-yellow-800', why: 'For inputs without a label. Less ideal (placeholder is hint, not label).' },
  { name: 'getByText', priority: '4th', color: 'bg-yellow-100 text-yellow-800', why: 'Non-interactive text content. Good for paragraphs, headings.' },
  { name: 'getByDisplayValue', priority: '5th', color: 'bg-orange-100 text-orange-800', why: 'Current value of form elements. Useful for selects.' },
  { name: 'getByAltText', priority: '6th', color: 'bg-orange-100 text-orange-800', why: 'Images and elements with alt text.' },
  { name: 'getByTestId', priority: 'Last resort', color: 'bg-red-100 text-red-700', why: 'data-testid attribute. Use only when no accessible query works.' },
];

function QueryPriorityDemo() {
  const [highlighted, setHighlighted] = useState<string | null>(null);

  return (
    <DemoPanel
      title="Query Priority — getByRole First"
      badge="Testing"
      badgeColor="blue"
      description="React Testing Library intentionally makes accessible queries easiest. This forces you to write tests that match how users and screen readers interact with your UI."
      code={`// ✓ Best — matches role (accessible)
getByRole('button', { name: /submit/i })
getByRole('textbox', { name: /email/i })

// ✓ Good for forms
getByLabelText(/password/i)

// ✗ Avoid — implementation detail
getByTestId('submit-btn')`}
    >
      <div className="space-y-2">
        <p className="text-xs text-gray-500 mb-3">Click a query to see why it's ranked that way:</p>
        {QUERIES.map(q => (
          <div
            key={q.name}
            onClick={() => setHighlighted(q.name === highlighted ? null : q.name)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors ${highlighted === q.name ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
          >
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${q.color} flex-shrink-0 w-20 text-center`}>{q.priority}</span>
            <span className="font-mono text-sm text-gray-800">{q.name}</span>
            {highlighted === q.name && <span className="text-xs text-gray-500 flex-1">{q.why}</span>}
          </div>
        ))}
      </div>
    </DemoPanel>
  );
}

function ComponentShowcase() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [submitted, setSubmitted] = useState<{ email: string; password: string } | null>(null);

  return (
    <DemoPanel
      title="Component Showcase — What the Tests Are Testing"
      badge="Testing"
      badgeColor="purple"
      description="The components tested in 10-testing.tsx live below. Interact with them — then look at the test code alongside to understand what each test query and assertion verifies."
    >
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium text-gray-600 mb-3">Counter — tested with getByText, getByRole('button')</p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <Counter initialCount={5} />
          </div>
          <div className="mt-2 bg-gray-900 text-green-400 font-mono text-xs rounded-lg p-3 overflow-x-auto">
            <p className="text-gray-500">// Test</p>
            <p>render({'<Counter initialCount={5} />'})</p>
            <p>expect(screen.getByText('Count: 5')).toBeInTheDocument()</p>
            <p>await userEvent.click(screen.getByRole('button', {'{ name: /increment/i }'}));</p>
            <p>expect(screen.getByText('Count: 6')).toBeInTheDocument()</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-600 mb-3">LoginForm — tested with getByLabelText, role="alert"</p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <LoginForm onSubmit={(e, p) => setSubmitted({ email: e, password: p })} />
            {submitted && <div className="mt-2 text-xs text-gray-500 font-mono">onSubmit called with: {JSON.stringify(submitted)}</div>}
          </div>
          <div className="mt-2 bg-gray-900 text-green-400 font-mono text-xs rounded-lg p-3 overflow-x-auto">
            <p className="text-gray-500">// Test — validation</p>
            <p>await userEvent.click(screen.getByRole('button', {'{ name: /log in/i }'}));</p>
            <p>expect(screen.getByRole('alert')).toHaveTextContent('Invalid email')</p>
            <p className="text-gray-500 mt-1">// Test — success</p>
            <p>await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com')</p>
            <p>await userEvent.type(screen.getByLabelText(/password/i), 'secret')</p>
            <p>expect(mockSubmit).toHaveBeenCalledWith('a@b.com', 'secret')</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-600 mb-3">ThemedButton — tested with custom render wrapper</p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex gap-3 items-center">
            <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')} className={btnGray}>Toggle theme ({theme})</button>
            <ThemeCtx.Provider value={theme}>
              <ThemedButton>Click me</ThemedButton>
            </ThemeCtx.Provider>
          </div>
          <div className="mt-2 bg-gray-900 text-green-400 font-mono text-xs rounded-lg p-3 overflow-x-auto">
            <p className="text-gray-500">// Custom render helper — wraps with all providers</p>
            <p>function renderWithProviders(ui, {'{ theme = "dark" } = {}'}) {'{'}</p>
            <p className="ml-4">return render({'<ThemeCtx.Provider value={theme}>{ui}</ThemeCtx.Provider>'})</p>
            <p>{'}'}</p>
            <p className="mt-1">renderWithProviders({'<ThemedButton>Click</ThemedButton>'}, {'{ theme: "dark" }'})</p>
            <p>expect(screen.getByRole('button')).toHaveClass('bg-gray-700')</p>
          </div>
        </div>
      </div>
    </DemoPanel>
  );
}

function ActExplainerDemo() {
  return (
    <DemoPanel
      title="userEvent vs fireEvent vs act()"
      badge="Testing"
      badgeColor="gray"
      description="Three levels of interaction simulation. userEvent is closest to real user behavior — it fires the full sequence of events (keydown, keypress, input, keyup, change, blur)."
      code={`// fireEvent — single synthetic event, low-level
fireEvent.click(button);

// userEvent — full interaction sequence (prefer this)
await userEvent.type(input, 'hello'); // keydown+input+keyup ×5
await userEvent.click(button);

// act() — flush all pending React updates
// Usually automatic with RTL's findBy*/userEvent
// Manual: act(() => { triggerStateChange(); });`}
    >
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="font-bold text-yellow-800 mb-1">fireEvent</p>
            <ul className="space-y-1 text-yellow-700">
              <li>• Single event</li>
              <li>• Fast but shallow</li>
              <li>• Missing browser behavior (blur, focus sequence)</li>
              <li>• Use for simple clicks</li>
            </ul>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="font-bold text-green-800 mb-1">userEvent ✓</p>
            <ul className="space-y-1 text-green-700">
              <li>• Full interaction chain</li>
              <li>• Closest to real user</li>
              <li>• Handles focus, selection, clipboard</li>
              <li>• await required</li>
            </ul>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="font-bold text-blue-800 mb-1">act()</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Flush state updates</li>
              <li>• Auto with userEvent</li>
              <li>• Manual for renderHook</li>
              <li>• Ensures DOM is settled</li>
            </ul>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-600 mb-2">getBy* vs queryBy* vs findBy*</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div><p className="font-mono text-blue-700">getBy*</p><p className="text-gray-500">Throws if not found. Use when element must exist.</p></div>
            <div><p className="font-mono text-blue-700">queryBy*</p><p className="text-gray-500">Returns null if not found. Use for "should NOT exist" assertions.</p></div>
            <div><p className="font-mono text-blue-700">findBy*</p><p className="text-gray-500">Returns Promise — waits for async appearance. Use after data fetches.</p></div>
          </div>
        </div>
      </div>
    </DemoPanel>
  );
}

export default function TestingPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Testing Concepts</h2>
        <p className="text-gray-500 mt-1">Day 17c — React Testing Library philosophy, query priority, userEvent, component showcase</p>
      </div>
      <QueryPriorityDemo />
      <ComponentShowcase />
      <ActExplainerDemo />
    </div>
  );
}
