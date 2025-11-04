'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { uploadImage, generateImagePreview } from '@/lib/image-upload';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  folder?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  onError,
  disabled = false,
  className = '',
  folder = 'product_images'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // Generate preview
      const preview = await generateImagePreview(file);
      setPreviewUrl(preview);

      // Upload to Firebase Storage
      const result = await uploadImage(file, folder);
      
      if (result.success && result.url) {
        onChange(result.url);
      } else {
        onError?.(result.error || '上傳失敗');
        setPreviewUrl(null);
      }
    } catch (error: any) {
      onError?.(error.message || '上傳失敗');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onChange('');
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const displayUrl = previewUrl || value;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload area */}
      {!displayUrl && (
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
              <p className="text-xs text-gray-400">支援 JPG, PNG, GIF (最大 5MB)</p>
            </div>
          )}
        </div>
      )}

      {/* Image preview */}
      {displayUrl && (
        <div className="relative">
          <img
            src={displayUrl}
            alt="Product preview"
            className="w-full h-48 object-cover rounded-lg border border-gray-200"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Upload button (when image exists) */}
      {displayUrl && !disabled && (
        <button
          type="button"
          onClick={handleClick}
          disabled={isUploading}
          className="flex items-center justify-center space-x-2 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <ImageIcon className="w-4 h-4" />
          <span>{isUploading ? '上傳中...' : '更換圖片'}</span>
        </button>
      )}
    </div>
  );
};

export default ImageUploader;
