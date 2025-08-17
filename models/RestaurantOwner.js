import mongoose from "mongoose";

const restaurantOwnerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String },
  address: { type: String, required: true },
  restaurantName: { type: String, required: true },
  taxNumber: { type: String, required: true },
  document: { type: String, required: true }, 
  website: { type: String, required: true, trim: true },
  role: { type: String, default: "restaurant" },
});

export default mongoose.model("RestaurantOwner", restaurantOwnerSchema, "restaurantOwners");