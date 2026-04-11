import { useState } from 'react'
import TodayScreen from './components/today/TodayScreen'
import NewDayScreen from './components/today/NewDayScreen'
import TaskPoolScreen from './components/tasks/TaskPoolScreen'
import TemplatesScreen from './components/templates/TemplatesScreen'
import BottomNav from './components/ui/BottomNav'
import './index.css'

type Screen = 'today' | 'new-day' | 'templates' | 'pool' | 'history'

function App() {
  const [screen, setScreen] = useState<Screen>('today')

  return (
    <div className="app-root">
      {screen === 'today' && <TodayScreen onNewDay={() => setScreen('new-day')} />}
      {screen === 'new-day' && <NewDayScreen onDone={() => setScreen('today')} />}
      {screen === 'pool' && <TaskPoolScreen />}
      {screen === 'templates' && <TemplatesScreen />}
      {screen === 'history' && (
        <div className="stub-screen">
          <span className="text-muted">// в разработке</span>
          <span className="blink-cursor" />
        </div>
      )}
      {screen !== 'new-day' && <BottomNav active={screen} onNavigate={setScreen} />}
    </div>
  )
}

export default App
