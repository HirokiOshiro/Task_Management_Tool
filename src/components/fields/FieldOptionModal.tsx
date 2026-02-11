import { X } from 'lucide-react'
import type { FieldDefinition } from '@/types/task'
import { FieldOptionEditor } from './FieldOptionEditor'
import { useI18n, translateFieldName } from '@/i18n'

type Option = { id: string; label: string; color: string }

export function FieldOptionModal({
  field,
  onClose,
  onUpdateOptions,
}: {
  field: FieldDefinition | null
  onClose: () => void
  onUpdateOptions: (fieldId: string, options: Option[]) => void
}) {
  const { t } = useI18n()

  if (!field) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-popover text-popover-foreground rounded-lg shadow-xl w-full max-w-md mx-4 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-base font-semibold">{t.fieldManager.editOptions}</h3>
            <p className="text-xs text-muted-foreground">
              {translateFieldName(t, field.id, field.name)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-accent/50"
            title={t.common.close}
          >
            <X size={16} />
          </button>
        </div>
        <FieldOptionEditor field={field} onUpdateOptions={onUpdateOptions} showTitle={false} />
      </div>
    </div>
  )
}
