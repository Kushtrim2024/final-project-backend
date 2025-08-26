import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    // Verbindung zum User (falls registriert)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // falls Gastbestellungen erlaubt
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant", // muss mit deinem Restaurant-Model übereinstimmen
      required: true,
    },

    // Kundeninfos
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: function () {
        return this.deliveryType === "delivery";
      },
      trim: true,
    },

    // Bestell-Details
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true,
        },
        name: String,
        quantity: Number,
        price: Number,
        total: Number,
        size: String,
        addOns: [mongoose.Schema.Types.ObjectId],
      },
    ],

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    // Liefer-/Abholoption
    deliveryType: {
      type: String,
      enum: ["delivery", "takeaway"],
      required: true,
    },

    // Zahlungsinfos
    paymentMethod: {
      type: String,
      enum: ["card", "paypal", "applepay", "googlepay"],
      required: true,
    },
    paymentDetails: {
      cardType: { type: String, enum: ["visa", "mastercard", "maestro", "amex", "discover", "other"], required: false },
      last4: { type: String, required: false }, // nur die letzten 4 Ziffern
      transactionId: { type: String, required: false }, // z. B. bei PayPal/ApplePay
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    // Status der Bestellung
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"],
      default: "pending",
    },

    // Verlauf / Aktionen
    actions: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Admin oder System
      },
    ],

    // Zeitstempel der Bestellung
    orderTime: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);
