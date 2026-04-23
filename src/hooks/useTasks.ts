import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Task, TaskDescription } from '../types'

interface RawTaskRow {
  id: string
  title: string
  duration: string | null
  icon: string | null
  created_at: string
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: true }),
      supabase.from('task_descriptions').select('*'),
    ]).then(([tasksRes, descsRes]) => {
      if (tasksRes.error) console.error(tasksRes.error)
      if (descsRes.error) console.error(descsRes.error)

      const descMap = new Map(
        ((descsRes.data ?? []) as TaskDescription[]).map(d => [d.task_id, d])
      )
      setTasks(
        ((tasksRes.data ?? []) as RawTaskRow[]).map(raw => ({
          id: raw.id,
          title: raw.title,
          duration: raw.duration ?? undefined,
          icon: raw.icon ?? undefined,
          created_at: raw.created_at,
          description: descMap.get(raw.id),
        }))
      )
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
      .select()
      .single()

    if (error) {
      console.error(error)
      setTasks(prev => prev.filter(t => t.id !== tempId))
      return
    }
    const raw = data as RawTaskRow
    setTasks(prev => prev.map(t => t.id === tempId ? {
      id: raw.id,
      title: raw.title,
      duration: raw.duration ?? undefined,
      icon: raw.icon ?? undefined,
      created_at: raw.created_at,
    } : t))
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

    if (error) {
      if (error.code !== '23505') {
        console.error(error)
        return null
      }
      const { data: existing, error: fetchError } = await supabase
        .from('task_descriptions')
        .select()
        .eq('task_id', taskId)
        .single()
      if (fetchError || !existing) { console.error(fetchError ?? error); return null }
      const desc = existing as TaskDescription
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, description: desc } : t))
      return desc
    }

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
