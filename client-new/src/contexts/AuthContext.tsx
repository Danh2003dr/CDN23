import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Set axios base URL
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

interface User {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  role_name: string;
  permissions: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is already logged in on app start
  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token && mounted) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        await checkAuthStatus();
      } else if (mounted) {
        setLoading(false);
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get('/api/auth/profile');
      if (response.data.success) {
        setUser(response.data.data);
      } else {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('📤 Sending login request...');
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      console.log('📥 Login response:', response.data);

      if (response.data.success) {
        const { token, user } = response.data.data;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(user);
        console.log('✅ User logged in:', user.first_name, user.last_name);
        // Redirect to dashboard after successful login
        navigate('/dashboard');
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      console.error('❌ Login error details:', error);
      
      // Clear any existing token on error
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      
      if (error.response) {
        // Server responded with error
        const status = error.response.status;
        const message = error.response.data?.message;
        
        if (status === 401) {
          throw new Error('Email hoặc mật khẩu không đúng');
        } else if (status === 500) {
          throw new Error('Lỗi server. Vui lòng thử lại sau.');
        } else {
          throw new Error(message || `Lỗi server (${status})`);
        }
      } else if (error.request) {
        // Network error
        throw new Error('Lỗi kết nối. Vui lòng kiểm tra mạng.');
      } else {
        // Other error
        throw new Error(error.message || 'Đăng nhập thất bại');
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 