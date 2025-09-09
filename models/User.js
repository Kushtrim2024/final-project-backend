import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
}, { _id: true }); // _id lassen, damit du gezielt löschen kannst

const paymentMethodSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["card", "paypal", "applepay", "googlepay"],
    },
    cardType: {
      type: String,
      enum: ["visa", "mastercard", "maestro", "amex", "discover"],
    },
    last4: { type: String, match: /^\d{4}$/ }, // Nur die letzten 4 Ziffern
    expiryDate: { type: String }, // MM/YY
    email: { type: String, lowercase: true, trim: true }, // für Paypal usw.
    icon: { type: String },
  },
  { timestamps: true, _id: true }
);


const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String },
  profilePicture: { type: String, default: "default.png" }, // URL oder Pfad
  addresses: { type: [addressSchema], default: [] },
  role: { type: String, default: "user" },

  paymentMethods: { type: [paymentMethodSchema], default: [] }, // Payment Methods als Array

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
