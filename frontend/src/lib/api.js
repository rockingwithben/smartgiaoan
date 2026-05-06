import axios from 'axios';

const BASE = process.env.REACT_APP_BACKEND_URL
  ? process.env.REACT_APP_BACKEND_URL.replace(/\/$/, '')
  : 'https://smartgiaoan-backend.onrender.com';

export const API = `${BASE}/api`;

export const http = axios.create({
  baseURL: API,
  withCredentials: true,
});

// 2000% MODE FIX: On absolute boot, force the token into the headers immediately
const initialToken = localStorage.getItem('session_token');
if (initialToken) {
  http.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}

// Failsafe Interceptor: Double check the token before every single request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('session_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function getMe() {
  const r = await http.get('/auth/me');
  return r.data;
}

export async function exchangeSession(session_id) {
  const r = await http.post('/auth/session', { session_id });
  return r.data;
}

export async function logout() {
  localStorage.removeItem('session_token');
  delete http.defaults.headers.common['Authorization'];
  try {
    await http.post('/auth/logout');
  } catch (e) {}
}

export async function exportAccount() {
  const r = await http.get('/auth/export');
  return r.data;
}

export async function deleteAccount() {
  const r = await http.delete('/auth/delete-account');
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

export async function grantRewarded(tier) {
  const r = await http.post('/usage/grant-rewarded', { tier });
  return r.data;
}

export async function markPremium() {
  const r = await http.post('/billing/mark-premium');
  return r.data;
}

export async function wakeUpServer() {
  try {
    await axios.get(`${BASE}/health`, { timeout: 5000 });
    console.log("Backend server is awake and ready.");
  } catch (e) {
    console.warn("Backend server is waking up...");
  }
// Add an interceptor to inject the token into every single request automatically
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('session_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
}
