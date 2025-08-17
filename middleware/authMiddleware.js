// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import RestaurantOwner from "../models/RestaurantOwner.js";

// Rollen → Model Mapping
const roleModelMap = {
  user: User,
  admin: Admin,
  restaurant: RestaurantOwner,
};

// Auth Middleware
export const authMiddleware = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      // Token aus Header holen
      const authHeader = req.headers["authorization"];
      const token = authHeader?.split(" ")[1];

      if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
      }

      // Token prüfen
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { id, role } = decoded;

      if (!id || !role) {
        return res.status(400).json({ message: "Invalid token payload." });
      }

      // Rollenprüfung (nur wenn allowedRoles gesetzt ist)
      if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        return res.status(403).json({ message: "Access forbidden: insufficient permissions." });
      }

      // Passendes Model holen
      const Model = roleModelMap[role];
      if (!Model) {
        return res.status(400).json({ message: `No model found for role: ${role}` });
      }

      // Benutzer aus der richtigen Collection holen
      const user = await Model.findById(id).select("-password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // User ins Request-Objekt packen
      req.user = user;
      next();
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token expired." });
      }
      return res.status(401).json({ message: "Invalid token." });
    }
  };
};
