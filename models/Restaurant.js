import mongoose from "mongoose";

const RestaurantSchema = new mongoose.Schema(
  {
    // Basis-Infos
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Medien & Darstellung
    image: {
      type: String, // URL oder Pfad
      required: true,
    },
    gallery: {
      type: [String], // mehrere Bilder
      default: [],
    },

    // Öffnungszeiten
    openingHours: {
      type: String, // z.B. "10:00"
      required: true,
    },
    closingHours: {
      type: String, // z.B. "22:00"
      required: true,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },

    // Serviceoptionen
    deliveryAvailable: {
      type: Boolean,
      default: false,
    },
    takeawayAvailable: {
      type: Boolean,
      default: false,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },

    // Kategorien & Tags
    categories: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String], // z.B. ["vegan", "bio"]
      default: [],
    },

    // Standortdaten
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },

    // Bewertungen
    ratings: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Social Media & Web
    socialLinks: {
      website: String,
      facebook: String,
      instagram: String,
    },
  },
  { timestamps: true }
);

// Geospatial Index für Standortsuche
RestaurantSchema.index({ location: "2dsphere" });

export default mongoose.model("Restaurant", RestaurantSchema);
