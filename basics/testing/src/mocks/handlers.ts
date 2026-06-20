import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://jsonplaceholder.typicode.com/todos', () => {
    return HttpResponse.json([
      { id: 1, userId: 1, title: 'Buy groceries', completed: false },
      { id: 2, userId: 1, title: 'Read a book', completed: true },
      { id: 3, userId: 1, title: 'Exercise', completed: false },
    ]);
  }),

  http.post('https://jsonplaceholder.typicode.com/todos', async ({ request }) => {
    const body = (await request.json()) as { title: string };
    return HttpResponse.json(
      { id: 201, userId: 1, title: body.title, completed: false },
      { status: 201 }
    );
  }),

  http.get('https://jsonplaceholder.typicode.com/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'Alice Chen', email: 'alice@example.com', username: 'alicec' },
      { id: 2, name: 'Bob Smith', email: 'bob@example.com', username: 'bobs' },
    ]);
  }),
];
