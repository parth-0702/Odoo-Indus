import axiosInstance from './axiosInstance';
export const getMovementsApi = (params) => axiosInstance.get('/movements', { params });
