const express = require('express');
const multer = require('multer');
const UploadRepository = require('../patterns/repository/UploadRepository');
const UploadController = require('../controllers/UploadController');

const router = express.Router();

// Configure multer to store files in memory
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
});

// Initialize repository and controller
const uploadRepository = new UploadRepository();
const uploadController = new UploadController(uploadRepository);

/**
 * POST /api/upload/image - Upload single image to Cloudinary
 */
router.post('/image', upload.single('image'), (req, res, next) =>
  uploadController.uploadImage(req, res, next)
);

/**
 * POST /api/upload/images - Upload multiple images to Cloudinary
 */
router.post('/images', upload.array('images', 10), (req, res, next) =>
  uploadController.uploadImages(req, res, next)
);

/**
 * POST /api/upload/avatar - Upload avatar image
 */
router.post('/avatar', upload.single('avatar'), (req, res, next) =>
  uploadController.uploadAvatar(req, res, next)
);

/**
 * DELETE /api/upload/:publicId - Delete file from Cloudinary
 */
router.delete('/:publicId', (req, res, next) =>
  uploadController.deleteFile(req, res, next)
);

/**
 * GET /api/upload/:publicId/info - Get file information
 */
router.get('/:publicId/info', (req, res, next) =>
  uploadController.getFileInfo(req, res, next)
);

module.exports = router;
