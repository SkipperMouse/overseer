import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Task, TaskDescription } from '../types'

interface RawTaskRow {
  id: string
  title: string
  duration: string | null
  icon: string | null
  created_at: string
  task_descriptions: TaskDescription[] | null
}

function toTask(raw: RawTaskRow): Task {
  return {
    id: raw.id,
    title: raw.title,
    duration: raw.duration ?? undefined,
    icon: raw.icon ?? undefined,
    created_at: raw.created_at,
    description: raw.task_descriptions?.[0] ?? undefined,
  }
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('tasks')
      .select('*, task_descriptions(*)')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error(error)
        setTasks((data as RawTaskRow[] ?? []).map(toTask))
        setLoading(false)
      })
  }, [])

  const createTask = useCallback(async (
    title: string,
    duration?: string,
    icon?: string,
  ) => {
    const tempId = crypto.randomUUID()
    const optimistic: Task = { id: tempId, title, duration, icon, created_at: new Date().toISOString() }
    setTasks(prev => [...prev, optimistic])

    const { data, error } = await supabase
      .from('tasks')
      .insert({ title, duration: duration ?? null, icon: icon ?? null })
      .select('*, task_descriptions(*)')
      .single()

    if (error) {
      console.error(error)
      setTasks(prev => prev.filter(t => t.id !== tempId))
      return
    }
    setTasks(prev => prev.map(t => t.id === tempId ? toTask(data as RawTaskRow) : t))
  }, [])

  const updateTask = useCallback(async (
    id: string,
    patch: Partial<Pick<Task, 'title' | 'duration' | 'icon'>>,
  ) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
    const { error } = await supabase
      .from('tasks')
      .update({
        ...(patch.title !== undefined ? { title: patch.title } : {}),
        ...(patch.duration !== undefined ? { duration: patch.duration ?? null } : {}),
        ...(patch.icon !== undefined ? { icon: patch.icon ?? null } : {}),
      })
      .eq('id', id)
    if (error) console.error(error)
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) console.error(error)
  }, [])

  const createDescription = useCallback(async (taskId: string): Promise<TaskDescription | null> => {
    const { data, error } = await supabase
      .from('task_descriptions')
      .insert({ task_id: taskId, content: '' })
      .select()
      .single()
    if (error) { console.error(error); return null }
    const desc = data as TaskDescription
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, description: desc } : t
    ))
    return desc
  }, [])

  const updateDescription = useCallback(async (taskId: string, content: string) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId && t.description
        ? { ...t, description: { ...t.description, content } }
        : t
    ))
    const { error } = await supabase
      .from('task_descriptions')
      .update({ content })
      .eq('task_id', taskId)
    if (error) console.error(error)
  }, [])

  return { tasks, loading, createTask, updateTask, deleteTask, createDescription, updateDescription }
}
