import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { DayPlan, DayItem, TaskItem } from '../types'

function todayDate() {
  return new Date().toLocaleDateString('en-CA')
}

const DEFAULT_ITEMS: DayItem[] = [
  { id: crypto.randomUUID(), type: 'separator', label: '[ утро ]',   block: 'morning' },
  { id: crypto.randomUUID(), type: 'separator', label: '[ работа ]', block: 'day'     },
  { id: crypto.randomUUID(), type: 'separator', label: '[ вечер ]',  block: 'evening' },
]

export function canMove(items: DayItem[], id: string, direction: 'up' | 'down'): boolean {
  const idx = items.findIndex(i => i.id === id)
  if (idx === -1) return false
  const block = items[idx].block
  if (direction === 'up') {
    return items.slice(0, idx).some(i => i.block === block && i.type === 'task')
  }
  return items.slice(idx + 1).some(i => i.block === block && i.type === 'task')
}

export function useDayPlan() {
  const [plan, setPlan] = useState<DayPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('day_plans')
      .select('*')
      .eq('date', todayDate())
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error(error)
        setPlan((data as DayPlan) ?? null)
        setLoading(false)
      })
  }, [])

  const startEmpty = useCallback(async () => {
    const items: DayItem[] = DEFAULT_ITEMS.map(i => ({ ...i, id: crypto.randomUUID() }))
    const { data, error } = await supabase
      .from('day_plans')
      .insert({ date: todayDate(), items, note: '' })
      .select()
      .single()
    if (error) { console.error(error); return }
    setPlan(data as DayPlan)
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
      supabase.from('day_plans').update({ items: newItems }).eq('id', prev.id)
        .then(({ error }) => { if (error) console.error(error) })
      return next
    })
  }, [])

  const moveItem = useCallback((id: string, direction: 'up' | 'down') => {
    setPlan(prev => {
      if (!prev) return prev
      const items = [...prev.items]
      const idx = items.findIndex(i => i.id === id)
      if (idx === -1) return prev
      const block = items[idx].block

      const swapIdx = direction === 'up'
        ? [...items.keys()].filter(i => i < idx && items[i].block === block && items[i].type === 'task').at(-1)
        : items.findIndex((item, i) => i > idx && item.block === block && item.type === 'task')

      if (swapIdx === undefined || swapIdx === -1) return prev
      ;[items[idx], items[swapIdx]] = [items[swapIdx], items[idx]]

      const next = { ...prev, items }
      supabase.from('day_plans').update({ items }).eq('id', prev.id)
        .then(({ error }) => { if (error) console.error(error) })
      return next
    })
  }, [])

  const saveNote = useCallback((note: string) => {
    setPlan(prev => {
      if (!prev) return prev
      const next = { ...prev, note }
      supabase.from('day_plans').update({ note }).eq('id', prev.id)
        .then(({ error }) => { if (error) console.error(error) })
      return next
    })
  }, [])

  return { plan, loading, startEmpty, toggleItem, moveItem, saveNote }
}
