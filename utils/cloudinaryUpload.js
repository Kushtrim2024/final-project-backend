import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import fs from "fs";

/** Upload from a temp file path (express-fileupload with useTempFiles:true) */
export const uploadFileToCloudinary = async (filePath, options = {}) => {
  // uses cloudinary.uploader.upload on file path
  return cloudinary.uploader.upload(filePath, options);
};

/** Upload from a Buffer (if you ever use memory buffers) */
export const uploadBufferToCloudinary = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });

/** Extract public_id from a Cloudinary URL */
export const extractPublicIdFromUrl = (url) => {
  try {
    if (!url) return null;
    // Example: .../image/upload/v16999/uploads/profile/abc123.jpg
    const u = new URL(url);
    const parts = u.pathname.split("/");
    const uploadIdx = parts.findIndex((p) => p === "upload");
    const rel = parts.slice(uploadIdx + 1).join("/"); // vxxx/.../folder/name.ext
    const withoutVersion = rel.replace(/^v[0-9]+\//, "");
    return withoutVersion.replace(/\.[^/.]+$/, ""); // remove extension
  } catch {
    return null;
  }
};

/** Delete by public_id or by URL */
export const deleteFromCloudinaryByPublicId = (publicId) => {
  if (!publicId) return null;
  return cloudinary.uploader.destroy(publicId);
};

export const deleteFromCloudinaryByUrl = async (url) => {
  const publicId = extractPublicIdFromUrl(url);
  if (!publicId) return null;
  return deleteFromCloudinaryByPublicId(publicId);
};