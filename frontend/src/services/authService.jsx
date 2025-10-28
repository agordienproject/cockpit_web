import api from './api';

class AuthService {
    // Login function
    async login(credentials) {
        try {
            console.log("Login function called");
            console.log(credentials);
            console.log("Full URL: ", api.defaults.baseURL + '/auth/login');

            const response = await api.post('/auth/login', credentials);
            
            // Store user data in localStorage
            if (response.data) {
                localStorage.setItem('userId', response.data.id_user);
                localStorage.setItem('role', response.data.role);
                localStorage.setItem('token', response.data.token || '');
            }
            
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: 'Login failed' };
        }
    }

    // Logout function
    async logout() {
        console.log("Logout function called");
        try {
            // Call backend logout endpoint to clear cookies
            await api.get('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear localStorage regardless of backend response
            localStorage.removeItem('userId');
            localStorage.removeItem('role');
            localStorage.removeItem('token');
            localStorage.setItem('isAuthenticated', false);
        }
    }

    // Get current user from localStorage
    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!localStorage.getItem('token');
    }

    // Get user token
    getToken() {
        return localStorage.getItem('token');
    }

    // Update user data in localStorage
    updateUserData(userData) {
        localStorage.setItem('user', JSON.stringify(userData));
    }

    // Refresh user data from backend
    async refreshUserData() {
        try {
            const response = await api.get('/auth/me');
            if (response.data.user) {
                this.updateUserData(response.data.user);
                return response.data.user;
            }
        } catch (error) {
            console.error('Failed to refresh user data:', error);
            throw error;
        }
    }

    // Check if user has specific role
    hasRole(role) {
        const user = this.getCurrentUser();
        return user && user.role === role;
    }

    // Check if user has any of the specified roles
    hasAnyRole(roles) {
        const user = this.getCurrentUser();
        return user && roles.includes(user.role);
    }
}

export default new AuthService(); 