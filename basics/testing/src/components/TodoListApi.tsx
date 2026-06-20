// TodoListApi — API-connected todo list used by the Day 34 integration test.
// Contrast with TodoList.tsx (local state only) — this version fetches from
// the network on mount and POSTs new todos to the server.
//
// The integration test renders THIS component, not TodoList.tsx.
// MSW intercepts the fetch calls so no real network traffic occurs.

import { useState, useEffect } from 'react';
import type { ApiTodo } from '@/api/todos';

export function TodoListApi() {
  const [todos, setTodos] = useState<ApiTodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [adding, setAdding] = useState(false);

  // ── Initial load ──────────────────────────────────────────────
  useEffect(() => {
    fetch('https://jsonplaceholder.typicode.com/todos')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<ApiTodo[]>;
      })
      .then(data => {
        setTodos(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      });
  }, []);

  // ── Add a new todo via POST ───────────────────────────────────
  const addTodo = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setAdding(true);
    try {
      const res = await fetch('https://jsonplaceholder.typicode.com/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed, userId: 1, completed: false }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newTodo = (await res.json()) as ApiTodo;
      setTodos(prev => [...prev, newTodo]);
      setInputValue('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setAdding(false);
    }
  };

  // ── Local toggle (no PATCH in this demo) ─────────────────────
  const toggleTodo = (id: number) => {
    setTodos(prev =>
      prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // ── Local delete (no DELETE in this demo) ────────────────────
  const deleteTodo = (id: number) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') void addTodo();
  };

  if (loading) return <div data-testid="loading">Loading todos...</div>;
  if (error) return <div data-testid="error">{error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a new todo..."
          data-testid="todo-input"
          aria-label="New todo"
          disabled={adding}
        />
        <button onClick={() => void addTodo()} data-testid="add-button" disabled={adding}>
          {adding ? 'Adding…' : 'Add'}
        </button>
      </div>

      {todos.length === 0 ? (
        <p data-testid="empty-state">No todos yet. Add one above!</p>
      ) : (
        <ul data-testid="todo-list" style={{ listStyle: 'none', padding: 0 }}>
          {todos.map(todo => (
            <li key={todo.id} data-testid={`todo-item-${todo.id}`}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                data-testid={`todo-checkbox-${todo.id}`}
                aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
              />
              <span
                data-testid={`todo-title-${todo.id}`}
                style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}
              >
                {todo.title}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                data-testid={`todo-delete-${todo.id}`}
                aria-label={`Delete "${todo.title}"`}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
