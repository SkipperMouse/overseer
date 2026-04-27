type NavScreen = 'today' | 'pool' | 'stat' | 'history'

interface Props {
  active: NavScreen
  onNavigate: (screen: NavScreen) => void
}

const NAV_ITEMS: { id: NavScreen; label: string }[] = [
  { id: 'today',   label: 'PLAN' },
  { id: 'pool',    label: 'POOL' },
  { id: 'stat',    label: 'STAT' },
  { id: 'history', label: 'HIST' },
]

export default function BottomNav({ active, onNavigate }: Props) {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ id, label }) => (
        <button
          key={id}
          className={`nav-item${active === id ? ' active phosphor-glow' : ''}`}
          onClick={() => onNavigate(id)}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}
