import { useEffect, useState } from 'react';
import axios from 'axios';

export const useCsrfToken = () => {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        // CSRFクッキーを取得
        await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
        
        // CSRFトークンをクッキーから取得
        const token = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN'))?.split('=')[1];

        if (token) {
          // Axiosのデフォルトヘッダーにトークンを設定
          axios.defaults.headers.common['X-XSRF-TOKEN'] = token;
          setCsrfToken(token);
        } else {
          throw new Error('CSRF token not found in cookies');
        }
      } catch (error) {
        console.error('CSRFトークンの取得に失敗しました:', error);
        setError('CSRFトークンの取得に失敗しました。');
      }
    };

    fetchCsrfToken();
  }, []);

  return { csrfToken, error };
};