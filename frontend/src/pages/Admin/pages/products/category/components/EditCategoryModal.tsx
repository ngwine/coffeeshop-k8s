import React from 'react';
import VariantsSection, { ProductVariant } from '../../ProductDetail/components/VariantsSection';

type ImportSummary = {
  created: number;
  updated: number;
  failed: number;
};

type EditCategoryModalProps = {
  open: boolean;
  form: {
    title: string;
    status: string;
    defaultVariants: ProductVariant[];
  };
  attachment: File | null;
  summary: ImportSummary | null;
  isUpdating: boolean;
  selectedCategory: {
    name: string;
    productCount: number;
  } | null;
  onClose: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  onTitleChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onVariantsChange: (variants: ProductVariant[]) => void;
  onFileChange: (file: File | null) => void;
};

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  open,
  form,
  attachment,
  summary,
  isUpdating,
  selectedCategory,
  onClose,
  onCancel,
  onSubmit,
  onTitleChange,
  onStatusChange,
  onVariantsChange,
  onFileChange,
}) => {
  if (!open || !selectedCategory) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background-dark border border-gray-700 rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-text-primary">Edit Category</h3>
          <button
            className="text-text-secondary hover:text-text-primary"
            onClick={onClose}
            disabled={isUpdating}
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4 text-sm overflow-y-auto flex-1">
          <div>
            <label className="block text-text-secondary mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Enter category title"
              className="w-full bg-background-light border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-text-primary"
            />
          </div>
          {/* Unique attribute input removed */}
          <div>
            <label className="block text-text-secondary mb-1">Attachment (tùy chọn)</label>
            <p className="text-xs text-text-secondary mb-2">
              Upload file JSON hoặc Excel (.xlsx) để cập nhật sản phẩm thuộc category này (map theo SKU).
            </p>
            <label
              className="w-full bg-background-light border border-dashed border-gray-600 rounded-lg px-3 py-3 flex flex-col gap-2 cursor-pointer hover:bg-background-dark transition"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  onFileChange(e.dataTransfer.files[0]);
                }
              }}
            >
              <span className="text-text-secondary text-sm">
                {attachment ? attachment.name : 'Choose file or drag & drop here'}
              </span>
              <input
                type="file"
                accept=".json,.xlsx,.xls,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden"
                onChange={(e) => onFileChange(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div>
            <label className="block text-text-secondary mb-1">Cấu hình tính năng biến thể (mặc định)</label>
            <p className="text-xs text-text-secondary mb-2">
              Các tuỳ chọn mẫu cập nhật ở đây sẽ được gợi ý cho các sản phẩm Tạo Mới thuộc danh mục này.
            </p>
            <div className="bg-background-light border border-gray-600 rounded-lg p-3">
              <VariantsSection 
                variants={form.defaultVariants} 
                onChange={onVariantsChange} 
              />
            </div>
          </div>

          <div>
            <label className="block text-text-secondary mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full bg-background-light border border-gray-600 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="rounded-lg border border-gray-700 bg-background-light px-3 py-2 text-xs text-text-secondary">
            <p>
              Đang chỉnh sửa category:{' '}
              <span className="text-text-primary font-semibold">{selectedCategory?.name}</span>
            </p>
            <p>
              Tổng sản phẩm:{' '}
              <span className="text-text-primary font-semibold">{selectedCategory?.productCount || 0}</span>
            </p>
          </div>
          {summary && (
            <div className="rounded-lg border border-gray-700 bg-background-light px-3 py-2 text-xs text-text-secondary">
              <p>
                Cập nhật: <span className="text-accent-green font-semibold">{summary.updated}</span> sản phẩm
              </p>
              <p>
                Tạo mới: <span className="text-accent-green font-semibold">{summary.created}</span> sản phẩm
              </p>
              {summary.failed > 0 && (
                <p>
                  Thất bại: <span className="text-accent-red font-semibold">{summary.failed}</span> sản phẩm
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-700">
          <button
            className="px-4 py-2 rounded-lg border border-gray-700 text-text-secondary hover:text-text-primary hover:bg-background-light transition-colors"
            onClick={onCancel}
            disabled={isUpdating}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
            onClick={onSubmit}
            disabled={isUpdating}
          >
            {isUpdating ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditCategoryModal;

















