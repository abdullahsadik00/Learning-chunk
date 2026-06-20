export interface User { id: number; name: string; email: string; username: string; }

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch('https://jsonplaceholder.typicode.com/users');
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json() as Promise<User[]>;
}
