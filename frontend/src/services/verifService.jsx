import api from './api';

const verifService = {
  async getCurrentVerifs() {
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
  }
};

export default verifService;
