import api from './api';

export const getAllServices = async (filters = null) => {
  let url = '/users/services';
  if (filters && Object.keys(filters).length > 0) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') params.append(k, String(v)); });
    url += `?${params.toString()}`;
  }
  const resp = await api.get(url);
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

export const getDisabledServices = async () => {
  const resp = await api.get('/users/services/disabled');
  return resp.data;
};

export const activateService = async (id) => {
  const resp = await api.put(`/users/services/${id}/activate`);
  return resp.data;
};

export default { getAllServices, getServiceById, createService, updateService, deleteService, getDisabledServices, activateService };
