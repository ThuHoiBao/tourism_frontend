import axiosInstance from '../../utils/axiosCustomize';

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        userId: number;
        fullName: string;
        email: string;
        avatar: string | null;
        role: 'CUSTOMER' | 'ADMIN' | 'TOUR_OWNER';
        provinceName: string | null;
        districtName: string | null;
        coinBalance: number;
    };
}

//authAPI là một object, mỗi key là một hàm gọi API.
export const authAPI = {  
    login: (email: string, password: string) => 
        axiosInstance.post<LoginResponse>('/auth/login', { email, password }),

    register: (data : {
        fullName: string;
        email: string;
        password: string;
        confirmPassword: string;
        provinceCode?: string;
        provinceName?: string;
        districtCode?: string;
        districtName?: string;
    }) => 
        axiosInstance.post('/auth/register', data),

    verifyEmail: (token: string) =>
        axiosInstance.get('/auth/verify-email', { params: { token } }),
    
    resendVerification: (email: string) =>
        axiosInstance.post('/auth/resend-verification', null, { params: { email } }),

    refreshToken: (refreshToken: string) =>
        axiosInstance.post('/auth/refresh-token', { refreshToken }),

    logout: (refreshToken: string) =>
        axiosInstance.post('/auth/logout', { refreshToken }),

    logoutAll: (userId: number) =>
        axiosInstance.post('/auth/logout-all', { userId }),

    // Backend-mediated Google OAuth2 (Keycloak authorization_code flow)
    googleLogin: (code: string, redirectUri: string) =>
        axiosInstance.post<LoginResponse>('/auth/google-login', { code, redirectUri }),
};