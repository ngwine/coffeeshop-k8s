/**
 * UploadRepository - Data access layer for file uploads to Cloudinary
 * Organized into patterns/repository
 */
const cloudinary = require('../../config/cloudinary');
const { Readable } = require('stream');

class UploadRepository {
  constructor() {
    this.cloudinary = cloudinary;
  }

  /**
   * Upload buffer to Cloudinary
   */
  async uploadToCloudinary(buffer, folder = 'products', options = {}) {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto' },
          ],
          ...options,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      const stream = Readable.from(buffer);
      stream.pipe(uploadStream);
    });
  }

  async uploadSingle(fileBuffer, fileName, folder = 'products') {
    const result = await this.uploadToCloudinary(fileBuffer, folder);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      secureUrl: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      originalFileName: fileName,
    };
  }

  async uploadMultiple(files, folder = 'products') {
    const uploadPromises = files.map((file) =>
      this.uploadToCloudinary(file.buffer, folder).then((result) => ({
        url: result.secure_url,
        publicId: result.public_id,
        secureUrl: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        originalFileName: file.originalname,
      }))
    );

    return Promise.all(uploadPromises);
  }

  async deleteFile(publicId) {
    return new Promise((resolve, reject) => {
      this.cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  async getFileInfo(publicId) {
    return new Promise((resolve, reject) => {
      this.cloudinary.api.resource(publicId, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }
}

module.exports = UploadRepository;
