import cloudinary from "../config/cloudinary.js";

export function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}

export function uploadFileToCloudinary(filePath, options = {}) {
  return cloudinary.uploader.upload(filePath, options);
}

export function extractPublicIdFromUrl(url) {
  try {
    if (!url) return null;
    const u = new URL(url);
    const parts = u.pathname.split("/");
    const uploadIdx = parts.findIndex((p) => p === "upload");
    const rel = parts.slice(uploadIdx + 1).join("/");
    const withoutVersion = rel.replace(/^v[0-9]+\//, "");
    return withoutVersion.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
}

export function deleteFromCloudinaryByPublicId(publicId) {
  if (!publicId) return null;
  return cloudinary.uploader.destroy(publicId);
}

export async function deleteFromCloudinaryByUrl(url) {
  const publicId = extractPublicIdFromUrl(url);
  if (!publicId) return null;
  return deleteFromCloudinaryByPublicId(publicId);
}