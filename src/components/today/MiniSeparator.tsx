interface Props {
  label: string
}

export default function MiniSeparator({ label }: Props) {
  return (
    <div className="mini-separator">— {label}</div>
  )
}
