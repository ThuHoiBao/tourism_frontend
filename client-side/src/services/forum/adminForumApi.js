import axios from 'axios';

// Admin pages authenticate with the token stored under `adminAccessToken`
// (see AdminLogin.jsx), NOT the customer `accessToken` used by axiosCustomize.
// Use a dedicated instance so admin forum calls carry the correct admin token
// and a 401 sends the user back to the admin login (not the customer login).
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

// Unwrap the { success, data } envelope used by the forum-service controllers.
const unwrap = (res) => (res?.data?.data !== undefined ? res.data.data : res?.data);

const adminForumApi = {
    // ── Posts ──────────────────────────────────────────────────────────────
    getPosts: (params) => instance.get('/admin/forum/posts', { params }).then(unwrap),
    getPostDetail: (postId) => instance.get(`/admin/forum/posts/${postId}/detail`).then(unwrap),
    pinPost: (postId) => instance.put(`/admin/forum/posts/${postId}/pin`).then(unwrap),
    featurePost: (postId) => instance.put(`/admin/forum/posts/${postId}/feature`).then(unwrap),
    changePostStatus: (postId, status, rejectionReason) =>
        instance.put(`/admin/forum/posts/${postId}/status`, { status, rejectionReason }).then(unwrap),
    updatePostContent: (postId, body) =>
        instance.put(`/admin/forum/posts/${postId}/content`, body).then(unwrap),
    deletePost: (postId) => instance.delete(`/admin/forum/posts/${postId}`).then(unwrap),
    bulkPostAction: (ids, action) =>
        instance.post('/admin/forum/posts/bulk-action', { ids, action }).then(unwrap),

    // ── Comments ───────────────────────────────────────────────────────────
    getComments: (params) => instance.get('/admin/forum/comments', { params }).then(unwrap),
    // Group view: danh sách bài có comment
    getPostsWithComments: (params) =>
        instance.get('/admin/forum/posts-with-comments', { params }).then(unwrap),
    // Cây comment của 1 bài
    getCommentsByPost: (postId) =>
        instance.get(`/admin/forum/posts/${postId}/comments`).then(unwrap),
    changeCommentStatus: (commentId, status) =>
        instance.post('/admin/forum/comments/bulk-action', {
            ids: [commentId],
            action: status === 'PUBLISHED' ? 'approve' : status === 'HIDDEN' ? 'hide' : 'reject'
        }).then(unwrap),
    deleteComment: (commentId) =>
        instance.delete(`/admin/forum/comments/${commentId}`).then(unwrap),
    bulkCommentAction: (ids, action) =>
        instance.post('/admin/forum/comments/bulk-action', { ids, action }).then(unwrap),

    // ── Categories ───────────────────────────────────────────────────────────
    getCategories: () => instance.get('/admin/forum/categories').then(unwrap),
    createCategory: (body) => instance.post('/admin/forum/categories', body).then(unwrap),
    updateCategory: (categoryId, body) =>
        instance.put(`/admin/forum/categories/${categoryId}`, body).then(unwrap),
    deleteCategory: (categoryId) =>
        instance.delete(`/admin/forum/categories/${categoryId}`).then(unwrap),
    reorderCategories: (items) =>
        instance.put('/admin/forum/categories/reorder', { items }).then(unwrap),

    // ── Tags ───────────────────────────────────────────────────────────────────
    getTags: (params) => instance.get('/admin/forum/tags', { params }).then(unwrap),
    createTag: (body) => instance.post('/admin/forum/tags', body).then(unwrap),
    updateTag: (tagId, body) => instance.put(`/admin/forum/tags/${tagId}`, body).then(unwrap),
    deleteTag: (tagId) => instance.delete(`/admin/forum/tags/${tagId}`).then(unwrap),

    // ── Analytics ────────────────────────────────────────────────────────────────
    getStats: () => instance.get('/admin/forum/stats').then(unwrap),
    getAnalytics: () => instance.get('/admin/forum/analytics').then(unwrap),

    // ── Trash & Audit ────────────────────────────────────────────────────────────
    getTrash: (type) => instance.get('/admin/forum/trash', { params: { type } }).then(unwrap),
    restorePost: (postId) => instance.post(`/admin/forum/trash/posts/${postId}/restore`).then(unwrap),
    restoreComment: (commentId) => instance.post(`/admin/forum/trash/comments/${commentId}/restore`).then(unwrap),
    getAuditLogs: (params) => instance.get('/admin/forum/audit-logs', { params }).then(unwrap),

    // ── Ban người dùng (chỉ hạn chế trong forum) ──────────────────────────────────
    banUser: (userId, body) => instance.post(`/admin/forum/users/${userId}/ban`, body).then(unwrap),
    unbanUser: (userId) => instance.post(`/admin/forum/users/${userId}/unban`).then(unwrap),
    getBannedUsers: () => instance.get('/admin/forum/banned-users').then(unwrap),

    // ── Báo cáo nội dung ──────────────────────────────────────────────────────────
    getReports: (params) => instance.get('/admin/forum/reports', { params }).then(unwrap),
    resolveReport: (reportId, action) =>
        instance.patch(`/admin/forum/reports/${reportId}`, null, { params: { action } }).then(unwrap),

    // ── Export CSV (Sprint 5) ──────────────────────────────────────────────────
    exportModerationCsv: ({ from, to } = {}) =>
        instance.get('/admin/forum/export', {
            params: { type: 'moderation', from, to },
            responseType: 'blob',
        }).then((res) => {
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8' }));
            const a = document.createElement('a');
            const filename = `moderation_${from || 'all'}_${to || 'all'}.csv`;
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click(); a.remove();
            window.URL.revokeObjectURL(url);
        }),
};

export default adminForumApi;
