import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
}, { _id: true }); // _id lassen, damit du gezielt löschen kannst

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String },
  addresses: { type: [addressSchema], default: [] }, // mehrere Adressen
  role: { type: String, default: "user" },
});

export default mongoose.model("User", userSchema, "users");
