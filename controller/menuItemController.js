import MenuItem from "../models/MenuItem.js";
import Restaurant from "../models/Restaurant.js";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload.js";

// Get menu items
export const getMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ restaurantId: req.params.restaurantId }).lean();
    res.status(200).json(menuItems);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create menu item
export const createMenuItem = async (req, res) => {
  const { restaurantId } = req.params;
  let { name, description, category, sizes, addOns, basePrice } = req.body;

  try {
    // Strings -> Arrays parsen
    if (typeof sizes === "string") sizes = JSON.parse(sizes);
    if (typeof addOns === "string") addOns = JSON.parse(addOns);

    // Bilder hochladen
    let images = [];
    if (req.files?.length) {
      const results = await Promise.all(
        req.files.map(f => uploadBufferToCloudinary(f.buffer, { folder: "menuItems" }))
      );
      images = results.map(r => r.secure_url);
    } else if (req.file) {
      const r = await uploadBufferToCloudinary(req.file.buffer, { folder: "menuItems" });
      images = [r.secure_url];
    }

    // Business-Regeln nach Kategorie prüfen
    if (category.toLowerCase() === "pizza") {
      if (!sizes || sizes.length === 0) {
        return res.status(400).json({ message: "Pizza items require sizes with prices" });
      }
    } else {
      if (!basePrice) {
        return res.status(400).json({ message: "Non-pizza items require a basePrice" });
      }
    }

    const newMenuItem = await MenuItem.create({
      restaurantId,
      name,
      description,
      category,
      basePrice: category.toLowerCase() !== "pizza" ? basePrice : undefined,
      sizes: Array.isArray(sizes) ? sizes : [],
      addOns: Array.isArray(addOns) ? addOns : [],
      images,
    });

    res.status(201).json(newMenuItem);
  } catch (error) {
    console.error("Error creating menu item:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Update menu item
// Update menu item
export const updateMenuItem = async (req, res) => {
  const { id } = req.params;
  let updates = { ...req.body };

  try {
    if (updates.sizes && typeof updates.sizes === "string") {
      updates.sizes = JSON.parse(updates.sizes);
    }
    if (updates.addOns && typeof updates.addOns === "string") {
      updates.addOns = JSON.parse(updates.addOns);
    }

    // Bilder hochladen?
    if (req.files?.length) {
      const results = await Promise.all(
        req.files.map(f => uploadBufferToCloudinary(f.buffer, { folder: "menuItems" }))
      );
      updates.$push = { images: { $each: results.map(r => r.secure_url) } };
    }

    // Kategorie prüfen
    if (updates.category?.toLowerCase() === "pizza") {
      if (!updates.sizes || updates.sizes.length === 0) {
        return res.status(400).json({ message: "Pizza items require sizes with prices" });
      }
      updates.basePrice = undefined; // Pizza soll kein basePrice haben
    } else {
      if (!updates.basePrice) {
        return res.status(400).json({ message: "Non-pizza items require a basePrice" });
      }
      updates.sizes = []; // andere Kategorien brauchen keine sizes
    }

    const menuItem = await MenuItem.findByIdAndUpdate(id, updates, { new: true });
    if (!menuItem) return res.status(404).json({ message: "Menu item not found" });

    res.status(200).json(menuItem);
  } catch (error) {
    console.error("Error updating menu item:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Delete
export const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
    if (!menuItem) return res.status(404).json({ message: "Menu item not found" });
    res.status(200).json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Restaurants by category
export const getRestaurantsByCategory = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ categories: req.params.category }).lean();
    res.status(200).json(restaurants);
  } catch (error) {
    console.error("Error fetching restaurants by category:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Restaurants by tag
export const getRestaurantsByTag = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ tags: req.params.tag }).lean();
    res.status(200).json(restaurants);
  } catch (error) {
    console.error("Error fetching restaurants by tag:", error);
    res.status(500).json({ message: "Server error" });
  }
};
