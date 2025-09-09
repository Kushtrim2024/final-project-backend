import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
  quantity: Number,
  size: String,
  addOns: Array,
  totalPrice: Number,
});

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items: [cartItemSchema],
  paymentMethod: { type: String }, // "card", "paypal", ...
  paymentDetails: { type: Object }, // cardType, last4, email etc.
});

export default mongoose.model("Cart", cartSchema);
