import axiosInstance from './axiosInstance';
export const getDeliveriesApi = (params) => axiosInstance.get('/deliveries', { params });
export const getDeliveryApi = (id) => axiosInstance.get(`/deliveries/${id}`);
export const createDeliveryApi = (data) => axiosInstance.post('/deliveries', data);
export const updateDeliveryApi = (id, data) => axiosInstance.put(`/deliveries/${id}`, data);
export const validateDeliveryApi = (id) => axiosInstance.patch(`/deliveries/${id}/validate`);
export const cancelDeliveryApi = (id) => axiosInstance.patch(`/deliveries/${id}/cancel`);
