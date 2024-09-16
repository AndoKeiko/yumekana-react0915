import api from '../api/axios';

export const refreshToken = async () => {
  try {
    const response = await api.post('/api/refresh-token');
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
    return access_token;
  } catch (error) {
    console.error('Failed to refresh token', error);
    throw error;
  }
};