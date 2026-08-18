// src/services/thumbnail.js
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dbvzcet3/image/upload';
const UPLOAD_PRESET = 'THUMNAIL_WINDHUB';

// Cloudinary chỉ dùng cho ảnh thumbnail được trích từ video.
export const generateAndSaveVideoThumbnail = async (fileId, imageBlob) => {
  try {
    const formData = new FormData();
    
    // SỬA DÒNG NÀY: Thêm tham số thứ 3 để tạo tên file độc nhất không bị trùng lặp
    formData.append('file', imageBlob, `thumb_${fileId}.jpg`);
    
    formData.append('upload_preset', UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!data.secure_url) throw new Error('Upload failed');

    const thumbnailUrl = data.secure_url.replace('/upload/', '/upload/w_300,q_auto,f_auto/');

    await updateDoc(doc(db, 'windhub_files', fileId), {
      thumbnailUrl: thumbnailUrl
    });

    console.log('Đã tạo và lưu thumbnail thành công!');
    return thumbnailUrl;
  } catch (error) {
    console.error('Lỗi khi tạo thumbnail:', error);
  }
};
