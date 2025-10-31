'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { uploadImage, generateImagePreview } from '@/lib/image-upload';

interface MultipleImageUploaderProps {
  value?: string[];
  onChange: (urls: string[]) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  maxImages?: number;
}

export const MultipleImageUploader: React.FC<MultipleImageUploaderProps> = ({
  value = [],
  onChange,
  onError,
  disabled = false,
  className = '',
  maxImages = 10
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageUrls = value || [];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check if adding these files would exceed maxImages
    if (imageUrls.length + files.length > maxImages) {
      onError?.(`最多只能上傳 ${maxImages} 張圖片`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      setIsUploading(true);
      const newUrls: string[] = [...imageUrls];
      
      // Upload all selected files
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadingIndex(i);
        
        // Upload to Firebase Storage
        const result = await uploadImage(file);
        
        if (result.success && result.url) {
          newUrls.push(result.url);
        } else {
          onError?.(result.error || `圖片 ${i + 1} 上傳失敗`);
        }
      }
      
      onChange(newUrls);
    } catch (error: any) {
      onError?.(error.message || '上傳失敗');
    } finally {
      setIsUploading(false);
      setUploadingIndex(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const newUrls = imageUrls.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  const handleClick = () => {
    if (!disabled && imageUrls.length < maxImages) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={true}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || imageUrls.length >= maxImages}
      />

      {/* Image grid */}
      {imageUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {imageUrls.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Product image ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {imageUrls.length < maxImages && (
        <div
          onClick={handleClick}
          className={`
            border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer
            hover:border-primary-500 hover:bg-primary-50 transition-colors
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="text-sm text-gray-600">上傳中...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-sm text-gray-600">點擊上傳圖片</p>
              <p className="text-xs text-gray-400">
                支援 JPG, PNG, GIF (最大 5MB) • 可一次選擇多張圖片 • 最多 {maxImages} 張
              </p>
              <p className="text-xs text-blue-600 font-medium">
                提示：按住 Ctrl (Windows) 或 Cmd (Mac) 可一次選擇多張圖片
              </p>
              {imageUrls.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  已上傳 {imageUrls.length} / {maxImages} 張
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {imageUrls.length >= maxImages && (
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">已達到最大上傳數量 ({maxImages} 張)</p>
        </div>
      )}
    </div>
  );
};

export default MultipleImageUploader;

