// ═══════════════════════════════════════════════════════════════
// MODULE 6: PROTOTYPES & INHERITANCE
// Run: node 05-prototypes.js
// ═══════════════════════════════════════════════════════════════
//
// PROTOTYPE = an object that another object inherits from.
//
// Every object has a hidden [[Prototype]] link (readable as __proto__).
// When you read obj.prop JS searches:
//   obj → obj.__proto__ → obj.__proto__.__proto__ → ... → null
// This chain of __proto__ links = the PROTOTYPE CHAIN.
//
// KEY DISTINCTION:
//   __proto__  → property ON every object; points to its prototype
//   prototype  → property ON functions only; becomes __proto__ of
//                objects created with `new Constructor()`

// ───────────────────────────────────────────────────────────────
// 1. BASIC PROTOTYPE CHAIN
// ───────────────────────────────────────────────────────────────

console.log("=== 1. Basic Prototype Chain ===");

const animal = {
    eat() { console.log(this.name, "is eating"); },
    sleep() { console.log(this.name, "is sleeping"); },
};

const dog = { name: "Rex" };
Object.setPrototypeOf(dog, animal); // dog.__proto__ = animal

dog.eat();   // "Rex is eating"  — found on animal (1 level up)
dog.sleep(); // "Rex is sleeping"

// Lookup trace for dog.eat():
//   1. Is `eat` on dog?       No
//   2. Is `eat` on animal?    Yes → call it with this = dog ✅

console.log(Object.getPrototypeOf(dog) === animal); // true

// ───────────────────────────────────────────────────────────────
// 2. __proto__ vs prototype
// ───────────────────────────────────────────────────────────────

console.log("\n=== 2. __proto__ vs prototype ===");

function Person(name) {
    this.name = name;
}
// Person.prototype = the object that will become __proto__ of instances

Person.prototype.greet = function () {
    console.log(`Hi, I'm ${this.name}`);
};

const p1 = new Person("Sadik");
const p2 = new Person("Priya");

p1.greet(); // Hi, I'm Sadik
p2.greet(); // Hi, I'm Priya

console.log(p1.__proto__ === Person.prototype); // true
console.log(p2.__proto__ === Person.prototype); // true
console.log(p1.greet === p2.greet);             // true — shared single copy

// p1 and p2 have their OWN `name`, but SHARE `greet` via prototype.
// This is memory-efficient — greet exists only once.

// ───────────────────────────────────────────────────────────────
// 3. WHY put methods on prototype (not inside the constructor)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 3. Prototype vs In-Constructor ===");

// ❌ Wasteful — each instance gets its own copy of greet
function PersonBad(name) {
    this.name = name;
    this.greet = function () { return `Hi, I'm ${this.name}`; };
}
const b1 = new PersonBad("A");
const b2 = new PersonBad("B");
console.log(b1.greet === b2.greet); // false — separate copies in memory!

// ✅ Efficient — all instances share one copy on the prototype
function PersonGood(name) {
    this.name = name;
}
PersonGood.prototype.greet = function () { return `Hi, I'm ${this.name}`; };
const g1 = new PersonGood("A");
const g2 = new PersonGood("B");
console.log(g1.greet === g2.greet); // true ✅

// ───────────────────────────────────────────────────────────────
// 4. Object.create() — cleanest prototype setup
// ───────────────────────────────────────────────────────────────

console.log("\n=== 4. Object.create() ===");

const vehicleProto = {
    describe() { console.log(`${this.brand} — ${this.type}`); },
    start()    { console.log(`${this.brand} started`); },
};

const car = Object.create(vehicleProto); // car.__proto__ = vehicleProto
car.brand = "Toyota";
car.type  = "Sedan";

car.describe(); // Toyota — Sedan
car.start();    // Toyota started

console.log(Object.getPrototypeOf(car) === vehicleProto); // true

// Object.create(null) — object with NO prototype at all (useful for pure maps)
const pureMap = Object.create(null);
pureMap.key = "value";
console.log(pureMap.hasOwnProperty); // undefined — no inherited methods

// ───────────────────────────────────────────────────────────────
// 5. PROTOTYPE-BASED INHERITANCE (pre-ES6 style — interviews love this)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 5. Prototypal Inheritance ===");

// Parent
function Animal(name) {
    this.name = name;
}
Animal.prototype.speak = function () {
    console.log(`${this.name} makes a sound`);
};

// Child
function Dog(name, breed) {
    Animal.call(this, name); // ① call parent constructor (sets this.name)
    this.breed = breed;
}

// ② Wire up the prototype chain
Dog.prototype = Object.create(Animal.prototype);
// ③ Fix the constructor reference (Object.create reset it to Animal)
Dog.prototype.constructor = Dog;

// ④ Add Dog-specific methods
Dog.prototype.bark = function () {
    console.log(`${this.name} barks: Woof!`);
};

// ⑤ Override parent method
Dog.prototype.speak = function () {
    console.log(`${this.name} barks loudly!`);
};

const rex = new Dog("Rex", "German Shepherd");
rex.bark();   // Rex barks: Woof!
rex.speak();  // Rex barks loudly!   (overridden)

console.log(rex instanceof Dog);    // true
console.log(rex instanceof Animal); // true — prototype chain goes through Animal

// Prototype chain for rex:
// rex → Dog.prototype → Animal.prototype → Object.prototype → null

// ───────────────────────────────────────────────────────────────
// 6. ES6 CLASS SYNTAX (syntactic sugar over prototypes)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 6. ES6 Classes ===");

class Shape {
    constructor(color) {
        this.color = color;
    }

    describe() {
        console.log(`A ${this.color} shape`);
    }

    // Static method — on the class itself, not instances
    static create(color) {
        return new Shape(color);
    }
}

class Circle extends Shape {
    constructor(color, radius) {
        super(color); // must call super() before using `this`
        this.radius = radius;
    }

    area() {
        return +(Math.PI * this.radius ** 2).toFixed(2);
    }

    describe() {
        super.describe(); // call parent's describe
        console.log(`  Radius: ${this.radius}, Area: ${this.area()}`);
    }
}

const c1 = new Circle("red", 5);
c1.describe();
// A red shape
// Radius: 5, Area: 78.54

console.log(c1 instanceof Circle); // true
console.log(c1 instanceof Shape);  // true

// Proof that classes are still prototypes underneath:
console.log(typeof Shape);                               // "function"
console.log(Circle.prototype.__proto__ === Shape.prototype); // true

// ───────────────────────────────────────────────────────────────
// 7. PROPERTY LOOKUP — own vs inherited
// ───────────────────────────────────────────────────────────────

console.log("\n=== 7. own vs inherited ===");

function Car(brand) {
    this.brand = brand;        // own property
}
Car.prototype.wheels = 4;      // inherited property

const myCar = new Car("Honda");

console.log(myCar.brand);   // "Honda"
console.log(myCar.wheels);  // 4 — found on prototype

// hasOwnProperty — checks ONLY the object itself:
// eslint-disable-next-line no-prototype-builtins
console.log(myCar.hasOwnProperty("brand"));  // true
// eslint-disable-next-line no-prototype-builtins
console.log(myCar.hasOwnProperty("wheels")); // false

// in operator — checks the ENTIRE chain:
console.log("brand"  in myCar); // true
console.log("wheels" in myCar); // true
console.log("engine" in myCar); // false

// Safe iteration — skip inherited:
for (const key in myCar) {
    // eslint-disable-next-line no-prototype-builtins
    if (myCar.hasOwnProperty(key)) {
        console.log("own:", key); // only "brand"
    }
}

// ───────────────────────────────────────────────────────────────
// 8. PROPERTY SHADOWING (overriding on instance)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 8. Property Shadowing ===");

function Robot(name) { this.name = name; }
Robot.prototype.type = "generic";

const r1 = new Robot("R1");
const r2 = new Robot("R2");

r1.type = "advanced"; // creates own property on r1 — shadows the prototype

console.log(r1.type); // "advanced" — own property
console.log(r2.type); // "generic"  — still reads from prototype

// Deleting the shadow restores prototype lookup:
delete r1.type;
console.log(r1.type); // "generic"  — back to prototype

// ───────────────────────────────────────────────────────────────
// 9. PROTOTYPE POLLUTION (security — know it to avoid it)
// ───────────────────────────────────────────────────────────────

console.log("\n=== 9. Prototype Pollution ===");

// Attackers can inject into Object.prototype via untrusted JSON/deep-merge
// Example of the attack (DO NOT do this in real code):
const malicious = JSON.parse('{}');
// if a naive deep-merge did: target.__proto__.isAdmin = true
// every {} in the app would suddenly have isAdmin!

// Safe alternatives:
// 1. Object.create(null) for dictionaries
// 2. Validate keys — reject __proto__, constructor, prototype
// 3. Use Map instead of plain objects for user-controlled keys
// 4. Object.freeze(Object.prototype) — prevents any modification

const safeDict = Object.create(null);
safeDict["key"] = "value";
console.log(safeDict["key"]); // "value"
// No toString, no hasOwnProperty — truly clean dictionary

// ───────────────────────────────────────────────────────────────
// PRACTICE
// ───────────────────────────────────────────────────────────────

console.log("\n=== Practice ===");

// Q1: What prints?
const base = { x: 1 };
const child = Object.create(base);
child.y = 2;
console.log(child.x);                        // ?  → 1  (inherited)
// eslint-disable-next-line no-prototype-builtins
console.log(child.hasOwnProperty("x"));      // ?  → false
// eslint-disable-next-line no-prototype-builtins
console.log(child.hasOwnProperty("y"));      // ?  → true
// Answer: 1, false, true

// Q2: What prints?
function Fn() {}
Fn.prototype.val = 10;
const inst1 = new Fn();
Fn.prototype = { val: 20 }; // replaced the prototype object entirely
const inst2 = new Fn();
console.log(inst1.val); // ?  → 10 (inst1 still points to OLD prototype)
console.log(inst2.val); // ?  → 20 (inst2 points to NEW prototype)
// Answer: 10, 20

// Q3: What prints?
function Parent() {}
Parent.prototype.getValue = function () { return 1; };
function Child() {}
Child.prototype = Object.create(Parent.prototype);
Child.prototype.getValue = function () { return 2; };

const inst = new Child();
console.log(inst.getValue()); // 2  (Child's override)
delete Child.prototype.getValue;
console.log(inst.getValue()); // 1  (falls through to Parent)
delete Parent.prototype.getValue;
console.log(inst.getValue);   // undefined  (not found anywhere)
// Answer: 2, 1, undefined

// Q4: Build Animal / Cat using ES6 classes
class Animal2 {
    constructor(name) { this.name = name; }
    speak() { return `${this.name} makes a sound`; }
}

class Cat extends Animal2 {
    constructor(name, indoor) {
        super(name);
        this.indoor = indoor;
    }
    speak() { return `${this.name} says: Meow!`; }
    describe() { return `${this.name} is ${this.indoor ? "indoor" : "outdoor"}`; }
}

const kitty = new Cat("Whiskers", true);
console.log(kitty.speak());    // Whiskers says: Meow!
console.log(kitty.describe()); // Whiskers is indoor
console.log(kitty instanceof Cat);    // true
console.log(kitty instanceof Animal2); // true
