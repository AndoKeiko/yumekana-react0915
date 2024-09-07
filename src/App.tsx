import AppContent from "./pages/AppContent";
import ErrorBoundary from "./components/ErrorBoundary";
import { useCsrfToken } from './hooks/useCsrfToken';

function App() {
  useCsrfToken();

  // URLからトークンを取得（例としてクエリパラメータから）
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  if (token) {
    localStorage.setItem("token", token);
    // トークンを使用してユーザー情報を取得するなど
  }

  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;