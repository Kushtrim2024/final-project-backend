import MenuItem from "../models/MenuItem.js";

// Get menu items for a restaurant
export const getMenuItems = async (req, res) => {
    const { restaurantId } = req.params;

    try {
        const menuItems = await MenuItem.find({ restaurantId });
        res.status(200).json(menuItems);
    } catch (error) {
        console.error("Error fetching menu items:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Create a new menu item
export const createMenuItem = async (req, res) => {
    const { restaurantId } = req.params;
    const { name, description, category, sizes, addOns, price, image } = req.body;

    try {
        const newMenuItem = new MenuItem({
            name,
            description,
            category,
            sizes,
            addOns,
            price,
            image,
            restaurantId
        });

        await newMenuItem.save();
        res.status(201).json(newMenuItem);
    } catch (error) {
        console.error("Error creating menu item:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update a menu item
export const updateMenuItem = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const menuItem = await MenuItem.findByIdAndUpdate(id, updates, { new: true });
        if (!menuItem) {
            return res.status(404).json({ message: "Menu item not found" });
        }
        res.status(200).json(menuItem);
    } catch (error) {
        console.error("Error updating menu item:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete a menu item
export const deleteMenuItem = async (req, res) => {
    const { id } = req.params;

    try {
        const menuItem = await MenuItem.findByIdAndDelete(id);
        if (!menuItem) {
            return res.status(404).json({ message: "Menu item not found" });
        }
        res.status(200).json({ message: "Menu item deleted successfully" });
    } catch (error) {
        console.error("Error deleting menu item:", error);
        res.status(500).json({ message: "Server error" });
    }
};
// Get restaurants by category
export const getRestaurantsByCategory = async (req, res) => {
    const { category } = req.params;

    try {
        const restaurants = await Restaurant.find({ categories: category });
        res.status(200).json(restaurants);
    } catch (error) {
        console.error("Error fetching restaurants by category:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get restaurants by tag
export const getRestaurantsByTag = async (req, res) => {
    const { tag } = req.params;

    try {
        const restaurants = await Restaurant.find({ tags: tag });
        res.status(200).json(restaurants);
    } catch (error) {
        console.error("Error fetching restaurants by tag:", error);
        res.status(500).json({ message: "Server error" });
    }
};  