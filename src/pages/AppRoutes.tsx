import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Goal from './Goal'
import CreatePost from './CreatePost'
import Login from '@/components/Auth/Login'
import Register from '@/components/Auth/Register'
import TaskListPage from './TaskListPage'
import GoalsListPage from './GoalsListPage'
// import TaskList from './TaskList'
import GoalDetail from './GoalDetail'
import { AuthContext } from './AuthProvider'

const ProtectedRoute = ({ children }) => {
  const { isAuth } = React.useContext(AuthContext)
  if (!isAuth) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function AppRoutes() {
  const { userId, error, csrfError } = React.useContext(AuthContext)

  return (
    <>
      {csrfError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">エラー:</strong>
          <span className="block sm:inline"> {csrfError}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">エラー:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      <Routes>
        <Route path="/" element={<ProtectedRoute><Goal /></ProtectedRoute>} />
        <Route path="/TaskList" element={<ProtectedRoute><TaskListPage /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute><Goal /></ProtectedRoute>} />
        <Route
          path="/goallist"
          element={
            <ProtectedRoute>
              {userId ? <GoalsListPage user_id={userId} /> : <div>Loading...</div>}
            </ProtectedRoute>
          }
        />
        <Route path="/tasks/:goalId" element={<ProtectedRoute><TaskListPage /></ProtectedRoute>} />
        <Route path="/CreatePost" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
        <Route path="/goals/:id" element={<ProtectedRoute><GoalDetail /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </>
  )
}