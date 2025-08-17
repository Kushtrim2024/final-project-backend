import Restaurant from "../models/Restaurant.js";


// Get all restaurants
export const getAllRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find();
        res.status(200).json(restaurants);
    } catch (error) {
        console.error("Error fetching restaurants:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get a single restaurant by ID
export const getRestaurantById = async (req, res) => {
    const { id } = req.params;
    try {
        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }
        res.status(200).json(restaurant);
    } catch (error) {
        console.error("Error fetching restaurant:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Create a new restaurant
export const createRestaurant = async (req, res) => {
  const { 
    restaurantName, 
    description, 
    address,
    phone, 
    email, 
    website,
    image,
    logo
  } = req.body;

  if (!restaurantName || !description || !address || !phone || !email) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const newRestaurant = new Restaurant({
      restaurantName,
      description,
      address,
      phone,
      email,
      website,
      image: image || "",
      logo: logo || "",
      ownerId: req.user.id
    });

    await newRestaurant.save();
    res.status(201).json(newRestaurant);
  } catch (error) {
    console.error("Error creating restaurant:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update restaurant details
// This function allows restaurant owners to update their restaurant details
// It includes fields like opening hours, categories, tags, image, gallery, location, ratings, and social links.

export const updateRestaurantDetails = async (req, res) => {
  const { id } = req.params; 
  const { openingHours, closingHours, categories, tags, image, gallery, location, ratings, socialLinks } = req.body;

  try {
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    if (restaurant.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (openingHours) restaurant.openingHours = openingHours;
    if (closingHours) restaurant.closingHours = closingHours;
    if (categories) restaurant.categories = categories;
    if (tags) restaurant.tags = tags;
    if (image) restaurant.image = image;
    if (gallery) restaurant.gallery = gallery;

    // Standortdaten validiert und gesetzt
    if (location?.coordinates && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
      restaurant.location = {
        type: "Point",
        coordinates: location.coordinates
      };
    }

    if (ratings && Array.isArray(ratings)) {
      restaurant.ratings = ratings; // überschreiben oder anpassen je nach Logik
    }

    if (socialLinks) {
      if (socialLinks.facebook) restaurant.socialLinks.facebook = socialLinks.facebook;
      if (socialLinks.instagram) restaurant.socialLinks.instagram = socialLinks.instagram;
    }

    await restaurant.save();
    res.status(200).json({ message: "Restaurant updated successfully", restaurant });

  } catch (error) {
    console.error("Error updating restaurant:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a restaurant
export const updateRestaurant = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const restaurant = await Restaurant.findByIdAndUpdate(id, updates, { new: true }); 
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }
        res.status(200).json(restaurant);
    } catch (error) {
        console.error("Error updating restaurant:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete a restaurant
export const deleteRestaurant = async (req, res) => {
    const { id } = req.params;

    try {
        const restaurant = await Restaurant.findByIdAndDelete(id);
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }
        res.status(200).json({ message: "Restaurant deleted successfully" });
    } catch (error) {
        console.error("Error deleting restaurant:", error);
        res.status(500).json({ message: "Server error" });
    }
};
