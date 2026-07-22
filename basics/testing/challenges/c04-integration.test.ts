// ═══════════════════════════════════════════════════════════
// CHALLENGE C04: INTEGRATION TESTING  (Day 34)
// Run: npm run challenge:04   |   Time target: 35–45 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Wire several units together into a "load todos" feature — a
//          reducer that models the request lifecycle, plus an async
//          orchestrator that talks to an INJECTED fetcher and drives the
//          reducer through dispatch. Integration = units cooperating, tested
//          with the network faked out (vi.fn) — no MSW, no real HTTP.
//
// RED→GREEN TDD loop: the SPECS assert both the reducer transitions and the
// end-to-end success/error flows. Everything ships stubbed → RED until built.
//
// RULES:
//  • Implement the SUBJECT (reducer + loadTodos) — keep signatures/names.
//  • Do NOT edit anything below the "SPECS" banner.
//  • loadTodos must NOT call real fetch — it uses the `fetcher` argument.
//  • Run `npm run challenge:04` — all green = done.

import { describe, it, expect, vi } from 'vitest';

// ══════════════════════════════════════════════════════════
// SUBJECT — implement these (Day 34: reducer + mocked-fetcher flow)
// ══════════════════════════════════════════════════════════

export interface Todo {
    id: number;
    title: string;
    done: boolean;
}

export type TodosState =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; todos: Todo[] }
    | { status: 'error'; message: string };

export type TodosAction =
    | { type: 'load' }
    | { type: 'loaded'; todos: Todo[] }
    | { type: 'failed'; message: string };

export const initialTodosState: TodosState = { status: 'idle' };

// Transitions:
//   'load'   → { status: 'loading' }
//   'loaded' → { status: 'success', todos }
//   'failed' → { status: 'error', message }
// Unknown actions return the current state unchanged.
export function todosReducer(state: TodosState, action: TodosAction): TodosState {
    switch (action.type) {
        // TODO: one case per action type (see mapping above)
        default:
            return state; // keep as the fallthrough for unknown actions
    }
}

// A fetcher is any function returning a promise of the todo list. In tests
// it's a vi.fn(); in production it'd wrap fetch(). loadTodos must:
//   1. dispatch({ type: 'load' })
//   2. await fetcher()
//   3. on success → dispatch({ type: 'loaded', todos })
//   4. on throw   → dispatch({ type: 'failed', message: err.message })
// It must NOT throw itself — errors are turned into a 'failed' dispatch.
export type TodosFetcher = () => Promise<Todo[]>;

export async function loadTodos(
    fetcher: TodosFetcher,
    dispatch: (action: TodosAction) => void,
): Promise<void> {
    // TODO: implement the load → await → loaded/failed orchestration above.
}

// ══════════════════════════════════════════════════════════
// SPECS — do not modify below this line
// ══════════════════════════════════════════════════════════

const sampleTodos: Todo[] = [
    { id: 1, title: 'Write tests', done: false },
    { id: 2, title: 'Make them green', done: false },
];

describe('C04 · todosReducer', () => {
    it('load → loading', () => {
        expect(todosReducer({ status: 'idle' }, { type: 'load' })).toEqual({ status: 'loading' });
    });
    it('loaded → success with todos', () => {
        expect(todosReducer({ status: 'loading' }, { type: 'loaded', todos: sampleTodos })).toEqual({
            status: 'success',
            todos: sampleTodos,
        });
    });
    it('failed → error with message', () => {
        expect(todosReducer({ status: 'loading' }, { type: 'failed', message: 'boom' })).toEqual({
            status: 'error',
            message: 'boom',
        });
    });
    it('unknown action returns the current state', () => {
        const state: TodosState = { status: 'success', todos: sampleTodos };
        // @ts-expect-error — deliberately invalid action to prove the fallthrough
        expect(todosReducer(state, { type: 'nope' })).toBe(state);
    });
});

describe('C04 · loadTodos (mocked fetcher, no network)', () => {
    it('dispatches load then loaded on success, in order', async () => {
        const fetcher = vi.fn<TodosFetcher>().mockResolvedValue(sampleTodos);
        const dispatch = vi.fn();

        await loadTodos(fetcher, dispatch);

        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(dispatch).toHaveBeenNthCalledWith(1, { type: 'load' });
        expect(dispatch).toHaveBeenNthCalledWith(2, { type: 'loaded', todos: sampleTodos });
    });

    it('dispatches load then failed when the fetcher rejects', async () => {
        const fetcher = vi.fn<TodosFetcher>().mockRejectedValue(new Error('network down'));
        const dispatch = vi.fn();

        await loadTodos(fetcher, dispatch);

        expect(dispatch).toHaveBeenNthCalledWith(1, { type: 'load' });
        expect(dispatch).toHaveBeenNthCalledWith(2, { type: 'failed', message: 'network down' });
    });

    it('does not throw when the fetcher rejects', async () => {
        const fetcher = vi.fn<TodosFetcher>().mockRejectedValue(new Error('x'));
        await expect(loadTodos(fetcher, vi.fn())).resolves.toBeUndefined();
    });

    it('drives the reducer end-to-end through the collected actions', async () => {
        const fetcher = vi.fn<TodosFetcher>().mockResolvedValue(sampleTodos);
        const actions: TodosAction[] = [];

        await loadTodos(fetcher, (a) => actions.push(a));

        // Replay the recorded actions through the reducer, like a real store would.
        const finalState = actions.reduce(todosReducer, initialTodosState);
        expect(finalState).toEqual({ status: 'success', todos: sampleTodos });
    });
});
