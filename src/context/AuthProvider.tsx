import React, { createContext, useState, useEffect } from 'react'
import api from '../api/axios'
import { API_ENDPOINTS } from '../config/api'

export const AuthContext = React.createContext<{
  isAuth: boolean;
  userId: string | null;
  error: string | null;
  handleLogout: () => Promise<void>;
  handleLogin: (email: string, password: string) => Promise<boolean>;
} | null>(null);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          setIsAuth(false)
          return
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        const response = await api.get(API_ENDPOINTS.USER)
        
        if (response.data && typeof response.data === 'object') {
          setIsAuth(true)
          if (response.data.id) {
            setUserId(response.data.id.toString())
          }
        } else {
          setError('ユーザー情報の形式が不正です')
          setIsAuth(false)
        }
      } catch (error) {
        console.error('ユーザー情報の取得に失敗しました:', error)
        setError('ユーザー情報の取得に失敗しました。再度ログインしてください。')
        setIsAuth(false)
        localStorage.removeItem('token')
      }
    }

    fetchUserData()
  }, [])

  const handleLogout = async () => {
    try {
      await api.post(API_ENDPOINTS.LOGOUT)
      setIsAuth(false)
      setUserId(null)
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
    } catch (error) {
      console.error('Logout failed', error)
    }
  }

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await api.post(API_ENDPOINTS.LOGIN, { email, password })
      const { access_token, user } = response.data
      localStorage.setItem('token', access_token)
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
      setIsAuth(true)
      setUserId(user.id.toString())
      return true
    } catch (error) {
      console.error('Login failed', error)
      setError('ログインに失敗しました。メールアドレスとパスワードを確認してください。')
      return false
    }
  }

  return (
    <AuthContext.Provider value={{ isAuth, userId, error, handleLogout, handleLogin }}>
      {children}
    </AuthContext.Provider>
  )
}