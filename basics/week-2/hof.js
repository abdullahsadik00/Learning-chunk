// 1. Easy: Bulk Discount Calculator
// Scenario: Apply fixed-amount coupons to an array of product prices.

const prices = [200, 150, 300];
const coupons = ["RS50", "RS20", "INVALID"];

function applyCoupon(coupon) {
    /* Return discount function based on coupon:
       "RS50" → ₹50 off, "RS20" → ₹20 off, invalid → ₹0 */
    let discount = 0;
    switch (coupon) {
        case "RS50":
            discount = 50;
            break;
        case "RS20":
            discount = 20;
            break;
        case "INVALID":
            discount = 0;
            break;
        default:
            discount = 0;
            break;
    }
    return discount
}

// HOF Implementation:
function applyBulkDiscount(prices, couponHandler) {
    // Apply couponHandler to each price
    let result = []
    for (let i = 0; i < prices.length; i++) {
        result.push(prices[i] - couponHandler(coupons[i]))
    }
    return result
}

console.log(applyBulkDiscount(prices, applyCoupon));
// Output: [150, 130, 300] (₹50 off first, ₹20 off second, no discount on third)

// 2. Easy-Medium: Dynamic Tax Calculation
// Scenario: Apply state-specific GST rates to products.

const products = [
    { name: "Laptop", price: 50000 },
    { name: "Phone", price: 20000 }
];

function getTaxRate(state) {
    /* Return tax function: 
       "MH" → 18%, "KA" → 15%, default → 12% */
    let TAX = null
    switch (state) {
        case "MH":
            TAX = 0.18;
            break;
        case "KA":
            TAX = 0.15;
            break;
        default:
            TAX = 0.12;
            break;
    }
    return TAX
}

// HOF Implementation:
function calculateTotal(products, state, taxHandler) {
    // Apply taxHandler to each product
    const result = []
    const tax = taxHandler(state)
    for (let i = 0; i < products.length; i++) {
        result.push(products[i].price + (products[i].price * tax))
    }
    return result
}

console.log(calculateTotal(products, "MH", getTaxRate));
// Output: [59000, 23600] (18% tax applied)

// 3. Medium: Discount Pipeline
// Scenario: Apply multiple discounts sequentially (e.g., festival sale + member discount).

const discounts = [
    price => price * 0.8,      // 20% festival discount
    price => price - 500,      // ₹500 member coupon
    price => price > 1000 ? price - 100 : price  // ₹100 off if > ₹1000
];

// HOF Implementation:
function applyDiscountPipeline(price, discountFunctions) {
    // Sequentially apply all discount functions
    let finalPrice = price;
    for (let i = 0; i < discountFunctions.length; i++) {
        finalPrice = discountFunctions[i](finalPrice)
    }
    return finalPrice
}

console.log(applyDiscountPipeline(2000, discounts));
// Step 1: 2000*0.8 = 1600
// Step 2: 1600-500 = 1100
// Step 3: 1100>1000 → 1100-100 = 1000

// 4. Hard: Adaptive Pricing Engine
// Scenario: Dynamic pricing based on demand, user type, and time of day.

const pricingRules = [
    basePrice => basePrice * 1.2,               // Peak hour surge
    (price, userType) => userType === "prime" ? price * 0.9 : price,  // Prime discount
    price => Math.min(price, 5000)              // Price ceiling
];

// HOF Implementation:
function calculateFinalPrice(basePrice, userType, rules) {
    // Apply all rules sequentially
    let finalPrice = basePrice;
    for (let i = 0; i < rules.length; i++) {
        finalPrice = rules[i](finalPrice, userType)
    }
    return finalPrice
}

console.log(calculateFinalPrice(3000, "prime", pricingRules));
// Step 1: 3000*1.2 = 3600
// Step 2: 3600*0.9 = 3240
// Step 3: min(3240, 5000) = 3240

// 5. Very Hard: Inventory Reconciliation
// Scenario: Reconcile physical stock with database records using validation hooks.

const physicalCount = [
    { id: "A1", count: 105 },
    { id: "B2", count: 89 }
  ];
  
  const validators = [
    item => item.count >= 0,                          // Non-negative
    item => item.count <= 100 ? {...item, flagged: true} : item,  // Flag if >100
    item => item.id.startsWith("A") ? {...item, warehouse: "East"} : item
  ];
  
  // HOF Implementation:
  function reconcileInventory(inventory, validationHooks) {
    // Process each item through all validators
    // Return {validItems: [...], flaggedItems: [...]}
  }
  
  console.log(reconcileInventory(physicalCount, validators));
  /* Output:
  {
    validItems: [{id: "B2", count: 89, warehouse: null}],
    flaggedItems: [{id: "A1", count: 105, warehouse: "East", flagged: true}]
  }
  */

//   Easy: Filter Prime Numbers
//   Problem: Create a function that filters out prime numbers from an array using filter.
  
  function isPrime(num) {
    if (num < 2) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return true;
  }
  
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const primes = numbers.filter(isPrime);
  console.log(primes); // [2, 3, 5, 7]
//   2. Easy: Calculate Product with Reduce
//   Problem: Use reduce to calculate the product of all numbers in an array.
  
  const numbers2 = [1, 2, 3, 4];
  const product = numbers2.reduce((acc, curr) => acc * curr, 1);
  console.log(product); // 24
//   3. Medium: Custom Filter Implementation
//   Problem: Implement your own filter function using a callback.
  
  function customFilter(arr, callback) {
    const result = [];
    for (const item of arr) {
      if (callback(item)) {
        result.push(item);
      }
    }
    return result;
  }
  
  const numbers1 = [10, 20, 30, 40];
  const filtered = customFilter(numbers1, x => x > 25);
  console.log(filtered); // [30, 40]
//   4. Medium: Flatten 2D Array with Reduce
//   Problem: Use reduce to flatten a 2D array into 1D.
  
  const matrix = [[1, 2], [3, 4], [5, 6]];
  const flattened = matrix.reduce((acc, curr) => [...acc, ...curr], []);
  console.log(flattened); // [1, 2, 3, 4, 5, 6]

//   5. Hard: Compose Functions with Reduce
//   Problem: Create a function composition pipeline using reduce.  

  function compose(...functions) {
    return input => 
      functions.reduceRight((acc, fn) => fn(acc), input);
  }
  
  const add5 = x => x + 5;
  const double = x => x * 2;
  const square = x => x * x;
  
  const transform = compose(square, double, add5);
  console.log(transform(5)); 
  // Steps:
  //   5 + 5 = 10
  //   10 * 2 = 20
  //   20 * 20 = 400