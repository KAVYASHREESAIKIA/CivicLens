import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If unauthorized and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
                        headers: { Authorization: `Bearer ${refreshToken}` }
                    });

                    const { access_token } = response.data;
                    localStorage.setItem('token', access_token);

                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    refresh: () => api.post('/auth/refresh'),
};

// Complaints API
export const complaintsAPI = {
    create: (data) => {
        if (data instanceof FormData) {
            return api.post('/complaints', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        }
        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] !== null && data[key] !== undefined) {
                formData.append(key, data[key]);
            }
        });
        return api.post('/complaints', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    getAll: (params) => api.get('/complaints', { params }),
    getOne: (id) => api.get(`/complaints/${id}`),
    getMyComplaints: (params) => api.get('/complaints/my', { params }),
    updateStatus: (id, data) => api.put(`/complaints/${id}/status`, data),
    getNearby: (params) => api.get('/complaints/nearby', { params }),
    track: (complaintId) => api.get(`/complaints/track/${complaintId}`),
};

// Admin API
export const adminAPI = {
    getDashboard: () => api.get('/admin/dashboard'),
    getUsers: (params) => api.get('/admin/users', { params }),
    updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
    deleteUser: (id) => api.delete(`/admin/users/${id}`),
    getHeatmap: (params) => api.get('/admin/heatmap', { params }),
    assignComplaint: (complaintId, officerId) =>
        api.post(`/admin/complaints/${complaintId}/assign`, { officer_id: officerId }),
    getDepartments: () => api.get('/admin/departments'),
    getOfficers: (params) => api.get('/admin/officers', { params }),
};

// Officer API
export const officerAPI = {
    getDashboard: () => api.get('/officer/dashboard'),
    getMyComplaints: (params) => api.get('/officer/complaints', { params }),
    updateComplaintStatus: (id, data) => api.put(`/officer/complaints/${id}/status`, data),
    addNote: (id, data) => api.post(`/officer/complaints/${id}/notes`, data),
};

// Analytics API
export const analyticsAPI = {
    getOverview: (params) => api.get('/analytics/overview', { params }),
    getTrends: (params) => api.get('/analytics/trends', { params }),
    getCategories: (params) => api.get('/analytics/categories', { params }),
    getHotspots: (params) => api.get('/analytics/hotspots', { params }),
    getDepartmentPerformance: (params) => api.get('/analytics/departments', { params }),
    getResolutionTimes: (params) => api.get('/analytics/resolution-times', { params }),
};

export default api;
