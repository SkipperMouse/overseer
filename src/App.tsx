import { useState } from 'react'
import TodayScreen from './components/today/TodayScreen'
import NewDayScreen from './components/today/NewDayScreen'
import TaskPoolScreen from './components/tasks/TaskPoolScreen'
import TemplatesScreen from './components/templates/TemplatesScreen'
import HistoryScreen from './components/history/HistoryScreen'
import BottomNav from './components/ui/BottomNav'
import './index.css'

type Screen = 'today' | 'new-day' | 'templates' | 'pool' | 'history'

function App() {
  const [screen, setScreen] = useState<Screen>('today')

  return (
    <div className="app-root">
      <div className="app-container">
        {screen === 'today' && <TodayScreen onNewDay={() => setScreen('new-day')} />}
        {screen === 'new-day' && <NewDayScreen onDone={() => setScreen('today')} />}
        {screen === 'pool' && <TaskPoolScreen />}
        {screen === 'templates' && <TemplatesScreen />}
        {screen === 'history' && <HistoryScreen />}
        {screen !== 'new-day' && <BottomNav active={screen} onNavigate={setScreen} />}
      </div>
    </div>
  )
}

export default App
