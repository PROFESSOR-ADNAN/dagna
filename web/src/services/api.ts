const API_BASE = '/api/v1';

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
    headers,
  });

  if (res.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
    // Attempt token refresh
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, { method: 'POST' });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        localStorage.setItem('dagna_access_token', refreshData.accessToken);
        headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
        const retryRes = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
        return retryRes.json();
      }
    } catch {
      localStorage.removeItem('dagna_access_token');
    }
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.detail || data.message || `HTTP ${res.status}`);
  }

  return data as T;
}
