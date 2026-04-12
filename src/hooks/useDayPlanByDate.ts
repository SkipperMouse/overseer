import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { DayPlan, DayItem, TaskItem, Task, Block } from '../types'

interface RawDescRow {
  task_id: string
}

export function canMove(items: DayItem[], id: string, direction: 'up' | 'down'): boolean {
  const idx = items.findIndex(i => i.id === id)
  if (idx === -1) return false
  if (direction === 'up') {
    return items.slice(0, idx).some(i => i.type === 'task')
  }
  return items.slice(idx + 1).some(i => i.type === 'task')
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

      const swapIdx = direction === 'up'
        ? [...items.keys()].filter(i => i < idx && items[i].type === 'task').at(-1)
        : items.findIndex((item, i) => i > idx && item.type === 'task')

      if (swapIdx === undefined || swapIdx === -1) return prev
      ;[items[idx], items[swapIdx]] = [items[swapIdx], items[idx]]

      // Обновить block у обоих элементов по ближайшему предшествующему разделителю
      function inferBlock(pos: number): Block {
        for (let i = pos - 1; i >= 0; i--) {
          if (items[i].type === 'separator') return items[i].block
        }
        return 'morning'
      }
      if (items[idx].type === 'task') {
        items[idx] = { ...items[idx], block: inferBlock(idx) } as TaskItem
      }
      if (items[swapIdx].type === 'task') {
        items[swapIdx] = { ...items[swapIdx], block: inferBlock(swapIdx) } as TaskItem
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
