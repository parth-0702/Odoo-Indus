import axiosInstance from './axiosInstance';
export const getReceiptsApi = (params) => axiosInstance.get('/receipts', { params });
export const getReceiptApi = (id) => axiosInstance.get(`/receipts/${id}`);
export const createReceiptApi = (data) => axiosInstance.post('/receipts', data);
export const updateReceiptApi = (id, data) => axiosInstance.put(`/receipts/${id}`, data);
export const validateReceiptApi = (id) => axiosInstance.patch(`/receipts/${id}/validate`);
export const cancelReceiptApi = (id) => axiosInstance.patch(`/receipts/${id}/cancel`);
