import DayView from '../dayview/DayView'

function todayDate() {
  return new Date().toLocaleDateString('en-CA')
}

interface Props {
  onNewDay?: () => void
  date?: string
  onBack?: () => void
}

export default function TodayScreen({ onNewDay, date, onBack }: Props) {
  return <DayView date={date ?? todayDate()} onNewDay={onNewDay} onBack={onBack} />
}
