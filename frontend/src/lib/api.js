import axios from 'axios';
import { toast } from 'sonner';

const backendUrl = (process.env.REACT_APP_BACKEND_URL || window.location.origin).replace(/\/+$/, '');
export const API = `${backendUrl}/api`;

export const http = axios.create({
  baseURL: API,
  withCredentials: true,
  timeout: 30000,
});

// Global error interceptor — shows toast for auth/payment errors
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.detail || error.message;

    if (status === 401) {
      toast.error('Session expired. Please log in again.');
      // Optional: redirect to login
      // window.location.href = '/login';
    } else if (status === 402) {
      toast.error(message || 'Free quota exceeded. Upgrade or watch an ad.');
    } else if (status === 403) {
      toast.error('Access denied.');
    } else if (status >= 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);

export async function getMe() {
  const r = await http.get('/auth/me');
  return r.data;
}

export async function exchangeSession(session_id) {
  const r = await http.post('/auth/session', { session_id });
  return r.data;
}

export async function logout() {
  await http.post('/auth/logout');
}

export async function exportAccount() {
  const r = await http.get('/auth/export');
  return r.data;
}

export async function deleteAccount() {
  const r = await http.delete('/auth/delete-account');
  return r.data;
}

export async function updateProfile(payload) {
  const r = await http.put('/auth/profile', payload);
  return r.data;
}

export async function generateWorksheet(payload) {
  const r = await http.post('/worksheets/generate', payload);
  return r.data;
}

export async function listWorksheets() {
  const r = await http.get('/worksheets');
  return r.data;
}

export async function getWorksheet(worksheetId) {
  const r = await http.get(`/worksheets/${worksheetId}`);
  return r.data;
}

export async function deleteWorksheet(worksheetId) {
  const r = await http.delete(`/worksheets/${worksheetId}`);
  return r.data;
}

export async function grantRewarded(tier) {
  const r = await http.post('/usage/grant-rewarded', { tier });
  return r.data;
}

export async function markPremium() {
  const r = await http.post('/billing/mark-premium');
  return r.data;
}

export async function cancelPremium() {
  const r = await http.post('/billing/cancel-premium');
  return r.data;
}
