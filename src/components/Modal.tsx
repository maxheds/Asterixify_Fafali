import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
}

export function Modal({ isOpen, onClose, children, title, size = 'medium' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-2xl',
    large: 'max-w-5xl',
    xlarge: 'max-w-7xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div
        className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-black/60 to-lime-900/40 backdrop-blur-md"
        onClick={onClose}
      />

      <div className={`relative bg-transparent rounded-2xl shadow-2xl border-2 border-lime-500/30 w-full ${sizeClasses[size]} h-[95vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200`}>
        {title && (
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-lime-500/20 bg-gradient-to-r from-slate-900/80 via-slate-800/80 to-slate-900/80 backdrop-blur-sm flex-shrink-0">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-lime-400 to-lime-300 bg-clip-text text-transparent">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-full hover:bg-lime-500/20 transition-all duration-300 border border-lime-500/30"
              aria-label="Close modal"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-lime-300" />
            </button>
          </div>
        )}

        <div className="flex-1 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
