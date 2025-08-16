// Use Case for var
// `var` is function-scoped. If it's declared anywhere within a function, 
// it can be accessed throughout that function. 
// Accessing it before initialization returns `undefined`, but does NOT throw an error.

function fun() {
    var i = 5;
    while (i < 10) {
        var x = i;
        i++;
    }
    console.log(x); // Outputs 9
}
// fun();
// Example with let (Block Scope)
// `let` is block-scoped. It is only accessible within the block it's declared in.
// In this case, since the variable is conditionally initialized, we could also use `var`.
// However, using `let` is safer and prevents unintended access.

function fun2(x) {
    let i;
    if (x % 2 === 0) {
        i = 0;
    } else {
        i = 1;
    }
    console.log(i);
}
// fun2(5);
// Same Example Using var (Still Works, but Less Safe)
function fun3(x) {
    if (x % 2 === 0) {
        var i = 0;
    } else {
        var i = 1;
    }
    console.log(i); // Accessible outside the if block
}
// fun3(5);
// var in Loops
function fun4() {
    for (var index = 0; index < 10; index++) {
        // loop body
    }
    console.log(index); // Accessible outside the loop due to function scoping
}
// fun4();
// Scoping Pitfall Example
function process(x, y) {
    if (x < y) {
        var temp = x;
        x = y;
        y = temp;
    }
    console.log(temp); // temp is still accessible here
    return y - x;
}
process(5, 9);
// If a variable is only needed inside a block, prefer let or const to avoid scope leakage.

// Redeclaring Variables
// let x = 8;
// let x = 10; // Error: Identifier 'x' has already been declared

var q = 9;
var q = 5; // ✅ Allowed with `var`

// `var` allows redeclaration; `let` and `const` do not.
// const Behavior
const a = 40;
// const a = 99;  Error: Identifier 'a' has already been declared

// `const` is block-scoped like `let`, but cannot be reassigned.

const obj = { name: 'Sadik' };
obj.name = 'Ali'; // ✅ Allowed: You can mutate properties of a const object
// obj = { name: 'Zaid' }; // ❌ Error: Cannot reassign a const
// Function Declarations vs Function Expressions
// Function Declaration
function abc() {
    // do something
}

// Function Expression (named)
let x = function abc() {
    // do something
};

// IIFE (Immediately Invoked Function Expression)
(function abc() {
    // do something
})();

// Another IIFE with argument
(function(name) {
    console.log("Hello, " + name);
})("World");

// Arrow Function Expression
let y = () => {
    // do something
};
// IIFE Summary
// IIFE (Immediately Invoked Function Expression)
// Useful for executing code immediately and creating a local scope

(function iifeExample() {
    console.log('iife');
})(); // Note: Parentheses at the end are required to invoke the function

// Scopes
let d = 10;

function outer() {
    let e = 20;

    function inner() {
        let f = 30;
        z = "no scope"
        console.log(d, e, f); // Accesses outer scopes
    }

    inner();
}

outer();
console.log(z)

function square(el){
    return el * 2;
}

function customMapper(arr,func){
    let result = []
    for (let index = 0; index < arr.length; index++) {
        result.push(func(arr[index],index))
    }
    return result
}
const arr = [2,4,5,6,7,8,9]
const result = customMapper(arr,square)
console.log(result)

// We want a function that applies different discount strategies (10%, 20%, etc.) depending on the function we pass.

function tenPercentDiscount(amount){
    return amount - amount * 0.1
}
function twentyPercentDiscount(amount){
    return amount - amount * 0.2
}
function thirtyPercentDiscount(amount){
    return amount - amount * 0.3
}

function applyDiscount(discountFunction,price){
    return discountFunction(price)
}

let price = 1000;
console.log("Original Price:", price);

console.log("Price after 10% discount:", applyDiscount( tenPercentDiscount,price,));
console.log("Price after 20% discount:", applyDiscount( twentyPercentDiscount,price));
console.log("Price after 30% discount:", applyDiscount( thirtyPercentDiscount,price));

// 💡 Write a program using Higher-Order Functions to calculate the final bill for a food delivery app.

// The base price should be passed.

// Apply different charges like delivery fee, GST, and coupon discount using HOF.

// Print the final payable amount.

function discountCoupon(coupon) {
    let discountedPrice = 0
    switch (coupon) {
        case "RS5":
            discountedPrice = 5
            break
        case "RS10":
            discountedPrice = 10
            break
        default:
            discountedPrice = 0
    }
    return discountedPrice
}

function calculateGST(price) {
    return price * 0.18;
}
function calculateBill(price, deliveryFee, gstFunction, couponFunction, couponCode) {
    const gstAmount = gstFunction(price);
    const discount = couponFunction(couponCode);
    return price + deliveryFee + gstAmount - discount;
}

// Example usage
let basePrice = 500;
let deliveryFee = 40;

let finalAmount = calculateBill(basePrice, deliveryFee, calculateGST, discountCoupon, "RS10");

console.log("Base Price:", basePrice);
console.log("Delivery Fee:", deliveryFee);
console.log("GST (18%):", calculateGST(basePrice));
console.log("Coupon Discount:", discountCoupon("RS10"));
console.log("Final Payable Amount:", finalAmount);