import React, { useEffect, useRef, useState } from 'react';
import { UploadCloud, Link2, Trash2 } from 'lucide-react';

type ProductImageUploaderProps = {
  onChange?: (file: File | null) => void;
};

type PreviewState = {
  file: File;
  url: string;
};

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({ onChange }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imagePreview, setImagePreview] = useState<PreviewState | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview.url);
    }
    setImagePreview({ file, url });
    onChange?.(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    handleFiles(event.dataTransfer.files);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDragActive) setIsDragActive(true);
  };

  const handleDragLeave = () => {
    if (isDragActive) setIsDragActive(false);
  };

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview.url);
    }
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onChange?.(null);
  };

  useEffect(
    () => () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview.url);
      }
    },
    [imagePreview]
  );

  return (
    <div className="bg-background-light p-6 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Product Image</h3>
        <button className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <Link2 size={16} />
          Add media from URL
        </button>
      </div>
      <div
        className={`border-2 border-dashed rounded-lg p-6 sm:p-10 transition-colors cursor-pointer ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-gray-600 hover:border-primary'
        } ${imagePreview ? 'text-left' : 'text-center'}`}
        onClick={triggerFilePicker}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {imagePreview ? (
          <div className="max-w-xs bg-background-dark/50 border border-gray-700 rounded-lg overflow-hidden">
            <div className="aspect-square bg-background-dark">
              <img src={imagePreview.url} alt={imagePreview.file.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-3 space-y-1">
              <p className="text-sm font-semibold text-text-primary truncate">{imagePreview.file.name}</p>
              <p className="text-xs text-text-secondary">{formatFileSize(imagePreview.file.size)}</p>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  removeImage();
                }}
                className="flex items-center gap-2 text-xs font-medium text-accent-red hover:underline"
              >
                <Trash2 size={14} />
                Remove file
              </button>
            </div>
          </div>
        ) : (
          <>
            <UploadCloud className="mx-auto h-12 w-12 text-gray-500" />
            <p className="mt-4 text-text-secondary">Drag and drop your image here</p>
            <p className="text-xs text-gray-500">or</p>
            <button
              type="button"
              className="text-sm font-semibold text-primary hover:underline mt-1"
              onClick={(event) => {
                event.stopPropagation();
                triggerFilePicker();
              }}
            >
              Browse image
            </button>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>
    </div>
  );
};

export default ProductImageUploader;



