import axios from 'axios';

export const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const http = axios.create({
  baseURL: API,
  withCredentials: true,
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
