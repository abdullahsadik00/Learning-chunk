// ═══════════════════════════════════════════════════════════════
// TYPESCRIPT 05: UTILITY TYPES — BUILT-IN POWER TOOLS
// Run: npx ts-node 05-utility-types.ts
// ═══════════════════════════════════════════════════════════════
//
// TypeScript ships with ~20 built-in utility types.
// They transform existing types without rewriting them.
//
// OBJECT UTILITIES:   Partial, Required, Readonly, Mutable
//                     Pick, Omit, Record, Exclude, Extract, NonNullable
// FUNCTION UTILITIES: ReturnType, Parameters, ConstructorParameters
//                     InstanceType, ThisParameterType, OmitThisParameter
// STRING UTILITIES:   Uppercase, Lowercase, Capitalize, Uncapitalize

// Base interfaces used throughout this file
interface UserProfile {
    id: number;
    name: string;
    email: string;
    age: number;
    createdAt: Date;
    role: "admin" | "user" | "guest";
}

interface PostRecord {
    id: number;
    title: string;
    content: string;
    authorId: number;
    published: boolean;
    publishedAt: Date | null;
}

// ───────────────────────────────────────────────────────────────
// 1. Partial<T> — Make all properties optional
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Partial<T> ===");

// Use case: update endpoints — only send the changed fields
function updateUser(id: number, updates: Partial<UserProfile>): void {
    console.log("Updating user", id, "with", updates);
}

updateUser(1, { name: "New Name" });                  // ✅ partial
updateUser(1, { name: "Alice", age: 31 });            // ✅ partial
// updateUser(1, { invalid: true });                  // ❌ Error

// ───────────────────────────────────────────────────────────────
// 2. Required<T> — Make all properties required (remove ?)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Required<T> ===");

interface Config {
    host?: string;
    port?: number;
    debug?: boolean;
}

function startServer(config: Required<Config>): void {
    console.log(`Starting on ${config.host}:${config.port} debug=${config.debug}`);
}

startServer({ host: "localhost", port: 3000, debug: false }); // ✅
// startServer({ host: "localhost" });                        // ❌ port, debug missing

// ───────────────────────────────────────────────────────────────
// 3. Readonly<T> — Make all properties readonly (shallow)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Readonly<T> ===");

const frozenUser: Readonly<UserProfile> = {
    id: 1, name: "Alice", email: "a@b.com",
    age: 30, createdAt: new Date(), role: "user",
};

// frozenUser.name = "Bob"; // ❌ Cannot assign to 'name' — readonly
// Note: Readonly is SHALLOW — nested objects are still mutable
// frozenUser.createdAt.setFullYear(2000); // ✅ Still works (nested object)

console.log("frozen:", frozenUser.name);

// ───────────────────────────────────────────────────────────────
// 4. Pick<T, K> — Create type with only specified keys
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Pick<T, K> ===");

// Show only public info in a list
type UserSummary = Pick<UserProfile, "id" | "name" | "role">;

const summary: UserSummary = { id: 1, name: "Alice", role: "admin" };
console.log("summary:", summary);

// ───────────────────────────────────────────────────────────────
// 5. Omit<T, K> — Create type with specified keys removed
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Omit<T, K> ===");

// Create user — no id or timestamps (server generates those)
type CreateUserDTO = Omit<UserProfile, "id" | "createdAt">;

const newUser: CreateUserDTO = {
    name: "Bob", email: "bob@x.com",
    age: 25, role: "user",
};
console.log("create user:", newUser);

// Update user — all optional EXCEPT id
type UpdateUserDTO = Partial<Omit<UserProfile, "id" | "createdAt">> & Pick<UserProfile, "id">;

const update: UpdateUserDTO = { id: 1, name: "New Name" };
console.log("update:", update);

// ───────────────────────────────────────────────────────────────
// 6. Record<K, V> — Object type with keys K and values V
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Record<K, V> ===");

// Map a union to a consistent shape
type RolePermissions = Record<"admin" | "user" | "guest", string[]>;

const perms: RolePermissions = {
    admin: ["read", "write", "delete"],
    user:  ["read", "write"],
    guest: ["read"],
};
console.log("perms:", perms.admin);

// String → number mapping (dictionary)
type WordCount = Record<string, number>;
const wc: WordCount = { hello: 3, world: 1 };
console.log("word count:", wc);

// ───────────────────────────────────────────────────────────────
// 7. Exclude<T, U> and Extract<T, U>
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Exclude / Extract ===");

type AllEvents = "click" | "focus" | "blur" | "keydown" | "keyup";

// Remove types assignable to U
type MouseEvents = Exclude<AllEvents, "keydown" | "keyup">;
// "click" | "focus" | "blur"

// Keep ONLY types assignable to U
type KeyboardEvents = Extract<AllEvents, "keydown" | "keyup">;
// "keydown" | "keyup"

const e1: MouseEvents = "click";
const e2: KeyboardEvents = "keydown";
console.log("mouse:", e1, "keyboard:", e2);

// ───────────────────────────────────────────────────────────────
// 8. NonNullable<T> — Remove null and undefined
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. NonNullable<T> ===");

type MaybeString = string | null | undefined;
type DefiniteString = NonNullable<MaybeString>; // string

function safeLength(s: MaybeString): number {
    const safe: DefiniteString = s!; // after your own null check
    return safe.length;
}
// Actually let TypeScript help:
function betterLength(s: MaybeString): number {
    if (s == null) return 0;
    return s.length; // TypeScript narrows to string here
}
console.log("length:", betterLength("hello"), betterLength(null));

// ───────────────────────────────────────────────────────────────
// 9. ReturnType<T> and Parameters<T>
// ───────────────────────────────────────────────────────────────

console.log("\n=== 9. ReturnType / Parameters ===");

function createSession(userId: string, role: string) {
    return { token: "abc123", userId, role, expiresAt: new Date() };
}

type Session = ReturnType<typeof createSession>;
// { token: string; userId: string; role: string; expiresAt: Date }

const session: Session = createSession("u1", "admin");
console.log("session:", session.token);

function greetUser2(name: string, title: string, formal: boolean): string {
    return formal ? `Dear ${title} ${name}` : `Hey ${name}`;
}

type GreetParams = Parameters<typeof greetUser2>;
// [name: string, title: string, formal: boolean]

function logAndGreet(...args: GreetParams): string {
    console.log("args:", args);
    return greetUser2(...args);
}
console.log(logAndGreet("Alice", "Dr", true));

// ───────────────────────────────────────────────────────────────
// 10. ConstructorParameters<T> and InstanceType<T>
// ───────────────────────────────────────────────────────────────

console.log("\n=== 10. ConstructorParameters / InstanceType ===");

class Animal {
    constructor(public name: string, public species: string) {}
    speak(): string { return `${this.name} makes a sound`; }
}

type AnimalCtorParams = ConstructorParameters<typeof Animal>;
// [string, string]

type AnimalInstance = InstanceType<typeof Animal>;
// Animal

// Generic factory using these utility types
function createInstance<T extends new (...args: any[]) => any>(
    Ctor: T,
    ...args: ConstructorParameters<T>
): InstanceType<T> {
    return new Ctor(...args);
}

const animal = createInstance(Animal, "Leo", "Lion");
console.log("instance:", animal.speak());

// ───────────────────────────────────────────────────────────────
// 11. String Utility Types
// ───────────────────────────────────────────────────────────────

console.log("\n=== 11. String Utility Types ===");

type Loud  = Uppercase<"hello world">;   // "HELLO WORLD"
type Quiet = Lowercase<"HELLO WORLD">;   // "hello world"
type Cap   = Capitalize<"hello">;        // "Hello"
type Uncap = Uncapitalize<"Hello">;      // "hello"

// Practical: generate Redux action type strings
type ActionTypes<Prefix extends string> =
    | `${Uppercase<Prefix>}_REQUEST`
    | `${Uppercase<Prefix>}_SUCCESS`
    | `${Uppercase<Prefix>}_FAILURE`;

type UserActions  = ActionTypes<"fetchUser">;
// "FETCHUSER_REQUEST" | "FETCHUSER_SUCCESS" | "FETCHUSER_FAILURE"

type AuthActions = ActionTypes<"login">;
// "LOGIN_REQUEST" | "LOGIN_SUCCESS" | "LOGIN_FAILURE"

const action: AuthActions = "LOGIN_SUCCESS";
console.log("action:", action);

// ───────────────────────────────────────────────────────────────
// 12. Combining Utility Types
// ───────────────────────────────────────────────────────────────

console.log("\n=== 12. Combining Utility Types ===");

// PartialBy<T, K> — make only specific keys optional
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type UserWithOptionalEmail = PartialBy<UserProfile, "email" | "age">;
// id, name, createdAt, role are required; email, age are optional

const u: UserWithOptionalEmail = { id: 1, name: "Alice", createdAt: new Date(), role: "user" };
console.log("partial by:", u.name, u.email); // Alice, undefined

// Simplify intersection (flatten merged type into clean shape)
type Simplify<T> = { [K in keyof T]: T[K] };
type CleanUser = Simplify<UserWithOptionalEmail>;

// ReadonlyPick<T, K>
type ReadonlyPick<T, K extends keyof T> = Readonly<Pick<T, K>>;
type ImmutableIdentity = ReadonlyPick<UserProfile, "id" | "email">;
// { readonly id: number; readonly email: string }

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q1: Create CRUD DTO types for PostRecord
type CreatePostDTO  = Omit<PostRecord, "id" | "publishedAt">;
type UpdatePostDTO  = Partial<Omit<PostRecord, "id">> & Pick<PostRecord, "id">;
type PostListItem   = Pick<PostRecord, "id" | "title" | "published">;

const newPost: CreatePostDTO = {
    title: "Hello TypeScript", content: "...", authorId: 1, published: false,
};
console.log("Q1 create post:", newPost.title);

// Q2: What's the difference between Omit and Exclude?
// Omit<T, K>    — removes KEYS from an object type
// Exclude<T, U> — removes MEMBERS from a union type
type Q2a = Omit<{ a: 1; b: 2; c: 3 }, "b">;       // { a: 1; c: 3 }
type Q2b = Exclude<"a" | "b" | "c", "b">;            // "a" | "c"
console.log("Q2: Omit removes keys, Exclude removes union members");

// Q3: Build a generic transform function
function transform<T, R>(
    items: T[],
    fn: (item: T) => R
): R[] {
    return items.map(fn);
}

const names = transform([{ id: 1, name: "A" }, { id: 2, name: "B" }], u => u.name);
console.log("Q3 transform:", names); // ["A", "B"]

export {};
