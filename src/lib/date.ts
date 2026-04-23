export function todayDate(): string {
  return new Date().toLocaleDateString('en-CA')
}

export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' })
    .replace(/\.$/, '')
}
