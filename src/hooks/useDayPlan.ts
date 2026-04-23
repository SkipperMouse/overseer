import { useDayPlanByDate } from './useDayPlanByDate'
import { todayDate } from '../lib/date'

export { canMove } from './useDayPlanByDate'

export function useDayPlan() {
  return useDayPlanByDate(todayDate())
}
