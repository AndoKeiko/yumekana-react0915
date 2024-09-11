import AppLayout from './AppLayout'
import AuthProvider from './AuthProvider'
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