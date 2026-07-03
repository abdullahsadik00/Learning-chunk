// ═══════════════════════════════════════════════════════════
// CHALLENGE C07: DECORATORS
// Run: npm run challenge:07  |  Time target: 30–40 min
// ═══════════════════════════════════════════════════════════
// PROJECT: Build a lightweight service container where decorators
//          register classes, validate inputs, and log method calls.
//
// RULES:
//  • Delete each // TODO comment as you implement it.
//  • Do NOT rename any exported name — assertions depend on them.
//  • You MAY add helper functions.
//  • Run `npm run challenge:07` to check your work.
//  NOTE: experimentalDecorators is enabled in tsconfig.json.

// ── ASSERT HELPER (do not modify) ─────────────────────────
function assert(condition: boolean, message: string): void {
  if (!condition) { console.error(`  FAIL  ${message}`); process.exitCode = 1; }
  else            { console.log (`  PASS  ${message}`); }
}

// ══════════════════════════════════════════════════════════
// SHARED REGISTRIES (do not modify)
// ══════════════════════════════════════════════════════════

export const serviceRegistry = new Map<string, Function>();
export const callLog: string[] = [];

// ══════════════════════════════════════════════════════════
// PART 1 — Class decorator: @Service(name)
// ══════════════════════════════════════════════════════════

// @Service("myName") registers the class in serviceRegistry under "myName".
// It must be a decorator factory (returns the actual decorator).
// The class itself is NOT modified — only register it.
//
// TODO: implement
export function Service(name: string) {
  return function (constructor: Function): void {
    // TODO: register constructor in serviceRegistry under `name`
    void name; void constructor;
  };
}

// ══════════════════════════════════════════════════════════
// PART 2 — Method decorator: @Log
// ══════════════════════════════════════════════════════════

// @Log wraps the method so that every call pushes a string to callLog:
//   "<ClassName>.<methodName> called"
//
// Hint: descriptor.value is the original function.
//       Replace it with a wrapper that pushes to callLog, then calls through.
//       Use `target.constructor.name` to get the class name.
//
// TODO: implement
export function Log(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  void target; void propertyKey; void descriptor;
  return descriptor; // replace this with the real implementation
}

// ══════════════════════════════════════════════════════════
// PART 3 — Method decorator: @Validate
// ══════════════════════════════════════════════════════════

// @Validate checks every argument before the method runs.
// If any argument is null or undefined, throw new Error("Invalid argument: null or undefined").
// Otherwise call through normally.
//
// TODO: implement
export function Validate(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  void target; void propertyKey;
  return descriptor; // replace this with the real implementation
}

// ══════════════════════════════════════════════════════════
// PART 4 — Property decorator: @ReadonlyProp
// ══════════════════════════════════════════════════════════

// @ReadonlyProp makes a property non-writable after the instance is created.
// Use Object.defineProperty in the decorator to set writable: false.
//
// Hint: property decorators receive (target, propertyKey) — no descriptor.
//       Use Object.defineProperty on the prototype to control writability.
//       Because this is set on the prototype, any later assignment attempt
//       in strict mode will throw; in non-strict it silently fails.
//
// TODO: implement
export function ReadonlyProp(target: any, propertyKey: string): void {
  void target; void propertyKey;
  // TODO: Object.defineProperty(target, propertyKey, { writable: false, configurable: false })
}

// ══════════════════════════════════════════════════════════
// PART 5 — Decorated services
// ══════════════════════════════════════════════════════════

// Do NOT rename these classes or their methods — assertions use them.

@Service("userService")
export class UserService {
  @ReadonlyProp
  readonly serviceName = "UserService";

  @Log
  @Validate
  getUser(id: string): string {
    return `User(${id})`;
  }

  @Log
  listUsers(): string[] {
    return ["alice", "bob"];
  }
}

@Service("orderService")
export class OrderService {
  @Log
  @Validate
  getOrder(orderId: string, userId: string): string {
    return `Order(${orderId}) for User(${userId})`;
  }
}

// ── ASSERTIONS (do not modify) ────────────────────────────
console.log("\n── C07 Decorators assertions ──");

// @Service registration
assert(serviceRegistry.has("userService"),  "@Service: userService is registered");
assert(serviceRegistry.has("orderService"), "@Service: orderService is registered");
assert(serviceRegistry.get("userService") === UserService,  "@Service: maps to UserService class");
assert(serviceRegistry.get("orderService") === OrderService, "@Service: maps to OrderService class");

// @Log
const us = new UserService();
const os = new OrderService();

callLog.length = 0; // reset
us.getUser("u1");
assert(callLog.length === 1,                                              "@Log: one entry after getUser call");
assert(callLog.length >= 1 && callLog[0].includes("getUser"),             "@Log: entry mentions method name");
assert(callLog.length >= 1 && callLog[0].includes("UserService"),         "@Log: entry mentions class name");

us.listUsers();
assert(callLog.length === 2,                  "@Log: two entries after listUsers call");

// @Validate — should throw on null/undefined
let threw = false;
try { us.getUser(null as unknown as string); } catch { threw = true; }
assert(threw, "@Validate: throws when argument is null");

threw = false;
try { us.getUser(undefined as unknown as string); } catch { threw = true; }
assert(threw, "@Validate: throws when argument is undefined");

// @Validate — should pass through on valid args
let result = "";
try { result = us.getUser("u42"); } catch { /* noop */ }
assert(result === "User(u42)",                "@Validate: passes through on valid argument");

// OrderService @Validate with two args
threw = false;
try { os.getOrder("o1", null as unknown as string); } catch { threw = true; }
assert(threw, "@Validate: throws when second argument is null");

const orderResult = os.getOrder("o1", "u1");
assert(orderResult === "Order(o1) for User(u1)", "@Validate: getOrder returns correct string");

export {};
