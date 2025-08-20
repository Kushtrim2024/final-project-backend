
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
  try {
    let restaurant;

    // Admin kann über ID updaten
    if (req.user.role === "admin" && req.params.id) {
      restaurant = await Restaurant.findById(req.params.id);
    } else {
      // Owner: nur eigenes Restaurant
      restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    }

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const { hours } = req.body;

    if (hours) {
      const days = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
      restaurant.hours = {};
      days.forEach(day => {
        restaurant.hours[day] = {
          open: hours[day]?.open || "Closed",
          close: hours[day]?.close || "Closed"
        };
      });
    }

    await restaurant.save();
    res.status(200).json({ message: "Restaurant updated successfully", restaurant });

  } catch (error) {
    console.error("Error updating restaurant:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const updateRestaurant = async (req, res) => {
  try {
    let restaurant;

    if (req.params.id && req.user.role === "admin") {
      // Admin: beliebiges Restaurant über ID
      restaurant = await Restaurant.findById(req.params.id);
      if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    } else {
      // Owner: nur eigenes Restaurant
      restaurant = await Restaurant.findOne({ ownerId: req.user.id });
      if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    }

    const { hours, categories, tags, image, gallery, location, ratings, socialLinks, restaurantName, description, phone, email, website } = req.body;

    // Öffnungszeiten
    if (hours) {
      const days = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
      restaurant.hours = {};
      days.forEach(day => {
        restaurant.hours[day] = {
          open: hours[day]?.open || "Closed",
          close: hours[day]?.close || "Closed"
        };
      });
    }

    // Sonstige Felder
    if (categories) restaurant.categories = categories;
    if (tags) restaurant.tags = tags;
    if (image) restaurant.image = image;
    if (gallery) restaurant.gallery = gallery;
    if (restaurantName) restaurant.restaurantName = restaurantName;
    if (description) restaurant.description = description;
    if (phone) restaurant.phone = phone;
    if (email) restaurant.email = email;
    if (website) restaurant.website = website;

    if (location?.coordinates?.length === 2) {
      restaurant.location = { type: "Point", coordinates: location.coordinates };
    }

    if (ratings && Array.isArray(ratings)) {
      restaurant.ratings = ratings;
    }

    if (socialLinks) {
      restaurant.socialLinks = { ...restaurant.socialLinks, ...socialLinks };
    }

    await restaurant.save();
    res.status(200).json({ message: "Restaurant updated successfully", restaurant });

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

// RestaurantOwner → Nur sein eigenes Restaurant sehen
export const getMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ message: "You have no restaurant yet" });
    }
    res.status(200).json(restaurant);
  } catch (error) {
    console.error("Error fetching my restaurant:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// RestaurantOwner → Eigenes Restaurant löschen
export const deleteMyRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOneAndDelete({ ownerId: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ message: "No restaurant found to delete" });
    }
    res.status(200).json({ message: "Your restaurant has been deleted successfully" });
  } catch (error) {
    console.error("Error deleting my restaurant:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getRestaurantsByCategory = async (req, res) => {
  const { category } = req.query; // Query-Parameter statt req.params
  if (!category) return res.status(400).json({ message: "Query parameter is required" });

  try {
    const restaurants = await Restaurant.find({ categories: category }).lean();
    res.status(200).json(restaurants);
  } catch (error) {
    console.error(error);
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

export const searchRestaurants = async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ message: "Query parameter is required" });

  try {
    const regex = new RegExp(name, "i");
    const restaurants = await Restaurant.find({ restaurantName: { $regex: regex } }).lean();
    res.status(200).json(restaurants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get restaurants by postal code
export const getRestaurantsByPostCode = async (req, res) => {
  const { postcode } = req.query;  // Query statt params
  if (!postcode) {
    return res.status(400).json({ message: "Postal code is required" });
  }

  try {
    const restaurants = await Restaurant.find({ "address.postalCode": postcode }).lean();
    res.status(200).json(restaurants);
  } catch (error) {
    console.error("Error fetching restaurants by postal code:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Get restaurants by location (coordinates)
export const getRestaurantsByLocation = async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ message: "Latitude and longitude are required" });
  }

  try {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    const restaurants = await Restaurant.find({
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [longitude, latitude] },
          $maxDistance: 5000 // z.B. 5 km Radius
        }
      }
    }).lean();

    res.status(200).json(restaurants);
  } catch (error) {
    console.error("Error fetching restaurants by location:", error);
    res.status(500).json({ message: "Server error" });
  }
};
