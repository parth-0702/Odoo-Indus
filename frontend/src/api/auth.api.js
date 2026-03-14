import axiosInstance from './axiosInstance';
export const loginApi = (data) => axiosInstance.post('/auth/login', data);
export const registerApi = (data) => axiosInstance.post('/auth/register', data);
export const getMeApi = () => axiosInstance.get('/auth/me');
