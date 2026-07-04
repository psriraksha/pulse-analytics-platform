import api from './api.js';

export async function signup({ name, email, password, domain }) {
  const { data } = await api.post('/api/auth/signup', { name, email, password, domain });
  return data;
}

export async function login({ email, password }) {
  const { data } = await api.post('/api/auth/login', { email, password });
  return data;
}

export async function fetchMe() {
  const { data } = await api.get('/api/auth/me');
  return data;
}
