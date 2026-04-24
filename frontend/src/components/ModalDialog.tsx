import React from 'react';

type ModalDialogProps = {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  variant?: 'default' | 'danger';
};

const ModalDialog: React.FC<ModalDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel,
  onConfirm,
  onCancel,
  variant = 'default',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-background-light rounded-xl shadow-2xl max-w-md w-full p-6">
        <h3 className="text-xl font-semibold text-text-primary mb-2">{title}</h3>
        <div className="text-text-secondary text-sm whitespace-pre-line">{message}</div>
        <div className="mt-6 flex justify-end gap-3">
          {cancelLabel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-gray-600 text-text-primary hover:bg-gray-700/40 transition-colors"
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white transition-colors ${
              variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDialog;











