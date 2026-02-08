import * as XLSX from 'xlsx'
import type { TaskDataSet, FieldDefinition, Task } from '@/types/task'
import { createDefaultFields } from '@/types/task'
import { generateId } from '@/lib/id'
import type { ViewConfig } from '@/types/view'
import { sanitizeColor } from '@/lib/sanitize'

/** Excelファイル(ArrayBuffer)からTaskDataSetに変換 */
export function parseExcel(data: ArrayBuffer): TaskDataSet {
  const workbook = XLSX.read(data, { type: 'array', cellDates: true })

  // フィールド定義の復元を試みる
  let fields: FieldDefinition[] | null = null
  let viewConfigs: ViewConfig[] = []

  // _FieldDefs シートからフィールド定義を読み込み
  if (workbook.SheetNames.includes('_FieldDefs')) {
    const sheet = workbook.Sheets['_FieldDefs']
    const json = sheet['A1']?.v
    if (typeof json === 'string') {
      try {
        const parsed = JSON.parse(json)
        if (Array.isArray(parsed) && parsed.every(isValidFieldDef)) {
          // オプションのカラー値をサニタイズ
          fields = parsed.map((f: FieldDefinition) => ({
            ...f,
            options: f.options?.map((o) => ({ ...o, color: sanitizeColor(o.color) })),
          }))
        }
      } catch {
        // パース失敗時はnullのまま
      }
    }
  }

  // _ViewConfigs シートからビュー設定を読み込み
  if (workbook.SheetNames.includes('_ViewConfigs')) {
    const sheet = workbook.Sheets['_ViewConfigs']
    const json = sheet['A1']?.v
    if (typeof json === 'string') {
      try {
        const parsed = JSON.parse(json)
        if (Array.isArray(parsed)) {
          viewConfigs = parsed.filter(isValidViewConfig)
        }
      } catch {
        // パース失敗時は空配列
      }
    }
  }

  // メインデータシート（最初のシートまたは "Tasks" シート）
  const mainSheetName = workbook.SheetNames.includes('Tasks')
    ? 'Tasks'
    : workbook.SheetNames.find((n) => !n.startsWith('_')) ?? workbook.SheetNames[0]
  const mainSheet = workbook.Sheets[mainSheetName]

  if (!mainSheet) {
    return {
      version: '1.0.0',
      fields: fields ?? createDefaultFields(),
      tasks: [],
      viewConfigs,
      metadata: { lastModified: new Date().toISOString(), source: 'local' },
    }
  }

  // 2次元配列に変換
  const rows: unknown[][] = XLSX.utils.sheet_to_json(mainSheet, {
    header: 1,
    raw: false,
    dateNF: 'yyyy-mm-dd',
  })

  if (rows.length === 0) {
    return {
      version: '1.0.0',
      fields: fields ?? createDefaultFields(),
      tasks: [],
      viewConfigs,
      metadata: { lastModified: new Date().toISOString(), source: 'local' },
    }
  }

  // ヘッダー行
  const headers = (rows[0] as string[]).map((h) => String(h ?? '').trim())

  // フィールド定義がなければヘッダーから推論
  if (!fields) {
    fields = inferFieldsFromHeaders(headers, rows.slice(1))
  }

  // ヘッダー名からフィールドIDへのマッピング
  const headerToFieldId = new Map<number, string>()
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i]
    const field = fields.find((f) => f.name === header)
    if (field) {
      headerToFieldId.set(i, field.id)
    }
  }

  // タスクの構築
  const tasks: Task[] = []
  for (let rowIdx = 1; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx] as unknown[]
    if (!row || row.every((c) => c == null || c === '')) continue

    const fieldValues: Record<string, unknown> = {}
    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      const fieldId = headerToFieldId.get(colIdx)
      if (!fieldId) continue
      const field = fields.find((f) => f.id === fieldId)
      if (!field) continue
      fieldValues[fieldId] = parseValue(row[colIdx], field)
    }

    tasks.push({
      id: generateId(),
      fieldValues,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  return {
    version: '1.0.0',
    fields,
    tasks,
    viewConfigs,
    metadata: { lastModified: new Date().toISOString(), source: 'local' },
  }
}

/** ヘッダーとデータからフィールド定義を推論 */
function inferFieldsFromHeaders(
  headers: string[],
  dataRows: unknown[][]
): FieldDefinition[] {
  // 既知のフィールド名パターン
  const knownFields: Record<string, { id: string; type: FieldDefinition['type'] }> = {
    'タイトル': { id: 'title', type: 'text' },
    'Title': { id: 'title', type: 'text' },
    'ステータス': { id: 'status', type: 'select' },
    'Status': { id: 'status', type: 'select' },
    '担当者': { id: 'assignee', type: 'person' },
    'Assignee': { id: 'assignee', type: 'person' },
    '期限': { id: 'due_date', type: 'date' },
    'Due Date': { id: 'due_date', type: 'date' },
    '優先度': { id: 'priority', type: 'select' },
    'Priority': { id: 'priority', type: 'select' },
    '説明': { id: 'description', type: 'text' },
    'Description': { id: 'description', type: 'text' },
    'タグ': { id: 'tags', type: 'multi_select' },
    'Tags': { id: 'tags', type: 'multi_select' },
    '進捗': { id: 'progress', type: 'progress' },
    'Progress': { id: 'progress', type: 'progress' },
    '開始日': { id: 'start_date', type: 'date' },
    'Start Date': { id: 'start_date', type: 'date' },
    '業務': { id: 'category', type: 'select' },
    'Category': { id: 'category', type: 'select' },
  }

  const defaults = createDefaultFields()

  return headers.map((header, index) => {
    const known = knownFields[header]
    if (known) {
      const defaultField = defaults.find((f) => f.id === known.id)
      if (defaultField) {
        return { ...defaultField, order: index, visible: true }
      }
      return {
        id: known.id,
        name: header,
        type: known.type,
        required: known.id === 'title',
        order: index,
        width: 150,
        visible: true,
        isSystem: false,
      }
    }

    // 型推論
    const sampleValues = dataRows
      .slice(0, 20)
      .map((row) => row[index])
      .filter((v) => v != null && v !== '')

    return {
      id: `field_${generateId()}`,
      name: header,
      type: inferType(sampleValues),
      required: false,
      order: index,
      width: 150,
      visible: true,
      isSystem: false,
    }
  })
}

/** セル値の集合から型を推論 */
function inferType(values: unknown[]): FieldDefinition['type'] {
  if (values.length === 0) return 'text'

  const allNumbers = values.every((v) => !isNaN(Number(v)))
  if (allNumbers) {
    // パーセント値かチェック
    const allPercent = values.every((v) => {
      const n = Number(v)
      return n >= 0 && n <= 100
    })
    if (allPercent && values.length >= 3) return 'progress'
    return 'number'
  }

  const allDates = values.every((v) => {
    const s = String(v)
    return /^\d{4}-\d{2}-\d{2}/.test(s) || !isNaN(Date.parse(s))
  })
  if (allDates) return 'date'

  const allBool = values.every((v) => {
    const s = String(v).toLowerCase()
    return ['true', 'false', 'yes', 'no', 'はい', 'いいえ', 'done', 'not done'].includes(s)
  })
  if (allBool) return 'checkbox'

  const hasComma = values.some((v) => String(v).includes(','))
  if (hasComma) return 'multi_select'

  const allUrl = values.every((v) => /^https?:\/\//.test(String(v)))
  if (allUrl) return 'url'

  return 'text'
}

/** _FieldDefs の各要素が最低限の構造を持っているか検証 */
function isValidFieldDef(raw: unknown): raw is FieldDefinition {
  if (raw == null || typeof raw !== 'object') return false
  const f = raw as Record<string, unknown>
  return typeof f.id === 'string' && typeof f.name === 'string' && typeof f.type === 'string'
}

/** _ViewConfigs の各要素が最低限の構造を持っているか検証 */
function isValidViewConfig(raw: unknown): raw is ViewConfig {
  if (raw == null || typeof raw !== 'object') return false
  const v = raw as Record<string, unknown>
  return typeof v.id === 'string' && typeof v.type === 'string' && Array.isArray(v.sorts)
}

/** セル値をフィールド型に変換 */
function parseValue(raw: unknown, field: FieldDefinition): unknown {
  if (raw == null || raw === '') return undefined

  switch (field.type) {
    case 'number':
    case 'progress':
      return Number(raw) || 0
    case 'checkbox': {
      const s = String(raw).toLowerCase()
      return ['true', 'yes', 'はい', 'done', '1'].includes(s)
    }
    case 'multi_select':
      return String(raw)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    case 'date':
      if (raw instanceof Date) return raw.toISOString().split('T')[0]
      return String(raw)
    case 'select':
      // オプションIDとして返す（マッチしなければラベルとして扱う）
      if (field.options?.some((o) => o.id === raw)) return raw
      if (field.options?.some((o) => o.label === raw)) {
        return field.options.find((o) => o.label === raw)!.id
      }
      return String(raw)
    default:
      return String(raw)
  }
}
