import api from './api';

class UserService {
  // Get all users (admin only)
  async getUsers(params = {}) {
    try {
      const response = await api.get('/users', { params });
      console.log('Fetched users:', response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch users' };
    }
  }

  // Get user by ID
  async getUserById(id) {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user' };
    }
  }

  // Update user profile and password in one call
  async updateProfileAndPassword(profileData, id) {
    try {
      const response = await api.put(`/users/${id}`, profileData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  }

  // Create new user (admin only)
  async createUser(userData) {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create user' };
    }
  }

  // Update user (admin only)
  async updateUser(id, userData) {
    try {
      const response = await api.put(`/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user' };
    }
  }

  // Delete user (admin only)
  async deleteUser(id) {
    try {
      console.log(`Deleting user with ID: ${id}`);
      const response = await api.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete user' };
    }
  }

  // Reactivate user (admin only)
  async activateUser(id) {
    try {
      const response = await api.put(`/users/${id}/activate`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to reactivate user' };
    }
  }

  // Get user statistics
  async getUserStats() {
    try {
      const response = await api.get('/users/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user stats' };
    }
  }

  // Get user activity
  async getUserActivity(userId) {
    try {
      const response = await api.get(`/users/${userId}/activity`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch user activity' };
    }
  }

  // Reset user password (admin only)
  async resetUserPassword(userId) {
    try {
      const response = await api.post(`/users/${userId}/reset-password`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to reset password' };
    }
  }

  // Get user roles
  async getUserRoles() {
    try {
      const response = await api.get('/users/roles');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch roles' };
    }
  }

  // Update user role (admin only)
  async updateUserRole(userId, role) {
    try {
      const response = await api.put(`/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update user role' };
    }
  }
}

export default new UserService();