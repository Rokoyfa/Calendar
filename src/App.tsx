import './assets/css/App.css'
import { storageConfig } from './config/storage.ts'
import { Calendar } from './features/calendar/index.ts'
import { StorageProvider } from './features/storage/index.ts'

function App() {
  return (
    <StorageProvider config={storageConfig}>
      <div className="app">
        <Calendar />
      </div>
    </StorageProvider>
  )
}

export default App
