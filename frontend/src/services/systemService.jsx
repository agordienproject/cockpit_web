import api from './api';

export const getAllSystems = async () => {
  const resp = await api.get('/systems');
  return resp.data;
};

export const getSystemById = async (id) => {
  const resp = await api.get(`/systems/${id}`);
  return resp.data;
};

export const createSystem = async (payload) => {
  const resp = await api.post('/systems', payload);
  return resp.data;
};

export const updateSystem = async (id, payload) => {
  const resp = await api.put(`/systems/${id}`, payload);
  return resp.data;
};

export const deleteSystem = async (id) => {
  const resp = await api.delete(`/systems/${id}`);
  return resp.data;
};

// Referential endpoints for system types
export const getAllRefSystems = async (filters = null) => {
  let url = '/systems/sys-ref';
  if (filters && Object.keys(filters).length > 0) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') params.append(k, String(v)); });
    url += `?${params.toString()}`;
  }
  const resp = await api.get(url);
  return resp.data;
};

export const createRefSystem = async (payload) => {
  const resp = await api.post('/systems/sys-ref', payload);
  return resp.data;
};

export const updateRefSystem = async (id, payload) => {
  const resp = await api.put(`/systems/sys-ref/${id}`, payload);
  return resp.data;
};

export const deleteRefSystem = async (id) => {
  const resp = await api.delete(`/systems/sys-ref/${id}`);
  return resp.data;
};

export const getDisabledRefSystems = async () => {
  const resp = await api.get('/systems/sys-ref/disabled');
  return resp.data;
};

export const activateRefSystem = async (id) => {
  const resp = await api.put(`/systems/sys-ref/${id}/activate`);
  return resp.data;
};

export default { getAllSystems, getSystemById, createSystem, updateSystem, deleteSystem, getAllRefSystems, createRefSystem, updateRefSystem, deleteRefSystem, getDisabledRefSystems, activateRefSystem };
