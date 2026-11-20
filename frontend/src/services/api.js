const API_BASE = '/api/v1';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
      window.location.href = '/login';
    }
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.detail || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Authentication
  auth: {
    register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    getMe: () => request('/auth/me'),
  },

  // Videos
  videos: {
    process: (url) => request('/videos/process', { method: 'POST', body: JSON.stringify({ url }) }),
    list: () => request('/videos'),
    get: (id) => request(`/videos/${id}`),
    delete: (id) => request(`/videos/${id}`, { method: 'DELETE' }),
  },

  // Chat
  chat: {
    sendMessage: (videoId, question, conversationId = null) =>
      request(`/chat/${videoId}/message`, {
        method: 'POST',
        body: JSON.stringify({ question, conversation_id: conversationId }),
      }),
    getConversations: (videoId) => request(`/chat/${videoId}/conversations`),
    getConversation: (conversationId) => request(`/chat/conversations/${conversationId}`),
    deleteConversation: (conversationId) => request(`/chat/conversations/${conversationId}`, { method: 'DELETE' }),
  },

  // Summaries
  summaries: {
    generate: (videoId) => request(`/summaries/${videoId}/generate`, { method: 'POST' }),
    get: (videoId) => request(`/summaries/${videoId}`),
  },

  // Study Notes
  notes: {
    generate: (videoId) => request(`/notes/${videoId}/generate`, { method: 'POST' }),
    get: (videoId) => request(`/notes/${videoId}`),
    update: (noteId, content_markdown) =>
      request(`/notes/${noteId}`, { method: 'PUT', body: JSON.stringify({ content_markdown }) }),
  },

  // Quizzes
  quizzes: {
    generate: (videoId) => request(`/quizzes/${videoId}/generate`, { method: 'POST' }),
    get: (videoId) => request(`/quizzes/${videoId}`),
    submit: (quizId, answers) => request(`/quizzes/${quizId}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
  },

  // Dashboard
  dashboard: {
    getStats: () => request('/dashboard/stats'),
  },
};
