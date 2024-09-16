
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost/',  // Laravel サーバーのURLを確認してください
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export default api;

// import axios from 'axios';
// import { refreshToken } from '../services/auth'; // この関数は後で実装します

// const api = axios.create({
//   baseURL: 'http://localhost',
//   withCredentials: true,
//   headers: {
//     'X-Requested-With': 'XMLHttpRequest',
//     'Content-Type': 'application/json',
//     'Accept': 'application/json'
//   }
// });

// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;
//     if (error.response.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
//       try {
//         const newToken = await refreshToken();
//         api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
//         return api(originalRequest);
//       } catch (refreshError) {
//         // リフレッシュに失敗した場合はログアウト処理などを行う
//         return Promise.reject(refreshError);
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;