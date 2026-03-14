import axiosInstance from './axiosInstance';
export const getTransfersApi = (params) => axiosInstance.get('/transfers', { params });
export const getTransferApi = (id) => axiosInstance.get(`/transfers/${id}`);
export const createTransferApi = (data) => axiosInstance.post('/transfers', data);
export const confirmTransferApi = (id) => axiosInstance.patch(`/transfers/${id}/confirm`);
export const cancelTransferApi = (id) => axiosInstance.patch(`/transfers/${id}/cancel`);
