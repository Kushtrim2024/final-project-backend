import mongoose from "mongoose";
import dotenv from "dotenv";
import RestaurantOwner from "../models/RestaurantOwner.js";
import bcrypt from "bcrypt";

dotenv.config();

const MONGODB_URI = process.env.DB_MONGO_URI;

async function updateAllOwnerPasswords(newPassword) {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("🌱 DB verbunden");

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await RestaurantOwner.updateMany(
      {}, // kein Filter = alle Einträge
      { password: hashedPassword }
    );

    console.log(`✅ Passwörter für ${result.modifiedCount} Owner erfolgreich geändert`);

    process.exit();
  } catch (err) {
    console.error("❌ Fehler:", err);
    process.exit(1);
  }
}

// Beispiel: Passwort für alle ändern
updateAllOwnerPasswords("OwnerPW123!");
