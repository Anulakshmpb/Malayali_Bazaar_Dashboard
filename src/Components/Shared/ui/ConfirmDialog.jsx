import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle, HelpCircle, X } from "lucide-react";

const ConfirmContext = createContext(null);

export const ConfirmDialog = ({
  open,
  title = "Confirm action",
  message = "Are you sure you want to proceed?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm animate-fadeIn"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 p-6">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              isDanger
                ? "bg-rose-50 text-rose-600"
                : "bg-primary/10 text-primary"
            }`}
          >
            {isDanger ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <HelpCircle className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3
              id="confirm-dialog-title"
              className="font-jakarta text-base font-bold text-gray-900"
            >
              {title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
              {message}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 bg-slate-50 px-6 py-3.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-primary hover:bg-secondary"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Provides imperative `confirm(options)` Promise hook replacing native `window.confirm`.
 */
export const ConfirmProvider = ({ children }) => {
  const [dialogState, setDialogState] = useState({ open: false });
  const resolverRef = useRef(null);

  const confirm = useCallback((options = {}) => {
    const normalized =
      typeof options === "string" ? { message: options } : options;
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialogState({
        open: true,
        title: normalized.title || "Confirm action",
        message: normalized.message || "Are you sure you want to continue?",
        confirmLabel: normalized.confirmLabel || "Confirm",
        cancelLabel: normalized.cancelLabel || "Cancel",
        variant: normalized.variant || "danger",
      });
    });
  }, []);

  const handleClose = useCallback((accepted) => {
    setDialogState((prev) => ({ ...prev, open: false }));
    if (resolverRef.current) {
      resolverRef.current(accepted);
      resolverRef.current = null;
    }
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        confirmLabel={dialogState.confirmLabel}
        cancelLabel={dialogState.cancelLabel}
        variant={dialogState.variant}
        onConfirm={() => handleClose(true)}
        onCancel={() => handleClose(false)}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
};
