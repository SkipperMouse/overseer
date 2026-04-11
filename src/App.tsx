import { useState } from 'react'
import TodayScreen from './components/today/TodayScreen'
import TaskPoolScreen from './components/tasks/TaskPoolScreen'
import TemplatesScreen from './components/templates/TemplatesScreen'
import BottomNav from './components/ui/BottomNav'
import './index.css'

type Screen = 'today' | 'templates' | 'pool' | 'history'

function App() {
  const [screen, setScreen] = useState<Screen>('today')

  return (
    <div className="app-root">
      {screen === 'today' && <TodayScreen />}
      {screen === 'pool' && <TaskPoolScreen />}
      {screen === 'templates' && <TemplatesScreen />}
      {screen === 'history' && (
        <div className="stub-screen">
          <span className="text-muted">// в разработке</span>
          <span className="blink-cursor" />
        </div>
      )}
      <BottomNav active={screen} onNavigate={setScreen} />
    </div>
  )
}

export default App
