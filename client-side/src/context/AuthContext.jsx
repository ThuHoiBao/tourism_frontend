import React, {createContext, useState, useEffect} from 'react';
import axios from '../utils/axiosCustomize';

const AuthContext = createContext();    

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []); // Chạy một lần khi component được mount (app vua duoc mo tren trinh duyet)

    const fetchProfile = async () => {
        try {
            const response = await axios.get('/auth/profile');

            if(response){
                const userData = response.data;
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
            } 
        } catch (error) {
            console.error('Lỗi cập nhật thông tin user:', error);
            setUser(null);
            setIsAuthenticated(false);
        } 
    };


    const checkAuth = async() => {
        const devUserId = parseInt(process.env.REACT_APP_DEV_USER_ID || '0');
        if(devUserId){
            try {
                const res = await axios.get(`/users/${devUserId}`);
                const data = res.data;
                const realUser = {
                    id: data.userID, userId: data.userID, userID: data.userID, 
                    fullName: data.fullName || data.fullname || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    dateOfBirth: data.dateOfBirth || null,
                    coinBalance: data.coinBalance || 0,
                    avatar: data.avatar || null,
                    status: data.status,
                    role: data.role || 'CUSTOMER',
                }
                setUser(realUser);
                setIsAuthenticated(true);
            } catch (e){
                console.error('Dev mode: failed to fetch user:', e);
                setUser({ id: devUserId, userId: devUserId, userID: devUserId, fullName: 'Dev User', email: 'dev@test.com', role: 'CUSTOMER' });
                setIsAuthenticated(true);
            }
            setLoading(false);
            return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            const userStr = localStorage.getItem('user');

            if(token && userStr){
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
    }

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

    const loginWithGoogleCode = async (code, redirectUri) => {
        try {
            const response = await axios.post('/auth/google-login', { code, redirectUri });
            const{ accessToken, refreshToken, user: userData } = response.data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
            setIsAuthenticated(true);

            return {success: true, user: userData};
        } catch (error) {
            console.error('Google login error:', error);
            throw error;
        }
    }


    const register = async (registerData) => {
        try {
            const response = await axios.post('/auth/register', registerData);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Registration error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Đăng ký thất bại'
            };
        }
    };

    const logout = async () => {
        try {
           const refreshToken = localStorage.getItem('refreshToken');
           if(refreshToken){
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
    }


    const updateUser = (updatedUserData) => {
        const updatedUser = { ...user, ...updatedUserData };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const refreshAccessToken = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if(!refreshToken) throw new Error('No refresh token available');

            const response = await axios.post('/auth/refresh-token', { refreshToken });

            const {accessToken, refreshToken: newRefreshToken} = response.data;

            localStorage.setItem('accessToken', accessToken);
            if(newRefreshToken){
                localStorage.setItem('refreshToken', newRefreshToken);
            }
            
            return accessToken;
        } catch(error){
            console.error('Error refreshing access token:', error);
            logout();
            throw error;
        }
    };

    const value = {
        user, 
        loading, 
        isAuthenticated,
        login,
        loginWithGoogleCode,
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
    const context = React.useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
} 


export default AuthContext;