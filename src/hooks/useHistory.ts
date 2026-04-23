import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { DayPlan } from '../types'

const PAGE_SIZE = 30

export function useHistory() {
  const [plans, setPlans] = useState<DayPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('day_plans')
        .select('*')
        .order('date', { ascending: false })
        .limit(PAGE_SIZE)
      if (error) console.error(error)
      const rows = (data as DayPlan[]) ?? []
      setPlans(rows)
      setHasMore(rows.length === PAGE_SIZE)
      setLoading(false)
    }
    load()
  }, [])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const { data, error } = await supabase
      .from('day_plans')
      .select('*')
      .order('date', { ascending: false })
      .range(plans.length, plans.length + PAGE_SIZE - 1)
    if (error) console.error(error)
    const rows = (data as DayPlan[]) ?? []
    setPlans(prev => [...prev, ...rows])
    setHasMore(rows.length === PAGE_SIZE)
    setLoadingMore(false)
  }, [plans.length, loadingMore, hasMore])

  const deletePlan = useCallback(async (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id))
    const { error } = await supabase.from('day_plans').delete().eq('id', id)
    if (error) {
      console.error(error)
      const { data } = await supabase
        .from('day_plans')
        .select('*')
        .order('date', { ascending: false })
        .limit(PAGE_SIZE)
      if (data) {
        setPlans(data as DayPlan[])
        setHasMore((data as DayPlan[]).length === PAGE_SIZE)
      }
    }
  }, [])

  return { plans, loading, loadingMore, hasMore, loadMore, deletePlan }
}
