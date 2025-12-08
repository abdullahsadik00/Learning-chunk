const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = express.Router();
const courseRoutes = require('./routes/courseInfo');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(routes)

routes.use('/courses', courseRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});