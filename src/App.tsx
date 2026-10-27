import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StoreProvider, useStore } from './lib/store'
import { Layout } from './components/ui'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Mistakes from './pages/Mistakes'
import MistakeDetail from './pages/MistakeDetail'
import MistakeNew from './pages/MistakeNew'
import SubjectStats from './pages/SubjectStats'
import KnowledgeStats from './pages/KnowledgeStats'
import ReviewPlan from './pages/ReviewPlan'
import DailyTasks from './pages/DailyTasks'
import CalendarPage from './pages/Calendar'
import Sessions from './pages/Sessions'
import ImportExport from './pages/ImportExport'
import Settings from './pages/Settings'
import Admin from './pages/Admin'
import More from './pages/More'

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } })

function Guard({ children }: { children: React.ReactNode }) {
  const { user } = useStore()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <StoreProvider>
        <HashRouter>
          <Layout>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Guard><Dashboard /></Guard>} />
              <Route path="/mistakes" element={<Guard><Mistakes /></Guard>} />
              <Route path="/mistakes/new" element={<Guard><MistakeNew /></Guard>} />
              <Route path="/mistakes/:id" element={<Guard><MistakeDetail /></Guard>} />
              <Route path="/stats" element={<Guard><SubjectStats /></Guard>} />
              <Route path="/knowledge" element={<Guard><KnowledgeStats /></Guard>} />
              <Route path="/review" element={<Guard><ReviewPlan /></Guard>} />
              <Route path="/tasks" element={<Guard><DailyTasks /></Guard>} />
              <Route path="/calendar" element={<Guard><CalendarPage /></Guard>} />
              <Route path="/sessions" element={<Guard><Sessions /></Guard>} />
              <Route path="/import-export" element={<Guard><ImportExport /></Guard>} />
              <Route path="/settings" element={<Guard><Settings /></Guard>} />
              <Route path="/admin" element={<Guard><Admin /></Guard>} />
              <Route path="/more" element={<Guard><More /></Guard>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </HashRouter>
      </StoreProvider>
    </QueryClientProvider>
  )
}
