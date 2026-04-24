import React from 'react';

type CategoryInfo = {
  name: string;
  productCount?: number;
};

type DeleteCategoryModalProps = {
  open: boolean;
  category: CategoryInfo | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const DeleteCategoryModal: React.FC<DeleteCategoryModalProps> = ({
  open,
  category,
  isDeleting,
  onCancel,
  onConfirm,
}) => {
  if (!open || !category) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background-dark border border-gray-700 rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-text-primary">Delete Category</h3>
          <button
            className="text-text-secondary hover:text-text-primary"
            onClick={onCancel}
            disabled={isDeleting}
          >
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4 text-sm">
          <p className="text-text-secondary">
            Xóa category{' '}
            <span className="text-text-primary font-semibold">{category.name}</span> sẽ xóa luôn{' '}
            {category.productCount || 0} sản phẩm thuộc category này. Hành động này không thể hoàn tác.
          </p>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-gray-700">
          <button
            className="px-4 py-2 rounded-lg border border-gray-600 text-text-secondary hover:text-text-primary hover:bg-gray-800 transition-colors disabled:opacity-60"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-accent-red text-white font-semibold hover:bg-accent-red/90 transition-colors disabled:opacity-60"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCategoryModal;

















