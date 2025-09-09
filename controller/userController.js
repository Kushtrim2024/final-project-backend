import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import {
  uploadFileToCloudinary,
  uploadBufferToCloudinary,
  extractPublicIdFromUrl,
  deleteFromCloudinaryByPublicId,
  deleteFromCloudinaryByUrl,
} from "../utils/cloudinaryUpload.js";

function validateCardNumber(number) {
  const regex = /^\d{13,19}$/; // Länge 13–19, nur Ziffern
  if (!regex.test(number)) return false;

  // Luhn Algorithmus
  let sum = 0;
  let shouldDouble = false;
  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i], 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

// 🟢 Registrierung eines neuen Benutzers
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
    res.status(500).json({ message: "Server error! Email already exists" });
  }
};
// 🟢 Login eines Benutzers
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(200).json({ message: "Login successful", token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
// 🟢 Benutzerprofil abrufen
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
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // express-fileupload puts files on req.files
    // You configured: app.use(fileUpload({ useTempFiles: true }))
    // So: file.tempFilePath will exist.
    const file = (req.files && (req.files.avatar || req.files.photo)) || null;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Delete previous image if exists and not default
    if (user.profilePicture && user.profilePicture !== "default.png") {
      try {
        await deleteFromCloudinaryByUrl(user.profilePicture);
      } catch (err) {
        console.warn(
          "[Cloudinary] Previous image delete failed:",
          err?.message || err
        );
      }
    }

    let uploaded;
    if (file.tempFilePath) {
      // ✅ express-fileupload with temp file path
      uploaded = await uploadFileToCloudinary(file.tempFilePath, {
        folder: "uploads/profile",
        resource_type: "image",
      });
    } else if (file.data) {
      // If useTempFiles:false, you'll have a Buffer at file.data
      uploaded = await uploadBufferToCloudinary(file.data, {
        folder: "uploads/profile",
        resource_type: "image",
      });
    } else {
      return res.status(400).json({ message: "Unsupported file payload" });
    }

    user.profilePicture = uploaded.secure_url;
    await user.save();

    return res.json({ message: "Photo uploaded", url: user.profilePicture });
  } catch (err) {
    console.error("Upload error:", err);
    return res.status(500).json({ message: err.message || "Upload error" });
  }
};
// 🟢 Profil aktualisieren
export const updateUserProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name, email, phone },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

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
    if (!defaultAddress)
      return res.status(404).json({ message: "No addresses found" });

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

// Adresse aktualisieren
export const updateAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const address = user.addresses.id(req.params.addressId);
    if (!address) return res.status(404).json({ message: "Address not found" });

    // Felder überschreiben, falls im Body vorhanden
    address.street = req.body.street ?? address.street;
    address.city = req.body.city ?? address.city;
    address.postalCode = req.body.postalCode ?? address.postalCode;
    address.country = req.body.country ?? address.country;

    await user.save();

    res.status(200).json(address); // aktualisierte Adresse zurück
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
    if (!isMatch)
      return res.status(401).json({ message: "Current password is incorrect" });

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
    if (!deletedUser)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User account deleted successfully" });
  } catch (error) {
    console.error("Error deleting user account:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 🟢 Neue Payment Method speichern
// Funktion für E-Mail-Validierung
export const addPaymentMethod = async (req, res) => {
  try {
    const { type, cardType, cardNumber, expiryDate, email } = req.body; // <-- expiryDate
    const userId = req.user._id; // authMiddleware liefert user

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    let newMethod;

    const validateEmail = (email) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    };

    const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;

    if (type === "card") {
      if (!cardNumber || !validateCardNumber(cardNumber)) {
        return res.status(400).json({ message: "Ungültige Kartennummer" });
      }

      if (!expiryDate || !expiryRegex.test(expiryDate)) {
        return res.status(400).json({ message: "Ungültiges Ablaufdatum" });
      }

      const last4 = cardNumber.slice(-4);

      // Icon bestimmen
      let icon = "/creditcard.svg"; // Default
      const typeLower = cardType?.toLowerCase();
      if (typeLower === "visa") icon = "/visa.svg";
      else if (typeLower === "mastercard") icon = "/mastercard.svg";
      else if (typeLower === "amex") icon = "/amex.svg";

      newMethod = {
        type,
        cardType: cardType || "unknown",
        last4,
        expiryDate,
        icon,
      };
    } else if (["paypal", "applepay", "googlepay"].includes(type)) {
      if (!email) {
        return res
          .status(400)
          .json({ message: "Email für diese Zahlungsart erforderlich" });
      }
      if (!validateEmail(email)) {
        return res.status(400).json({ message: "Ungültige Email-Adresse" });
      }

      const iconMap = {
        paypal: "/paypal.svg",
        applepay: "/applepay.svg",
        googlepay: "/googlepay.svg",
      };

      newMethod = {
        type,
        email,
        icon: iconMap[type],
      };
    } else {
      return res.status(400).json({ message: "Ungültiger Zahlungstyp" });
    }

    user.paymentMethods.push(newMethod);
    await user.save();

    res.status(200).json({
      message: "Payment method added",
      paymentMethods: user.paymentMethods,
    });
  } catch (err) {
    console.error("Error adding payment method:", err);
    res.status(500).json({
      message: "Server error beim Hinzufügen der Zahlungsmethode",
    });
  }
};

// 🟢 Alle Payment Methods anzeigen
export const getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Sicherstellen, dass jede Methode ein Icon hat
    const paymentMethodsWithIcons = user.paymentMethods.map((method) => {
      if (method.icon) return method; // Icon schon gesetzt

      let icon = "/creditcard.svg"; // Default
      if (method.type === "card") {
        const typeLower = method.cardType?.toLowerCase();
        if (typeLower === "visa") icon = "/visa.svg";
        else if (typeLower === "mastercard") icon = "/mastercard.svg";
        else if (typeLower === "amex") icon = "/amex.svg";
      } else if (method.type === "paypal") icon = "/paypal.svg";
      else if (method.type === "applepay") icon = "/applepay.svg";
      else if (method.type === "googlepay") icon = "/googlepay.svg";

      return { ...method.toObject(), icon };
    });

    res.status(200).json({ paymentMethods: paymentMethodsWithIcons });
  } catch (err) {
    console.error("Error getting payment methods:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🟢 Payment Method löschen
export const deletePaymentMethod = async (req, res) => {
  try {
    const userId = req.user._id;
    const { methodId } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.paymentMethods = user.paymentMethods.filter(
      (m) => m._id.toString() !== methodId
    );
    await user.save();

    res.status(200).json({
      message: "Payment method removed",
      paymentMethods: user.paymentMethods,
    });
  } catch (err) {
    console.error("Error deleting payment method:", err);
    res.status(500).json({ message: "Server error" });
  }
};
