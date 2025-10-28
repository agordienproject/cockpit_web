import api from './api';

export const getAllMachines = async () => {
  const resp = await api.get('/machines');
  return resp.data;
};

export const getMachineById = async (id) => {
  const resp = await api.get(`/machines/${id}`);
  return resp.data;
};

export default { getAllMachines, getMachineById };
