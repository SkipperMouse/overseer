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

function AppContainer({ children, curvature }: { children: React.ReactNode; curvature: boolean }) {
  return (
    <div
      className="app-container"
      style={{
        borderRadius: curvature ? 10 : 0,
        boxShadow: curvature
          ? 'inset 22px 0 40px rgba(0,0,0,0.60), inset -22px 0 40px rgba(0,0,0,0.60), inset 0 14px 28px rgba(0,0,0,0.38), inset 0 -14px 28px rgba(0,0,0,0.38)'
          : 'none',
      }}
    >
      {/* Curvature: perimeter glass sheen */}
      {curvature && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10001,
          borderRadius: 10,
          boxShadow: 'inset 0 0 0 1px rgba(106,170,90,0.10)',
          background: 'radial-gradient(ellipse at 50% 2%, rgba(106,170,90,0.05) 0%, transparent 55%)',
        }} />
      )}

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
  const { settings, toggleSetting, setSetting, loaded } = useDisplaySettings()
  const [authed, setAuthed] = useState(isAuthenticated)

  if (!loaded) return null

  if (!authed) {
    return (
      <AppRoot settings={settings}>
        <AppContainer curvature={settings.curvature}>
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
      <AppContainer curvature={settings.curvature}>
        {screen === 'today' && <TodayScreen onNewDay={() => setScreen('new-day')} />}
        {screen === 'new-day' && <NewDayScreen onDone={() => setScreen('today')} />}
        {screen === 'pool' && <TaskPoolScreen />}
        {screen === 'history' && <HistoryScreen />}
        {screen === 'stat' && <StatScreen onSettings={() => setScreen('settings')} />}
        {screen === 'settings' && (
          <SettingsScreen
            settings={settings}
            onToggle={toggleSetting}
            onSet={setSetting}
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
