import { X } from 'lucide-react';
import { useAppStore } from '@/features/settings/store';
import { cn } from '@/shared/utils/cn';

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);
  const removeToast = useAppStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'rounded-lg border px-4 py-3 shadow-lg flex items-start gap-3',
            'bg-card text-card-foreground',
            toast.type === 'error' && 'border-destructive',
            toast.type === 'warning' && 'border-yellow-500',
          )}
        >
          <p className="flex-1 text-sm">{toast.message}</p>
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="text-sm font-medium text-primary underline"
            >
              {toast.action.label}
            </button>
          )}
          <button
            onClick={() => removeToast(toast.id)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
