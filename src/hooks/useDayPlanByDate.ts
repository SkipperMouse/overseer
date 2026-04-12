import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { DayPlan, DayItem, TaskItem, Task, Block } from '../types'

interface RawDescRow {
  task_id: string
}

const BLOCKS: Block[] = ['morning', 'day', 'evening']
function nextBlock(b: Block): Block | null {
  const i = BLOCKS.indexOf(b); return i < BLOCKS.length - 1 ? BLOCKS[i + 1] : null
}
function prevBlock(b: Block): Block | null {
  const i = BLOCKS.indexOf(b); return i > 0 ? BLOCKS[i - 1] : null
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

  useEffect(() => {
    async function load() {
      setLoading(true)
      setPlan(null)
      setTaskDescIds(new Set())

      const { data, error } = await supabase
        .from('day_plans')
        .select('*')
        .eq('date', date)
        .maybeSingle()
      if (error) console.error(error)
      const planData = (data as DayPlan) ?? null
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
          setTaskDescIds(new Set(((descs ?? []) as RawDescRow[]).map(d => d.task_id)))
        }
      }
      setLoading(false)
    }
    load()
  }, [date])

  const persistItems = useCallback(async (planId: string, items: DayItem[]) => {
    const { error } = await supabase.from('day_plans').update({ items }).eq('id', planId)
    if (error) console.error(error)
  }, [])

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
          // Свап внутри блока
          ;[items[idx], items[prevInBlock]] = [items[prevInBlock], items[idx]]
        } else {
          const pb = prevBlock(block)
          if (!pb) return prev
          const lastInPrev = [...items.keys()]
            .filter(i => items[i].type === 'task' && items[i].block === pb)
            .at(-1)

          if (lastInPrev !== undefined) {
            // Свап с последней задачей предыдущего блока
            ;[items[idx], items[lastInPrev]] = [items[lastInPrev], items[idx]]
            const a = items[idx]; if (a.type === 'task') items[idx] = { ...a, block }
            const b = items[lastInPrev]; if (b.type === 'task') items[lastInPrev] = { ...b, block: pb }
          } else {
            // Предыдущий блок пуст — переносим перед разделителем текущего блока
            const curSepIdx = items.findIndex(i => i.type === 'separator' && i.block === block)
            if (curSepIdx === -1) return prev
            items.splice(idx, 1)
            const insertAt = idx < curSepIdx ? curSepIdx - 1 : curSepIdx
            items.splice(insertAt, 0, { ...item, block: pb })
          }
        }
      } else {
        const nextInBlock = items.findIndex(
          (it, i) => i > idx && it.type === 'task' && it.block === block
        )

        if (nextInBlock !== -1) {
          // Свап внутри блока
          ;[items[idx], items[nextInBlock]] = [items[nextInBlock], items[idx]]
        } else {
          const nb = nextBlock(block)
          if (!nb) return prev
          const firstInNext = items.findIndex(i => i.type === 'task' && i.block === nb)

          if (firstInNext !== -1) {
            // Свап с первой задачей следующего блока
            ;[items[idx], items[firstInNext]] = [items[firstInNext], items[idx]]
            const a = items[idx]; if (a.type === 'task') items[idx] = { ...a, block }
            const b = items[firstInNext]; if (b.type === 'task') items[firstInNext] = { ...b, block: nb }
          } else {
            // Следующий блок пуст — переносим сразу после его разделителя
            const nextSepIdx = items.findIndex(i => i.type === 'separator' && i.block === nb)
            if (nextSepIdx === -1) return prev
            items.splice(idx, 1)
            const adjustedSep = idx < nextSepIdx ? nextSepIdx - 1 : nextSepIdx
            items.splice(adjustedSep + 1, 0, { ...item, block: nb })
          }
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
      const blockTasks = prev.items.filter(i => i.type === 'task' && i.block === block)
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
      const items = [...prev.items]
      let insertIdx = items.length
      for (let i = items.length - 1; i >= 0; i--) {
        if (items[i].block === block) { insertIdx = i + 1; break }
      }
      items.splice(insertIdx, 0, newItem)
      const next = { ...prev, items }
      persistItems(prev.id, items)
      return next
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
      const blockTasks = prev.items.filter(i => i.type === 'task' && i.block === block)
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
      const items = [...prev.items]
      let insertIdx = items.length
      for (let i = items.length - 1; i >= 0; i--) {
        if (items[i].block === block) { insertIdx = i + 1; break }
      }
      items.splice(insertIdx, 0, newItem)
      const next = { ...prev, items }
      persistItems(prev.id, items)
      return next
    })
  }, [persistItems])

  return {
    plan,
    loading,
    taskDescIds,
    toggleItem,
    moveItem,
    saveNote,
    removeItem,
    addTaskItem,
    addOneOffTask,
  }
}
