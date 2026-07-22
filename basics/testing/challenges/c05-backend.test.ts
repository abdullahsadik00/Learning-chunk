// ═══════════════════════════════════════════════════════════
// CHALLENGE C05: BACKEND TESTING  (Day 36)
// Run: npm run challenge:05   |   Time target: 35–45 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Test the pure core of an auth/wallet backend WITHOUT a DB or HTTP
//          server — the three most-unit-tested backend layers:
//            1) request-body validation (like a Zod schema)
//            2) a signed-token helper (sign / verify round-trip)
//            3) a service that depends on a repository — mocked with vi.fn()
//          so there is zero I/O.
//
// NOTE ON DAY MAPPING: Day 35 is Playwright E2E, which needs a real browser and
// cannot go green under Vitest. This challenge maps the "backend testing"
// techniques from teaching file 06 (Day 36) into the same self-checking Vitest
// loop so the whole set stays runnable with no network and no backend.
//
// RED→GREEN TDD loop: SPECS are complete; SUBJECT ships stubbed → RED.
//
// RULES:
//  • Implement the SUBJECT — keep signatures and exported names.
//  • Do NOT edit anything below the "SPECS" banner.
//  • The service must use the injected `repo`; never touch a real DB.
//  • Run `npm run challenge:05` — all green = done.

import { describe, it, expect, vi } from 'vitest';

// ══════════════════════════════════════════════════════════
// SUBJECT — implement these (Day 36: validation, tokens, mocked deps)
// ══════════════════════════════════════════════════════════

// ── 1) Validation ────────────────────────────────────────────────────────
export interface SignupInput {
    username: string;
    email: string;
    password: string;
}

export interface ValidationResult {
    ok: boolean;
    errors: string[]; // empty when ok === true
}

// Rules (push one message per broken rule, in this order):
//   username: length >= 3            → 'username too short'
//   email:    contains a single '@'  → 'invalid email'
//   password: length >= 8            → 'password too short'
// ok is true only when errors is empty.
export function validateSignup(input: SignupInput): ValidationResult {
    // TODO: build the errors array per the rules above, then return
    //       { ok: errors.length === 0, errors }.
    return { ok: false, errors: [] }; // placeholder — remove
}

// ── 2) Signed token helper ───────────────────────────────────────────────
// A tiny stand-in for JWT: token = base64(JSON payload) + '.' + signature,
// where signature = base64(sign(base64payload, secret)). Keep it deterministic.
// (You may implement `sign` however you like as long as verify round-trips.)
export interface TokenPayload {
    userId: string;
    role: string;
}

export function signToken(payload: TokenPayload, secret: string): string {
    // TODO: encode the payload and append a signature derived from the
    //       encoded payload + secret. Return `${encoded}.${signature}`.
    return ''; // placeholder — remove
}

// Return the payload if the signature matches for `secret`; otherwise null.
export function verifyToken(token: string, secret: string): TokenPayload | null {
    // TODO: split on '.', recompute the signature, compare, and JSON-parse the
    //       payload only when it matches. Return null on any mismatch/parse error.
    return null; // placeholder — remove
}

// ── 3) Service with an injected repository (mocked in tests) ──────────────
export interface AccountRepo {
    getBalance(userId: string): Promise<number>;
    setBalance(userId: string, amount: number): Promise<void>;
}

// transfer moves `amount` from → to using ONLY the repo:
//   - amount must be > 0            → throw Error('amount must be positive')
//   - sender must have enough funds → throw Error('insufficient funds')
//   - on success: setBalance(from, fromBalance-amount) and
//                 setBalance(to,   toBalance+amount)
// Reads both balances via repo.getBalance before writing.
export async function transfer(
    repo: AccountRepo,
    from: string,
    to: string,
    amount: number,
): Promise<void> {
    // TODO: validate amount, read both balances, check funds, write both sides.
}

// ══════════════════════════════════════════════════════════
// SPECS — do not modify below this line
// ══════════════════════════════════════════════════════════

describe('C05 · validateSignup', () => {
    it('accepts a fully valid input', () => {
        expect(validateSignup({ username: 'ada', email: 'a@b.com', password: 'longenough' }))
            .toEqual({ ok: true, errors: [] });
    });

    it.each([
        [{ username: 'ab', email: 'a@b.com', password: 'longenough' }, ['username too short']],
        [{ username: 'ada', email: 'nope', password: 'longenough' }, ['invalid email']],
        [{ username: 'ada', email: 'a@b.com', password: 'short' }, ['password too short']],
    ])('flags a single broken rule %#', (input, expected) => {
        const result = validateSignup(input);
        expect(result.ok).toBe(false);
        expect(result.errors).toEqual(expected);
    });

    it('collects multiple errors in rule order', () => {
        const result = validateSignup({ username: 'a', email: 'bad', password: 'x' });
        expect(result.errors).toEqual(['username too short', 'invalid email', 'password too short']);
    });
});

describe('C05 · signToken / verifyToken', () => {
    const secret = 's3cret';
    const payload: TokenPayload = { userId: 'u1', role: 'admin' };

    it('round-trips a payload with the correct secret', () => {
        const token = signToken(payload, secret);
        expect(typeof token).toBe('string');
        expect(token).toContain('.');
        expect(verifyToken(token, secret)).toEqual(payload);
    });

    it('rejects a token verified with the wrong secret', () => {
        const token = signToken(payload, secret);
        expect(verifyToken(token, 'wrong')).toBeNull();
    });

    it('rejects a tampered token', () => {
        const token = signToken(payload, secret);
        const tampered = 'Zm9v' + token; // corrupt the encoded payload
        expect(verifyToken(tampered, secret)).toBeNull();
    });

    it('returns null on malformed input instead of throwing', () => {
        expect(verifyToken('garbage', secret)).toBeNull();
    });
});

describe('C05 · transfer (mocked repository)', () => {
    function makeRepo(balances: Record<string, number>): AccountRepo {
        return {
            getBalance: vi.fn(async (id: string) => balances[id] ?? 0),
            setBalance: vi.fn(async (id: string, amount: number) => {
                balances[id] = amount;
            }),
        };
    }

    it('moves funds between accounts on success', async () => {
        const repo = makeRepo({ alice: 100, bob: 20 });
        await transfer(repo, 'alice', 'bob', 30);
        expect(repo.setBalance).toHaveBeenCalledWith('alice', 70);
        expect(repo.setBalance).toHaveBeenCalledWith('bob', 50);
        expect(repo.setBalance).toHaveBeenCalledTimes(2);
    });

    it('reads balances through the repo (no direct state access)', async () => {
        const repo = makeRepo({ alice: 100, bob: 0 });
        await transfer(repo, 'alice', 'bob', 10);
        expect(repo.getBalance).toHaveBeenCalledWith('alice');
        expect(repo.getBalance).toHaveBeenCalledWith('bob');
    });

    it('rejects a non-positive amount and writes nothing', async () => {
        const repo = makeRepo({ alice: 100, bob: 0 });
        await expect(transfer(repo, 'alice', 'bob', 0)).rejects.toThrow('amount must be positive');
        expect(repo.setBalance).not.toHaveBeenCalled();
    });

    it('rejects on insufficient funds and writes nothing', async () => {
        const repo = makeRepo({ alice: 5, bob: 0 });
        await expect(transfer(repo, 'alice', 'bob', 10)).rejects.toThrow('insufficient funds');
        expect(repo.setBalance).not.toHaveBeenCalled();
    });
});
