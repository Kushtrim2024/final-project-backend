import mongoose from "mongoose";
import MenuItem from "../models/MenuItem.js";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload.js";

// Get products for a restaurant
// Get menu items for a restaurant, grouping pizzas by name with sizes
export const getMenuItems = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const menuItems = await MenuItem.find({ restaurantId }).lean();

    const groupedMenu = {};

    menuItems.forEach((item) => {
      const category = item.category;

      if (!groupedMenu[category]) groupedMenu[category] = [];

      if (Array.isArray(item.sizes) && item.sizes.length > 0) {
        // Prüfen, ob Pizza mit diesem Namen schon existiert
        const existingPizza = groupedMenu[category].find(
          (p) => p.name === item.name
        );
        if (existingPizza) {
          existingPizza.sizes.push(...item.sizes);
        } else {
          groupedMenu[category].push({
            ...item,
            sizes: item.sizes, // Array mit Größen behalten
          });
        }
      } else {
        groupedMenu[category].push(item);
      }
    });

    res.status(200).json(groupedMenu);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get menu item by ID
export const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const menuItem = await MenuItem.findById(id).lean();
    if (!menuItem)
      return res.status(404).json({ message: "Product not found" });
    res.status(200).json(menuItem);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Restaurantowner - Nur seine Produkte ansehen
export const getMyMenuItems = async (req, res) => {
  try {
    const menuItems = await MenuItem.find({
      restaurantId: req.user.restaurantId,
    });
    if (menuItems.length === 0) {
      return res.status(404).json({ message: "You have no menu items yet" });
    }
    res.status(200).json(menuItems);
  } catch (error) {
    console.error("Error fetching my menu items:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Restaurantowner - Nur sein Produkt über die ID ansehen
export const getMyMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const { restaurantId } = req.user;

    const menuItem = await MenuItem.findOne({
      _id: id,
      restaurantId: restaurantId,
    });

    if (!menuItem) {
      // It's a security best practice to return 404 for both not found and unauthorized access.
      // This prevents an attacker from knowing if an ID exists but belongs to a different user.
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(menuItem);
  } catch (error) {
    console.error("Error fetching my menu item:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create menu item
export const createMenuItem = async (req, res) => {
  const { restaurantId } = req.params;
  let { name, description = "", category, sizes, addOns, basePrice } = req.body;

  try {
    // Strings → Arrays
    if (typeof sizes === "string") sizes = JSON.parse(sizes);
    if (typeof addOns === "string") addOns = JSON.parse(addOns);

    // Bilder hochladen
    let images = [];
    if (req.files?.length) {
      const results = await Promise.all(
        req.files.map((f) =>
          uploadBufferToCloudinary(f.buffer, { folder: "uploads/menu" })
        )
      );
      images = results.map((r) => r.secure_url);
    } else if (req.file) {
      const r = await uploadBufferToCloudinary(req.file.buffer, {
        folder: "uploads/menu",
      });
      images = [r.secure_url];
    } else {
      images = ["default_menu.png"]; // Fallback
    }

    // Validation: either basePrice OR at least one size is required
    const hasSizes = Array.isArray(sizes) && sizes.length > 0;
    const hasBase =
      basePrice !== undefined &&
      basePrice !== null &&
      !isNaN(Number(basePrice));
    if (!hasSizes && !hasBase) {
      return res
        .status(400)
        .json({ message: "Provide either basePrice or at least one size." });
    }
    // Menüitem erstellen
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

// Update product
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
        req.files.map((f) =>
          uploadBufferToCloudinary(f.buffer, { folder: "menuItems" })
        )
      );
      updates.$push = { images: { $each: results.map((r) => r.secure_url) } };
    }

    // Kategorie prüfen
    // Normalized numeric fields if present
    if (
      updates.basePrice !== undefined &&
      updates.basePrice !== null &&
      updates.basePrice !== ""
    ) {
      updates.basePrice = Number(updates.basePrice);
    } else {
      // leave as-is if not provided (so we don't delete it accidentally)
      delete updates.basePrice;
    }

    if (Array.isArray(updates.sizes)) {
      updates.sizes = updates.sizes
        .filter((s) => s && s.label && s.price !== undefined && s.price !== "")
        .map((s) => ({
          label: String(s.label).trim(),
          price: Number(s.price),
        }));
      if (updates.sizes.length === 0) {
        // if client explicitly sent empty array, keep it empty (means "clear sizes")
      }
    } else {
      // if sizes not provided in payload, don't touch existing sizes
      delete updates.sizes;
    }

    if (Array.isArray(updates.addOns)) {
      updates.addOns = updates.addOns
        .filter((a) => a && a.name && a.price !== undefined && a.price !== "")
        .map((a) => ({ name: String(a.name).trim(), price: Number(a.price) }));
    } else {
      delete updates.addOns;
    }

    // Validation: item must have at least basePrice or some sizes after update
    const current = await MenuItem.findById(id).lean();
    if (!current)
      return res.status(404).json({ message: "Menu item not found" });
    const nextBase =
      updates.basePrice !== undefined ? updates.basePrice : current.basePrice;
    const nextSizes =
      updates.sizes !== undefined ? updates.sizes : current.sizes;
    const hasBase =
      nextBase !== undefined && nextBase !== null && !isNaN(Number(nextBase));
    const hasSizes = Array.isArray(nextSizes) && nextSizes.length > 0;
    if (!hasBase && !hasSizes) {
      return res
        .status(400)
        .json({ message: "Provide either basePrice or at least one size." });
    }

    const menuItem = await MenuItem.findByIdAndUpdate(id, updates, {
      new: true,
    });
    if (!menuItem)
      return res.status(404).json({ message: "Menu item not found" });

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
    if (!menuItem)
      return res.status(404).json({ message: "Menu item not found" });
    res.status(200).json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    res.status(500).json({ message: "Server error" });
  }
};