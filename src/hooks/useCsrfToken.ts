import { useEffect } from 'react';
import axios from 'axios';

export const useCsrfToken = () => {
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        await axios.get('/sanctum/csrf-cookie');
      } catch (error) {
        console.error('CSRFトークンの取得に失敗しました:', error);
      }
    };

    fetchCsrfToken();
  }, []);
};