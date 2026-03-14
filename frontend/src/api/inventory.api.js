import axiosInstance from './axiosInstance';
export const getStockApi = (params) => axiosInstance.get('/inventory', { params });
export const getStockSummaryApi = () => axiosInstance.get('/inventory/summary');
