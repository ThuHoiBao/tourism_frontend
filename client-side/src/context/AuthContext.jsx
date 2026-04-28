import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from '../utils/axiosCustomize';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await axios.get('/auth/profile'); 
            if (response) {
                const userData = response.data; 
                console.log('Fetched user profile:', userData);
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData)); 
            }
        } catch (error) {
            console.error("Lỗi cập nhật thông tin user:", error);
            setUser(null);
            setIsAuthenticated(false);
        }
    };

   const checkAuth = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const userStr = localStorage.getItem('user');

            if (token && userStr) {
                const userData = JSON.parse(userStr);
                setUser(userData);
                setIsAuthenticated(true);
                
                await fetchProfile(); 
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('Error checking auth:', error);
            logout(); 
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await axios.post('/auth/login', { email, password });
            const { accessToken, refreshToken, user: userData } = response.data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
            setIsAuthenticated(true);

            return { success: true, user: userData };
        } catch (error) {
            console.error('Login error:', error);
            throw error; 
        }
    };

    const loginWithGoogle = async (idToken) => {
        try {
            const response = await axios.post('/auth/google/login', { idToken });
            const { accessToken, refreshToken, user: userData } = response.data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
            setIsAuthenticated(true);

            return { success: true, user: userData };
        } catch (error) {
            console.error('Google login error:', error);
            throw error; 
        }
    };

    const register = async (registerData) => {
        try {
            const response = await axios.post('/auth/register', registerData);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Register error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Đăng ký thất bại'
            };
        }
    };

    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await axios.post('/auth/logout', { refreshToken });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');

            setUser(null);
            setIsAuthenticated(false);
        }
    };

    const updateUser = (updatedUserData) => {
        const updatedUser = { ...user, ...updatedUserData };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const refreshAccessToken = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                throw new Error('No refresh token');
            }

            const response = await axios.post('/auth/refresh-token', { refreshToken });
            const { accessToken, refreshToken: newRefreshToken } = response.data;

            localStorage.setItem('accessToken', accessToken);
            if (newRefreshToken) {
                localStorage.setItem('refreshToken', newRefreshToken);
            }

            return accessToken;
        } catch (error) {
            console.error('Refresh token error:', error);
            logout();
            throw error;
        }
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        loginWithGoogle,
        register,
        logout,
        updateUser,
        refreshAccessToken,
        checkAuth
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export default AuthContext;