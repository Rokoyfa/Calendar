import { AccountMenu, useAuth } from '../features/authorization/index.ts'
import { Calendar } from '../features/calendar/index.ts'
import { LocalImportPrompt } from '../features/storage/index.ts'

export function CalendarPage() {
  const { user } = useAuth()
  return (
    <div className="app">
      <Calendar headerAccessory={<AccountMenu />} />
      {user && <LocalImportPrompt userId={user.id} />}
    </div>
  )
}
