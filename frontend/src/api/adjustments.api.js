import axiosInstance from './axiosInstance';
export const getAdjustmentsApi = (params) => axiosInstance.get('/adjustments', { params });
export const getAdjustmentApi = (id) => axiosInstance.get(`/adjustments/${id}`);
export const createAdjustmentApi = (data) => axiosInstance.post('/adjustments', data);
export const applyAdjustmentApi = (id) => axiosInstance.patch(`/adjustments/${id}/apply`);
