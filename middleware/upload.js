import multer from "multer";

// Bilder im RAM speichern
const storage = multer.memoryStorage();
const upload = multer({ storage });

export default upload;
