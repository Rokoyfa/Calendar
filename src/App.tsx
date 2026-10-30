import './assets/css/App.css'
import { Calendar } from './features/calendar/index.ts'
import { StorageProvider } from './features/storage/index.ts'

function App() {
  return (
    <StorageProvider>
      <div className="app">
        <Calendar />
      </div>
    </StorageProvider>
  )
}

export default App
