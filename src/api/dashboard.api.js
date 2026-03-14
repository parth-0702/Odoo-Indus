import axiosInstance from './axiosInstance';
export const getDashboardStatsApi = () => axiosInstance.get('/dashboard/stats');
