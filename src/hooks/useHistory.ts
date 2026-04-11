import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { DayPlan } from '../types'

export function useHistory() {
  const [plans, setPlans] = useState<DayPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('day_plans')
        .select('*')
        .order('date', { ascending: false })
        .limit(30)
      if (error) console.error(error)
      setPlans((data as DayPlan[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const deletePlan = useCallback(async (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id))
    const { error } = await supabase.from('day_plans').delete().eq('id', id)
    if (error) {
      console.error(error)
      // Revert: reload
      const { data } = await supabase
        .from('day_plans')
        .select('*')
        .order('date', { ascending: false })
        .limit(30)
      if (data) setPlans(data as DayPlan[])
    }
  }, [])

  return { plans, loading, deletePlan }
}
