import { Platform } from 'react-native';
import config from '../constants/config';

const BASE_URL = config.API_URL;

const buildHeaders = (token, isJson = true) => {
  const headers = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  let data;

  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    const text = await response.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const errorMessage =
      data?.error || data?.message || data?.detail || `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

const request = async (endpoint, options = {}) => {
  const { method = 'GET', body, token, isFormData = false } = options;

  const url = `${BASE_URL}${endpoint}`;
  const headers = buildHeaders(token, !isFormData);

  const fetchOptions = {
    method,
    headers,
  };

  if (body) {
    fetchOptions.body = isFormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    return await handleResponse(response);
  } catch (error) {
    if (error.status) {
      throw error;
    }
    // Network error
    const networkError = new Error(
      'Unable to connect to the server. Please check your internet connection and try again.'
    );
    networkError.isNetworkError = true;
    throw networkError;
  }
};

export const api = {
  // ── Authentication ──────────────────────────────────────────────────

  login: (email, password) =>
    request('/api/login', {
      method: 'POST',
      body: { email, password },
    }),

  register: (name, email, password) =>
    request('/api/register', {
      method: 'POST',
      body: { name, email, password },
    }),

  checkAuthStatus: (token) =>
    request('/api/auth/status', {
      method: 'GET',
      token,
    }),

  logout: (token) =>
    request('/api/logout', {
      method: 'POST',
      token,
    }),

  // ── Chat ────────────────────────────────────────────────────────────

  sendMessage: (message, token) =>
    request('/api/chat', {
      method: 'POST',
      body: { message },
      token,
    }),

  sendStreamMessage: (message, token) =>
    request('/api/chat/stream', {
      method: 'POST',
      body: { message },
      token,
    }),

  // ── Documents ───────────────────────────────────────────────────────

  uploadDocument: (fileUri, fileName, token) => {
    const formData = new FormData();
    const fileType = fileName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';

    formData.append('file', {
      uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
      name: fileName,
      type: fileType,
    });

    return request('/api/upload', {
      method: 'POST',
      body: formData,
      token,
      isFormData: true,
    });
  },

  scrapeUrl: (url, token) =>
    request('/api/scrape', {
      method: 'POST',
      body: { url },
      token,
    }),

  summarizeText: (text, maxLength, token) =>
    request('/api/summarize', {
      method: 'POST',
      body: { text, max_length: maxLength },
      token,
    }),

  // ── Memory & Session ───────────────────────────────────────────────

  getMemory: (token) =>
    request('/api/memory', {
      method: 'GET',
      token,
    }),

  clearSession: (token) =>
    request('/api/clear', {
      method: 'POST',
      token,
    }),

  // ── Conversations ──────────────────────────────────────────────────

  getConversations: (token) =>
    request('/api/conversations', {
      method: 'GET',
      token,
    }),

  saveConversation: (id, title, token) =>
    request('/api/conversations', {
      method: 'POST',
      body: { id, title },
      token,
    }),

  loadConversation: (id, token) =>
    request(`/api/conversations/${id}`, {
      method: 'GET',
      token,
    }),

  deleteConversation: (id, token) =>
    request(`/api/conversations/${id}`, {
      method: 'DELETE',
      token,
    }),

  renameConversation: (id, title, token) =>
    request(`/api/conversations/${id}/rename`, {
      method: 'PUT',
      body: { title },
      token,
    }),

  // ── Messages ───────────────────────────────────────────────────────

  editMessage: (index, message, token) =>
    request(`/api/messages/${index}/edit`, {
      method: 'PUT',
      body: { message },
      token,
    }),

  // ── Personas ───────────────────────────────────────────────────────

  getPersonas: (token) =>
    request('/api/persona', {
      method: 'GET',
      token,
    }),

  setPersona: (persona, token) =>
    request('/api/persona', {
      method: 'PUT',
      body: { persona },
      token,
    }),
};

export default api;
