import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.DB_MONGO_URI;

  if (!uri || uri === "ENTER YOUR CONNECTION STRING HERE") {
    console.error("❌ No valid MongoDB connection string found in .env!");
    console.warn("👉 Look at the DB_MONGO_URI in .env-file.");
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB connection established");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }

  mongoose.connection.on("error", (err) => {
    console.error("❗ Mongoose runtime error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("🔌 Mongoose disconnected");
  });
};
