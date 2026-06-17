require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const rootRouter = require("./routes/index");

app.use(express.json());
app.use(cors());

app.use('/api/v1', rootRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});