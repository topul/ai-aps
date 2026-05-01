import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/useUserStore';
import { authApi } from '../services/api';

export function useAuth() {
  const navigate = useNavigate();
  const { user, token, setUser, setToken, logout } = useUserStore();

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await authApi.login(username, password);
      const accessToken = response.data.access_token;
      localStorage.setItem('access_token', accessToken);
      setToken(accessToken);
      
      const userResponse = await authApi.me();
      setUser(userResponse.data);
      
      navigate('/');
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }, [navigate, setToken, setUser]);

  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      try {
        setToken(storedToken);
        const response = await authApi.me();
        setUser(response.data);
        return true;
      } catch {
        logout();
        return false;
      }
    }
    return false;
  }, [setToken, setUser, logout]);

  return {
    user,
    token,
    isAuthenticated: !!token,
    login,
    logout: () => {
      localStorage.removeItem('access_token');
      logout();
      navigate('/login');
    },
    checkAuth,
  };
}