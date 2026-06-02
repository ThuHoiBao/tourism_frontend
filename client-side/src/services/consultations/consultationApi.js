import axios from 'axios';

/**
 * Admin Consultation API — dùng adminAccessToken (giống admin forum).
 */
const instance = axios.create({
    baseURL: 'http://localhost:8080/api',
    timeout: 30000,
});

instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminAccessToken') || localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

instance.interceptors.response.use(
    (res) => res,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('adminAccessToken');
            localStorage.removeItem('adminRefreshToken');
            localStorage.removeItem('adminUser');
            window.location.href = '/admin/login';
        }
        return Promise.reject(error);
    }
);

const unwrap = (res) => (res?.data?.data !== undefined ? res.data.data : res?.data);

const consultationApi = {
    list: (params) => instance.get('/admin/consultations', { params }).then(unwrap),
    detail: (id) => instance.get(`/admin/consultations/${id}`).then(unwrap),
    stats: () => instance.get('/admin/consultations/stats').then(unwrap),
    updateStatus: (id, body) =>
        instance.patch(`/admin/consultations/${id}/status`, body).then(unwrap),
};

export default consultationApi;
