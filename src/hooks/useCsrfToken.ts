import { useEffect, useState } from 'react';
import axios from 'axios';

export const useCsrfToken = () => {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCsrfToken = async (retries = 3) => {
      try {
        console.log('CSRFトークン取得開始');
        await axios.get('/sanctum/csrf-cookie', { withCredentials: true });
        
        // クッキーが設定されるのを待つ時間を延長
        await new Promise(resolve => setTimeout(resolve, 500));

        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('XSRF-TOKEN'))
          ?.split('=')[1];

        if (token) {
          const decodedToken = decodeURIComponent(token);
          axios.defaults.headers.common['X-XSRF-TOKEN'] = decodedToken;
          setCsrfToken(decodedToken);
          console.log('CSRFトークンが正常に取得されました:', decodedToken);
        } else {
          console.log('現在のクッキー:', document.cookie);
          if (retries > 0) {
            console.log(`CSRFトークンが見つかりません。再試行中... (残り${retries}回)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await fetchCsrfToken(retries - 1);
          } else {
            throw new Error('複数回の試行後もCSRFトークンの取得に失敗しました');
          }
        }
      } catch (error) {
        console.error('CSRFトークンの取得に失敗:', error);
        console.log('現在のクッキー:', document.cookie);
        setError(`CSRFトークンの取得に失敗しました。エラー詳細: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    fetchCsrfToken();
  }, []);

  return { csrfToken, error };
};