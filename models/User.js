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
  profilePicture: { type: String, default: "default.png" }, // URL oder Pfad
  addresses: { type: [addressSchema], default: [] },
  role: { type: String, default: "user" },

  cart: {
    type: [
      {
        menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
        quantity: { type: Number, required: true },
      },
    ],
    default: [],
  },
});


export default mongoose.model("User", userSchema, "users");
