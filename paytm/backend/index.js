const express = require("express");
const app = express();
const cors = require("cors");
const rootRouter = require("./routes/index");

app.use(express.json());
app.use(cors());

app.use('/api/v1', rootRouter);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});