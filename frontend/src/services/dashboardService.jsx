import api from './api';

class DashboardService {
  // Get dashboard overview data
  async getDashboardOverview() {
    try {
      const response = await api.get('/dashboards');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch dashboard data' };
    }
  }
  // Get machines list from dashboard (shortcut)
  async getMachines() {
    try {
      const response = await api.get('/dashboards/machines');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch machines' };
    }
  }

  // Get workers list from dashboard (shortcut)
  async getWorkers() {
    try {
      const response = await api.get('/dashboards/workers');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch workers' };
    }
  }

  // Helper to format date as YYYY-MM-DD
  formatDateParam(val) {
    if (!val) return undefined;
    if (val instanceof Date && !isNaN(val)) {
      return val.toISOString().slice(0, 10);
    }
    if (typeof val === 'string') {
      // Try to parse string to Date and format
      const d = new Date(val);
      if (!isNaN(d)) {
        return d.toISOString().slice(0, 10);
      }
      // If already in YYYY-MM-DD, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    }
    return undefined;
  }

  // Validation time distribution (removed with inspections)
}

export default new DashboardService();