// ═══════════════════════════════════════════════════════════
// CHALLENGE C06: CLASSES & OOP
// Run: npm run challenge:06  |  Time target: 30–40 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Build a payment processing system with an abstract
//          base class, two concrete processors, and an audit trail.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • You MAY add private helper methods.
//  • Run `npm run challenge:06` to check your work.

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// PART 1 — Supporting types (given, do not modify)
// ══════════════════════════════════════════════════════════

export interface AuditEntry {
  timestamp: number; // Date.now()
  action: "charge" | "refund" | "fail";
  amount: number;
  note?: string;
}

// ══════════════════════════════════════════════════════════
// PART 2 — Interface contract
// ══════════════════════════════════════════════════════════

// TODO: Define the Auditable interface:
//   getAuditLog(): AuditEntry[]  — returns all past entries
//   clearAuditLog(): void        — empties the log
export interface Auditable {
  // TODO: add method signatures
}

// ══════════════════════════════════════════════════════════
// PART 3 — Abstract base class
// ══════════════════════════════════════════════════════════

// PaymentProcessor is the base for all processors.
// It holds shared state and implements common logic.
export abstract class PaymentProcessor {
  // TODO: declare these fields with correct access modifiers:
  //   id         — readonly string (set in constructor, never changes)
  //   currency   — protected string (subclasses may read it)
  //   _balance   — private number (only this class touches it directly)

  constructor(id: string, currency: string, initialBalance: number) {
    // TODO: assign the three fields above
    void id; void currency; void initialBalance; // remove these lines once implemented
  }

  // TODO: add a getter `balance` that returns _balance (number)

  // TODO: add a setter `balance` that throws if value < 0,
  //       otherwise sets _balance

  // Abstract methods — subclasses must implement these.
  // TODO: declare abstract charge(amount: number): boolean
  // TODO: declare abstract refund(transactionId: string): boolean

  // Concrete shared method — do NOT make this abstract.
  // Returns a one-line status string:
  //   "Processor <id> | Currency: <currency> | Balance: <balance>"
  // TODO: implement getStatus(): string
  getStatus(): string {
    return "";
  }

  // Method chaining: deposit adds to balance and returns `this`
  // so calls can be chained: processor.deposit(100).deposit(50)
  // TODO: implement deposit(amount: number): this
  deposit(_amount: number): this {
    return this;
  }
}

// ══════════════════════════════════════════════════════════
// PART 4 — Concrete class: CreditCardProcessor
// ══════════════════════════════════════════════════════════

export class CreditCardProcessor extends PaymentProcessor implements Auditable {
  private auditLog: AuditEntry[] = [];
  // lastFour stores the last 4 digits of the card — private, readonly after construction
  private readonly lastFour: string;

  constructor(id: string, lastFour: string, initialBalance: number) {
    // TODO: call super with id, "USD", initialBalance
    super(id, "USD", initialBalance); // already done
    this.lastFour = lastFour;
  }

  // TODO: implement charge(amount: number): boolean
  //   • Return false (and push a "fail" AuditEntry) if amount <= 0 or amount > balance
  //   • On success: subtract amount from balance, push a "charge" AuditEntry, return true
  charge(_amount: number): boolean {
    return false;
  }

  // TODO: implement refund(transactionId: string): boolean
  //   • Always succeeds in this simulation — add amount from transactionId (parse as number) to balance
  //   • Push a "refund" AuditEntry with note = transactionId
  //   • Return true
  refund(_transactionId: string): boolean {
    return false;
  }

  // TODO: implement getAuditLog(): AuditEntry[]  — return a copy (spread or slice)
  getAuditLog(): AuditEntry[] {
    return [];
  }

  // TODO: implement clearAuditLog(): void
  clearAuditLog(): void {}

  // TODO: implement getCardSummary(): string → "Card ending in XXXX"
  getCardSummary(): string {
    return "";
  }
}

// ══════════════════════════════════════════════════════════
// PART 5 — Concrete class: CryptoProcessor
// ══════════════════════════════════════════════════════════

export class CryptoProcessor extends PaymentProcessor implements Auditable {
  private auditLog: AuditEntry[] = [];
  private readonly walletAddress: string;

  constructor(id: string, walletAddress: string, initialBalance: number) {
    // TODO: call super with id, "ETH", initialBalance
    super(id, "ETH", initialBalance);
    this.walletAddress = walletAddress;
  }

  // TODO: implement charge(amount: number): boolean
  //   Same rules as CreditCardProcessor but add a 2% network fee on top:
  //   Effective deduction = amount * 1.02
  //   If balance < amount * 1.02, return false (push "fail" entry)
  //   On success: deduct amount * 1.02, push "charge" entry, return true
  charge(_amount: number): boolean {
    return false;
  }

  // TODO: implement refund — same as CreditCardProcessor
  refund(_transactionId: string): boolean {
    return false;
  }

  // TODO: implement getAuditLog() and clearAuditLog()
  getAuditLog(): AuditEntry[] { return []; }
  clearAuditLog(): void {}

  getWalletSummary(): string {
    return `Wallet: ${this.walletAddress}`;
  }
}

// ══════════════════════════════════════════════════════════
// PART 6 — Static factory method
// ══════════════════════════════════════════════════════════

// TODO: Add a static `create` method to PaymentProcessor (add it to the class above)
// Signature: static create(type: "credit" | "crypto", id: string, detail: string, balance: number): PaymentProcessor
//   "credit" → returns new CreditCardProcessor(id, detail, balance)
//   "crypto" → returns new CryptoProcessor(id, detail, balance)
//
// Because the method references the subclasses, implement it as a standalone
// factory function here instead of modifying the abstract class above:
export function createProcessor(
  type: "credit" | "crypto",
  id: string,
  detail: string,
  balance: number
): PaymentProcessor {
  // TODO: implement
  void type; void id; void detail; void balance;
  return null as unknown as PaymentProcessor;
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C06 Classes assertions ──");

const cc = new CreditCardProcessor("cc-1", "4242", 1000);

// getStatus
assert(cc.getStatus().includes("cc-1"),    "getStatus: contains id");
assert(cc.getStatus().includes("USD"),     "getStatus: contains currency");
assert(cc.getStatus().includes("1000"),    "getStatus: contains balance");

// charge success
assert(cc.charge(200) === true,            "charge: succeeds within balance");
assert(cc.balance     === 800,             "charge: balance reduced");
const log = cc.getAuditLog();
assert(log.length === 1,                           "audit: one entry after charge");
assert(log.length >= 1 && log[0].action === "charge", "audit: entry action is charge");

// charge fail — over balance
assert(cc.charge(900) === false,           "charge: fails when over balance");
assert(cc.balance     === 800,             "charge: balance unchanged on fail");
const log2 = cc.getAuditLog();
assert(log2.length >= 2 && log2[1].action === "fail", "audit: fail entry added");

// charge fail — negative
assert(cc.charge(-10) === false,           "charge: fails for negative amount");

// method chaining
cc.deposit(500).deposit(100);
assert(cc.balance === 1400,                "deposit: method chaining works");

// card summary
assert(cc.getCardSummary().includes("4242"), "getCardSummary: contains last four");

// clearAuditLog
cc.clearAuditLog();
assert(cc.getAuditLog().length === 0,      "clearAuditLog: log is empty");

// CryptoProcessor 2% fee
const crypto = new CryptoProcessor("eth-1", "0xABCD", 1000);
assert(crypto.charge(100) === true,        "crypto charge: succeeds");
assert(Math.abs(crypto.balance - 898) < 0.01, "crypto charge: deducts 2% fee (100 * 1.02 = 102)");

// instanceof
assert(cc instanceof PaymentProcessor,     "instanceof: CreditCardProcessor is PaymentProcessor");
assert(crypto instanceof PaymentProcessor, "instanceof: CryptoProcessor is PaymentProcessor");

// factory
const p1 = createProcessor("credit", "x", "1111", 500);
const p2 = createProcessor("crypto", "y", "0xDEF", 500);
assert(p1 instanceof CreditCardProcessor,  "createProcessor: credit returns CreditCardProcessor");
assert(p2 instanceof CryptoProcessor,      "createProcessor: crypto returns CryptoProcessor");

export {};
