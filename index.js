import "dotenv/config"; // THIS MUST BE FIRST: Automatically loads your .env file immediately
import connectDB from "./database/db.js";
import { app } from './app.js';

connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    });
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
});
