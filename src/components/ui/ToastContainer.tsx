import { useToastStore } from '@/stores/toast-store'
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const icons = {
  success: <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />,
  error: <AlertCircle size={16} className="text-destructive flex-shrink-0" />,
  info: <Info size={16} className="text-primary flex-shrink-0" />,
}

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-center gap-2 rounded-lg border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg animate-in slide-in-from-right duration-200',
          )}
        >
          {icons[toast.type]}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
