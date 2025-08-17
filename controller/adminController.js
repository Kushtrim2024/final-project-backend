import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import admin from "../models/Admin.js";

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