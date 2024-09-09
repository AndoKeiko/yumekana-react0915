import AppContent from "./pages/AppContent";
import ErrorBoundary from "./components/ErrorBoundary";
import { useCsrfToken } from './hooks/useCsrfToken';

function App() {
  const { csrfToken, error } = useCsrfToken();

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <ErrorBoundary>
      <AppContent csrfToken={csrfToken} />
    </ErrorBoundary>
  );
}

export default App;