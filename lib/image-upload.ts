import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload an image file to Firebase Storage
 * @param file - The image file to upload
 * @param folder - The folder path in storage (default: 'product_images')
 * @param fileName - Optional custom file name (default: auto-generated timestamp)
 * @returns Promise with upload result
 */
export const uploadImage = async (
  file: File,
  folder: string = 'product_images',
  fileName?: string
): Promise<UploadResult> => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: '請選擇圖片檔案'
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: '圖片檔案大小不能超過 5MB'
      };
    }

    // Generate file name if not provided
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    // Use folder name in filename prefix for better organization
    let folderPrefix = 'image';
    if (folder === 'product_images') {
      folderPrefix = 'product';
    } else if (folder === 'homepage_banners') {
      folderPrefix = 'banner';
    } else {
      // Extract folder name (last segment after /)
      const folderName = folder.split('/').pop() || folder;
      // Clean up the folder name for use as prefix (remove underscores, take first word)
      folderPrefix = folderName.split('_')[0] || 'image';
    }
    const finalFileName = fileName || `${folderPrefix}_${timestamp}.${fileExtension}`;
    
    // Create storage reference
    const storageRef = ref(storage, `${folder}/${finalFileName}`);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      success: true,
      url: downloadURL
    };
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return {
      success: false,
      error: error.message || '圖片上傳失敗'
    };
  }
};

/**
 * Generate a preview URL for an image file (for preview before upload)
 * @param file - The image file
 * @returns Promise with preview URL
 */
export const generateImagePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
