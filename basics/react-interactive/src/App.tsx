import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/01-jsx', label: 'JSX & Components', day: '12' },
  { to: '/02-hooks', label: 'useState & useEffect', day: '13' },
  { to: '/03-perf-hooks', label: 'useRef · useMemo · useCallback', day: '14a' },
  { to: '/04-context', label: 'Context & useReducer', day: '14b' },
  { to: '/05-internals', label: 'React Internals', day: '15a' },
  { to: '/06-advanced', label: 'Error Boundaries & Portals', day: '15b' },
  { to: '/07-state-mgmt', label: 'State Management', day: '16' },
  { to: '/08-patterns', label: 'React Patterns', day: '17a' },
  { to: '/09-perf', label: 'Performance', day: '17b' },
  { to: '/10-testing', label: 'Testing Concepts', day: '17c' },
  { to: '/11-practice', label: 'Practice Problems', day: '17c' },
];

export default function App() {
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-gray-900 text-white flex flex-col overflow-y-auto flex-shrink-0 border-r border-gray-800">
        <div className="p-5 border-b border-gray-800">
          <h1 className="text-base font-bold text-white">React Interactive</h1>
          <p className="text-xs text-gray-500 mt-1">Live demos — Days 12–17</p>
        </div>
        <nav className="flex-1 py-2">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              <span className="text-xs text-gray-600 w-7 flex-shrink-0 font-mono">{item.day}</span>
              <span className="leading-tight">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800 text-xs text-gray-600">
          Each demo is interactive — poke the controls and watch the log.
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
