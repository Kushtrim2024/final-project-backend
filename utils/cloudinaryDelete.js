import cloudinary from "../config/cloudinary.js";

// public_id aus der URL holen
export const getPublicIdFromUrl = (url) => {
  try {
    const parts = url.split("/");
    const filename = parts.pop(); // z.B. abc123.jpg
    const folder = parts.slice(parts.indexOf("upload") + 1).join("/");
    return folder + "/" + filename.split(".")[0];
  } catch (err) {
    console.error("Fehler beim public_id extrahieren:", err);
    return null;
  }
};

// Löschen in Cloudinary
export const deleteFromCloudinary = async (url) => {
  const publicId = getPublicIdFromUrl(url);
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log("Gelöscht:", publicId);
  } catch (err) {
    console.error("Cloudinary Löschfehler:", err);
  }
};
