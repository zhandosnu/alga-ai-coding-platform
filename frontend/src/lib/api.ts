import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('alga_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('alga_token');
      localStorage.removeItem('alga_user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  },
);

// Auth
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

// Problems
export const problemsApi = {
  list: (params?: { tag?: string; difficulty?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/problems', { params }).then((r) => r.data),
  listAdmin: (params?: { tag?: string; difficulty?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/problems/admin', { params }).then((r) => r.data),
  getById: (id: string) => api.get(`/problems/${id}`).then((r) => r.data),
  getBySlug: (slug: string) => api.get(`/problems/slug/${slug}`).then((r) => r.data),
  getTags: () => api.get('/problems/tags').then((r) => r.data as string[]),
  create: (data: any) => api.post('/problems', data).then((r) => r.data),
  update: (id: string, data: any) => api.put(`/problems/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/problems/${id}`).then((r) => r.data),
};

// Submissions
export const submissionsApi = {
  submit: (data: { problemId: string; code: string; language: string }) =>
    api.post('/submissions', data).then((r) => r.data),
  getById: (id: string) => api.get(`/submissions/${id}`).then((r) => r.data),
  getMy: (params?: { page?: number; limit?: number }) =>
    api.get('/submissions/my', { params }).then((r) => r.data),
  /** Fetch persisted submissions for current user on a specific problem */
  getByProblem: (problemId: string) =>
    api.get(`/submissions/problem/${problemId}`).then((r) => r.data as any[]),
};

// Hints
export const hintsApi = {
  request: (data: { problemId: string; code?: string; hintLevel?: number; language?: string }) =>
    api.post('/hints/request', data).then((r) => r.data),
  getSession: (problemId: string) => api.get(`/hints/session/${problemId}`).then((r) => r.data),
  clearSession: (problemId: string) => api.delete(`/hints/session/${problemId}`).then((r) => r.data),
};

// Users
export const usersApi = {
  leaderboard: (limit?: number) =>
    api.get('/users/leaderboard', { params: { limit } }).then((r) => r.data),
};

// Recommendations
export const recommendationsApi = {
  next: () => api.get('/recommendations/next').then((r) => r.data),
  stats: () => api.get('/recommendations/stats').then((r) => r.data),
};
