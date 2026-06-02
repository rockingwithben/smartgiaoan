import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const rawBase = process.env.REACT_APP_BACKEND_URL
  ? process.env.REACT_APP_BACKEND_URL.replace(/\/$/, '')
  : 'https://smartgiaoan.onrender.com';
const BASE = rawBase.replace(/\/api$/, '');

export const API = `${BASE}/api`;
export const BACKEND_BASE = BASE;

export const http = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Add an idempotency key to mutating requests to prevent duplicate writes.
http.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};

  if (['post', 'put', 'patch'].includes(config.method?.toLowerCase())) {
    config.headers['Idempotency-Key'] = config.headers['Idempotency-Key'] ?? uuidv4();
  }

  return config;
});

// Response interceptor with request-scoped retry logic
const MAX_RETRIES = 2;

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    if (!config) {
      return Promise.reject(error);
    }

    const isNetworkError = !error.response;
    const isServerError = error.response?.status >= 500;
    const shouldRetry = isNetworkError || isServerError;

    if (!shouldRetry) {
      return Promise.reject(error);
    }

    config.__retryCount = config.__retryCount ?? 0;

    if (config.__retryCount >= MAX_RETRIES) {
      return Promise.reject(error);
    }

    config.__retryCount += 1;
    const delay = 2 ** config.__retryCount * 1000;

    await new Promise((resolve) => setTimeout(resolve, delay));
    return http(config);
  }
);

// Email/password auth helpers.
export async function loginWithEmail(email, password) {
  const r = await http.post('/auth/login', { email, password });
  return r.data;
}

export async function registerWithEmail(email, password, name, role) {
  const r = await http.post('/auth/register', { email, password, name, role });
  return r.data;
}

export async function getMe() {
  const r = await http.get('/auth/me');
  return r.data;
}

export async function logout() {
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

export async function uploadLibraryWorksheet(payload) {
  const r = await http.post('/library/upload', payload);
  return r.data;
}

export async function aiEditWorksheet(worksheet_id, command) {
  const r = await http.post('/worksheets/ai-edit', { worksheet_id, command });
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

export async function capturePayPal(order_id, product_type) {
  const r = await http.post('/billing/paypal-capture', { order_id, product_type });
  return r.data;
}

export async function wakeUpServer() {
  try {
    await axios.get(`${BASE}/health`, { timeout: 5000 });
    console.log("Backend server is awake and ready.");
  } catch (e) {
    console.warn("Backend server is waking up...");
  }
}
