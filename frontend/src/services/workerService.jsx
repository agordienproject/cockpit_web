import api from './api';

export const getAllWorkers = async () => {
  const resp = await api.get('/workers');
  return resp.data;
};

export const getWorkerById = async (id) => {
  const resp = await api.get(`/workers/${id}`);
  return resp.data;
};

export const createWorker = async (payload) => {
  const resp = await api.post('/workers', payload);
  return resp.data;
};

export const updateWorker = async (id, payload) => {
  const resp = await api.put(`/workers/${id}`, payload);
  return resp.data;
};

export const deleteWorker = async (id) => {
  const resp = await api.delete(`/workers/${id}`);
  return resp.data;
};

export default { getAllWorkers, getWorkerById, createWorker, updateWorker, deleteWorker };
