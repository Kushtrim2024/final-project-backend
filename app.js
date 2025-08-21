import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./db/mongoose.connect.js";

// Router
import userRouter from "./router/userRouter.js";
import restaurantOwnerRouter from "./router/restaurantOwnerRouter.js";
import adminRouter from "./router/adminRouter.js";
import restaurantPublicRouter from "./router/restaurantPublicRouter.js";
import adminRestaurantRouter from "./router/adminRestaurantRouter.js";
import adminUserRouter from "./router/adminUserRouter.js";
import adminRestaurantOwnerRouter from "./router/adminRestaurantOwnerRouter.js";
import menuRouter from "./router/menuRouter.js";
import orderRouter from "./router/orderRouter.js";
import restaurantRouter from "./router/restaurantRouter.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5517;

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5517"], // Frontend
    credentials: true,
  })
);

// Public Router
app.use("/restaurants", restaurantPublicRouter);

// Owner Router: Profil & Auth für RestaurantOwner
app.use("/owner", restaurantOwnerRouter);

// Menu-Router verschachtelt unter Restaurants
app.use("/owner/restaurants/:restaurantId/menu-items", menuRouter);

// RestaurantOwner-eigene Restaurants (CRUD für eigenes Restaurant)
app.use("/owner/restaurants", restaurantRouter);


// Admin Router
app.use("/admin/users", adminUserRouter);
app.use("/admin/restaurants", adminRestaurantRouter);
app.use("/admin/restaurant-owners", adminRestaurantOwnerRouter);
app.use("/admin", adminRouter);

// User Router
app.use("/user", userRouter);

// Orders
app.use("/orders", orderRouter);

// Health Check
app.get("/", (req, res) => res.send("Liefrik Backend läuft 🚀"));

// DB + Serverstart
connectDB()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`✅ Server is running: http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err);
  });
