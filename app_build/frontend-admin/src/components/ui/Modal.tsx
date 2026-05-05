import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { LoadingButton } from './LoadingButton';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  children: React.ReactNode;
  confirmText?: string;
  confirmVariant?: 'primary' | 'danger';
  loading?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirmar',
  confirmVariant = 'primary',
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="px-6 py-4">
          {children}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Cancelar
          </button>
          {onConfirm && (
            <LoadingButton
              onClick={onConfirm}
              variant={confirmVariant}
              loading={loading}
            >
              {confirmText}
            </LoadingButton>
          )}
        </div>
      </div>
    </div>
  );
};
