import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { BLOCKS } from '../lib/blocks'
import type { DayPlan, DayItem, TaskItem, Task, Block } from '../types'

interface RawDescRow {
  task_id: string
}

function nextBlock(b: Block): Block | null {
  const i = BLOCKS.indexOf(b); return i < BLOCKS.length - 1 ? BLOCKS[i + 1] : null
}
function prevBlock(b: Block): Block | null {
  const i = BLOCKS.indexOf(b); return i > 0 ? BLOCKS[i - 1] : null
}

function deriveBlock(items: DayItem[], idx: number): Block {
  for (let i = idx - 1; i >= 0; i--) {
    if (items[i].type === 'separator') return items[i].block
  }
  return 'morning'
}

function normalizeItems(items: DayItem[]): DayItem[] {
  return items.map((item, idx) =>
    item.type === 'task' ? { ...item, block: deriveBlock(items, idx) } : item
  )
}

export function canMove(items: DayItem[], id: string, direction: 'up' | 'down'): boolean {
  const idx = items.findIndex(i => i.id === id)
  if (idx === -1) return false
  const block = items[idx].block
  if (direction === 'up') {
    const hasPrev = items.slice(0, idx).some(i => i.type === 'task' && i.block === block)
    return hasPrev || prevBlock(block) !== null
  }
  const hasNext = items.slice(idx + 1).some(i => i.type === 'task' && i.block === block)
  return hasNext || nextBlock(block) !== null
}

export function useDayPlanByDate(date: string) {
  const [plan, setPlan] = useState<DayPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [taskDescIds, setTaskDescIds] = useState<Set<string>>(new Set())
  const [writeConflict, setWriteConflict] = useState(false)

  // Tracks the updated_at we last read/wrote — used for CAS on persistItems
  const updatedAtRef = useRef<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingPersistRef = useRef<{ planId: string; items: DayItem[] } | null>(null)

  const loadPlan = useCallback(async (signal: { cancelled: boolean }) => {
    setLoading(true)
    setPlan(null)
    setTaskDescIds(new Set())
    setWriteConflict(false)
    updatedAtRef.current = null

    const { data, error } = await supabase
      .from('day_plans')
      .select('*')
      .eq('date', date)
      .maybeSingle()
    if (signal.cancelled) return
    if (error) console.error(error)
    const planData = (data as DayPlan) ?? null
    if (planData) updatedAtRef.current = planData.updated_at
    setPlan(planData)

    if (planData) {
      const taskIds = planData.items
        .filter((i): i is TaskItem => i.type === 'task' && !!i.task_id)
        .map(i => i.task_id as string)
      if (taskIds.length > 0) {
        const { data: descs } = await supabase
          .from('task_descriptions')
          .select('task_id')
          .in('task_id', taskIds)
        if (signal.cancelled) return
        setTaskDescIds(new Set(((descs ?? []) as RawDescRow[]).map(d => d.task_id)))
      }
    }
    if (!signal.cancelled) setLoading(false)
  }, [date])

  useEffect(() => {
    const signal = { cancelled: false }
    loadPlan(signal)
    return () => { signal.cancelled = true }
  }, [loadPlan])

  const persistItems = useCallback((planId: string, items: DayItem[]) => {
    pendingPersistRef.current = { planId, items }
    if (debounceRef.current !== null) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      debounceRef.current = null
      pendingPersistRef.current = null

      const knownAt = updatedAtRef.current
      // CAS: match updated_at to detect concurrent writes from other devices
      const query = supabase.from('day_plans').update({ items }).eq('id', planId)
      const { data, error } = knownAt !== null
        ? await query.eq('updated_at', knownAt).select('updated_at').maybeSingle()
        : await query.select('updated_at').maybeSingle()

      if (error) { console.error(error); return }

      if (data === null && knownAt !== null) {
        // 0 rows matched: remote write happened since our last read — reload
        console.warn('Write conflict detected on day_plans, reloading')
        pendingPersistRef.current = null
        loadPlan({ cancelled: false })
        setWriteConflict(true)
      } else if (data) {
        updatedAtRef.current = (data as { updated_at: string }).updated_at
      }
    }, 300)
  }, [loadPlan])

  // Flush any pending debounced write when date changes or component unmounts
  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      if (pendingPersistRef.current !== null) {
        const { planId, items } = pendingPersistRef.current
        pendingPersistRef.current = null
        supabase.from('day_plans').update({ items }).eq('id', planId)
          .then(({ error }) => { if (error) console.error(error) })
      }
    }
  }, [date])

  const toggleItem = useCallback((id: string) => {
    setPlan(prev => {
      if (!prev) return prev
      const newItems = prev.items.map((item): DayItem =>
        item.id === id && item.type === 'task'
          ? { ...(item as TaskItem), checked: !(item as TaskItem).checked }
          : item
      )
      const next = { ...prev, items: newItems }
      persistItems(prev.id, newItems)
      return next
    })
  }, [persistItems])

  const reorderItems = useCallback((orderedIds: string[]) => {
    setPlan(prev => {
      if (!prev) return prev
      const itemMap = new Map(prev.items.map(i => [i.id, i]))
      const reordered = orderedIds.map(id => itemMap.get(id)).filter((i): i is DayItem => !!i)
      const normalized = normalizeItems(reordered)
      persistItems(prev.id, normalized)
      return { ...prev, items: normalized }
    })
  }, [persistItems])

  const moveItem = useCallback((id: string, direction: 'up' | 'down') => {
    setPlan(prev => {
      if (!prev) return prev
      const items = [...prev.items]
      const idx = items.findIndex(i => i.id === id)
      if (idx === -1) return prev
      const item = items[idx]
      if (item.type !== 'task') return prev
      const block = item.block

      if (direction === 'up') {
        const prevInBlock = [...items.keys()]
          .filter(i => i < idx && items[i].type === 'task' && items[i].block === block)
          .at(-1)

        if (prevInBlock !== undefined) {
          ;[items[idx], items[prevInBlock]] = [items[prevInBlock], items[idx]]
        } else {
          const pb = prevBlock(block)
          if (!pb) return prev
          const curSepIdx = items.findIndex(i => i.type === 'separator' && i.block === block)
          if (curSepIdx === -1) return prev
          items.splice(idx, 1)
          const insertAt = idx < curSepIdx ? curSepIdx - 1 : curSepIdx
          items.splice(insertAt, 0, { ...item, block: pb })
        }
      } else {
        const nextInBlock = items.findIndex(
          (it, i) => i > idx && it.type === 'task' && it.block === block
        )

        if (nextInBlock !== -1) {
          ;[items[idx], items[nextInBlock]] = [items[nextInBlock], items[idx]]
        } else {
          const nb = nextBlock(block)
          if (!nb) return prev
          const nextSepIdx = items.findIndex(i => i.type === 'separator' && i.block === nb)
          if (nextSepIdx === -1) return prev
          items.splice(idx, 1)
          const adjustedSep = idx < nextSepIdx ? nextSepIdx - 1 : nextSepIdx
          items.splice(adjustedSep + 1, 0, { ...item, block: nb })
        }
      }

      const next = { ...prev, items }
      persistItems(prev.id, items)
      return next
    })
  }, [persistItems])

  const saveNote = useCallback((note: string) => {
    setPlan(prev => {
      if (!prev) return prev
      const next = { ...prev, note }
      supabase.from('day_plans').update({ note }).eq('id', prev.id)
        .then(({ error }) => { if (error) console.error(error) })
      return next
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setPlan(prev => {
      if (!prev) return prev
      const newItems = prev.items.filter(i => i.id !== id)
      const next = { ...prev, items: newItems }
      persistItems(prev.id, newItems)
      return next
    })
  }, [persistItems])

  const addTaskItem = useCallback((task: Task, block: Block) => {
    setPlan(prev => {
      if (!prev) return prev
      const items = [...prev.items]
      const sepIdx = items.findIndex(i => i.type === 'separator' && i.block === block)
      const nextSepIdx = sepIdx === -1
        ? -1
        : items.findIndex((i, idx) => idx > sepIdx && i.type === 'separator')
      const insertIdx = nextSepIdx === -1 ? items.length : nextSepIdx
      const blockTasks = items.filter(i => i.type === 'task' && i.block === block)
      const newItem: TaskItem = {
        id: crypto.randomUUID(),
        type: 'task',
        task_id: task.id,
        title: task.title,
        duration: task.duration,
        icon: task.icon,
        block,
        time: null,
        checked: false,
        position: blockTasks.length,
      }
      items.splice(insertIdx, 0, newItem)
      persistItems(prev.id, items)
      return { ...prev, items }
    })
  }, [persistItems])

  const addOneOffTask = useCallback((
    title: string,
    block: Block,
    duration?: string,
    icon?: string,
  ) => {
    setPlan(prev => {
      if (!prev) return prev
      const items = [...prev.items]
      const sepIdx = items.findIndex(i => i.type === 'separator' && i.block === block)
      const nextSepIdx = sepIdx === -1
        ? -1
        : items.findIndex((i, idx) => idx > sepIdx && i.type === 'separator')
      const insertIdx = nextSepIdx === -1 ? items.length : nextSepIdx
      const blockTasks = items.filter(i => i.type === 'task' && i.block === block)
      const newItem: TaskItem = {
        id: crypto.randomUUID(),
        type: 'task',
        task_id: null,
        title,
        duration,
        icon,
        block,
        time: null,
        checked: false,
        position: blockTasks.length,
      }
      items.splice(insertIdx, 0, newItem)
      persistItems(prev.id, items)
      return { ...prev, items }
    })
  }, [persistItems])

  return {
    plan,
    loading,
    taskDescIds,
    writeConflict,
    toggleItem,
    moveItem,
    reorderItems,
    saveNote,
    removeItem,
    addTaskItem,
    addOneOffTask,
  }
}
