const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined) || '';
export const API_BASE = rawApiUrl ? `${rawApiUrl.replace(/\/+$/, '')}/api/v1` : '/api/v1';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('dagna_access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (res.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
    // Attempt token refresh
    try {
      const storedRefresh = localStorage.getItem('dagna_refresh_token');
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefresh || undefined }),
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        localStorage.setItem('dagna_access_token', refreshData.accessToken);
        if (refreshData.refreshToken) {
          localStorage.setItem('dagna_refresh_token', refreshData.refreshToken);
        }
        headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
        const retryRes = await fetch(`${API_BASE}${endpoint}`, {
          ...options,
          credentials: 'include',
          headers,
        });
        return retryRes.json();
      }
    } catch {
      localStorage.removeItem('dagna_access_token');
      localStorage.removeItem('dagna_refresh_token');
    }
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.detail || data.message || `HTTP ${res.status}`);
  }

  return data as T;
}
