import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import admin from "../models/Admin.js";
import RestaurantOwner from "../models/RestaurantOwner.js";
import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";

export const registerAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);

    // Admin speichern
    const newAdmin = await admin.create({
      name,
      email,
      password: hashedPassword,
      phone,
      address,
      role: "admin", // Rolle für Admin festlegen
    });

    // JWT erstellen
    const token = jwt.sign({ id: newAdmin._id, role: newAdmin.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(201).json({
      message: "Admin registered successfully",
      token,
      user: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      }
    });

  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const adminUser = await admin.findOne({ email });
    if (!adminUser) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, adminUser.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: adminUser._id, role: adminUser.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({
      message: "Admin logged in successfully",
      token,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAdminProfile = async (req, res) => {
  try {
    const adminUser = await admin.findById(req.user.id).select("-password");
    if (!adminUser) return res.status(404).json({ message: "Admin not found" });

    res.status(200).json(adminUser);
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const updateAdminProfile = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;

    const updatedAdmin = await admin.findByIdAndUpdate(
      req.user.id,
      { name, email, phone, address },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedAdmin) return res.status(404).json({ message: "Admin not found" });

    res.status(200).json(updatedAdmin);
  } catch (error) {
    console.error("Error updating admin profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const adminDashboard = async (req, res) => {
  try {
    // Hier könnten Admin-spezifische Daten abgerufen werden
    res.status(200).json({ message: "Admin dashboard accessed successfully" });
  } catch (error) {
    console.error("Error accessing admin dashboard:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const deleteAdmin = async (req, res) => {
  try {
    const adminId = req.params.id;
    const deletedAdmin = await admin.findByIdAndDelete(adminId);
    if (!deletedAdmin) return res.status(404).json({ message: "Admin not found" });

    res.status(200).json({ message: "Admin deleted successfully" });
  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllAdmins = async (req, res) => {
  try {
    const admins = await admin.find().select("-password");
    res.status(200).json(admins);
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAdminById = async (req, res) => {
  try {
    const adminId = req.params.id;
    const adminUser = await admin.findById(adminId).select("-password");
    if (!adminUser) return res.status(404).json({ message: "Admin not found" });

    res.status(200).json(adminUser);
  } catch (error) {
    console.error("Error fetching admin by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminUser = await admin.findById(req.user.id);

    if (!adminUser) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(currentPassword, adminUser.password);
    if (!isMatch) return res.status(401).json({ message: "Current password is incorrect" });

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    adminUser.password = hashedNewPassword;
    await adminUser.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const resetAdminPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const adminUser = await admin.findOne({ email });
    if (!adminUser) return res.status(404).json({ message: "Admin not found" });

    const resetToken = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// All users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete user by ID
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params .id;
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//All restaurant owners
export const getAllRestaurantOwners = async (req, res) => {
  try {
    const restaurantOwners = await RestaurantOwner.find().select("-password");
    res.status(200).json(restaurantOwners);
  } catch (error) {
    console.error("Error fetching restaurant owners:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get restaurant owner by ID
export const getRestaurantOwnerById = async (req, res) => {
  try {
    const ownerId = req.params.id;
    const restaurantOwner = await RestaurantOwner.findById(ownerId).select("-password");
    if (!restaurantOwner) return res.status(404).json({ message: "Restaurant owner not found" });

    res.status(200).json(restaurantOwner);
  } catch (error) {
    console.error("Error fetching restaurant owner by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};  

// Delete restaurant owner by ID
export const deleteRestaurantOwner = async (req, res) => {
  try {
    const ownerId = req.params.id;
    const deletedOwner = await RestaurantOwner.findByIdAndDelete(ownerId);
    if (!deletedOwner) return res.status(404).json({ message: "Restaurant owner not found" });

    res.status(200).json({ message: "Restaurant owner deleted successfully" });
  } catch (error) {
    console.error("Error deleting restaurant owner:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateRestaurantStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const owner = await RestaurantOwner.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!owner)
      return res.status(404).json({ message: "Restaurant owner not found" });
    res.status(200).json({ message: "Status updated", owner });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRestaurantOwner = async (req, res) => {
  try {
    const allowed = [
      "restaurantName",
      "name",
      "email",
      "phone",
      "website",
      "taxNumber",
      "document",
      "image",
      "logo",
      "description",
      "address",
      "status",
    ];
    const update = {};
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, k)) {
        update[k] = req.body[k];
      }
    }
 
    if (update.logo && !update.image) update.image = update.logo;
 
    if (update.document && !update.document) {
      update.document = update.document;
      delete update.document;
    }

    const owner = await RestaurantOwner.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true, context: "query" }
    );
    if (!owner)
      return res.status(404).json({ message: "Restaurant owner not found" });
    res.status(200).json(owner);
  } catch (err) {
    console.error("updateRestaurantOwner error:", err);
    if (err && err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Duplicate key", keyValue: err.keyValue });
    }
    if (err?.name === "ValidationError" || err?.name === "CastError") {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: "Server error" });
  }
};