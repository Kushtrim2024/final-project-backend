import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import RestaurantOwner from "../models/RestaurantOwner.js";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";
import dotenv from "dotenv";
dotenv.config();


const MONGODB_URI = process.env.DB_MONGO_URI;

// Globale Kategorien -> für Restaurants
const globalCategories = [
  "Burger", "Doner", "Chicken", "Pizza", "Sushi",
  "Pasta", "Salad", "Vegan", "Vegetarian", "Seafood"
];

// Lokale Kategorien -> für Menü-Items innerhalb eines Restaurants
const localCategories = ["Starters", "Main Courses", "Desserts", "Drinks", "Specials"];

function randomHours() {
  const days = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
  let hours = {};
  days.forEach(day => {
    if (faker.datatype.boolean()) {
      hours[day] = { open: "Closed", close: "Closed" };
    } else {
      const openHour = faker.number.int({ min: 8, max: 12 });
      const closeHour = faker.number.int({ min: 18, max: 23 });
      hours[day] = { open: `${openHour}:00`, close: `${closeHour}:00` };
    }
  });
  return hours;
}

function randomRatings() {
  const ratings = [];
  const count = faker.number.int({ min: 0, max: 20 });
  for (let i = 0; i < count; i++) {
    ratings.push({
      userId: new mongoose.Types.ObjectId(),
      rating: faker.number.int({ min: 1, max: 5 }),
      comment: faker.lorem.sentence(),
      createdAt: faker.date.past(),
    });
  }
  return ratings;
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("🌱 DB verbunden");

    // Alte Daten löschen
    await RestaurantOwner.deleteMany({});
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});
    console.log("🗑 Alte Daten gelöscht");

    let ownersData = [];
    let restaurantsData = [];
    let menuItemsData = [];

    // === Owners erstellen ===
    for (let i = 0; i < 100; i++) {
      ownersData.push({
  name: faker.person.fullName(),
  email: faker.internet.email(),
  password: "OwnerPW123!",
  phone: faker.phone.number(),
  address: {
    street: faker.location.streetAddress(),
    city: faker.location.city(),
    postalCode: faker.location.zipCode(),
    country: faker.location.country(),
  },
  restaurantName: faker.company.name(),
  taxNumber: faker.finance.accountNumber(),
  document: faker.system.filePath(),
  website: faker.internet.url(),
});

    }

    const owners = await RestaurantOwner.insertMany(ownersData);

    // === Restaurants erstellen ===
    owners.forEach((owner) => {
      restaurantsData.push({
        restaurantName: owner.restaurantName,
        description: faker.lorem.sentence(),
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          postalCode: faker.location.zipCode(),
          country: faker.location.country(),
        },
        phone: owner.phone,
        email: owner.email,
        ownerId: owner._id,
        image: faker.image.url(),
        logo: faker.image.url(),
        gallery: [faker.image.url(), faker.image.url()],
        deliveryAvailable: faker.datatype.boolean(),
        takeawayAvailable: faker.datatype.boolean(),
        minOrderAmount: faker.number.int({ min: 0, max: 50 }),
        // Nur 1-3 globale Kategorien
        categories: faker.helpers.arrayElements(globalCategories, faker.number.int({ min: 1, max: 3 })),
        tags: [faker.word.noun(), faker.word.adjective()],
        location: {
          type: "Point",
          coordinates: [faker.location.longitude(), faker.location.latitude()],
        },
        hours: randomHours(),
        ratings: randomRatings(),
      });
    });

    const restaurants = await Restaurant.insertMany(restaurantsData);

    // === MenuItems erstellen ===
    restaurants.forEach((restaurant) => {
      localCategories.forEach((cat) => {
        for (let i = 0; i < 30; i++) {
          menuItemsData.push({
            restaurantId: restaurant._id,
            name: faker.commerce.productName(),
            description: faker.lorem.sentence(),
            category: cat, // nur lokale Kategorie
            basePrice: faker.number.float({ min: 5, max: 25, precision: 0.01 }),
            sizes: [
              { label: "Small", price: faker.number.float({ min: 5, max: 15, precision: 0.01 }) },
              { label: "Medium", price: faker.number.float({ min: 10, max: 25, precision: 0.01 }) },
              { label: "Large", price: faker.number.float({ min: 15, max: 35, precision: 0.01 }) },
            ],
            addOns: [
              { name: "Extra Cheese", price: 2 },
              { name: "Extra Sauce", price: 1.5 },
            ],
            status: faker.helpers.arrayElement(["available", "unavailable"]),
            images: [faker.image.url(), faker.image.url()],
          });
        }
      });
    });

    await MenuItem.insertMany(menuItemsData);

    console.log(`✅ ${owners.length} Owner, ${restaurants.length} Restaurants, ${menuItemsData.length} MenuItems erstellt`);
    process.exit();
  } catch (err) {
    console.error("❌ Fehler beim Seed:", err);
    process.exit(1);
  }
}

seed();
