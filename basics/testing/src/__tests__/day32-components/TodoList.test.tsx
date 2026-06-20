// ═══════════════════════════════════════════════════════════════
// DAY 32: REACT COMPONENT TESTING — TodoList
// ═══════════════════════════════════════════════════════════════
//
// NEW PATTERNS THIS FILE TEACHES:
//
//  userEvent.type(element, 'text')
//    Simulates typing character-by-character into an input.
//    Fires keydown → keypress → input → keyup for each character.
//    More realistic than fireEvent.change() which fires just one event.
//
//  userEvent.clear(element)
//    Clears the input value (selects all + delete).
//
//  beforeEach(() => { ... })
//    Runs before EVERY test in the current describe block.
//    Use for setup that every test needs (rendering, creating mocks).
//
//  screen.queryByText() vs screen.getByText()
//    queryByText returns null when not found — use for "should NOT exist" checks.
//    getByText throws when not found — use when absence would be a test bug.
//
//  within(element).getBy*()
//    Scopes queries to a subtree of the DOM.
//    Use when you have multiple similar structures (list of todos)
//    and need to query inside a specific one.

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoList } from '@/components/TodoList';

// ─────────────────────────────────────────────────────────────────
// Helper: addTodo — encapsulates the "type + click Add" action.
// DRY principle: repeated setup should live in one place.
// When the component changes (e.g., different button label), fix it once here.
// ─────────────────────────────────────────────────────────────────
async function addTodo(user: ReturnType<typeof userEvent.setup>, text: string) {
  const input = screen.getByTestId('todo-input');
  const addBtn = screen.getByTestId('add-button');
  await user.type(input, text);
  await user.click(addBtn);
}

describe('TodoList', () => {
  // ─────────────────────────────────────────────────────────────
  // Initial render
  // ─────────────────────────────────────────────────────────────
  describe('initial render', () => {
    it('renders the input and Add button', () => {
      render(<TodoList />);

      // The input and button must exist
      expect(screen.getByTestId('todo-input')).toBeInTheDocument();
      expect(screen.getByTestId('add-button')).toBeInTheDocument();
    });

    it('shows empty state message when there are no todos', () => {
      render(<TodoList />);

      // getByTestId — checks the empty state is rendered
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();

      // The todo list itself should NOT exist yet
      // queryByTestId returns null rather than throwing — correct for absence checks
      expect(screen.queryByTestId('todo-list')).not.toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Adding todos
  // ─────────────────────────────────────────────────────────────
  describe('adding todos', () => {
    it('adds a todo when the user types and clicks Add', async () => {
      const user = userEvent.setup();
      render(<TodoList />);

      await addTodo(user, 'Buy milk');

      // After adding, the todo list should exist
      expect(screen.getByTestId('todo-list')).toBeInTheDocument();

      // The text "Buy milk" should be visible
      // getByText — finds element by its text content
      expect(screen.getByText('Buy milk')).toBeInTheDocument();
    });

    it('clears the input field after adding a todo', async () => {
      const user = userEvent.setup();
      render(<TodoList />);

      await addTodo(user, 'Buy milk');

      // The input should be empty again — ready for the next todo
      // toHaveValue(val) — checks the current value of an input element
      expect(screen.getByTestId('todo-input')).toHaveValue('');
    });

    it('hides the empty state after adding the first todo', async () => {
      const user = userEvent.setup();
      render(<TodoList />);

      await addTodo(user, 'First todo');

      // Empty state should disappear once there is at least one todo
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
    });

    it('adds multiple todos and shows all of them', async () => {
      const user = userEvent.setup();
      render(<TodoList />);

      await addTodo(user, 'Todo one');
      await addTodo(user, 'Todo two');
      await addTodo(user, 'Todo three');

      expect(screen.getByText('Todo one')).toBeInTheDocument();
      expect(screen.getByText('Todo two')).toBeInTheDocument();
      expect(screen.getByText('Todo three')).toBeInTheDocument();

      // getAllByRole — returns all matching elements as an array
      // Each todo item is a <li> (role="listitem")
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);
    });

    it('does NOT add a todo when the input is empty', async () => {
      const user = userEvent.setup();
      render(<TodoList />);

      // Click Add without typing anything
      await user.click(screen.getByTestId('add-button'));

      // Empty state persists — nothing was added
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.queryByTestId('todo-list')).not.toBeInTheDocument();
    });

    it('does NOT add a todo when the input is only whitespace', async () => {
      const user = userEvent.setup();
      render(<TodoList />);

      // Type only spaces
      await user.type(screen.getByTestId('todo-input'), '   ');
      await user.click(screen.getByTestId('add-button'));

      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Completing (toggling) todos
  // ─────────────────────────────────────────────────────────────
  describe('completing todos', () => {
    it('marks a todo as complete when the checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(<TodoList />);

      await addTodo(user, 'Learn testing');

      // Find all checkboxes — there should be exactly one
      // getByRole('checkbox') — checkboxes have role="checkbox"
      const checkbox = screen.getByRole('checkbox');

      // Before clicking: not checked
      expect(checkbox).not.toBeChecked();

      // Click the checkbox
      await user.click(checkbox);

      // After clicking: checked
      // toBeChecked() — jest-dom matcher for checkbox/radio state
      expect(checkbox).toBeChecked();
    });

    it('unchecks a completed todo when the checkbox is clicked again', async () => {
      const user = userEvent.setup();
      render(<TodoList />);

      await addTodo(user, 'Learn testing');

      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox); // complete it
      await user.click(checkbox); // uncomplete it

      expect(checkbox).not.toBeChecked();
    });

    it('only toggles the clicked todo, not others', async () => {
      const user = userEvent.setup();
      render(<TodoList />);

      await addTodo(user, 'Todo A');
      await addTodo(user, 'Todo B');

      // Get all checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);

      // Click only the first checkbox
      await user.click(checkboxes[0]);

      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Deleting todos
  // ─────────────────────────────────────────────────────────────
  describe('deleting todos', () => {
    it('removes a todo when the Delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<TodoList />);

      await addTodo(user, 'To be deleted');

      // The todo exists before deletion
      expect(screen.getByText('To be deleted')).toBeInTheDocument();

      // Find the Delete button by its role and accessible name
      const deleteBtn = screen.getByRole('button', { name: /delete "to be deleted"/i });
      await user.click(deleteBtn);

      // After deletion, the text should be gone
      // queryByText — returns null if not found (correct for "should not exist" checks)
      expect(screen.queryByText('To be deleted')).not.toBeInTheDocument();
    });

    it('shows empty state again when all todos are deleted', async () => {
      const user = userEvent.setup();
      render(<TodoList />);

      await addTodo(user, 'Only todo');
      await user.click(screen.getByRole('button', { name: /delete/i }));

      // Empty state should return
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('deletes only the targeted todo when there are multiple', async () => {
      const user = userEvent.setup();
      render(<TodoList />);

      await addTodo(user, 'Keep me');
      await addTodo(user, 'Delete me');

      // ── within() — scoped queries ─────────────────────────────
      // When there are multiple list items, we need to find the Delete
      // button *inside* a specific item, not just any Delete button.
      // within(element).getBy*() scopes the query to that element's subtree.
      const list = screen.getByTestId('todo-list');
      const items = within(list).getAllByRole('listitem');
      expect(items).toHaveLength(2);

      // Delete the second item ("Delete me")
      const deleteBtn = within(items[1]).getByRole('button', { name: /delete/i });
      await user.click(deleteBtn);

      // "Keep me" should still be there
      expect(screen.getByText('Keep me')).toBeInTheDocument();
      // "Delete me" should be gone
      expect(screen.queryByText('Delete me')).not.toBeInTheDocument();
      // Only 1 item remains
      expect(within(list).getAllByRole('listitem')).toHaveLength(1);
    });
  });
});
