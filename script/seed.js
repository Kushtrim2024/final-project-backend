// seed-pexels.mjs — Realistic MenuItem seeding with Pexels (keeps logins intact)
// Requirements: Node 18+ (built-in fetch), Mongoose models, a Pexels API key in .env

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { faker } from "@faker-js/faker";
import dotenv from "dotenv";
dotenv.config();

import RestaurantOwner from "../models/RestaurantOwner.js";
import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";

/** ================== CONFIG ================== */
// Safe mode: keep existing owners/restaurants; rebuild only MenuItems
const KEEP_OWNERS_AND_RESTAURANTS = true;
// How many items per local category per restaurant
const ITEMS_PER_LOCAL_CATEGORY = 30;
// Concurrency for image/API fetches (rate-limit friendly). Keep modest.
const MAX_CONCURRENCY = 6;

/** Global & Local Categories */
const globalCategories = [
  "Burger",
  "Doner",
  "Chicken",
  "Pizza",
  "Sushi",
  "Pasta",
  "Salad",
  "Vegan",
  "Vegetarian",
  "Seafood",
];
const localCategories = [
  "Starters",
  "Main Courses",
  "Desserts",
  "Drinks",
  "Specials",
];

/** ================== GENERIC HELPERS ================== */
function randomHours() {
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const hours = {};
  for (const day of days) {
    if (faker.datatype.boolean()) {
      hours[day] = { open: "Closed", close: "Closed" };
    } else {
      const openHour = faker.number.int({ min: 8, max: 12 });
      const closeHour = faker.number.int({ min: 18, max: 23 });
      hours[day] = { open: `${openHour}:00`, close: `${closeHour}:00` };
    }
  }
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

function hashInt(str) {
  const s = String(str ?? "");
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
function rnd(min, max, precision = 0.01) {
  return Number(faker.number.float({ min, max, precision }).toFixed(2));
}
function pick(arr) {
  return faker.helpers.arrayElement(arr);
}
function maybePickMany(arr, min = 0, max = 2) {
  if (!arr || !arr.length) return [];
  const count = faker.number.int({ min, max });
  return faker.helpers.arrayElements(arr, count);
}
function includesAny(text, keywords) {
  const t = (text || "").toLowerCase();
  return keywords.some((k) => t.includes(String(k).toLowerCase()));
}

/** ================== CATEGORY DICTS & RULES ================== */
// Name pools per local category (augmented by restaurant global cuisines)
const NAME_POOLS = {
  Starters: [
    "Bruschetta",
    "Garlic Bread",
    "Tomato Soup",
    "Chicken Wings",
    "Mozzarella Sticks",
    "Hummus & Pita",
    "Onion Rings",
  ],
  "Main Courses": [
    "Grilled Chicken Bowl",
    "Beef Burger",
    "Margherita Pizza",
    "Pepperoni Pizza",
    "Chicken Doner Plate",
    "Seafood Pasta",
    "Veggie Sushi Roll",
    "Salmon Teriyaki",
  ],
  Desserts: [
    "Tiramisu",
    "Cheesecake",
    "Chocolate Lava Cake",
    "Crème Brûlée",
    "Baklava",
    "Panna Cotta",
    "Brownie",
    "Apple Pie",
    "Churros",
  ],
  Drinks: [
    "Coca-Cola",
    "Sparkling Water",
    "Fresh Orange Juice",
    "Iced Tea",
    "Latte",
    "Espresso",
    "Cappuccino",
    "Lemonade",
  ],
  Specials: [
    "Chef’s Platter",
    "Truffle Pasta",
    "Tomahawk Steak",
    "Seasonal Tasting Menu",
  ],
};

// Add-on pools per category
const ADDON_POOLS = {
  Starters: [
    { name: "Extra Dip", price: 1.5 },
    { name: "Extra Sauce", price: 1.0 },
    { name: "Extra Bread", price: 2.0 },
  ],
  "Main Courses": [
    { name: "Extra Cheese", price: 2.0 },
    { name: "Double Meat", price: 4.0 },
    { name: "Gluten-Free Base", price: 2.5 },
    { name: "Extra Veggies", price: 1.5 },
  ],
  Desserts: [
    { name: "Chocolate Sauce", price: 1.2 },
    { name: "Caramel Drizzle", price: 1.2 },
    { name: "Berry Compote", price: 1.5 },
    { name: "Vanilla Ice Cream Scoop", price: 2.0 },
    { name: "Powdered Sugar", price: 0.5 },
  ],
  Drinks: [
    { name: "Extra Shot Espresso", price: 1.5 },
    { name: "Syrup (Vanilla/Caramel)", price: 0.8 },
    { name: "Oat Milk", price: 0.7 },
    { name: "Lemon Slice", price: 0.3 },
  ],
  Specials: [
    { name: "Truffle Shavings", price: 5.0 },
    { name: "Aged Parmesan", price: 3.0 },
  ],
};

// Price ranges (used when not using sizes)
const PRICE_RANGES = {
  Starters: { min: 4, max: 10 },
  "Main Courses": { min: 10, max: 30 },
  Desserts: { min: 4, max: 12 },
  Drinks: { min: 2, max: 8 },
  Specials: { min: 18, max: 45 },
};

// Size strategy per category
const SIZE_STRATEGY = {
  Starters: "none",
  "Main Courses": "optional", // e.g., pizza/burger might have sizes
  Desserts: "none",
  Drinks: "sizes", // drinks often have S/M/L
  Specials: "none",
};

// Cuisine augmentation: skew names based on restaurant global tags
const CUISINE_AUGMENT = {
  Sushi: ["California Roll", "Spicy Tuna Roll", "Dragon Roll", "Salmon Nigiri"],
  Pizza: ["Margherita", "Pepperoni", "Quattro Formaggi", "Funghi"],
  Burger: [
    "Classic Beef Burger",
    "Cheeseburger",
    "Chicken Burger",
    "Veggie Burger",
  ],
  Doner: ["Chicken Doner", "Beef Doner", "Doner Wrap", "Iskender Doner"],
  Pasta: [
    "Spaghetti Bolognese",
    "Penne Arrabbiata",
    "Fettuccine Alfredo",
    "Pesto Pasta",
  ],
  Salad: ["Caesar Salad", "Greek Salad", "Quinoa Salad", "Caprese Salad"],
  Chicken: [
    "Grilled Chicken",
    "Crispy Chicken",
    "BBQ Chicken",
    "Lemon Herb Chicken",
  ],
  Seafood: [
    "Grilled Salmon",
    "Shrimp Linguine",
    "Fish & Chips",
    "Seafood Paella",
  ],
  Vegan: ["Vegan Buddha Bowl", "Tofu Stir-fry", "Vegan Burger", "Vegan Curry"],
  Vegetarian: [
    "Paneer Tikka",
    "Veggie Lasagna",
    "Mushroom Risotto",
    "Falafel Plate",
  ],
};

function nameForCategory(cat, restaurantGlobals = []) {
  const base = NAME_POOLS[cat] || ["House Item"];
  const pool = [...base];
  for (const g of restaurantGlobals) {
    if (CUISINE_AUGMENT[g]) pool.push(...CUISINE_AUGMENT[g]);
  }
  return pick(pool);
}
function addonsForCategory(cat) {
  const pool = ADDON_POOLS[cat] || [];
  if (cat === "Desserts") return maybePickMany(pool, 1, 3);
  if (cat === "Drinks") return maybePickMany(pool, 0, 2);
  return maybePickMany(pool, 0, 2);
}
function sizesForCategory(cat) {
  const strat = SIZE_STRATEGY[cat] || "none";
  if (strat === "sizes") {
    const s = rnd(2, 4);
    const m = rnd(s + 0.5, s + 2.5);
    const l = rnd(m + 0.5, m + 2.5);
    return [
      { label: "Small", price: s },
      { label: "Medium", price: m },
      { label: "Large", price: l },
    ];
  }
  if (strat === "optional" && faker.datatype.boolean()) {
    const base = rnd(7, 12);
    return [
      { label: "Small", price: base },
      { label: "Medium", price: rnd(base + 1, base + 3) },
      { label: "Large", price: rnd(base + 2, base + 5) },
    ];
  }
  return [];
}
function priceForCategory(cat, sizes) {
  if (sizes && sizes.length) {
    const base = Math.min(...sizes.map((s) => s.price));
    return { basePrice: base, price: undefined };
  }
  const r = PRICE_RANGES[cat] || { min: 5, max: 20 };
  return { basePrice: rnd(r.min, r.max), price: undefined };
}

/** ================== PEXELS (Category-aware search + whitelist filter) ================== */
// Category-specific query templates (priority order)
const PEXELS_QUERIES = {
  Drinks: (name) => [
    name,
    `${name} drink`,
    `${name} beverage`,
    "coffee",
    "latte",
    "espresso",
    "cappuccino",
    "tea",
    "iced tea",
    "lemonade",
    "smoothie",
    "juice",
    "soda",
    "cola",
    "cocktail",
    "mocktail",
    "beer",
    "wine",
  ],
  Desserts: (name) => [
    name,
    `${name} dessert`,
    "dessert",
    "cake",
    "tiramisu",
    "cheesecake",
    "brownie",
    "pie",
    "tart",
    "pudding",
    "ice cream",
    "gelato",
    "panna cotta",
    "baklava",
    "churros",
    "cookie",
  ],
  Starters: (name) => [
    name,
    `${name} appetizer`,
    "appetizer",
    "starter",
    "bruschetta",
    "garlic bread",
    "soup",
    "wings",
    "hummus",
    "pita",
    "nachos",
    "onion rings",
    "dip",
  ],
  "Main Courses": (name) => [
    name,
    `${name} dish`,
    "pizza",
    "burger",
    "pasta",
    "steak",
    "chicken",
    "sushi",
    "salmon",
    "doner",
    "kebab",
    "bowl",
    "curry",
    "rice",
  ],
  Specials: (name) => [
    name,
    `${name} chef special`,
    "chef special",
    "tasting menu",
    "truffle",
    "tomahawk",
    "seasonal dish",
  ],
};

// Whitelist keywords (we prefer results whose ALT text contains any of these)
const WHITELISTS = {
  Drinks: [
    "drink",
    "beverage",
    "coffee",
    "latte",
    "espresso",
    "cappuccino",
    "tea",
    "iced tea",
    "lemonade",
    "smoothie",
    "juice",
    "soda",
    "cola",
    "cocktail",
    "mocktail",
    "beer",
    "wine",
  ],
  Desserts: [
    "dessert",
    "cake",
    "tiramisu",
    "cheesecake",
    "brownie",
    "pie",
    "tart",
    "pudding",
    "ice cream",
    "gelato",
    "panna cotta",
    "baklava",
    "churros",
    "cookie",
    "sweet",
  ],
  Starters: [
    "appetizer",
    "starter",
    "bruschetta",
    "garlic bread",
    "soup",
    "wings",
    "hummus",
    "pita",
    "nachos",
    "onion rings",
    "dip",
  ],
  "Main Courses": [
    "main",
    "dish",
    "pizza",
    "burger",
    "pasta",
    "steak",
    "chicken",
    "sushi",
    "salmon",
    "doner",
    "kebab",
    "bowl",
    "curry",
    "rice",
    "entrée",
  ],
  Specials: ["chef", "special", "tasting", "truffle", "tomahawk", "seasonal"],
};

const PEXELS = {
  key: process.env.PEXELS_API_KEY,
  mem: new Map(), // q -> normalized results
};

async function searchPexelsRaw(query, perPage = 30) {
  if (!PEXELS.key) return [];
  const q = String(query || "")
    .trim()
    .toLowerCase();
  if (PEXELS.mem.has(q)) return PEXELS.mem.get(q);

  const u = new URL("https://api.pexels.com/v1/search");
  u.searchParams.set("query", q);
  u.searchParams.set("per_page", String(perPage));
  u.searchParams.set("orientation", "landscape");

  const res = await fetch(u.toString(), {
    headers: { Authorization: PEXELS.key },
  });
  if (!res.ok) return [];

  const data = await res.json().catch(() => null);
  const photos = Array.isArray(data?.photos) ? data.photos : [];

  const normalized = photos.map((p) => ({
    id: String(p.id),
    alt: p.alt || "",
    url:
      p?.src?.landscape || p?.src?.large || p?.src?.large2x || p?.src?.original,
    photographer: p?.photographer || "Pexels",
    photographer_url: p?.photographer_url || "https://www.pexels.com",
  }));

  PEXELS.mem.set(q, normalized);
  return normalized;
}

function pickDeterministic(results, seed) {
  if (!results.length) return null;
  const idx = Math.abs(hashInt(String(seed))) % results.length;
  return results[idx];
}

// The main category-aware image picker (stable & filtered)
async function getPexelsImageForCategory(name, category, seed) {
  const builder =
    PEXELS_QUERIES[category] ||
    ((n) => [n, `${n} food`, category, `${category} food`]);
  const queries = Array.from(new Set(builder(name).filter(Boolean)));

  const whitelist = WHITELISTS[category] || [];
  let all = [];

  // Try queries in order; prefer those matching whitelist in 'alt'
  for (const q of queries) {
    const arr = await searchPexelsRaw(q, 30);
    all = all.concat(arr);

    const filtered = whitelist.length
      ? arr.filter((p) => includesAny(p.alt, whitelist))
      : arr;
    // Early exit heuristic: if enough relevant results found, prioritize them
    if (filtered.length >= 10) {
      all = filtered.concat(all); // bring filtered to the front
      break;
    }
  }

  let pool = whitelist.length
    ? all.filter((p) => includesAny(p.alt, whitelist))
    : all;
  if (!pool.length) pool = all;

  const picked = pickDeterministic(pool, seed) || pool[0];
  return picked?.url || null;
}

/** ================== MENU ITEM GENERATION ================== */
function buildDescription(name, cat) {
  const descTpl = {
    Desserts: `${name} served with a delicate touch. Perfect after your meal.`,
    Drinks: `${name}, served chilled.`,
    Starters: `Crispy and flavorful ${name} to start your meal.`,
    "Main Courses": `Hearty ${name} prepared fresh.`,
    Specials: `Limited-time ${name} by our chef.`,
  };
  return descTpl[cat] || `${name} prepared with fresh ingredients.`;
}

async function generateMenuItem(restaurant, cat) {
  const restaurantGlobals = restaurant.categories || []; // e.g., ["Burger","Sushi"]
  const name = nameForCategory(cat, restaurantGlobals);
  const sizes = sizesForCategory(cat);
  const { basePrice, price } = priceForCategory(cat, sizes);
  const description = buildDescription(name, cat);

  const seed = `${restaurant._id}-${name}-${cat}`;
  const image = await getPexelsImageForCategory(name, cat, seed);

  return {
    restaurantId: restaurant._id,
    name,
    description,
    category: cat,
    basePrice,
    price,
    sizes,
    addOns: addonsForCategory(cat),
    status: faker.helpers.arrayElement(["available", "unavailable"]),
    images: [image || faker.image.url()], // safe fallback
  };
}

/** ================== SIMPLE CONCURRENCY QUEUE ================== */
const queue = [];
let inflight = 0;
function runQueue() {
  while (inflight < MAX_CONCURRENCY && queue.length) {
    const job = queue.shift();
    inflight++;
    job().finally(() => {
      inflight--;
      runQueue();
    });
  }
}
function addJob(fn) {
  return new Promise((resolve, reject) => {
    queue.push(async () => {
      try {
        resolve(await fn());
      } catch (e) {
        reject(e);
      }
    });
    runQueue();
  });
}

/** ================== MAIN ================== */
async function seed() {
  const uri = process.env.DB_MONGO_URI;
  if (!uri) throw new Error("Missing DB_MONGO_URI");
  if (!process.env.PEXELS_API_KEY) {
    console.warn(
      "⚠️ Missing PEXELS_API_KEY — images will fall back to placeholders."
    );
  }

  await mongoose.connect(uri);
  console.log("🌱 Connected to MongoDB");

  let owners, restaurants;

  if (KEEP_OWNERS_AND_RESTAURANTS) {
    owners = await RestaurantOwner.find({});
    restaurants = await Restaurant.find({});
    console.log(
      `ℹ️ Keeping ${owners.length} owners and ${restaurants.length} restaurants`
    );
  } else {
    await RestaurantOwner.deleteMany({});
    await Restaurant.deleteMany({});
    await MenuItem.deleteMany({});
    console.log("🗑 Dropped owners, restaurants, and menu items");

    // Rebuild owners (only if you really want a full reset)
    const ownersData = [];
    for (let i = 0; i < 100; i++) {
      const hashedPassword = await bcrypt.hash("OwnerPW123!", 10);
      ownersData.push({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedPassword,
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
    owners = await RestaurantOwner.insertMany(ownersData);

    // Rebuild restaurants
    const restaurantsData = owners.map((owner) => ({
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
      categories: faker.helpers.arrayElements(
        globalCategories,
        faker.number.int({ min: 1, max: 3 })
      ),
      tags: [faker.word.noun(), faker.word.adjective()],
      location: {
        type: "Point",
        coordinates: [faker.location.longitude(), faker.location.latitude()],
      },
      hours: randomHours(),
      ratings: randomRatings(),
    }));
    restaurants = await Restaurant.insertMany(restaurantsData);
  }

  // Rebuild menu items per restaurant (idempotent for MenuItems)
  let totalItems = 0;
  for (const r of restaurants) {
    await MenuItem.deleteMany({ restaurantId: r._id });

    const jobs = [];
    for (const cat of localCategories) {
      for (let i = 0; i < ITEMS_PER_LOCAL_CATEGORY; i++) {
        jobs.push(addJob(async () => await generateMenuItem(r, cat)));
      }
    }
    const batch = await Promise.all(jobs);

    if (batch.length) {
      await MenuItem.insertMany(batch, { ordered: false });
      totalItems += batch.length;
      console.log(`🍽  Restaurant ${r._id}: inserted ${batch.length} items`);
    }
  }

  console.log(
    `✅ Done. Owners: ${owners.length}, Restaurants: ${restaurants.length}, MenuItems: ${totalItems}`
  );
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});