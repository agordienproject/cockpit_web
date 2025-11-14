import api from './api';

export const getAllMachines = async () => {
  const resp = await api.get('/machines');
  return resp.data;
};

export const getMachineById = async (id) => {
  const resp = await api.get(`/machines/${id}`);
  return resp.data;
};

export const createMachine = async (payload) => {
  const resp = await api.post('/machines', payload);
  return resp.data;
};

export const updateMachine = async (id, payload) => {
  const resp = await api.put(`/machines/${id}`, payload);
  return resp.data;
};

export const deleteMachine = async (id) => {
  const resp = await api.delete(`/machines/${id}`);
  return resp.data;
};

export const testMachineById = async (id) => {
  const resp = await api.get(`/machines/${id}/test`);
  return resp.data;
};

export const testExporterUrl = async (url) => {
  const params = new URLSearchParams({ url });
  console.log('Testing URL:', url);
  if (typeof url === 'string' && url.startsWith('host.docker.internal')) {
    console.log('Replacing host.docker.internal with localhost');
    params.set('url', url.replace('host.docker.internal', 'localhost'));
  }
  console.log('Final URL for testing:', params.get('url'));
  const resp = await api.get(`/machines/test-url?${params.toString()}`);
  return resp.data;
};

// Referential endpoints for machine types
export const getAllRefMachines = async (filters = null) => {
  let url = '/machines/machine-ref';
  if (filters && Object.keys(filters).length > 0) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') params.append(k, String(v)); });
    url += `?${params.toString()}`;
  }
  const resp = await api.get(url);
  return resp.data;
};

export const createRefMachine = async (payload) => {
  const resp = await api.post('/machines/machine-ref', payload);
  return resp.data;
};

export const updateRefMachine = async (id, payload) => {
  const resp = await api.put(`/machines/machine-ref/${id}`, payload);
  return resp.data;
};

export const deleteRefMachine = async (id) => {
  const resp = await api.delete(`/machines/machine-ref/${id}`);
  return resp.data;
};

export const getDisabledRefMachines = async () => {
  const resp = await api.get('/machines/machine-ref/disabled');
  return resp.data;
};

export const activateRefMachine = async (id) => {
  const resp = await api.put(`/machines/machine-ref/${id}/activate`);
  return resp.data;
};

export default { getAllMachines, getMachineById, createMachine, updateMachine, deleteMachine, testMachineById, testExporterUrl, getAllRefMachines, createRefMachine, updateRefMachine, deleteRefMachine, getDisabledRefMachines, activateRefMachine };
