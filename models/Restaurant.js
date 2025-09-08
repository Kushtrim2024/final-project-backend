import mongoose from "mongoose";

const RestaurantSchema = new mongoose.Schema(
  {
    restaurantName: { type: String, required: true },
    description: { type: String, trim: true },

    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },

    phone: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RestaurantOwner",
      required: true,
    },
  

    image: { type: String, trim: true },
    logo: { type: String, trim: true },
    gallery: [String],

    hours: {
      monday: {
        open: { type: String, default: "Closed" },
        close: { type: String, default: "Closed" },
      },
      tuesday: {
        open: { type: String, default: "Closed" },
        close: { type: String, default: "Closed" },
      },
      wednesday: {
        open: { type: String, default: "Closed" },
        close: { type: String, default: "Closed" },
      },
      thursday: {
        open: { type: String, default: "Closed" },
        close: { type: String, default: "Closed" },
      },
      friday: {
        open: { type: String, default: "Closed" },
        close: { type: String, default: "Closed" },
      },
      saturday: {
        open: { type: String, default: "Closed" },
        close: { type: String, default: "Closed" },
      },
      sunday: {
        open: { type: String, default: "Closed" },
        close: { type: String, default: "Closed" },
      },
    },

    deliveryAvailable: { type: Boolean, default: false },
    takeawayAvailable: { type: Boolean, default: false },
    minOrderAmount: { type: Number, default: 0 },

    categories: {
  type: [String], // z.B. ["Burger", "Pizza", "Seafood"]
  required: true,
},

    tags: [String],

    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },

    ratings: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    averageRating: { type: Number, default: 0 }, // <-- NEU

    socialLinks: {
      facebook: String,
      instagram: String,
    },
  },
  { timestamps: true }
);

RestaurantSchema.methods.calculateAverageRating = function () {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
  } else {
    const total = this.ratings.reduce((sum, r) => sum + r.rating, 0);
    this.averageRating = total / this.ratings.length;
  }
  return this.averageRating;
};

RestaurantSchema.index({ location: "2dsphere" });

export default mongoose.model("Restaurant", RestaurantSchema);
