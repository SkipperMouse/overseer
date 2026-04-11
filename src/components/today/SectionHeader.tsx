interface Props {
  label: string
}

export default function SectionHeader({ label }: Props) {
  return (
    <div className="section-header">
      <span className="label-section">{label}</span>
    </div>
  )
}
