import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    // Liste aller beteiligten Restaurants
    restaurants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Restaurant",
      },
    ],

    customerName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: {
      type: String,
      required: function () {
        return this.deliveryType === "delivery";
      },
      trim: true,
    },

    items: [
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true }, // NEU
    name: String,
    quantity: Number,
    price: Number,
    total: Number,
    size: String,
    addOns: [mongoose.Schema.Types.ObjectId],
  }
],

    total: { type: Number, required: true, min: 0 },

    deliveryType: { type: String, enum: ["delivery", "takeaway"], required: true },

    paymentMethod: { type: String, enum: ["card", "paypal", "applepay", "googlepay"], required: true },
    paymentDetails: {
      cardType: { type: String, enum: ["visa", "mastercard", "maestro", "amex", "discover", "other"] },
      last4: String,
      transactionId: String,
    },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },

    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"],
      default: "pending",
    },

    actions: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],

    orderTime: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);
