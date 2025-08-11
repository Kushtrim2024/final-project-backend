import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    // Verbindung zum User (falls registriert)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // falls Gastbestellungen erlaubt
    },

    // Kundeninfos (auch bei registrierten Usern redundant speichern)
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
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
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
      enum: ["card", "online"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    // Status der Bestellung
    status: {
      type: String,
      enum: ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"],
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
