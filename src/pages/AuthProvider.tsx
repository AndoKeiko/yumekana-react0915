import React from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { API_ENDPOINTS } from '@/config/api'
import { useCsrfToken } from '@/hooks/useCsrfToken'

export const AuthContext = React.createContext(null)

export default function AuthProvider({ children }) {
  const [isAuth, setIsAuth] = React.useState(false)
  const [userId, setUserId] = React.useState(null)
  const [error, setError] = React.useState(null)
  const navigate = useNavigate()
  const { csrfToken, error: csrfError } = useCsrfToken()

  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.USER, { withCredentials: true })
        if (response.data && typeof response.data === 'object') {
          setIsAuth(true)
          if (response.data.users && response.data.users[0] && response.data.users[0].id) {
            setUserId(response.data.users[0].id.toString())
          }
        } else {
          setError('ユーザー情報の形式が不正です')
          setIsAuth(false)
        }
      } catch (error) {
        console.error('ユーザー情報の取得に失敗しました:', error)
        setError('ユーザー情報の取得に失敗しました。再度ログインしてください。')
        setIsAuth(false)
      }
    }

    if (csrfToken) {
      fetchUserData()
    }
  }, [csrfToken])

  const handleLogout = async () => {
    try {
      await axios.post(API_ENDPOINTS.LOGOUT, { withCredentials: true })
      setIsAuth(false)
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
      navigate('/login')
    } catch (error) {
      console.error('Logout failed', error)
    }
  }

  return (
    <AuthContext.Provider value={{ isAuth, userId, error, csrfError, handleLogout }}>
      {children}
    </AuthContext.Provider>
  )
}