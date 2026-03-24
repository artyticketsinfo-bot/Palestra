import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  variant = 'danger'
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantClasses = {
    danger: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
    warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
    info: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20'
  };

  const iconClasses = {
    danger: 'text-red-500 bg-red-50',
    warning: 'text-amber-500 bg-amber-50',
    info: 'text-blue-500 bg-blue-50'
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-hidden animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl border border-stone-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className={`p-3 rounded-2xl ${iconClasses[variant]}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-xl transition-all text-stone-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-stone-900 tracking-tight">{title}</h3>
            <p className="text-stone-500 font-medium leading-relaxed">{message}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3.5 bg-stone-100 text-stone-600 rounded-2xl font-bold hover:bg-stone-200 transition-all active:scale-95"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-6 py-3.5 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${variantClasses[variant]}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
