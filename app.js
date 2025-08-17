import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./db/mongoose.connect.js";
import userRouter from "./router/userRouter.js";
import restaurantOwnerRouter from "./router/restaurantOwnerRouter.js";
import adminRouter from "./router/adminRouter.js";


const app = express();
const PORT = 5517;

app.use(express.json());
dotenv.config();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

//Router
app.use("/user", userRouter);
app.use("/admin", adminRouter);
app.use("/restaurant", restaurantOwnerRouter);
app.get('/', (req, res) => res.send('Liefrik Backend läuft'));
connectDB();

app.listen(PORT, () => {
  console.log(`Server is running: http://localhost:${PORT}`);
});
