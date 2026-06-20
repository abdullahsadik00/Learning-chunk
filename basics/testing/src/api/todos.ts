export interface ApiTodo { id: number; userId: number; title: string; completed: boolean; }

export async function fetchTodos(): Promise<ApiTodo[]> {
  const res = await fetch('https://jsonplaceholder.typicode.com/todos');
  if (!res.ok) throw new Error('Failed to fetch todos');
  return res.json() as Promise<ApiTodo[]>;
}

export async function createTodo(title: string): Promise<ApiTodo> {
  const res = await fetch('https://jsonplaceholder.typicode.com/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, userId: 1, completed: false }),
  });
  if (!res.ok) throw new Error('Failed to create todo');
  return res.json() as Promise<ApiTodo>;
}
