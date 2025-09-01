import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
  type: String,
  enum: ["Starters", "Main Courses", "Desserts", "Drinks", "Specials"],
  required: true,
},

    basePrice: { type: Number, min: 0 },
    sizes: {
      type: [
        {
          label: { type: String, trim: true },
          price: { type: Number, min: 0 },
        },
      ],
      default: [],
    },
    addOns: {
      type: [
        {
          name: { type: String, required: true, trim: true },
          price: { type: Number, required: true, min: 0 },
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: ["available", "unavailable"],
      default: "available",
    },
    images: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model("MenuItem", menuItemSchema);
