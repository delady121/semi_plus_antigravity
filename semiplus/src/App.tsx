import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './stores/authStore'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { LayoutEditorPage } from './pages/LayoutEditorPage'
import { DataManagementPage } from './pages/DataManagementPage'
import { WorkflowPage } from './pages/WorkflowPage'
import { SettingsPage } from './pages/SettingsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/dashboard/*" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/layout" element={<PrivateRoute><LayoutEditorPage /></PrivateRoute>} />
          <Route path="/layout/*" element={<PrivateRoute><LayoutEditorPage /></PrivateRoute>} />
          <Route path="/data" element={<PrivateRoute><DataManagementPage /></PrivateRoute>} />
          <Route path="/data/*" element={<PrivateRoute><DataManagementPage /></PrivateRoute>} />
          <Route path="/workflow" element={<PrivateRoute><WorkflowPage /></PrivateRoute>} />
          <Route path="/workflow/*" element={<PrivateRoute><WorkflowPage /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
          <Route path="/settings/*" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontFamily: 'inherit', fontSize: '13px' },
          success: { duration: 3000 },
          error: { duration: 5000 },
        }}
      />
    </QueryClientProvider>
  )
}
