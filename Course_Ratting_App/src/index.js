const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = express.Router();
const courseRoutes = require('./routes/courseInfo');
const app = express();
const PORT = process.env.PORT || 3000;
const mongoose = require('mongoose');
const { register, login } = require('./controller/authController');


// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

routes.use(bodyParser.urlencoded({ extended: true }));
routes.use(routes)

try {
    mongoose.connect("mongodb://localhost:27017/usersdb");
    console.log("Connected to MongoDB");
} catch (error) {
    console.error("Could not connect to MongoDB", error);
}

routes.use('/courses', courseRoutes);
routes.post('/register', register);;
routes.post('/login', login);
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});