import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setAuth, setUser } from '../../store/authSlice';
import { useForm } from "react-hook-form";
import api from '../../api/axios';
import { API_ENDPOINTS } from "@/config/api";
import type { RegisterForm, UserType } from "@/Types/index";
import axios, { AxiosError } from 'axios';

type RegisterProps = {
  // ここにプロップの型を定義
};

const Register: React.FC<RegisterProps> = (props) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { register, handleSubmit, formState: { errors }, watch } = useForm<RegisterForm>();
  const [registerError, setRegisterError] = useState<string | null>(null);

  // useEffect(() => {
  //   const getCsrfToken = async () => {
  //     try {
  //       await api.get('/sanctum/csrf-cookie');
  //       console.log('CSRF token fetched successfully');
  //     } catch (error) {
  //       console.error('Failed to get CSRF token', error);
  //     }
  //   };
  //   getCsrfToken();
  // }, []);

  // useEffect(() => {
  //   const xsrfToken = document.cookie
  //     .split('; ')
  //     .find(row => row.startsWith('XSRF-TOKEN'))
  //     ?.split('=')[1];
  //   if (xsrfToken) {
  //     axios.defaults.headers.common['X-XSRF-TOKEN'] = xsrfToken;
  //   }
  // }, []);


  const onSubmit = async (data: RegisterForm) => {
    setRegisterError(null);
    try {
      const response = await api.post<{ user: UserType, token: string }>(API_ENDPOINTS.REGISTER, data);
      dispatch(setAuth(true));
      dispatch(setUser(response.data.user));
      localStorage.setItem('token', response.data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      navigate('/');
    } catch (error) {
      let errorMessage = '登録に失敗しました。もう一度お試しください。';
      if (error instanceof AxiosError) {
        if (error.response && error.response.data) {
          if (error.response.data.errors) {
            // バリデーションエラーの詳細を表示
            errorMessage = Object.values(error.response.data.errors).flat().join(', ');
          } else {
            errorMessage = error.response.data.message || errorMessage;
          }
        } else if (error.request) {
          errorMessage = 'サーバーに接続できません。インターネット接続を確認してください。';
        }
      }
      setRegisterError(errorMessage);
      console.error('Registration failed', error);
    }
  };

  const googleLogin = () => {
    window.location.href = API_ENDPOINTS.GOOGLE_AUTH;
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-lg shadow-md w-9/12">
        <h1 className="text-2xl font-bold mb-6">新規登録</h1>
        {registerError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{registerError}</span>
          </div>
        )}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 text-left">名前</label>
          <input
            {...register("name", { required: "名前は必須です" })}
            type="text"  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          {errors.name && <span className="text-red-600 text-sm">{errors.name.message}</span>}
        </div>
        <div className="mb-4">
          <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 text-left">ニックネーム</label>
          <input
            {...register("nickname", { required: "ニックネームは必須です" })}
            type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          {errors.nickname && <span className="text-red-600 text-sm">{errors.nickname.message}</span>}
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 text-left">メールアドレス</label>
          <input
            {...register("email", {
              required: "メールアドレスは必須です",
              pattern: {
                value: /^[a-zA-Z0-9_.+-]+@([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/,
                message: "メールアドレスの形式が正しくありません",
              },
            })}
            type="email" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          {errors.email && <span className="text-red-600 text-sm">{errors.email.message}</span>}
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 text-left">パスワード</label>
          <input
            {...register("password", {
              required: "パスワードは必須です",
              minLength: {
                value: 8,
                message: "8文字以上入力してください",
              },
            })}
            type="password" autoComplete="current-password" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          {errors.password && <span className="text-red-600 text-sm">{errors.password.message}</span>}
        </div>
        <div className="mb-6">
          <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 text-left">パスワード（確認）</label>
          <input
            {...register("password_confirmation", {
              required: "パスワード（確認）は必須です",
              validate: (value) => value === watch('password') || "パスワードが一致しません"
            })}
            type="password"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          {errors.password_confirmation && <span className="text-red-600 text-sm">{errors.password_confirmation.message}</span>}
        </div>
        <div className="flex justify-end">
          <button type="submit" className="inline-flex w-full justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            登録
          </button>
        </div>
        <div className="mt-4">
          <button onClick={googleLogin} type="button" className="w-full py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            Googleで登録
          </button>
        </div>
      </form>
      <div className="mt-6 text-center">
        <span className="text-gray-600 text-sm">すでにアカウントをお持ちの方は</span>
        <Link to="/auth/login" className="text-sm text-indigo-600 font-medium hover:text-indigo-500">
          ログイン
        </Link>
      </div>
    </div>
  );
};

export default Register;