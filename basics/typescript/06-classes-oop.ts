// ═══════════════════════════════════════════════════════════════
// TYPESCRIPT 06: CLASSES & OOP
// Run: npx ts-node 06-classes-oop.ts
// ═══════════════════════════════════════════════════════════════
//
// TypeScript adds to JavaScript classes:
//  • Access modifiers: public, private, protected, readonly
//  • Parameter properties shorthand (declare + assign in constructor)
//  • Abstract classes — define contracts with partial implementation
//  • Interface contracts — implements keyword
//  • Type-safe method chaining with 'this' return type

// ───────────────────────────────────────────────────────────────
// 1. Basic Class with Access Modifiers
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Access Modifiers ===");

class BankAccount {
    public  accountNumber: string;  // accessible everywhere
    protected balance: number;      // accessible in class + subclasses
    private   pin: string;          // accessible ONLY in this class
    readonly  createdAt: Date;      // can't be changed after creation

    constructor(accountNumber: string, initialBalance: number, pin: string) {
        this.accountNumber = accountNumber;
        this.balance       = initialBalance;
        this.pin           = pin;
        this.createdAt     = new Date();
    }

    public getBalance(): number { return this.balance; }

    protected validatePin(input: string): boolean {
        return this.pin === input;
    }

    withdraw(amount: number, pin: string): boolean {
        if (!this.validatePin(pin)) {
            console.log("Invalid PIN");
            return false;
        }
        if (amount > this.balance) {
            console.log("Insufficient funds");
            return false;
        }
        this.balance -= amount;
        return true;
    }
}

const acct = new BankAccount("ACC001", 1000, "1234");
console.log("balance:", acct.getBalance());
acct.withdraw(200, "1234");
console.log("after withdraw:", acct.getBalance());
// acct.pin;     // ❌ Error: private
// acct.balance; // ❌ Error: protected

// ───────────────────────────────────────────────────────────────
// 2. Parameter Properties Shorthand
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. Parameter Properties ===");

// The 'public/private/protected/readonly' prefix in constructor
// AUTOMATICALLY declares the property AND assigns it
class User {
    constructor(
        public  readonly id: string,
        public  name: string,
        public  email: string,
        private password: string,
        protected role: string = "user"
    ) {}

    checkPassword(input: string): boolean {
        return this.password === input;
    }
}

const user1 = new User("u1", "Alice", "a@b.com", "secret");
console.log(user1.name, user1.email, user1.id);
// console.log(user1.password); // ❌ private
// user1.id = "u2";             // ❌ readonly

// ───────────────────────────────────────────────────────────────
// 3. Static Members
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Static Members ===");

class IdGenerator {
    private static counter: number = 0;

    // Singleton pattern using static
    private static instance: IdGenerator;

    private constructor() {}

    static getInstance(): IdGenerator {
        if (!IdGenerator.instance) {
            IdGenerator.instance = new IdGenerator();
        }
        return IdGenerator.instance;
    }

    generate(prefix: string = "ID"): string {
        return `${prefix}-${++IdGenerator.counter}`;
    }

    static reset(): void { IdGenerator.counter = 0; }
}

const gen1 = IdGenerator.getInstance();
const gen2 = IdGenerator.getInstance();
console.log("same instance:", gen1 === gen2);  // true (singleton)
console.log(gen1.generate("USER"), gen1.generate("POST")); // USER-1, POST-2

// ───────────────────────────────────────────────────────────────
// 4. Getters and Setters
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Getters / Setters ===");

class Temperature {
    private _celsius: number = 0;

    get celsius(): number { return this._celsius; }
    set celsius(value: number) {
        if (value < -273.15) throw new RangeError("Below absolute zero");
        this._celsius = value;
    }

    get fahrenheit(): number { return this._celsius * 9/5 + 32; }
    set fahrenheit(value: number) { this.celsius = (value - 32) * 5/9; }

    get kelvin(): number { return this._celsius + 273.15; }
    set kelvin(value: number) { this.celsius = value - 273.15; }
}

const temp = new Temperature();
temp.celsius = 25;
console.log(`${temp.celsius}°C = ${temp.fahrenheit}°F = ${temp.kelvin}K`);

temp.fahrenheit = 212;
console.log(`Boiling: ${temp.celsius}°C`); // 100

// ───────────────────────────────────────────────────────────────
// 5. Method Chaining with 'this' Return Type
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Method Chaining ===");

class QueryBuilder {
    private parts: string[] = [];

    select(...cols: string[]): this {
        this.parts.push(`SELECT ${cols.join(", ")}`);
        return this;
    }

    from(table: string): this {
        this.parts.push(`FROM ${table}`);
        return this;
    }

    where(condition: string): this {
        this.parts.push(`WHERE ${condition}`);
        return this;
    }

    limit(n: number): this {
        this.parts.push(`LIMIT ${n}`);
        return this;
    }

    build(): string { return this.parts.join(" "); }
}

const sql = new QueryBuilder()
    .select("id", "name", "email")
    .from("users")
    .where("age > 18")
    .limit(10)
    .build();
console.log("SQL:", sql);

// ───────────────────────────────────────────────────────────────
// 6. Inheritance
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. Inheritance ===");

class Animal {
    constructor(public name: string, protected sound: string) {}

    speak(): string { return `${this.name} says ${this.sound}`; }
    move(distance: number): string { return `${this.name} moved ${distance}m`; }
}

class Dog extends Animal {
    constructor(name: string, public breed: string) {
        super(name, "Woof");
    }

    // Override parent method
    speak(): string { return `${super.speak()}! (${this.breed})`; }

    fetch(): string { return `${this.name} fetches the ball`; }
}

class Bird extends Animal {
    constructor(name: string, public wingspan: number) {
        super(name, "Tweet");
    }

    move(distance: number): string {
        return `${this.name} flew ${distance}m`; // override
    }
}

const dog = new Dog("Buddy", "Labrador");
const bird = new Bird("Tweety", 25);

console.log(dog.speak());     // "Buddy says Woof! (Labrador)"
console.log(bird.speak());    // "Tweety says Tweet"
console.log(dog.move(10));    // "Buddy moved 10m"
console.log(bird.move(100));  // "Tweety flew 100m"
console.log(dog.fetch());

// ───────────────────────────────────────────────────────────────
// 7. Abstract Classes
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. Abstract Classes ===");

// Cannot be instantiated directly — must be subclassed
abstract class Shape {
    constructor(public color: string) {}

    // Must be implemented by subclass
    abstract getArea(): number;
    abstract getPerimeter(): number;
    abstract readonly name: string;

    // Concrete method — shared by all subclasses
    describe(): string {
        return `${this.color} ${this.name}: area=${this.getArea().toFixed(2)}`;
    }
}

class Circle extends Shape {
    readonly name = "Circle";
    constructor(color: string, public radius: number) { super(color); }
    getArea(): number { return Math.PI * this.radius ** 2; }
    getPerimeter(): number { return 2 * Math.PI * this.radius; }
}

class Rectangle extends Shape {
    readonly name = "Rectangle";
    constructor(color: string, public w: number, public h: number) { super(color); }
    getArea(): number { return this.w * this.h; }
    getPerimeter(): number { return 2 * (this.w + this.h); }
}

// const s = new Shape("red"); // ❌ Cannot instantiate abstract class

const shapes: Shape[] = [
    new Circle("red", 5),
    new Rectangle("blue", 4, 6),
    new Circle("green", 3),
];

shapes.forEach(s => console.log(s.describe()));

// ───────────────────────────────────────────────────────────────
// 8. Implementing Interfaces
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. Implements Interfaces ===");

interface Printable  { print(): void; }
interface Saveable   { save(): Promise<boolean>; }
interface Comparable<T> { compareTo(other: T): number; }

class Invoice implements Printable, Saveable, Comparable<Invoice> {
    constructor(
        public id: string,
        public amount: number,
        public client: string
    ) {}

    print(): void {
        console.log(`Invoice ${this.id}: ${this.client} — $${this.amount}`);
    }

    async save(): Promise<boolean> {
        // simulate DB save
        console.log(`Saved invoice ${this.id}`);
        return true;
    }

    compareTo(other: Invoice): number {
        return this.amount - other.amount;
    }
}

const inv1 = new Invoice("INV-001", 5000, "Acme Corp");
const inv2 = new Invoice("INV-002", 3200, "Widgets Inc");

inv1.print();
inv2.print();
console.log("compare:", inv1.compareTo(inv2) > 0 ? "INV-001 is higher" : "INV-002 is higher");
inv1.save();

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q1: What's the difference between private and #private?
// TypeScript 'private' — compile-time only; at runtime JS the property is accessible
// ECMAScript '#private'  — truly private at runtime, even via (obj as any).#field fails

// Q2: When to use abstract class vs interface?
// Interface   — pure contract, no implementation, multiple implements allowed
// Abstract    — partial implementation + contract, single extends (class hierarchy)

// Q3: Implement a generic Repository base class
abstract class BaseRepository<T extends { id: string }> {
    protected items: T[] = [];

    findById(id: string): T | undefined {
        return this.items.find(item => item.id === id);
    }

    findAll(): T[] { return [...this.items]; }

    abstract create(data: Omit<T, "id">): T;
}

interface Note { id: string; title: string; body: string; }

class NoteRepository extends BaseRepository<Note> {
    create(data: Omit<Note, "id">): Note {
        const note: Note = { id: `n-${Date.now()}`, ...data };
        this.items.push(note);
        return note;
    }
}

const notes = new NoteRepository();
const note = notes.create({ title: "Test", body: "Hello TS" });
console.log("Q3 note:", note.title, notes.findById(note.id)?.title);

export {};
