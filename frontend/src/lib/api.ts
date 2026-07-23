import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/expense-manager/backend/api';

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = useAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      sessionStorage.removeItem('em_token');
      sessionStorage.removeItem('em_user');
      if (!location.pathname.startsWith('/login')) {
        location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// Token kept in memory + sessionStorage (not localStorage) is fine here since this
// is a real deployed app (not a Claude.ai artifact) served from your own domain.
function useAuthToken(): string | null {
  return sessionStorage.getItem('em_token');
}

export function apiErrorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as any)?.message || fallback;
  }
  return fallback;
}
