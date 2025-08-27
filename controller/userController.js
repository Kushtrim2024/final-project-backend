import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body; // address = erste Adresse
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      addresses: address ? [address] : [], // erste Adresse ins Array packen
      role: "user",
    });

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({ message: "User registered", token, user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({ message: "Login successful", token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


export const profile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Profilbild hochladen (optional)

export const uploadProfilePicture = async (req, res) => {
   try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Altes Bild löschen (falls nicht default)
    if (user.profilePicture && user.profilePicture !== "default.png") {
      await deleteFromCloudinary(user.profilePicture);
    }

    const result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: "uploads/profile",
    });

    user.profilePicture = result.secure_url;
    await user.save();

    res.json({ message: "Profile picture changed", url: user.profilePicture });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};  

export const updateUserProfile = async (req, res) => {
  try {
    const { name, email, phone} = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name, email, phone},
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Neue Adresse hinzufügen

export const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.addresses.push(req.body); // neue Adresse hinten anhängen
    await user.save();

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Defaultadresse holen
export const getDefaultAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const defaultAddress = user.addresses[0]; // immer erste Adresse
    if (!defaultAddress) return res.status(404).json({ message: "No addresses found" });

    res.status(200).json(defaultAddress);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Adresse entfernen
export const removeAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.addresses.id(req.params.addressId).deleteOne();
    await user.save();

    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Passwort ändern
export const updateUserPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: "Current password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Benutzerkonto löschen

export const deleteUserAccount = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.user._id);
    if (!deletedUser) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User account deleted successfully" });
  } catch (error) {
    console.error("Error deleting user account:", error);
    res.status(500).json({ message: "Server error" });
  }
};    
