import api from './api';

class InspectionService {
  // Get all inspections with pagination and filters
  async getInspections(params = {}) {
    try {
      const response = await api.get('/inspections', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch inspections' };
    }
  }

  // Get inspection by ID
  async getInspectionById(id) {
    try {
      const response = await api.get(`/inspections/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch inspection' };
    }
  }

  // Create new inspection
  async createInspection(inspectionData) {
    try {
      const response = await api.post('/inspections', inspectionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create inspection' };
    }
  }

  // Update inspection
  async updateInspection(id, inspectionData) {
    try {
      const response = await api.put(`/inspections/${id}`, inspectionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update inspection' };
    }
  }

  // Delete inspection
  async deleteInspection(id) {
    try {
      const response = await api.delete(`/inspections/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete inspection' };
    }
  }

  // Validate inspection (for chiefs/admins)
  async validateInspection(id, validationData) {
    try {
      console.log(`Validating inspection with ID: ${id}`, validationData);
      const response = await api.put(`/inspections/${id}/status`, validationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to validate inspection' };
    }
  }

  // Get validation queue
  async getValidationQueue() {
    try {
      const response = await api.get('/inspections/validation-queue');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch validation queue' };
    }
  }

  // Get pieces for inspection
  async getPiecesForInspection(inspectionId) {
    try {
      const response = await api.get(`/inspections/${inspectionId}/pieces`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch pieces' };
    }
  }

  // Add piece to inspection
  async addPieceToInspection(inspectionId, pieceData) {
    try {
      const response = await api.post(`/inspections/${inspectionId}/pieces`, pieceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add piece' };
    }
  }

  // Update piece in inspection
  async updatePieceInInspection(inspectionId, pieceId, pieceData) {
    try {
      const response = await api.put(`/inspections/${inspectionId}/pieces/${pieceId}`, pieceData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update piece' };
    }
  }

  // Get inspection history
  async getInspectionHistory(id) {
    try {
      const response = await api.get(`/inspections/${id}/history`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch inspection history' };
    }
  }

  // Export inspection report
  async exportInspectionReport(id, format = 'pdf') {
    try {
      const response = await api.get(`/inspections/${id}/export`, {
        params: { format },
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to export report' };
    }
  }
}

export default new InspectionService(); 