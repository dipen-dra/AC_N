import React from "react";
import { AlertTriangle, LucideIcon } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: LucideIcon;
  variant?: "danger" | "warning" | "primary";
}

export function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  icon: Icon = AlertTriangle,
  variant = "danger",
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const colorMap = {
    danger: {
      bg: "bg-red-500/10 text-red-500",
      btn: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
    },
    warning: {
      bg: "bg-amber-500/10 text-amber-500",
      btn: "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500",
    },
    primary: {
      bg: "bg-primary/10 text-primary",
      btn: "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary",
    },
  };

  const style = colorMap[variant] || colorMap.primary;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-lg animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className={`rounded-full p-3 ${style.bg}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground leading-6">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 ${style.btn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
