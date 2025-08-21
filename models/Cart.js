import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },
        size: {
          type: String, // z. B. "Small", "Medium", "Large"
        },
        addOns: [
          {
            name: String,
            price: Number,
          },
        ],
        totalPrice: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Cart", cartSchema);
