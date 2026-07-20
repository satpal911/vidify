import express from "express";
import connectDb from "./database/db.js";
import dotenv from "dotenv";
dotenv.config();
const { PORT } = process.env;
const app = express();
const port = PORT || 8000;
connectDb();
app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
