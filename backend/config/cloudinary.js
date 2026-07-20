const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Creates a multer upload middleware with Cloudinary storage.
 * @param {string} folder - Cloudinary folder name
 * @param {string[]} allowedFormats - Allowed file formats
 */
const createUploader = (folder, allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp']) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `hackforge/${folder}`,
      allowed_formats: allowedFormats,
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    },
  });

  return multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  });
};

/**
 * Delete a file from Cloudinary by public_id
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error.message);
  }
};

module.exports = { cloudinary, createUploader, deleteFromCloudinary };
