type Screen = 'today' | 'pool' | 'history'

interface Props {
  active: Screen
  onNavigate: (screen: Screen) => void
}

const NAV_ITEMS: { id: Screen; label: string }[] = [
  { id: 'today',   label: 'TODAY' },
  { id: 'pool',    label: 'POOL'  },
  { id: 'history', label: 'HIST'  },
]

export default function BottomNav({ active, onNavigate }: Props) {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ id, label }) => (
        <button
          key={id}
          className={`nav-item${active === id ? ' active' : ''}`}
          onClick={() => onNavigate(id)}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}
