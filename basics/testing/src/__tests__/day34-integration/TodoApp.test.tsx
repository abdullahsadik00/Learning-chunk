// ═══════════════════════════════════════════════════════════════
// DAY 34: INTEGRATION TESTING — Full Todo CRUD Flow
// ═══════════════════════════════════════════════════════════════
//
// UNIT TEST vs INTEGRATION TEST — what's the difference?
//
//   Unit test:
//     — Isolates ONE function / component / hook.
//     — All dependencies are mocked.
//     — Fast, surgical, easy to pin-point failures.
//
//   Integration test:
//     — Exercises MULTIPLE units working together.
//     — Uses real implementations (except external I/O — we still use MSW).
//     — Here: TodoListApi component + fetch + state + DOM rendering.
//     — Slower, but gives more confidence that the system works end-to-end.
//
// WHAT THIS TEST COVERS:
//   1. Component renders a loading spinner while fetching.
//   2. Todos loaded from the API (via MSW) are displayed.
//   3. User types in the input and adds a new todo (POST).
//   4. User marks an existing todo as complete (checkbox → strike-through).
//   5. User deletes a todo (item disappears from the DOM).
//
// KEY PRINCIPLE — test BEHAVIOUR, not implementation:
//   We do NOT check internal state, hook return values, or CSS class names.
//   We interact with the component exactly as a real user would: typing,
//   clicking, reading text from the screen.
//
// TOOLS:
//   render()          — mount a component into jsdom
//   screen            — query the mounted DOM (getBy*, findBy*, queryBy*)
//   userEvent.setup() — simulate real user interactions (type, click, etc.)
//   waitFor()         — wait for async state to settle
//   findBy*           — getBy* + built-in waitFor (awaitable)
//
// QUERY PRIORITY (Testing Library philosophy):
//   1. getByRole         — most accessible, mirrors how screen readers work
//   2. getByLabelText    — form elements associated with a label
//   3. getByPlaceholderText
//   4. getByText
//   5. getByTestId       — last resort; use data-testid only when needed
//
// ═══════════════════════════════════════════════════════════════

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { TodoListApi } from '@/components/TodoListApi';

// The MSW handlers in src/mocks/handlers.ts already define:
//   GET  /todos  → returns 3 todos (Buy groceries, Read a book, Exercise)
//   POST /todos  → returns { id: 201, title: <body.title>, ... }
// These are active for every test. We only need per-test overrides for
// failure scenarios.

describe('TodoListApi — integration tests', () => {
  // ── Test 1: Shows loading state while fetching ─────────────────────────
  // On mount the component fires a fetch. Before it completes, the
  // loading indicator should be visible.
  it('shows a loading indicator while the initial fetch is in flight', () => {
    render(<TodoListApi />);

    // Immediately after render (fetch not yet complete), loading text visible.
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  // ── Test 2: Displays todos from the API ───────────────────────────────
  // After MSW responds with 3 todos, the list should be visible and
  // each todo title should be rendered.
  it('renders todos returned by the API', async () => {
    render(<TodoListApi />);

    // findByTestId is the async version of getByTestId — waits for the
    // element to appear in the DOM (up to the default 1000ms timeout).
    const list = await screen.findByTestId('todo-list');
    expect(list).toBeInTheDocument();

    // All three todo titles should be in the document.
    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
    expect(screen.getByText('Read a book')).toBeInTheDocument();
    expect(screen.getByText('Exercise')).toBeInTheDocument();
  });

  // ── Test 3: Adding a new todo via POST ───────────────────────────────
  // The user types a title into the input, clicks "Add", and the new
  // todo (returned by the POST handler as id: 201) appears in the list.
  it('adds a new todo when the user types and clicks Add', async () => {
    // userEvent.setup() creates a user-event instance.
    // Pass advanceTimers only if using fake timers — we are NOT here.
    const user = userEvent.setup();

    render(<TodoListApi />);

    // Wait for the initial todos to load.
    await screen.findByTestId('todo-list');

    // Type into the input.
    const input = screen.getByTestId('todo-input');
    await user.type(input, 'Write tests');

    // Click the add button.
    await user.click(screen.getByTestId('add-button'));

    // Wait for the new todo to appear. The POST handler returns id: 201.
    await waitFor(() => {
      expect(screen.getByTestId('todo-item-201')).toBeInTheDocument();
    });

    // The new todo's title should be visible.
    expect(screen.getByText('Write tests')).toBeInTheDocument();

    // The input should be cleared after adding.
    expect(input).toHaveValue('');
  });

  // ── Test 4: Adding a todo with Enter key ──────────────────────────────
  // The keyboard shortcut (Enter) should work the same as clicking Add.
  it('adds a new todo when the user presses Enter', async () => {
    const user = userEvent.setup();
    render(<TodoListApi />);

    await screen.findByTestId('todo-list');

    const input = screen.getByTestId('todo-input');
    await user.type(input, 'Learn MSW{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Learn MSW')).toBeInTheDocument();
    });
  });

  // ── Test 5: Marking a todo as complete ────────────────────────────────
  // Clicking the checkbox for "Buy groceries" (id: 1, completed: false)
  // should apply a strike-through style and flip the checkbox.
  it('marks a todo as complete when the checkbox is clicked', async () => {
    render(<TodoListApi />);
    await screen.findByTestId('todo-list');

    // Find the checkbox for todo 1 ("Buy groceries").
    const checkbox = screen.getByTestId('todo-checkbox-1') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    // Click it.
    await userEvent.click(checkbox);

    // Checkbox is now checked.
    expect(checkbox.checked).toBe(true);

    // The title element should now have line-through styling.
    const title = screen.getByTestId('todo-title-1');
    expect(title).toHaveStyle({ textDecoration: 'line-through' });
  });

  // ── Test 6: Deleting a todo removes it from the DOM ───────────────────
  // Clicking the Delete button for "Exercise" (id: 3) should remove
  // that <li> from the DOM entirely.
  it('removes a todo from the list when the Delete button is clicked', async () => {
    render(<TodoListApi />);
    await screen.findByTestId('todo-list');

    // Verify the todo is there first.
    expect(screen.getByTestId('todo-item-3')).toBeInTheDocument();

    // Click delete.
    await userEvent.click(screen.getByTestId('todo-delete-3'));

    // The item should no longer be in the DOM.
    expect(screen.queryByTestId('todo-item-3')).not.toBeInTheDocument();

    // But the other todos should still be there.
    expect(screen.getByTestId('todo-item-1')).toBeInTheDocument();
  });

  // ── Test 7: Shows error state on fetch failure ────────────────────────
  // Override the GET /todos handler for this test to return a 500.
  // The component should show an error message instead of the list.
  it('shows an error message when the initial fetch fails', async () => {
    server.use(
      http.get('https://jsonplaceholder.typicode.com/todos', () => {
        return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' });
      })
    );

    render(<TodoListApi />);

    // Wait for the error element to appear (loading resolves to error state).
    const error = await screen.findByTestId('error');
    expect(error).toBeInTheDocument();

    // The list should NOT be rendered.
    expect(screen.queryByTestId('todo-list')).not.toBeInTheDocument();
  });

  // ── Test 8: Already-completed todos render with strike-through ─────────
  // "Read a book" (id: 2, completed: true in mock) should appear already
  // struck-through on initial render — no user interaction needed.
  it('applies strike-through style to todos that are already completed', async () => {
    render(<TodoListApi />);
    await screen.findByTestId('todo-list');

    // Read a book (id: 2) has completed: true in the MSW handler.
    const title = screen.getByTestId('todo-title-2');
    expect(title).toHaveStyle({ textDecoration: 'line-through' });

    // Buy groceries (id: 1) has completed: false — no strike-through.
    const activeTitle = screen.getByTestId('todo-title-1');
    expect(activeTitle).toHaveStyle({ textDecoration: 'none' });
  });

  // ── Test 9: Scoped queries with within() ─────────────────────────────
  // When multiple todos are rendered, you can use within() to scope queries
  // to a specific container — preventing false positives from sibling items.
  it('scopes queries within a specific todo item using within()', async () => {
    render(<TodoListApi />);
    await screen.findByTestId('todo-list');

    // Grab todo item 1 as a container.
    const item1 = screen.getByTestId('todo-item-1');

    // within() creates a scoped query API — only searches inside item1.
    // This prevents accidentally clicking the wrong Delete button.
    const deleteButton = within(item1).getByRole('button', { name: /delete/i });
    await userEvent.click(deleteButton);

    // Item 1 should be gone, item 2 should still be there.
    expect(screen.queryByTestId('todo-item-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('todo-item-2')).toBeInTheDocument();
  });
});
