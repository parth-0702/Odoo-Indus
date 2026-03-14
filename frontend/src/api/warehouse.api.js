import axiosInstance from './axiosInstance';
export const getWarehousesApi = () => axiosInstance.get('/warehouses');
export const getWarehouseApi = (id) => axiosInstance.get(`/warehouses/${id}`);
export const createWarehouseApi = (data) => axiosInstance.post('/warehouses', data);
export const updateWarehouseApi = (id, data) => axiosInstance.put(`/warehouses/${id}`, data);
export const addLocationApi = (id, data) => axiosInstance.post(`/warehouses/${id}/locations`, data);
export const deleteLocationApi = (warehouseId, locationId) => axiosInstance.delete(`/warehouses/${warehouseId}/locations/${locationId}`);
