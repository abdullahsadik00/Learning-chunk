// ═══════════════════════════════════════════════════════════
// CHALLENGE C02: COMPONENT TESTING  (Day 32)
// Run: npm run challenge:02   |   Time target: 30–40 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Build a small <StepperInput> component the way Testing Library
//          wants it tested — accessible roles, real user interactions, and a
//          callback prop the test can spy on.
//
// RED→GREEN TDD loop: the SPECS below drive the DOM with render + userEvent +
// role queries. The component ships as an empty stub, so the suite is RED
// until you build the real markup and behavior.
//
// RULES:
//  • Implement the SUBJECT component — do not change props or exported names.
//  • Do NOT edit anything below the "SPECS" banner.
//  • Query by ROLE / accessible name like the specs do; don't rely on
//    test-ids or implementation details.
//  • Run `npm run challenge:02` — all green = done.

import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ══════════════════════════════════════════════════════════
// SUBJECT — implement this component (Day 32: render + user-event + roles)
// ══════════════════════════════════════════════════════════
// Requirements:
//   • Renders a heading (role "heading") showing `label`.
//   • Shows the current value inside an element with role "status"
//     (e.g. <output role="status">).
//   • Has two buttons with accessible names "Increment" and "Decrement".
//     - Increment adds `step`; Decrement subtracts `step`.
//     - The value must never go below `min` (Decrement is disabled/clamped
//       at min).
//   • Starts at `initial` and calls `onChange(newValue)` after each change.

export interface StepperInputProps {
    label: string;
    initial?: number; // default 0
    step?: number; // default 1
    min?: number; // default 0
    onChange?: (value: number) => void;
}

export function StepperInput({
    label,
    initial = 0,
    step = 1,
    min = 0,
    onChange,
}: StepperInputProps): React.ReactElement {
    // TODO: track the value with useState(initial).
    // TODO: render a heading with {label}, an output[role=status] with the
    //       value, and Increment/Decrement buttons.
    // TODO: clamp at `min`, and call onChange(next) whenever the value changes.
    return <div />; // placeholder — remove
}

// ══════════════════════════════════════════════════════════
// SPECS — do not modify below this line
// ══════════════════════════════════════════════════════════

describe('C02 · StepperInput', () => {
    it('renders the label as a heading and the initial value in a status', () => {
        render(<StepperInput label="Quantity" initial={2} />);
        expect(screen.getByRole('heading', { name: 'Quantity' })).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent('2');
    });

    it('increments by step when Increment is clicked', async () => {
        const user = userEvent.setup();
        render(<StepperInput label="Qty" initial={0} step={2} />);
        await user.click(screen.getByRole('button', { name: 'Increment' }));
        expect(screen.getByRole('status')).toHaveTextContent('2');
        await user.click(screen.getByRole('button', { name: 'Increment' }));
        expect(screen.getByRole('status')).toHaveTextContent('4');
    });

    it('decrements but never goes below min', async () => {
        const user = userEvent.setup();
        render(<StepperInput label="Qty" initial={1} min={0} />);
        await user.click(screen.getByRole('button', { name: 'Decrement' }));
        expect(screen.getByRole('status')).toHaveTextContent('0');
        // already at min — another decrement stays at 0
        await user.click(screen.getByRole('button', { name: 'Decrement' }));
        expect(screen.getByRole('status')).toHaveTextContent('0');
    });

    it('calls onChange with the new value on each change', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<StepperInput label="Qty" initial={5} step={5} onChange={onChange} />);
        await user.click(screen.getByRole('button', { name: 'Increment' }));
        expect(onChange).toHaveBeenLastCalledWith(10);
        await user.click(screen.getByRole('button', { name: 'Decrement' }));
        expect(onChange).toHaveBeenLastCalledWith(5);
        expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('does not fire onChange when a decrement is clamped at min', async () => {
        const user = userEvent.setup();
        const onChange = vi.fn();
        render(<StepperInput label="Qty" initial={0} min={0} onChange={onChange} />);
        await user.click(screen.getByRole('button', { name: 'Decrement' }));
        expect(onChange).not.toHaveBeenCalled();
    });
});
