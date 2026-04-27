import { useState } from 'react'
import TodayScreen from './components/today/TodayScreen'
import NewDayScreen from './components/today/NewDayScreen'
import TaskPoolScreen from './components/tasks/TaskPoolScreen'
import HistoryScreen from './components/history/HistoryScreen'
import BottomNav from './components/ui/BottomNav'
import AppRoot from './components/ui/AppRoot'
import LoginScreen from './components/login/LoginScreen'
import StatScreen from './components/stat/StatScreen'
import SettingsScreen from './components/settings/SettingsScreen'
import { useDisplaySettings } from './hooks/useDisplaySettings'
import './index.css'

type Screen = 'today' | 'new-day' | 'pool' | 'history' | 'stat' | 'settings'

function isAuthenticated(): boolean {
  if (import.meta.env.DEV) return true
  return document.cookie.includes('overseer_ui=1')
}

function AppContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-container">
      {/* Bezel corner marks */}
      {(['0 0 auto auto', 'auto auto 0 0', 'auto 0 0 auto', '0 auto auto 0'] as const).map((inset, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset,
            width: 8, height: 8,
            pointerEvents: 'none',
            zIndex: 10,
            fontSize: 8,
            color: 'var(--border-bright)',
            display: 'flex',
            alignItems: i < 2 ? 'flex-start' : 'flex-end',
            justifyContent: i % 2 === 0 ? 'flex-end' : 'flex-start',
            lineHeight: 1,
          }}
        >
          {(['┐', '└', '┘', '┌'] as const)[i]}
        </div>
      ))}
      {children}
    </div>
  )
}

function App() {
  const [screen, setScreen] = useState<Screen>('today')
  const { settings, toggleSetting } = useDisplaySettings()
  const [authed, setAuthed] = useState(isAuthenticated)

  if (!authed) {
    return (
      <AppRoot settings={settings}>
        <AppContainer>
          <LoginScreen onLogin={() => { setAuthed(true); window.location.reload() }} />
        </AppContainer>
      </AppRoot>
    )
  }

  const navActive = (
    screen === 'pool' ? 'pool' :
    screen === 'history' ? 'history' :
    screen === 'stat' ? 'stat' :
    'today'
  ) as 'today' | 'pool' | 'stat' | 'history'

  const showNav = screen !== 'new-day' && screen !== 'settings'

  return (
    <AppRoot settings={settings}>
      <AppContainer>
        {screen === 'today' && <TodayScreen onNewDay={() => setScreen('new-day')} />}
        {screen === 'new-day' && <NewDayScreen onDone={() => setScreen('today')} />}
        {screen === 'pool' && <TaskPoolScreen />}
        {screen === 'history' && <HistoryScreen />}
        {screen === 'stat' && <StatScreen onSettings={() => setScreen('settings')} />}
        {screen === 'settings' && (
          <SettingsScreen
            settings={settings}
            onToggle={toggleSetting}
            onBack={() => setScreen('stat')}
          />
        )}
        {showNav && (
          <BottomNav active={navActive} onNavigate={s => setScreen(s as Screen)} />
        )}
      </AppContainer>
    </AppRoot>
  )
}

export default App
