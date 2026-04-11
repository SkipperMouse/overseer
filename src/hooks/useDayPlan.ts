import { useDayPlanByDate } from './useDayPlanByDate'

export { canMove } from './useDayPlanByDate'

function todayDate() {
  return new Date().toLocaleDateString('en-CA')
}

export function useDayPlan() {
  return useDayPlanByDate(todayDate())
}
