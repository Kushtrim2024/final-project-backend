import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import RestaurantOwner from "../models/RestaurantOwner.js";
import Restaurant from "../models/Restaurant.js";
import cloudinary from "../config/cloudinary.js";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload.js";

export const registerRestaurantOwner = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
      restaurantName,
      taxNumber,
      document,
      website,
    } = req.body;

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. RestaurantOwner speichern
    const owner = await RestaurantOwner.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      restaurantName,
      taxNumber,
      document,
      website,
      role: "restaurant", // Rolle für Restaurantbesitzer
    });

    // 2. Restaurant-Eintrag anlegen
    await Restaurant.create({
      restaurantName,
      address,
      phone,
      email,
      ownerId: owner._id,
    });

    // 3. JWT erstellen
    const token = jwt.sign(
      { id: owner._id, role: owner.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      message: "Restaurant owner registered successfully",
      token,
      user: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        address: owner.address,
        restaurantName: owner.restaurantName,
        taxNumber: owner.taxNumber,
        document: owner.document,
        website: owner.website,
        role: owner.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const getRestaurantOwnerProfile = async (req, res) => {
  try {
    const ownerId = req.user._id || req.user.id;
    const owner = await RestaurantOwner.findById(ownerId).select("-password");
    if (!owner)
      return res.status(404).json({ message: "Restaurant owner not found" });
    const restaurant = await Restaurant.findOne({ ownerId });
    return res.status(200).json({ owner, restaurant });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const loginRestaurantOwner = async (req, res) => {
  const { email, password } = req.body;

  try {
    const owner = await RestaurantOwner.findOne({ email });
    if (!owner)
      return res.status(404).json({ message: "Restaurant owner not found" });

    const isMatch = await bcrypt.compare(password, owner.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: owner._id, role: owner.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Restaurant owner logged in successfully",
      token,
      user: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
        restaurantName: owner.restaurantName,
        taxNumber: owner.taxNumber,
        document: owner.document,
        website: owner.website,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateRestaurantOwnerProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {};

    const allowedFields = [
      "name",
      "email",
      "phone",
      "address",
      "restaurantName",
      "taxNumber",
      "document",
      "website",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined && req.body[field].trim() !== "") {
        fieldsToUpdate[field] = req.body[field];
      }
    });

    const updatedOwner = await RestaurantOwner.findByIdAndUpdate(
      req.user._id,
      fieldsToUpdate,
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedOwner)
      return res.status(404).json({ message: "Restaurant owner not found" });

    res.status(200).json(updatedOwner);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//Aktualisieren des Passworts für Restaurantbesitzer
export const updateRestaurantOwnerPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    const owner = await RestaurantOwner.findById(req.user._id);
    if (!owner)
      return res.status(404).json({ message: "Restaurant owner not found" });

    const isMatch = await bcrypt.compare(currentPassword, owner.password);
    if (!isMatch)
      return res.status(401).json({ message: "Current password is incorrect" });

    owner.password = await bcrypt.hash(newPassword, 10);
    await owner.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Löschen des Restaurantbesitzer-Kontos

export const deleteRestaurantOwnerAccount = async (req, res) => {
  try {
    const deletedOwner = await RestaurantOwner.findByIdAndDelete(req.user._id);
    if (!deletedOwner)
      return res.status(404).json({ message: "Restaurant owner not found" });
    // Optional: Auch das zugehörige Restaurant löschen
    await Restaurant.deleteOne({ ownerId: req.user._id });

    res
      .status(200)
      .json({ message: "Restaurant owner account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateRestaurantProfile = async (req, res) => {
  try {
    const ownerId = req.user._id || req.user.id;
    const allowed = [
      "name",
      "description",
      "cuisines",
      "minOrder",
      "deliveryTime",
      "deliveryFee",
      "logo",
      "coverPhoto",
    ];
    const update = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) update[k] = req.body[k];
    });
    if (update.name && !update.restaurantName)
      update.restaurantName = update.name;
    const restaurant = await Restaurant.findOneAndUpdate({ ownerId }, update, {
      new: true,
      runValidators: true,
    });
    if (!restaurant)
      return res.status(404).json({ message: "Restaurant not found" });
    return res.status(200).json({ restaurant });
  } catch (error) {
    console.error("Error updating restaurant:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const uploadRestaurantCover = async (req, res) => {
  try {
    const ownerId = req.user._id || req.user.id;
    if (!req.file) return res.status(400).json({ message: "No file provided" });

    const restaurant = await Restaurant.findOne({ ownerId });
    if (!restaurant)
      return res.status(404).json({ message: "Restaurant not found" });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `restaurants/${ownerId}/covers`,
          resource_type: "image",
          overwrite: true,
          transformation: [
            { width: 1920, height: 1080, crop: "fill", gravity: "auto" },
          ],
        },
        (err, data) => (err ? reject(err) : resolve(data))
      );
      stream.end(req.file.buffer);
    });

    restaurant.coverPhoto = result.secure_url;
    await restaurant.save();
    return res.status(200).json({ coverPhoto: restaurant.coverPhoto });
  } catch (error) {
    console.error("Error uploading cover:", error);
    return res.status(500).json({ message: "Server error" });
  }
};