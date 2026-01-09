import api from './api';

export const getAllDatabases = async () => {
  try {
    const resp = await api.get('/databases');
    return resp.data || [];
  } catch (err) {
    console.warn('Failed to fetch databases:', err.message);
    return [];
  }
};

export const getDatabaseById = async (id) => {
  try {
    const resp = await api.get(`/databases/${id}`);
    return resp.data;
  } catch (err) {
    console.error('Failed to fetch database:', err.message);
    throw err;
  }
};

export const createDatabase = async (payload) => {
  const resp = await api.post('/databases', payload);
  return resp.data;
};

export const updateDatabase = async (id, payload) => {
  const resp = await api.put(`/databases/${id}`, payload);
  return resp.data;
};

export const deleteDatabase = async (id) => {
  const resp = await api.delete(`/databases/${id}`);
  return resp.data;
};

export const testDatabaseById = async (id) => {
  const resp = await api.get(`/databases/${id}/test`);
  return resp.data;
};

export const testDatabaseConnection = async (connection) => {
  const resp = await api.post('/databases/test-connection', { connection });
  return resp.data;
};

export const testExporterUrl = async (url) => {
  const params = new URLSearchParams({ url });
  console.log('Testing DB URL:', url);
  const resp = await api.get(`/databases/test-url?${params.toString()}`);
  return resp.data;
};

// Referential endpoints for database types
export const getAllRefDatabases = async (filters = null) => {
  try {
    let url = '/databases/db-ref';
    if (filters && Object.keys(filters).length > 0) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') params.append(k, String(v)); });
      url += '?' + params.toString();
    }
    const resp = await api.get(url);
    return resp.data || [];
  } catch (err) {
    console.warn('Failed to fetch database referentials:', err.message);
    return [];
  }
};

export default {
  getAllDatabases,
  getDatabaseById,
  createDatabase,
  updateDatabase,
  deleteDatabase,
  testDatabaseById,
  testDatabaseConnection,
  testExporterUrl,
  getAllRefDatabases,
};
