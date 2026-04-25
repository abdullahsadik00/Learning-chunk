const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(num => num * 2);
console.log(doubled);

// User adds items to cart:
const cart = [
    { item: "Mobile", price: 10000 },
    { item: "Earphones", price: 2000 }
];
const updatedCart = cart.map(product => ({
    ...product,
    price: product.price * 0.18 // Adding 18% tax
}));
console.log(updatedCart);

// Filter even numbers from an array
const nums = [1, 2, 3, 4, 5, 6];
const evenNumbers = nums.filter(num => num % 2 === 0);
console.log(evenNumbers);

// Filter products with price greater than 5000
const products = [
    { item: "Laptop", price: 45000 },
    { item: "Mouse", price: 1500 },
    { item: "Keyboard", price: 3000 },
    { item: "Monitor", price: 12000 }
];
const expensiveProducts = products.filter(product => product.price > 5000);
console.log(expensiveProducts);

// Reduce to calculate the sum of an array
const total = numbers.reduce((acc, cur) => acc + cur, 0);

console.log(total);

const cartItems = products
const cartTotal = cartItems.reduce((acc, product) => acc + product.price, 0);
console.log(cartTotal);

const totalPhoneCost = products.filter(product => product.price < 5000).map(product => ({ ...product, price: product.price * 1.8 }))
    .reduce((acc, product) => acc + product.price, 0);
console.log(totalPhoneCost);

// From an array of users, return only those who are above 18.
const users = [
    { name: "Aman", age: 16 },
    { name: "Riya", age: 22 },
    { name: "Bharat", age: 19 }
]
const adults = users.filter(user => user.age > 18);
console.log(JSON.stringify(adults));

// Convert all product names to uppercase using map.
const items = [
    { name: "laptop", price: 50000 },
    { name: "mobile", price: 20000 }
]
const uppercasedItems = items.map(item => ({
    ...item,
    name: item.name.toUpperCase()
}));
console.log(JSON.stringify(uppercasedItems));

// Calculate the total price of products,Keep only items above 1000,Add 10% tax

const shoppingCart = [
    { name: "Tablet", price: 15000 },
    { name: "Charger", price: 500 },
    { name: "Headphones", price: 3000 }
]
const totalPrice = shoppingCart.filter(item => item.price > 1000)
    .map(item => ({
        ...item,
        price: item.price * 1.1
    }))
    .reduce((acc, item) => acc + item.price, 0);
console.log(totalPrice);

// Calculate the total marks obtained by each student and return an array of objects with student names and their total marks.
const students = [
    { name: "Aman", marks: [80, 70, 90] },
    { name: "Riya", marks: [95, 88, 92] },
    { name: "Bharat", marks: [60, 75, 70] }
];

const studentTotals = students.map(student => ({
    name: student.name,
    totalMarks: student.marks.reduce((acc, mark) => acc + mark, 0)
}));

console.log(JSON.stringify(studentTotals));