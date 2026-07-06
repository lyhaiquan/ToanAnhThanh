import axios from 'axios';
import { useAuth } from './store';
import { getDeviceId } from './device';

export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Device-Id'] = getDeviceId();
  return config;
});

// Tự refresh access token khi 401, retry request một lần
let refreshing: Promise<boolean> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    // Bị chặn vì sai thiết bị → đăng xuất ngay, đá về trang đăng nhập
    if (error.response?.status === 403 && error.response?.data?.code === 'DEVICE_MISMATCH') {
      useAuth.getState().logout();
      if (!location.pathname.startsWith('/login')) location.href = '/login?reason=device';
      return Promise.reject(error);
    }
    if (error.response?.status === 401 && !original._retried && useAuth.getState().refreshToken) {
      original._retried = true;
      refreshing ??= doRefresh();
      const ok = await refreshing;
      refreshing = null;
      if (ok) {
        original.headers.Authorization = `Bearer ${useAuth.getState().accessToken}`;
        return api(original);
      }
      useAuth.getState().logout();
    }
    return Promise.reject(error);
  }
);

async function doRefresh(): Promise<boolean> {
  try {
    const { data } = await axios.post('/api/auth/refresh', {
      refreshToken: useAuth.getState().refreshToken,
    });
    useAuth.getState().setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export function reportActivity(type: string, metadata?: Record<string, unknown>) {
  api.post('/security/activity', { type, metadata }).catch(() => {});
}

export function reportSecurityEvent(type: string, detail?: string) {
  // sendBeacon-style: cố gắng gửi được ngay cả khi trang sắp unload
  return api.post('/security/security-event', { type, detail }).catch(() => {});
}
