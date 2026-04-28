import axios from 'axios';
const BASE_URL = 'http://localhost:8080/api';
const instance = axios.create({
    baseURL: BASE_URL,
    // timeout: 30000, 
});

instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');

        console.log(' Request URL:', config.url);
        console.log('Token exists:', !!token);
         if (token) {
            console.log('Token preview:', token.substring(0, 20) + '...');
        }
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
    }
);

instance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                
                if (!refreshToken) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    return Promise.reject(error);
                }

                const response = await axios.post(
                    'http://localhost:8080/api/auth/refresh-token',
                    { refreshToken },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                        }
                    }
                );

                const { accessToken, refreshToken: newRefreshToken } = response.data;

                localStorage.setItem('accessToken', accessToken);
                if (newRefreshToken) {
                    localStorage.setItem('refreshToken', newRefreshToken);
                }

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return instance(originalRequest);

            } catch (refreshError) {
                console.error('Refresh token failed:', refreshError);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default instance;
