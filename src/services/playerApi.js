// src/services/playerApi.js

const CLOUDFLARE_WORKER_FALLBACK = 'https://windhub-worker.trinhgiaphong2k9.workers.dev';

export function getWorkerBaseUrl() {
  let base = import.meta.env.VITE_LOTTERY_WORKER_URL;
  if (base && (base.includes(':5173') || (typeof window !== 'undefined' && base === window.location.origin))) {
    base = '';
  }
  if (!base) {
    base = CLOUDFLARE_WORKER_FALLBACK;
  }
  return base.replace(/\/+$/, '');
}

export function getStoredSessionToken() {
  try {
    return localStorage.getItem('windhub_session_token') || '';
  } catch {
    return '';
  }
}

export function setStoredSessionToken(token) {
  try {
    if (token) {
      localStorage.setItem('windhub_session_token', token);
    } else {
      localStorage.removeItem('windhub_session_token');
    }
  } catch {}
}

async function apiRequest(path, options = {}) {
  const baseUrl = getWorkerBaseUrl();
  const token = getStoredSessionToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    credentials: 'include' // Sends HttpOnly cookie if same/cross origin supports it
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || data.message || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function loginWithGoogleApi(credential) {
  const res = await apiRequest('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential })
  });
  if (res.sessionToken) {
    setStoredSessionToken(res.sessionToken);
  }
  return res;
}

export async function logoutPlayerApi() {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
  } finally {
    setStoredSessionToken('');
  }
}

export async function fetchCurrentPlayerProfile() {
  return apiRequest('/api/auth/me', { method: 'GET' });
}

export async function fetchPlayerBalance() {
  return apiRequest('/api/wallet/balance', { method: 'GET' });
}

export async function fetchPlayerTransactions(limit = 50) {
  return apiRequest(`/api/wallet/transactions?limit=${limit}`, { method: 'GET' });
}

export async function fetchDailyRewardStatus() {
  return apiRequest('/api/reward/status', { method: 'GET' });
}

export async function claimDailyRewardApi() {
  return apiRequest('/api/reward/claim', { method: 'POST' });
}

export async function fetchWsTicket() {
  return apiRequest('/api/lottery/ws-ticket', { method: 'POST' });
}

