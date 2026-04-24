import React from 'react';
import { UploadCloud, Trash2 } from 'lucide-react';

export const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

type ImageUploadSectionProps = {
  imagePreview: { file?: File; url: string } | null;
  uploading?: boolean;
  isDragActive: boolean;
  previewFileName?: string | null;
  previewFileSize?: number | null;
  onTriggerUpload: () => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onRemoveImage: () => void;
  onBrowse: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  title?: string;
  required?: boolean;
};

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  imagePreview,
  uploading = false,
  isDragActive,
  previewFileName,
  previewFileSize,
  onTriggerUpload,
  onDrop,
  onDragOver,
  onDragLeave,
  onRemoveImage,
  onBrowse,
  onFileChange,
  fileInputRef,
  title = 'Product Image',
  required = true,
}) => (
  <div className="bg-background-light p-6 rounded-lg">
    <h3 className="text-lg font-semibold mb-4 text-text-primary">
      {title} {required && <span className="text-red-400">*</span>}
    </h3>
    <div
      className={`group border-2 border-dashed rounded-lg p-6 sm:p-10 transition-all duration-300 cursor-pointer ${
        isDragActive ? 'border-primary bg-primary/10 scale-[1.02] shadow-lg shadow-primary/20' : 'border-gray-600 hover:border-primary hover:bg-primary/5 hover:shadow-md'
      } ${imagePreview ? 'text-left' : 'text-center'}`}
      onClick={onTriggerUpload}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      {uploading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-text-secondary">Uploading image...</p>
        </div>
      ) : imagePreview ? (
        <div className="max-w-xs bg-background-dark/50 border border-gray-700 rounded-lg overflow-hidden">
          <div className="aspect-square bg-background-dark">
            <img
              src={imagePreview.url}
              alt={previewFileName || 'Product image'}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-3 space-y-1">
            <p className="text-sm font-semibold text-text-primary truncate">{previewFileName || 'Image'}</p>
            <p className="text-xs text-text-secondary">
              {previewFileSize ? formatFileSize(previewFileSize) : ''}
              {imagePreview.url && imagePreview.url.includes('cloudinary') && <span className="ml-2 text-green-400">✓ Uploaded</span>}
            </p>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRemoveImage();
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
          <UploadCloud className="mx-auto h-12 w-12 text-gray-500 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
          <p className="mt-4 text-text-secondary opacity-70 transition-opacity duration-300 group-hover:opacity-100">
            Drag and drop your image here
          </p>
          <p className="text-xs text-gray-500 opacity-70">or</p>
          <button
            type="button"
            className="group/btn relative inline-flex items-center gap-2 px-4 py-2 mt-2 text-sm font-semibold text-primary bg-primary/10 rounded-lg transition-all duration-300 hover:bg-primary hover:text-white hover:scale-105 hover:shadow-lg hover:shadow-primary/50 active:scale-95"
            onClick={(event) => {
              event.stopPropagation();
              onBrowse();
            }}
          >
            <span>Browse image</span>
            <svg
              className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
      <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={onFileChange} />
    </div>
  </div>
);

export default ImageUploadSection;














