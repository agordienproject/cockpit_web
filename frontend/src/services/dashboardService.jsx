import api from './api';

class DashboardService {
  // Get dashboard overview data
  async getDashboardOverview() {
    try {
      const response = await api.get('/dashboard/overview');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch dashboard data' };
    }
  }

  // Get inspection statistics
  async getInspectionStats() {
    try {
      const response = await api.get('/dashboards/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch inspection stats' };
    }
  }

  // Get piece current state
  async getPieceCurrentState() {
    try {
      const response = await api.get('/dashboards/pieces');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch piece data' };
    }
  }

  // Get inspector performance
  async getInspectorPerformance() {
    try {
      const response = await api.get('/dashboards/inspectors');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch inspector performance' };
    }
  }

  // Get daily trends
  async getDailyTrends() {
    try {
      const response = await api.get('/dashboards/trends');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch daily trends' };
    }
  }

  // Get piece history summary
  async getPieceHistorySummary() {
    try {
      const response = await api.get('/dashboards/piece-history');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch piece history' };
    }
  }

  // Get recent inspections
  async getRecentInspections() {
    try {
      const response = await api.get(`/inspections/recent`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch recent inspections' };
    }
  }

  // Get pending validations count
  async getPendingValidationsCount() {
    try {
      const response = await api.get('/dashboards/pending-validations-count');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch pending validations count' };
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

  // Get validation time distribution
  async getValidationTimeDistribution({ from, to, groupBy = 'day' } = {}) {
    try {
      const formattedFrom = this.formatDateParam(from);
      const formattedTo = this.formatDateParam(to);
      let url = '/dashboards/validation-times?';
      if (formattedFrom) url += `from=${encodeURIComponent(formattedFrom)}&`;
      if (formattedTo) url += `to=${encodeURIComponent(formattedTo)}&`;
      if (groupBy) url += `groupBy=${encodeURIComponent(groupBy)}`;
      console.log(`Fetching validation time distribution with URL: ${url}`);
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch validation time distribution' };
    }
  }
}

export default new DashboardService();