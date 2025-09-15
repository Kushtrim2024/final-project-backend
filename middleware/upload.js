import multer from "multer";

// Bilder im RAM speichern

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
});

export default upload;