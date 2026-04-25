/*
Assignment #1 - Your logic is like a doctor
Learn by doing, lets create an in memory hospital

You need to create 4 routes (4 things that the hospital can do)

1. GET - User can check how many kidneys they have and their health
2. POST - User can add a new kidney
3. PUT - User can replace a kidney, make it healthy
4. DELETE - User can remove a kidney

1. What should happen if they try to delete when there are no kidneys?
2. What should happen if they try to make a kidney healthy when all are already healthy?
*/

// import express module using require function and store it in express variable
const express = require("express");

// create an express application using express function
const app = express();

// Middleware to parse JSON data in the request body
app.use(express.json());

// Array to store users data
let users = [
    {
        name: "John",
        kidneys: [
            {
                healthy: false,
            },
        ],
    },
];

/**
 * Create a route handler for GET request
 * URL: http://localhost:3000/
 *
 *
 */
app.get("/", (req, res) => {
    const user = users[0].kidneys;
    const numberOfKidneys = user.kidneys.lenght
    const healthyKidneys = user.filter(kidney => kidney.healthy).length;
    const unhealthyKidneys = numberOfKidneys - healthyKidneys;

    res.status(200).json({ totalKidneys: numberOfKidneys, healthyKidneys, unhealthyKidneys });
});

app.post("/", (req, res) => {
   const isHealthy = req.body.healthy;
   users[0].kidneys.push({ healthy: isHealthy });
   res.status(201).json({ message: "New kidney added", totalKidneys: users[0].kidneys.length });
});

app.put("/", (req, res) => {
    if(isUnhealthyKidneyAvailable) {
        users[0].kidneys.forEach(kidney => {
            if(!kidney.healthy) {
                kidney.healthy = true;
            }
        });
        res.status(200).json({ message: "All unhealthy kidney has been made healthy" });
    }
});

app.delete("/", (req, res) => {
    if(users[0].kidneys.length === 0) {
        res.status(400).json({ message: "No kidneys to delete" });
    } else {
        users[0].kidneys.pop();
        res.status(200).json({ message: "One kidney removed", totalKidneys: users[0].kidneys.length });
    }
});
const isUnhealthyKidneyAvailable = users[0].kidneys.some(kidney => !kidney.healthy);

app.listen(3000);