import api from './api.js';

export async function fetchSites() {
  const { data } = await api.get('/api/sites');
  return data.sites;
}

export async function createSite({ name, domain }) {
  const { data } = await api.post('/api/sites', { name, domain });
  return data.site;
}

export async function fetchDashboard(siteId, range = '30d') {
  const { data } = await api.get(`/api/dashboard/${siteId}/full`, { params: { range } });
  return data;
}

export async function fetchLiveVisitors(siteId) {
  const { data } = await api.get(`/api/dashboard/${siteId}/live`);
  return data;
}

export function getPdfExportUrl(siteId, range = '30d') {
  const token = localStorage.getItem('auth_token');
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return `${base}/api/export/${siteId}/pdf?range=${range}&token=${token}`;
}

export async function downloadCsv(siteId, type, range = '30d') {
  const { data } = await api.get(`/api/export/${siteId}/csv`, {
    params: { type, range },
    responseType: 'blob',
  });
  return data;
}
