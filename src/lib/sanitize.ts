import type { TaskDataSet, FieldDefinition, Task } from '@/types/task'
import type { ViewConfig } from '@/types/view'

/** ファイルサイズ上限: 50MB */
export const MAX_FILE_SIZE = 50 * 1024 * 1024

/** 安全なプロトコルのみ許可。javascript: 等を防御 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return url
    }
    return ''
  } catch {
    // 相対URLや不正な形式はそのまま空文字
    return ''
  }
}

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/
const SAFE_OBJECT_KEY_RE = /^[A-Za-z0-9_-]{1,64}$/
const UNSAFE_OBJECT_KEYS = new Set(['__proto__', 'prototype', 'constructor'])

export function isSafeObjectKey(key: string): boolean {
  return !UNSAFE_OBJECT_KEYS.has(key) && SAFE_OBJECT_KEY_RE.test(key)
}

/** #RGB / #RRGGBB / #RRGGBBAA 形式のみ許可 */
export function sanitizeColor(color: string, fallback = '#94a3b8'): string {
  if (typeof color === 'string' && HEX_COLOR_RE.test(color)) {
    return color
  }
  return fallback
}

/**
 * インポートデータの構造を検証。
 * 不正なら Error をスローする。
 */
export function validateTaskDataSet(data: unknown): TaskDataSet {
  if (data == null || typeof data !== 'object') {
    throw new Error('データが不正です: オブジェクトではありません')
  }

  const obj = data as Record<string, unknown>

  // version
  if (typeof obj.version !== 'string') {
    throw new Error('データが不正です: version が文字列ではありません')
  }

  // fields
  if (!Array.isArray(obj.fields)) {
    throw new Error('データが不正です: fields が配列ではありません')
  }
  const fields = obj.fields.map(validateFieldDefinition)
  const allowedFieldIds = new Set(fields.map((field) => field.id))

  // tasks
  if (!Array.isArray(obj.tasks)) {
    throw new Error('データが不正です: tasks が配列ではありません')
  }
  const tasks = obj.tasks.map((task) => validateTask(task, allowedFieldIds))

  // viewConfigs
  const viewConfigs = Array.isArray(obj.viewConfigs)
    ? obj.viewConfigs.filter(isValidViewConfig)
    : []

  // metadata
  const metadata = validateMetadata(obj.metadata)

  return { version: obj.version, fields, tasks, viewConfigs, metadata }
}

function validateFieldDefinition(raw: unknown): FieldDefinition {
  if (raw == null || typeof raw !== 'object') {
    throw new Error('データが不正です: フィールド定義がオブジェクトではありません')
  }
  const f = raw as Record<string, unknown>

  if (typeof f.id !== 'string' || typeof f.name !== 'string' || typeof f.type !== 'string') {
    throw new Error('データが不正です: フィールド定義に id/name/type がありません')
  }
  if (!isSafeObjectKey(f.id)) {
    throw new Error('データが不正です: フィールドIDに使用できない文字が含まれています')
  }

  // color のサニタイズ
  if (Array.isArray(f.options)) {
    f.options = (f.options as Record<string, unknown>[]).map((opt) => ({
      ...opt,
      color: typeof opt.color === 'string' ? sanitizeColor(opt.color) : '#94a3b8',
    }))
  }

  return raw as FieldDefinition
}

function validateTask(raw: unknown, allowedFieldIds: Set<string>): Task {
  if (raw == null || typeof raw !== 'object') {
    throw new Error('データが不正です: タスクがオブジェクトではありません')
  }
  const t = raw as Record<string, unknown>

  if (typeof t.id !== 'string') {
    throw new Error('データが不正です: タスクに id がありません')
  }
  if (t.fieldValues == null || typeof t.fieldValues !== 'object') {
    throw new Error('データが不正です: タスクに fieldValues がありません')
  }

  const rawFieldValues = t.fieldValues as Record<string, unknown>
  const sanitizedFieldValues: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(rawFieldValues)) {
    if (!isSafeObjectKey(key)) continue
    if (!allowedFieldIds.has(key)) continue
    sanitizedFieldValues[key] = value
  }

  return {
    id: t.id,
    fieldValues: sanitizedFieldValues,
    createdAt: typeof t.createdAt === 'string' ? t.createdAt : new Date().toISOString(),
    updatedAt: typeof t.updatedAt === 'string' ? t.updatedAt : new Date().toISOString(),
  }
}

function isValidViewConfig(raw: unknown): raw is ViewConfig {
  if (raw == null || typeof raw !== 'object') return false
  const v = raw as Record<string, unknown>
  return typeof v.id === 'string' && typeof v.type === 'string' && Array.isArray(v.sorts)
}

function validateMetadata(raw: unknown): TaskDataSet['metadata'] {
  if (raw != null && typeof raw === 'object') {
    const m = raw as Record<string, unknown>
    const source = ['local', 'sharepoint', 'memory'].includes(m.source as string)
      ? (m.source as TaskDataSet['metadata']['source'])
      : 'local'
    return {
      lastModified: typeof m.lastModified === 'string' ? m.lastModified : new Date().toISOString(),
      source,
    }
  }
  return { lastModified: new Date().toISOString(), source: 'local' }
}
