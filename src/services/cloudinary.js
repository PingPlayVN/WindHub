// src/services/cloudinary.js

// LƯU Ý: Bạn cần thay thế 2 biến này bằng thông tin từ tài khoản Cloudinary của bạn
const CLOUD_NAME = 'your_cloud_name_here'; 
const UPLOAD_PRESET = 'your_unsigned_preset_here'; 

export const uploadFileToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    // Dùng endpoint auto/upload để hỗ trợ cả image, video và file thô (raw)
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Upload thất bại');
    }
    
    const data = await response.json();
    return data; 
  } catch (error) {
    console.error('Lỗi khi upload lên Cloudinary:', error);
    throw error;
  }
};