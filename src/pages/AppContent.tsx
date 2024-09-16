import AppLayout from './AppLayout'
import AuthProvider from '@/context/AuthProvider'
import AppRoutes from './AppRoutes'

export default function AppContent() {
  return (
    <AuthProvider>
      <AppLayout>
        <AppRoutes />
      </AppLayout>
    </AuthProvider>
  )
}