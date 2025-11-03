import api from './api';

export const getAllServices = async () => {
  const resp = await api.get('/users/services');
  return resp.data;
};

export const getServiceById = async (id) => {
  const resp = await api.get(`/users/services/${id}`);
  return resp.data;
};

export const createService = async (payload) => {
  const resp = await api.post('/users/services', payload);
  return resp.data;
};

export const updateService = async (id, payload) => {
  const resp = await api.put(`/users/services/${id}`, payload);
  return resp.data;
};

export const deleteService = async (id) => {
  const resp = await api.delete(`/users/services/${id}`);
  return resp.data;
};

export default { getAllServices, getServiceById, createService, updateService, deleteService };
