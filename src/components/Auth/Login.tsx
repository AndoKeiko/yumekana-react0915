import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../../store/authSlice';
import { useForm } from "react-hook-form";
import api from '../../api/axios';
import { API_ENDPOINTS } from "@/config/api";
import type { LoginForm, LoginResponse } from "@/Types/index";
import axios from 'axios';
import { useCsrfToken } from '@/hooks/useCsrfToken';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const [loginError, setLoginError] = useState<string | null>(null);
  const { csrfToken, error: csrfError } = useCsrfToken();

  // useEffect(() => {
  //   const xsrfToken = document.cookie
  //   .split('; ')
  //   .find(row => row.startsWith('XSRF-TOKEN'))
  //   ?.split('=')[1];
  //   if (xsrfToken) {
  //   axios.defaults.headers.common['X-XSRF-TOKEN'] = xsrfToken;
  //   }
  //   }, []);

  const onSubmit = async (data: LoginForm) => {
    setLoginError(null);
    dispatch(loginStart());
  
    try {
      // CSRFトークンを取得
      await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
  
      const response = await api.post<LoginResponse>(API_ENDPOINTS.LOGINURL, data, { withCredentials: true });
      const { access_token, token_type, user } = response.data;
      dispatch(loginSuccess({ token: access_token, userId: user.id.toString() }));
      api.defaults.headers.common['Authorization'] = `${token_type} ${access_token}`;
      navigate('/goals');
    } catch (error) {
      let errorMessage = 'ログインに失敗しました。もう一度お試しください。';
      if (axios.isAxiosError(error)) {
        if (error.response) {
          switch (error.response.status) {
            case 401:
              errorMessage = 'メールアドレスまたはパスワードが間違っています。';
              break;
            case 404:
              errorMessage = 'ユーザーが見つかりません。';
              break;
            case 500:
              errorMessage = 'サーバーエラーが発生しました。しばらくしてからもう一度お試しください。';
              break;
          }
        } else if (error.request) {
          errorMessage = 'サーバーに接続できません。インターネット接続を確認してください。';
        }
      }
      dispatch(loginFailure(errorMessage));
      setLoginError(errorMessage);
      console.error('Login failed', error);
    }
  };
  const googleLogin = () => {
    window.location.href = API_ENDPOINTS.GOOGLE_AUTH;
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">ログイン</h1>
        {loginError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{loginError}</span>
          </div>
        )}
        {csrfError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{csrfError}</span>
          </div>
        )}
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
          <input
            {...register("email", {
              required: "メールアドレスは必須です",
              pattern: {
                value: /^[a-zA-Z0-9_.+-]+@([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/,
                message: "メールアドレスの形式が正しくありません",
              },
            })}
            type="email"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          {errors.email && <span className="text-red-600 text-sm">{errors.email.message as string}</span>}
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">パスワード</label>
          <input
            {...register("password", {
              required: "パスワードは必須です",
              minLength: {
                value: 6,
                message: "6文字以上入力してください",
              },
            })}
            type="password" autoComplete="current-password" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          {errors.password && <span className="text-red-600 text-sm">{errors.password.message as string}</span>}
        </div>
        <div className="flex justify-end">
          <button type="submit" className="inline-flex w-full justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            メールアドレスでログイン
          </button>
        </div>
        <div className="mt-4">
          <button onClick={googleLogin} type="button" className="w-full py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            Googleでログイン
          </button>
        </div>
       </form>
       <div className="mt-6 text-center">
         <span className="text-gray-600 text-sm">アカウントをお持ちでない方は</span>
         <Link to="/register" className="text-sm text-indigo-600 font-medium hover:text-indigo-500">
           新規登録
         </Link>
       </div>

     </div>
   );
 };

 export default Login;