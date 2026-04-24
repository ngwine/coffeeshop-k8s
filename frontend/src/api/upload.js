import { apiClient } from './client';

const UploadApi = {
  // Upload single image to Cloudinary
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await apiClient.post('/upload/image', formData);
    return response;
  },

  // Upload multiple images to Cloudinary
  uploadImages: async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });

    const response = await apiClient.post('/upload/images', formData);
    return response;
  },
};

export default UploadApi;

