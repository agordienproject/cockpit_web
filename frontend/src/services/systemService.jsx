import api from './api';

export const getAllSystems = async () => {
  const resp = await api.get('/systems');
  return resp.data;
};

export const getSystemById = async (id) => {
  const resp = await api.get(`/systems/${id}`);
  return resp.data;
};

export default { getAllSystems, getSystemById };
