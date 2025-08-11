import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin", "restaurant", "courier"],
      default: "user",
    },
     // Spezielle Felder für Restaurantbesitzer
    documents: [
      {
        type: String, // z.B. URLs zu hochgeladenen Dokumenten (Gewerbeschein etc.)
      },
    ],
    website: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
