const express = require('express');
const bodyParser = require('body-parser');
const routes = express.Router();

// Middleware to parse JSON bodies
const app = express();
app.use(bodyParser.json());
app.use(routes)
app.use(bodyParser.urlencoded({ extended: false }));

const PORT = 3000;

// Sample route
routes.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});