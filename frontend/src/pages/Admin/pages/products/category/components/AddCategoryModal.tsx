import React from 'react';
import VariantsSection, { ProductVariant } from '../../ProductDetail/components/VariantsSection';

type ImportSummary = {
  created: number;
  updated: number;
  failed: number;
};

type AddCategoryModalProps = {
  open: boolean;
  form: {
    title: string;
    status: string;
    attachment: File | null;
    defaultVariants: ProductVariant[];
  };
  importSummary: ImportSummary | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onTitleChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onVariantsChange: (variants: ProductVariant[]) => void;
  onFileChange: (file: File | null) => void;
};

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  open,
  form,
  importSummary,
  isSaving,
  onClose,
  onSubmit,
  onTitleChange,
  onStatusChange,
  onVariantsChange,
  onFileChange,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background-dark border border-gray-700 rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-text-primary">Add Category</h3>
          <button 
            className="text-text-secondary" 
            onClick={onClose} 
            disabled={isSaving}
            style={{
              transition: 'none !important',
              boxShadow: 'none !important',
              WebkitTransition: 'none !important',
              MozTransition: 'none !important',
              OTransition: 'none !important',
              msTransition: 'none !important',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'rgb(156, 163, 175)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transition = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'rgb(229, 231, 235)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transition = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'rgb(156, 163, 175)';
            }}
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
            <label className="block text-text-secondary mb-1">Attachment</label>
            <p className="text-xs text-text-secondary mb-2">
              Hỗ trợ file JSON hoặc Excel (.xlsx). Với Excel, đặt tiêu đề cột:
              <span className="text-text-primary font-semibold"> name, sku, price, quantity, description, imageUrl</span>.
            </p>
            <label
              className={`w-full bg-background-light border ${
                isSaving ? 'border-primary' : 'border-dashed border-gray-600'
              } rounded-lg px-3 py-3 flex flex-col gap-2 cursor-pointer hover:bg-background-dark transition`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  onFileChange(e.dataTransfer.files[0]);
                }
              }}
            >
              <span className="text-text-secondary text-sm">
                {form.attachment ? form.attachment.name : 'Choose file or drag & drop here'}
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
              Các tuỳ chọn này sẽ tự động gợi ý cho sản phẩm thuộc danh mục này thay vì phải cài đặt lại cho từng sản phẩm.
            </p>
            <div className="bg-background-light border border-gray-600 rounded-lg p-3">
              <VariantsSection 
                variants={form.defaultVariants} 
                onChange={onVariantsChange} 
              />
            </div>
          </div>

          <div>
            <label className="block text-text-secondary mb-1">Select category status</label>
            <select
              value={form.status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full bg-background-light border border-gray-600 rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          {importSummary && (
            <div className="rounded-lg border border-gray-700 bg-background-light px-3 py-2 text-xs text-text-secondary">
              <p>
                Thêm mới: <span className="text-accent-green font-semibold">{importSummary.created}</span> sản phẩm
              </p>
              <p>
                Cập nhật: <span className="text-accent-green font-semibold">{importSummary.updated}</span> sản phẩm
              </p>
              {importSummary.failed > 0 && (
                <p>
                  Thất bại: <span className="text-accent-red font-semibold">{importSummary.failed}</span> sản phẩm
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-700">
          <button
            className="px-4 py-2 rounded-lg border border-red-600 bg-red-600 text-white"
            onClick={onClose}
            disabled={isSaving}
            style={{
              transition: 'none !important',
              boxShadow: 'none !important',
              WebkitTransition: 'none !important',
              MozTransition: 'none !important',
              OTransition: 'none !important',
              msTransition: 'none !important',
              backgroundColor: 'rgb(220, 38, 38)',
              borderColor: 'rgb(220, 38, 38)',
              color: 'rgb(255, 255, 255)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transition = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = 'rgb(220, 38, 38)';
              e.currentTarget.style.borderColor = 'rgb(220, 38, 38)';
              e.currentTarget.style.color = 'rgb(255, 255, 255)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transition = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = 'rgb(220, 38, 38)';
              e.currentTarget.style.borderColor = 'rgb(220, 38, 38)';
              e.currentTarget.style.color = 'rgb(255, 255, 255)';
            }}
          >
            Discard
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-primary text-white font-semibold"
            onClick={onSubmit}
            disabled={isSaving || !form.title.trim()}
            style={{
              transition: 'none !important',
              boxShadow: 'none !important',
              WebkitTransition: 'none !important',
              MozTransition: 'none !important',
              OTransition: 'none !important',
              msTransition: 'none !important',
              backgroundColor: 'rgb(124, 58, 237)',
              color: 'rgb(255, 255, 255)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transition = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = 'rgb(124, 58, 237)';
              e.currentTarget.style.color = 'rgb(255, 255, 255)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transition = 'none';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = 'rgb(124, 58, 237)';
              e.currentTarget.style.color = 'rgb(255, 255, 255)';
            }}
          >
            {isSaving ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCategoryModal;













