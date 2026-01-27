import api from './api';

export const getCurrentVerifs = async () => {
  try {
    const resp = await api.get('/verifications/current');
    console.log('Verif Service - getCurrentVerifs response:', resp);
    return resp.data;
  } catch (e) {
    const status = e?.response?.status;
    const code = e?.response?.data?.code;
    // If unauthenticated token issue, allow interceptor to redirect (will not reach here usually)
    if (status === 403) {
      console.warn('Verif Service - permission denied fetching verifications');
      return [];
    }
    return [];
  }
};

export const getSystemVerifications = async (systemId, filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.status) params.append('status', filters.status);
    
    const resp = await api.get(`/verifications/system/${systemId}?${params.toString()}`);
    console.log('Verif Service - getSystemVerifications response:', resp);
    return resp.data;
  } catch (e) {
    const status = e?.response?.status;
    if (status === 403) {
      console.warn('Verif Service - permission denied fetching system verifications');
      return [];
    }
    console.error('Verif Service - error:', e);
    return [];
  }
};

export default {
  getCurrentVerifs,
  getSystemVerifications,
};
