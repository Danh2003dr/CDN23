import apiService from './apiService';
import { User, LoginForm, RegisterForm, ApiResponse } from '../types';

export const authService = {
  // Login user
  async login(credentials: LoginForm): Promise<ApiResponse<{ user: User; token: string; requirePasswordChange?: boolean }>> {
    return apiService.post('/auth/login', credentials);
  },

  // Register new user
  async register(userData: RegisterForm): Promise<ApiResponse<{ user: User; token: string; verificationToken?: string }>> {
    return apiService.post('/auth/register', userData);
  },

  // Get current user
  async getMe(): Promise<ApiResponse<{ user: User }>> {
    return apiService.get('/auth/me');
  },

  // Update user profile
  async updateProfile(userData: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    return apiService.put('/auth/profile', userData);
  },

  // Change password
  async changePassword(data: { currentPassword?: string; newPassword: string }): Promise<ApiResponse<{ requirePasswordChange: boolean }>> {
    return apiService.put('/auth/change-password', data);
  },

  // Forgot password
  async forgotPassword(email: string): Promise<ApiResponse<{ resetToken: string }>> {
    return apiService.post('/auth/forgot-password', { email });
  },

  // Reset password
  async resetPassword(resetToken: string, password: string): Promise<ApiResponse<void>> {
    return apiService.put(`/auth/reset-password/${resetToken}`, { password });
  },

  // Verify email
  async verifyEmail(verificationToken: string): Promise<ApiResponse<void>> {
    return apiService.put(`/auth/verify-email/${verificationToken}`);
  },

  // Logout
  async logout(): Promise<ApiResponse<void>> {
    return apiService.post('/auth/logout');
  },

  // Local storage helpers
  setToken(token: string): void {
    localStorage.setItem('token', token);
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  removeToken(): void {
    localStorage.removeItem('token');
  },

  setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  removeUser(): void {
    localStorage.removeItem('user');
  },

  clearAuth(): void {
    this.removeToken();
    this.removeUser();
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }
};