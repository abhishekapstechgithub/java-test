import axios from 'axios';

// In production the React app is served by Nginx, which proxies /api to backend:8080
const BASE_URL = process.env.REACT_APP_API_URL || '/api/tasks';

const api = axios.create({ baseURL: BASE_URL });

export const getTasks    = ()            => api.get('/');
export const getTask     = (id)          => api.get(`/${id}`);
export const createTask  = (task)        => api.post('/', task);
export const updateTask  = (id, task)    => api.put(`/${id}`, task);
export const deleteTask  = (id)          => api.delete(`/${id}`);
export const getByStatus = (status)      => api.get(`/status/${status}`);
