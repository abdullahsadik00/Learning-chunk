import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useFetch } from '@/hooks/useFetch';
import type { User } from '@/api/users';

export function SearchBox() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const url = debouncedQuery.length >= 2 ? `https://jsonplaceholder.typicode.com/users` : null;
  const { data: users, loading, error } = useFetch<User[]>(url);

  const filtered = users?.filter(u =>
    u.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(debouncedQuery.toLowerCase())
  ) ?? [];

  return (
    <div>
      <input
        data-testid="search-input"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search users..."
        aria-label="Search users"
      />
      {loading && <div data-testid="loading">Loading...</div>}
      {error && <div data-testid="error">{error}</div>}
      {!loading && !error && debouncedQuery.length >= 2 && (
        <ul data-testid="results">
          {filtered.length === 0
            ? <li data-testid="no-results">No users found</li>
            : filtered.map(u => <li key={u.id} data-testid={`user-${u.id}`}>{u.name} — {u.email}</li>)
          }
        </ul>
      )}
    </div>
  );
}
