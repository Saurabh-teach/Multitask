import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/auth';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor for Auth
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor for Token Expiration
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Optional: Handle logout or token refresh
            console.warn('Unauthorized! Redirecting to login or refreshing token...');
        }
        return Promise.reject(error);
    }
);

export default apiClient;
