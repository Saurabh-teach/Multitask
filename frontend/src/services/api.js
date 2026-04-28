import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api/auth/';

export const authAPI = {
    register: (data) => axios.post(`${API_BASE}register/`, data),
    verifyOTP: (data) => axios.post(`${API_BASE}verify-otp/`, data),
    login: (data) => axios.post(`${API_BASE}login/`, data),
};