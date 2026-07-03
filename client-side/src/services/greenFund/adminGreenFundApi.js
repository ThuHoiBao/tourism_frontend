import axios from 'axios';

// Admin Green Fund dùng token `adminAccessToken` (giống adminForumApi.js),
// KHÔNG dùng `accessToken` của khách trong axiosCustomize. 401 → quay về admin login.
const instance = axios.create({
    baseURL: 'http://localhost:8080/api',
    timeout: 30000,
});

instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('adminAccessToken') || localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
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

// Bóc envelope { success, data } của các controller green-fund.
const unwrap = (res) => (res?.data?.data !== undefined ? res.data.data : res?.data);

const adminGreenFundApi = {
    // ── Đợt trồng cây ─────────────────────────────────────────────────────────
    getBatches: () => instance.get('/admin/green-fund/batches').then(unwrap),
    createBatch: (body) => instance.post('/admin/green-fund/batches', body).then(unwrap),
    updateBatch: (id, body) => instance.put(`/admin/green-fund/batches/${id}`, body).then(unwrap),
    deleteBatch: (id) => instance.delete(`/admin/green-fund/batches/${id}`).then(unwrap),

    // ── Audit đóng góp ────────────────────────────────────────────────────────
    getContributions: (params) =>
        instance.get('/admin/green-fund/contributions', { params }).then(unwrap),

    // ── Sổ quỹ ────────────────────────────────────────────────────────────────
    getLedger: () => instance.get('/admin/green-fund/ledger').then(unwrap),
};

export default adminGreenFundApi;
