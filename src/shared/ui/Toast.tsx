import { useAppStore } from '@/features/settings/store';
import { cn } from '@/shared/utils/cn';

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);
  const removeToast = useAppStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-12 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'border border-border px-4 py-3 flex items-start gap-3',
            'bg-card text-card-foreground',
            toast.type === 'error' && 'border-destructive',
            toast.type === 'warning' && 'border-accent',
          )}
        >
          <span className="text-xs shrink-0">
            {toast.type === 'error' ? '[!]' : toast.type === 'warning' ? '[?]' : '[i]'}
          </span>
          <p className="flex-1 text-xs">{toast.message}</p>
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="text-xs text-accent underline"
            >
              {toast.action.label}
            </button>
          )}
          <button
            onClick={() => removeToast(toast.id)}
            className="text-muted-foreground hover:text-accent text-xs"
          >
            [X]
          </button>
        </div>
      ))}
    </div>
  );
}
