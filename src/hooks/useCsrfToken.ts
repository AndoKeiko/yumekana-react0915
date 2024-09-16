import { useEffect, useState } from 'react';
import api from '../api/axios';
import { API_ENDPOINTS } from '@/config/api';

export const useCsrfToken = () => {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        console.log('CSRFトークン取得開始');
        await api.get(API_ENDPOINTS.CSRF_COOKIE, { withCredentials: true });
        
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('XSRF-TOKEN'))
          ?.split('=')[1];

        if (token) {
          const decodedToken = decodeURIComponent(token);
          api.defaults.headers.common['X-XSRF-TOKEN'] = decodedToken;
          setCsrfToken(decodedToken);
          console.log('CSRFトークンが正常に取得されました:', decodedToken);
        } else {
          throw new Error('CSRFトークンが見つかりません');
        }
      } catch (error) {
        console.error('CSRFトークンの取得に失敗:', error);
        setError(`CSRFトークンの取得に失敗しました。エラー詳細: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    fetchCsrfToken();
  }, []);

  return { csrfToken, error };
};

