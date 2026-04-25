const arr1 = [1, 2, 3, 4, 5];
const arr2 = [...arr1]
// const arr3 = ['a', 'b', 'c', 'd', 'e'];
console.log(arr2);
// Spread operator to merge arrays
const mergedArray = [...arr2, 6, 7, 8, 9, 10];

// Spread operator inside object
const obj1 = {name: 'John', age: 30};
const obj2 = {...obj1, city: 'New York'};
console.log(mergedArray);
console.log(obj2);

const product = {id:101, name:'Laptop', price: 800};
const updatedProduct = {...product, price: 750};
console.log(updatedProduct);

// Rest Operator (...Rest Operator)
const sum = (...numbers) => {return numbers.reduce((acc,curr)=> acc + curr,0)};
console.log(sum(1,2,3,4,5));

const [first,...other] = arr1;
const {name,...details} = obj2;
console.log(first);
console.log(other);
console.log(name)
console.log(details);

const placeOrders = (customer,...items) =>{
    console.log(`Customer ${customer} ordered ${items.length} items.`);
    console.log(items);
}

placeOrders('Alice', 'item1', 'item2', 'item3');

// A grocery app wants to create a copy of a fruits list so they can modify prices without affecting the original list.
const fruits = ["apple", "banana", "mango"];
const fruitsCopy = [...fruits];
console.log(fruitsCopy);

// Create a function that accepts any number of marks and returns their average.
const average = (...marks) => {
    console.log(marks.reduce((acc,curr) => acc + curr,0) / marks.length);
}

average(10, 20, 30);

// company has employees from two departments and wants a single list.
const deptA = ["Aman", "Riya"];
const deptB = ["Bharat", "Rohan"];
const allEmployees = [...deptA,...deptB];
console.log(allEmployees);

// An e-commerce admin dashboard shows the latest product, and others go to the list.
const products = ["Laptop", "Mouse", "Keyboard", "Monitor"];
const [latestProduct, ...otherProducts] = products;
console.log({latestProduct});
console.table(otherProducts);

// An online store wants to add orderId and status to a user object.
const user = { name: "Bharat", city: "Delhi" };
const updatedUser = {...user, orderId: 12345, status: "Shipped" };
console.log(updatedUser);

// On a shopping app, the admin wants the first product to be featured.
const featuredProducts = ([featured,...normalItems]) => {return {featured, normalItems}};
featuredProducts(["iPhone", "Samsung", "Pixel", "OnePlus"])

console.log(featuredProducts(["iPhone", "Samsung", "Pixel", "OnePlus"]))

// Array Destructuring
const numbers = [1, 2, 3, 4, 5];
const [a,,e] = numbers;

console.log(a,e);

// default values
const [x = 100] = [];
console.log(x); // 100

const location = [28.7041, 77.1025];
const [lat, lng] = location;

console.log(lat, lng);

const response = {
    status: 200,
    data: { userId: 1, userName: 'JohnDoe' }
};

const {status, data} = response;
console.log({status},data);

// Extract first two colors from the array
const colors = ["red", "green", "blue"];
const [firstColor, secondColor] = colors;
console.log(firstColor, secondColor);

// Extract name and age from the user object
const user1 = { firstName: "Aman", lastName:"Shaikh",age: 25, city: "Delhi" };
const {firstName, age} = user1;
console.log(firstName, age);

// Rename variables while destructuring
const laptop = { brand: "Apple", model: "MacBook Pro", price: 150000 };
const {brand:Company, ...detail} = laptop;
console.log(Company);
console.log(detail);

// Extract nested values Extract: id,title,stock,rating
const apiData = {
    status: "success",
    product: {
      id: 101,
      title: "Laptop",
      price: 45000,
      details: {
        stock: 30,
        rating: 4.5
      }
    }
  };
const {product:{id,title,details:{stock,rating}}} = apiData;    
console.log(id,title,stock,rating);

// Write a function that takes an object like this:
// const employee = {
//     name: "Rohit",
//     department: "IT",
//     skills: ["JS", "React", "Node"]
//   };
// and return it as 
// {
//     employeeName: "Rohit",
//     mainSkill: "JS",
//     otherSkills: ["React", "Node"]
//  }
  
const employee = {
    name: "Rohit",
    department: "IT",
    skills: ["JS", "React", "Node"]
  };
const updateEmployee  = (obj)=>{
    const {name:employeeName, skills:[mainSkill,...otherSkills]} = obj;
    return {employeeName, mainSkill, otherSkills};
}
console.log(updateEmployee(employee));

const apiResponse = {
    status1: "success",
    user: {
      id: 101,
      profile: {
        username: "bharat22",
        followers: undefined
      }
    }
  };
  const {status1,user:{id:userId,profile:{username:userName,followers=0}}} = apiResponse;
    console.log(status1,userId,userName,followers);

    const students = [
        { name: "Aman", score: 80 },
        { name: "Riya", score: 90 },
        { name: "Bharat", score: 95 },
      ];
// const {,,,} = students;
function registerUser({
    name,
    email,
    isAdmin = false,
    address: { city, pin },
    profile: { username: userName }
 }) {

    return { name, email,city, pin, userName  ,isAdmin};
 }
 const userData = {
    name: "Rohan",
    email: "rohan@test.com",
    address: { city: "Mumbai", pin: 400001 },
    profile: { username: "rohan123" }
  };

  console.log(registerUser(userData));