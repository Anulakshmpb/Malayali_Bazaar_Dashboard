import React, { useEffect } from "react";
import { X } from "lucide-react";

const SIZE_CLASSES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "2xl": "max-w-5xl",
};

/**
 * Accessible backdrop modal with Escape-key dismissal and structured header/body/footer slots.
 */
const Modal = ({
  open,
  onClose,
  title,
  subtitle,
  size = "lg",
  closeOnBackdrop = true,
  footer,
  children,
}) => {
  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : "Modal dialog"}
      onClick={() => {
        if (closeOnBackdrop && onClose) onClose();
      }}
    >
      <div
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-tertiary/30 bg-white shadow-2xl ${
          SIZE_CLASSES[size] || SIZE_CLASSES.lg
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
            <div className="min-w-0">
              {title && (
                <h2 className="font-jakarta text-lg font-bold text-gray-900">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
              )}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 bg-slate-50 px-6 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
