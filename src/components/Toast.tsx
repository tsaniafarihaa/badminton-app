import React from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Toast as ToastType } from '../types';
import { useTournament } from '../context/TournamentContext';

interface ToastProps {
  toast: ToastType;
}

export function Toast({ toast }: ToastProps) {
  const { removeToast } = useTournament();

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    error: <AlertTriangle className="w-5 h-5 text-rose-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
  };

  const bgColors = {
    success: 'bg-navy-800 border-emerald-500/30',
    error: 'bg-navy-800 border-rose-500/30',
    info: 'bg-navy-800 border-blue-500/30',
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border animate-slide-up shadow-lg ${bgColors[toast.type]}`}
    >
      {icons[toast.type]}
      <span className="text-sm text-gray-200">{toast.message}</span>
      <button
        onClick={() => removeToast(toast.id)}
        className="ml-2 text-gray-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useTournament();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
