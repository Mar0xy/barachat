import { API_URL } from './constants';

export interface FetchOptions extends RequestInit {
  token?: string;
}

/**
 * Fetch helper that automatically adds auth token from localStorage
 */
export async function apiFetch(endpoint: string, options: FetchOptions = {}) {
  const token = options.token || localStorage.getItem('token');
  
  const headers: HeadersInit = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}

/**
 * Fetch and parse JSON response
 */
export async function apiJSON<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const response = await apiFetch(endpoint, options);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}
