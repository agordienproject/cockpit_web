import api from './api';

export const getAllWorkers = async () => {
  const resp = await api.get('/workers');
  return resp.data;
};

export const getWorkerById = async (id) => {
  const resp = await api.get(`/workers/${id}`);
  return resp.data;
};

export default { getAllWorkers, getWorkerById };
