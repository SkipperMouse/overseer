export type Block = 'morning' | 'day' | 'evening'

export interface TaskItem {
  id: string
  type: 'task'
  task_id?: string | null
  title: string
  duration?: string
  icon?: string
  block: Block
  time?: string | null
  checked: boolean
  position: number
}

export interface SeparatorItem {
  id: string
  type: 'separator'
  label: string
  block: Block
}

export type DayItem = TaskItem | SeparatorItem

export interface DayPlan {
  id: string
  date: string
  items: DayItem[]
  note?: string
  created_at: string
  updated_at: string
}

export interface TaskDescription {
  id: string
  task_id: string
  content: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  duration?: string
  icon?: string
  created_at: string
  description?: TaskDescription
}

export interface Template {
  id: string
  name: string
  created_at: string
}

export interface TemplateItem {
  id: string
  template_id: string
  task_id?: string
  type: 'task' | 'separator'
  separator_label?: string
  block: Block
  position: number
  task?: Task
}
