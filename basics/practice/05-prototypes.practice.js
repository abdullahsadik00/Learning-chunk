// ═══════════════════════════════════════════════════════════════
// PRACTICE: PROTOTYPES & INHERITANCE
// Run: node 05-prototypes.practice.js
// ═══════════════════════════════════════════════════════════════

function check(label, got, expected) {
    const pass = JSON.stringify(got) === JSON.stringify(expected);
    console.log(pass
        ? `✅  ${label}`
        : `❌  ${label}\n    got:      ${JSON.stringify(got)}\n    expected: ${JSON.stringify(expected)}`
    );
}

// ─── PREDICT 1: prototype chain lookup ───────────────────────
console.log("\n── Predict 1 ──");
// JS looks for a property on the object first, then walks up __proto__.
// Predict:
//   A: ???
//   B: ???
//   C: ???

const animal = {
    eat()   { return `${this.name} eats`; },
    sleep() { return `${this.name} sleeps`; },
};
const dog = { name: "Rex" };
Object.setPrototypeOf(dog, animal);

console.log(dog.eat());    // A — found on animal, called with this=dog
console.log(dog.name);     // B — found on dog itself
console.log(dog.fly);      // C — not found anywhere

// ─── PREDICT 2: __proto__ vs prototype ───────────────────────
console.log("\n── Predict 2 ──");
// `prototype` = property on functions; becomes __proto__ of instances.
// Predict:
//   A: ???   (p1.__proto__ === ?)
//   B: ???   (p1.greet === p2.greet — shared or separate?)

function Person(name) { this.name = name; }
Person.prototype.greet = function() { return `Hi, I'm ${this.name}`; };

const p1 = new Person("Sadik");
const p2 = new Person("Priya");

console.log(p1.__proto__ === Person.prototype); // A
console.log(p1.greet === p2.greet);             // B — is greet shared or copied?

// ─── PREDICT 3: prototype replaced mid-flight ────────────────
console.log("\n── Predict 3 ──");
// Instances link to the prototype OBJECT that existed at construction time.
// Replacing the prototype after construction doesn't affect existing instances.
// Predict:
//   A: ???
//   B: ???

function Widget() {}
Widget.prototype.val = 10;
const w1 = new Widget();              // w1 links to OLD prototype
Widget.prototype = { val: 20 };       // prototype replaced entirely
const w2 = new Widget();              // w2 links to NEW prototype

console.log(w1.val);   // A
console.log(w2.val);   // B

// ─── PREDICT 4: hasOwnProperty vs `in` ───────────────────────
console.log("\n── Predict 4 ──");
// hasOwnProperty — checks ONLY the object itself.
// `in` operator  — checks the entire chain.
// Predict each:
//   A: ???  B: ???  C: ???  D: ???

function Car(brand) { this.brand = brand; }
Car.prototype.wheels = 4;
const myCar = new Car("Honda");

// eslint-disable-next-line no-prototype-builtins
console.log(myCar.hasOwnProperty("brand"));   // A
// eslint-disable-next-line no-prototype-builtins
console.log(myCar.hasOwnProperty("wheels"));  // B
console.log("brand"  in myCar);               // C
console.log("wheels" in myCar);               // D

// ─── IMPLEMENT 1: Object.create inheritance ──────────────────
console.log("\n── Implement 1 ──");
// Create a `cat` object that inherits from `animalProto`.
// cat must have its OWN `name` and `sound` properties.
// Calling cat.speak() should return "Whiskers says: Meow".
// Use Object.create — no `new`, no `class`.

const animalProto = {
    speak() { return `${this.name} says: ${this.sound}`; },
};

// YOUR CODE — create `cat` using Object.create(animalProto), then set name and sound
const cat = Object.create(null);   // fix: use animalProto as prototype, add name + sound

try {
    check("cat.speak()",                   cat.speak(), "Whiskers says: Meow");
} catch(e) { console.log("❌  cat.speak() threw:", e.message); }
check("cat inherits from animalProto",   Object.getPrototypeOf(cat) === animalProto, true);
// eslint-disable-next-line no-prototype-builtins
try { check("name is own property",      cat.hasOwnProperty("name"), true); }
catch(e) { console.log("❌  hasOwnProperty threw:", e.message); }

// ─── IMPLEMENT 2: pre-ES6 prototypal inheritance ─────────────
console.log("\n── Implement 2 ──");
// Implement Animal and Dog using ONLY constructor functions + prototype.
// (No class keyword.)
//
// Animal(name):  this.name = name
//   Animal.prototype.speak → returns "NAME makes a sound"
//
// Dog(name, breed) extends Animal:
//   Call Animal constructor to set this.name
//   Dog.prototype → Object.create(Animal.prototype)
//   Fix Dog.prototype.constructor
//   Dog.prototype.bark → returns "NAME barks: Woof!"
//   Dog.prototype.speak (override) → returns "NAME barks loudly!"

function Animal(name) {
    // YOUR CODE
}

function Dog(name, breed) {
    // YOUR CODE
}

// Wire up prototype chain here:
// Dog.prototype = ...
// Dog.prototype.constructor = ...
// Dog.prototype.bark = ...
// Dog.prototype.speak = ...  (override)

try {
    const rex = new Dog("Rex", "GSD");
    check("rex.bark()",           rex.bark(),            "Rex barks: Woof!");
    check("rex.speak() override", rex.speak(),           "Rex barks loudly!");
    check("rex instanceof Dog",   rex instanceof Dog,    true);
    check("rex instanceof Animal",rex instanceof Animal, true);
    check("Animal speak still works", new Animal("Cat").speak(), "Cat makes a sound");
} catch(e) { console.log("❌  Implement 2 threw:", e.message); }

// ─── IMPLEMENT 3: ES6 class + extends ────────────────────────
console.log("\n── Implement 3 ──");
// Rewrite the same Animal/Dog using ES6 class syntax.
// Same behaviour as Implement 2.
// Bonus: add a static Dog.fromObject({ name, breed }) factory method.

class Animal2 {
    // YOUR CODE
}

class Dog2 extends Animal2 {
    // YOUR CODE
}

try {
    const buddy = new Dog2("Buddy", "Labrador");
    check("buddy.bark()",            buddy.bark(),             "Buddy barks: Woof!");
    check("buddy.speak() override",  buddy.speak(),            "Buddy barks loudly!");
    check("buddy instanceof Dog2",   buddy instanceof Dog2,    true);
    check("buddy instanceof Animal2",buddy instanceof Animal2, true);
    // Verify it's still prototypes underneath:
    check("class is still a function", typeof Animal2, "function");
    check("Dog2 prototype chain",      Dog2.prototype.__proto__ === Animal2.prototype, true);
} catch(e) { console.log("❌  Implement 3 threw:", e.message); }
