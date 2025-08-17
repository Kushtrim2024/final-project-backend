import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String },
  address: { type: String, required: true },
  role: { type: String, default: "admin" },
});

export default mongoose.model("Admin", adminSchema, "admins");