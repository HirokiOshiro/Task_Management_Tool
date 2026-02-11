import type { Task } from '@/types/task'
import { SYSTEM_FIELD_IDS } from '@/types/task'

export interface DependencyEdge {
  from: string // 先行タスクID
  to: string   // 後続タスクID
}

/** タスクの依存関係ID配列を安全に取得 */
export function getDependencies(task: Task): string[] {
  const value = task.fieldValues[SYSTEM_FIELD_IDS.DEPENDENCIES]
  if (Array.isArray(value)) {
    return (value as string[]).filter(id => typeof id === 'string' && id.length > 0)
  }
  return []
}

/** 全タスクの依存グラフ構築 */
export function buildDependencyGraph(tasks: Task[]): Map<string, string[]> {
  const graph = new Map<string, string[]>()
  for (const task of tasks) {
    graph.set(task.id, getDependencies(task))
  }
  return graph
}

/**
 * 循環依存の検出（DFS）
 * from → to のエッジを追加した場合に循環が発生するかチェック
 * 「to から辿って from に到達できるか」を探索
 */
export function wouldCreateCycle(
  graph: Map<string, string[]>,
  from: string,
  to: string,
): boolean {
  if (from === to) return true
  const visited = new Set<string>()
  const stack = [from]
  while (stack.length > 0) {
    const current = stack.pop()!
    if (current === to) return true
    if (visited.has(current)) continue
    visited.add(current)
    const deps = graph.get(current) ?? []
    for (const dep of deps) {
      if (!visited.has(dep)) stack.push(dep)
    }
  }
  return false
}

/** 全タスクから依存関係エッジを抽出（ガント矢印描画用） */
export function getAllDependencyEdges(tasks: Task[]): DependencyEdge[] {
  const taskIds = new Set(tasks.map(t => t.id))
  const edges: DependencyEdge[] = []
  for (const task of tasks) {
    const deps = getDependencies(task)
    for (const depId of deps) {
      // 存在するタスクへの依存のみ
      if (taskIds.has(depId)) {
        edges.push({ from: depId, to: task.id })
      }
    }
  }
  return edges
}
