import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Template, TemplateItem, Task, Block } from '../types'

interface RawTemplateRow {
  id: string
  name: string
  created_at: string
}

interface RawTemplateItemRow {
  id: string
  template_id: string
  task_id: string | null
  type: 'task' | 'separator'
  separator_label: string | null
  block: Block
  position: number
}

interface RawTaskRow {
  id: string
  title: string
  duration: string | null
  icon: string | null
  created_at: string
}

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('templates')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error(error)
        setTemplates((data ?? []) as RawTemplateRow[])
        setLoading(false)
      })
  }, [])

  const createTemplate = useCallback(async (name: string): Promise<Template | null> => {
    const tempId = crypto.randomUUID()
    const optimistic: Template = { id: tempId, name, created_at: new Date().toISOString() }
    setTemplates(prev => [...prev, optimistic])

    const { data, error } = await supabase
      .from('templates')
      .insert({ name })
      .select()
      .single()

    if (error) {
      console.error(error)
      setTemplates(prev => prev.filter(t => t.id !== tempId))
      return null
    }
    const row = data as RawTemplateRow
    setTemplates(prev => prev.map(t => t.id === tempId ? row : t))
    return row
  }, [])

  const deleteTemplate = useCallback(async (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id))
    const { error } = await supabase.from('templates').delete().eq('id', id)
    if (error) console.error(error)
  }, [])

  return { templates, loading, createTemplate, deleteTemplate }
}

export function useTemplateItems(templateId: string) {
  const [items, setItems] = useState<TemplateItem[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase
        .from('template_items')
        .select('*')
        .eq('template_id', templateId)
        .order('position', { ascending: true }),
      supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true }),
    ]).then(([itemsRes, tasksRes]) => {
      if (itemsRes.error) console.error(itemsRes.error)
      if (tasksRes.error) console.error(tasksRes.error)

      const taskMap = new Map(
        ((tasksRes.data ?? []) as RawTaskRow[]).map(raw => [raw.id, {
          id: raw.id,
          title: raw.title,
          duration: raw.duration ?? undefined,
          icon: raw.icon ?? undefined,
          created_at: raw.created_at,
        } as Task])
      )
      setTasks([...taskMap.values()])

      setItems(
        ((itemsRes.data ?? []) as RawTemplateItemRow[]).map(raw => ({
          id: raw.id,
          template_id: raw.template_id,
          task_id: raw.task_id ?? undefined,
          type: raw.type,
          separator_label: raw.separator_label ?? undefined,
          block: raw.block,
          position: raw.position,
          task: raw.task_id ? taskMap.get(raw.task_id) : undefined,
        }))
      )
      setLoading(false)
    })
  }, [templateId])

  const addTaskItem = useCallback(async (block: Block, taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const blockItems = items.filter(i => i.block === block)
    const position = blockItems.length > 0
      ? Math.max(...blockItems.map(i => i.position)) + 1
      : 0

    const tempId = crypto.randomUUID()
    const optimistic: TemplateItem = {
      id: tempId,
      template_id: templateId,
      task_id: taskId,
      type: 'task',
      block,
      position,
      task,
    }
    setItems(prev => [...prev, optimistic])

    const { data, error } = await supabase
      .from('template_items')
      .insert({ template_id: templateId, task_id: taskId, type: 'task', block, position })
      .select()
      .single()

    if (error) {
      console.error(error)
      setItems(prev => prev.filter(i => i.id !== tempId))
      return
    }
    const row = data as RawTemplateItemRow
    setItems(prev => prev.map(i => i.id === tempId ? { ...optimistic, id: row.id } : i))
  }, [items, tasks, templateId])

  const addSeparator = useCallback(async (block: Block, label: string) => {
    const blockItems = items.filter(i => i.block === block)
    const position = blockItems.length > 0
      ? Math.max(...blockItems.map(i => i.position)) + 1
      : 0

    const tempId = crypto.randomUUID()
    const optimistic: TemplateItem = {
      id: tempId,
      template_id: templateId,
      type: 'separator',
      separator_label: label,
      block,
      position,
    }
    setItems(prev => [...prev, optimistic])

    const { data, error } = await supabase
      .from('template_items')
      .insert({ template_id: templateId, type: 'separator', separator_label: label, block, position })
      .select()
      .single()

    if (error) {
      console.error(error)
      setItems(prev => prev.filter(i => i.id !== tempId))
      return
    }
    const row = data as RawTemplateItemRow
    setItems(prev => prev.map(i => i.id === tempId ? { ...optimistic, id: row.id } : i))
  }, [items, templateId])

  const deleteItem = useCallback(async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
    const { error } = await supabase.from('template_items').delete().eq('id', id)
    if (error) console.error(error)
  }, [])

  // Ref to always access latest items inside async callbacks
  const itemsRef = useRef(items)
  itemsRef.current = items

  const moveCrossBlockLocal = useCallback((activeId: string, overId: string) => {
    setItems(prev => {
      const activeItem = prev.find(i => i.id === activeId)
      const overItem = prev.find(i => i.id === overId)
      if (!activeItem || !overItem || activeItem.block === overItem.block) return prev
      // Place active before over using a fractional position (normalized on dragEnd)
      return prev.map(i =>
        i.id === activeId ? { ...i, block: overItem.block, position: overItem.position - 0.5 } : i
      )
    })
  }, [])

  const moveCrossBlock = useCallback(async (activeId: string, overId: string) => {
    setItems(prev => {
      const activeItem = prev.find(i => i.id === activeId)
      const overItem = prev.find(i => i.id === overId)
      if (!activeItem || !overItem) return prev
      const targetBlock = overItem.block
      const targetItems = prev
        .filter(i => i.block === targetBlock && i.id !== activeId)
        .sort((a, b) => a.position - b.position)
      const overIdx = targetItems.findIndex(i => i.id === overId)
      const insertAt = overIdx >= 0 ? overIdx : targetItems.length
      targetItems.splice(insertAt, 0, { ...activeItem, block: targetBlock })
      const posMap = new Map(targetItems.map((item, idx) => [item.id, idx]))
      ;(async () => {
        await Promise.all(
          targetItems.map((item, idx) =>
            supabase.from('template_items').update({ block: targetBlock, position: idx }).eq('id', item.id)
          )
        )
      })()
      return prev.map(i => posMap.has(i.id) ? { ...i, block: targetBlock, position: posMap.get(i.id)! } : i)
    })
  }, [])

  const reorderBlock = useCallback(async (_block: Block, orderedIds: string[]) => {
    const posMap = new Map(orderedIds.map((id, idx) => [id, idx]))
    setItems(prev => prev.map(item =>
      posMap.has(item.id) ? { ...item, position: posMap.get(item.id)! } : item
    ))
    await Promise.all(
      orderedIds.map((id, idx) =>
        supabase.from('template_items').update({ position: idx }).eq('id', id)
      )
    )
  }, [])

  const moveItem = useCallback(async (id: string, dir: 'up' | 'down') => {
    const item = items.find(i => i.id === id)
    if (!item) return

    const blockItems = items
      .filter(i => i.block === item.block)
      .sort((a, b) => a.position - b.position)

    const idx = blockItems.findIndex(i => i.id === id)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= blockItems.length) return

    const other = blockItems[swapIdx]
    const newPos = other.position
    const oldPos = item.position

    setItems(prev => prev.map(i => {
      if (i.id === id) return { ...i, position: newPos }
      if (i.id === other.id) return { ...i, position: oldPos }
      return i
    }))

    await Promise.all([
      supabase.from('template_items').update({ position: newPos }).eq('id', id),
      supabase.from('template_items').update({ position: oldPos }).eq('id', other.id),
    ])
  }, [items])

  return { items, tasks, loading, addTaskItem, addSeparator, deleteItem, moveItem, reorderBlock, moveCrossBlockLocal, moveCrossBlock }
}
