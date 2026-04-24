/**
 * UploadController - Business logic layer for file uploads
 */
class UploadController {
  constructor(uploadRepository) {
    this.uploadRepository = uploadRepository;
  }

  /**
   * POST /api/upload/image - Upload single image
   */
  async uploadImage(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided',
        });
      }

      // Upload to Cloudinary
      const result = await this.uploadRepository.uploadSingle(
        req.file.buffer,
        req.file.originalname,
        'products'
      );

      return res.json({
        success: true,
        message: 'Image uploaded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/upload/images - Upload multiple images
   */
  async uploadImages(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No image files provided',
        });
      }

      // Upload all images in parallel
      const results = await this.uploadRepository.uploadMultiple(
        req.files,
        'products'
      );

      return res.json({
        success: true,
        message: 'Images uploaded successfully',
        data: results,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/upload/avatar - Upload avatar image
   */
  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No avatar file provided',
        });
      }

      // Upload to Cloudinary with avatar folder
      const result = await this.uploadRepository.uploadSingle(
        req.file.buffer,
        req.file.originalname,
        'avatars'
      );

      return res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/upload/:publicId - Delete file from Cloudinary
   */
  async deleteFile(req, res, next) {
    try {
      const { publicId } = req.params;

      if (!publicId) {
        return res.status(400).json({
          success: false,
          message: 'Public ID is required',
        });
      }

      const result = await this.uploadRepository.deleteFile(publicId);

      return res.json({
        success: true,
        message: 'File deleted successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/upload/:publicId/info - Get file information
   */
  async getFileInfo(req, res, next) {
    try {
      const { publicId } = req.params;

      if (!publicId) {
        return res.status(400).json({
          success: false,
          message: 'Public ID is required',
        });
      }

      const info = await this.uploadRepository.getFileInfo(publicId);

      return res.json({
        success: true,
        data: info,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UploadController;
