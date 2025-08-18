import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./db/mongoose.connect.js";
import userRouter from "./router/userRouter.js";
import restaurantOwnerRouter from "./router/restaurantOwnerRouter.js";
import adminRouter from "./router/adminRouter.js";
import restaurantRouter from "./router/restaurantRouter.js";
import menuRouter from "./router/menuRouter.js";
import orderRouter from "./router/orderRouter.js";
import adminRestaurantRouter from "./router/adminRestaurantRouter.js";
import adminUserRouter from "./router/adminUserRouter.js";
import adminRestaurantOwnerRouter from "./router/adminRestaurantOwnerRouter.js";
import restaurantPublicRouter from "./router/restaurantPublicRouter.js";


const app = express();
const PORT = 5517;

app.use(express.json());
dotenv.config();
app.use(
  cors({
    origin: "http://localhost:5517",
    credentials: true,
  })
);

//Router
app.use("/user", userRouter);
app.use("/admin/restaurants", adminRestaurantRouter);
app.use("/admin", adminRouter);
app.use("/restaurant", restaurantOwnerRouter);

app.use("/restaurants", restaurantPublicRouter);
app.use("/admin/users", adminUserRouter);
app.use("/admin/restaurant-owners", adminRestaurantOwnerRouter);
app.use("/owner/restaurants", restaurantRouter);
app.use("/menus", menuRouter);
app.use("/orders", orderRouter);
app.get('/', (req, res) => res.send('Liefrik Backend läuft'));
connectDB();

app.listen(PORT, () => {
  console.log(`Server is running: http://localhost:${PORT}`);
});
