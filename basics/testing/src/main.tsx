import ReactDOM from 'react-dom/client';
import React from 'react';
import { TodoList } from './components/TodoList';
import { LoginForm } from './components/LoginForm';
import { Counter } from './components/Counter';

function App() {
  return (
    <div
      style={{
        maxWidth: 800,
        margin: '0 auto',
        padding: 24,
        fontFamily: 'system-ui, sans-serif',
        background: '#0f0f11',
        minHeight: '100vh',
        color: '#e0e0e0',
      }}
    >
      <h1 style={{ color: '#a78bfa', borderBottom: '1px solid #333', paddingBottom: 12 }}>
        Testing App — Days 31–35
      </h1>
      <p style={{ color: '#6b7280', marginBottom: 32 }}>
        Run <code style={{ background: '#1e1e2e', padding: '2px 6px', borderRadius: 4 }}>npm test</code> to execute all unit and component tests.
      </p>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ color: '#60a5fa' }}>Counter</h2>
        <p style={{ color: '#6b7280', fontSize: 14 }}>
          Tests: Counter.test.tsx — role queries, disabled state, min/max constraints
        </p>
        <div style={{ background: '#1e1e2e', padding: 16, borderRadius: 8 }}>
          <Counter initialCount={0} min={-10} max={10} />
        </div>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ color: '#60a5fa' }}>Todo List</h2>
        <p style={{ color: '#6b7280', fontSize: 14 }}>
          Tests: TodoList.test.tsx — userEvent.type, add/toggle/delete, within() queries
        </p>
        <div style={{ background: '#1e1e2e', padding: 16, borderRadius: 8 }}>
          <TodoList />
        </div>
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ color: '#60a5fa' }}>Login Form</h2>
        <p style={{ color: '#6b7280', fontSize: 14 }}>
          Tests: LoginForm.test.tsx — validation, async loading, waitFor, fake timers
        </p>
        <div style={{ background: '#1e1e2e', padding: 16, borderRadius: 8 }}>
          <LoginForm onSuccess={(email) => alert(`Logged in as ${email}`)} />
        </div>
      </section>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
