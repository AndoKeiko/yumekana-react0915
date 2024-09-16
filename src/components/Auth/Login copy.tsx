import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { AuthContext } from '../../context/AuthProvider';
import type { LoginForm } from "../../Types/index";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const [loginError, setLoginError] = useState<string | null>(null);
  const authContext = useContext(AuthContext);

  const onSubmit = async (data: LoginForm) => {
    console.log('Login attempt with:', data);
    setLoginError(null);
    if (authContext && authContext.handleLogin) {
      try {
        const success = await authContext.handleLogin(data.email, data.password);
        console.log('Login result:', success);
        if (success) {
          navigate('/goals');
        } else {
          setLoginError('ログインに失敗しました。メールアドレスとパスワードを確認してください。');
        }
      } catch (error) {
        console.error('Login error:', error);
        setLoginError('ログイン中にエラーが発生しました。');
      }
    } else {
      console.error('AuthContext or handleLogin is not available');
      setLoginError('認証システムにエラーが発生しました。');
    }
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
          {errors.email && <span className="text-red-600 text-sm">{errors.email.message}</span>}
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
            type="password"
            autoComplete="current-password"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          {errors.password && <span className="text-red-600 text-sm">{errors.password.message}</span>}
        </div>
        <div className="flex justify-end">
          <button type="submit" className="inline-flex w-full justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-900 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            ログイン
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