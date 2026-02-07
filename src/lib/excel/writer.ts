import * as XLSX from 'xlsx'
import type { TaskDataSet, FieldDefinition } from '@/types/task'

/** TaskDataSetをExcelファイル(Uint8Array)に変換 */
export function writeExcel(dataSet: TaskDataSet): Uint8Array {
  const workbook = XLSX.utils.book_new()

  // フィールドを表示順でソート
  const sortedFields = [...dataSet.fields].sort((a, b) => a.order - b.order)

  // === Sheet 1: Tasks ===
  const headers = sortedFields.map((f) => f.name)
  const rows: unknown[][] = [headers]

  for (const task of dataSet.tasks) {
    const row = sortedFields.map((field) => formatValue(task.fieldValues[field.id], field))
    rows.push(row)
  }

  const tasksSheet = XLSX.utils.aoa_to_sheet(rows)

  // カラム幅を設定
  tasksSheet['!cols'] = sortedFields.map((f) => ({
    wch: Math.max((f.width ?? 150) / 8, f.name.length * 2 + 2),
  }))

  XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Tasks')

  // === Sheet 2: _FieldDefs (非表示) ===
  const fieldDefsSheet = XLSX.utils.aoa_to_sheet([[JSON.stringify(dataSet.fields)]])
  XLSX.utils.book_append_sheet(workbook, fieldDefsSheet, '_FieldDefs')

  // === Sheet 3: _ViewConfigs (非表示) ===
  const viewConfigsSheet = XLSX.utils.aoa_to_sheet([[JSON.stringify(dataSet.viewConfigs)]])
  XLSX.utils.book_append_sheet(workbook, viewConfigsSheet, '_ViewConfigs')

  // メタデータシートを非表示に設定
  workbook.Workbook = workbook.Workbook ?? {}
  workbook.Workbook.Sheets = workbook.Workbook.Sheets ?? []
  // Sheet indexは0始まり: 0=Tasks, 1=_FieldDefs, 2=_ViewConfigs
  workbook.Workbook.Sheets[1] = { Hidden: 1 }
  workbook.Workbook.Sheets[2] = { Hidden: 1 }

  const output = XLSX.write(workbook, {
    type: 'array',
    bookType: 'xlsx',
    compression: true,
  })

  return new Uint8Array(output as ArrayBuffer) as Uint8Array<ArrayBuffer>
}

/** フィールド値をExcelセルに適した形式に変換 */
function formatValue(value: unknown, field: FieldDefinition): unknown {
  if (value == null) return ''

  switch (field.type) {
    case 'select': {
      const option = field.options?.find((o) => o.id === value)
      return option?.label ?? String(value)
    }
    case 'multi_select': {
      if (Array.isArray(value)) return value.join(', ')
      return String(value)
    }
    case 'checkbox':
      return value ? 'Yes' : 'No'
    case 'progress':
      return Number(value) || 0
    case 'number':
      return Number(value) || 0
    case 'date':
      return value ? String(value) : ''
    default:
      return String(value)
  }
}
