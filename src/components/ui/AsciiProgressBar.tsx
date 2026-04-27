const BAR_LEN = 10

interface Props {
  value: number
  total: number
}

export default function AsciiProgressBar({ value, total }: Props) {
  const filled = Math.round(value / (total || 1) * BAR_LEN)
  const empty = BAR_LEN - filled

  return (
    <div className="ascii-progress">
      <span className="ascii-progress-filled">{'█'.repeat(filled)}</span>
      <span className="ascii-progress-empty">{'█'.repeat(empty)}</span>
      <span className="ascii-progress-label">{value}/{total}</span>
    </div>
  )
}
