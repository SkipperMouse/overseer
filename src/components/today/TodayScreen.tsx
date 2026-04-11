import DayView from '../dayview/DayView'

function todayDate() {
  return new Date().toLocaleDateString('en-CA')
}

interface Props {
  onNewDay: () => void
}

export default function TodayScreen({ onNewDay }: Props) {
  return <DayView date={todayDate()} onNewDay={onNewDay} />
}
