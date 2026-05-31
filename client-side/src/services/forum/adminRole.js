/**
 * Helper đọc role admin từ localStorage để ẩn UI theo phân quyền.
 * - ADMIN: full quyền (xóa, quản lý category/tag, ban user)
 * - MODERATOR/STAFF: chỉ duyệt/ẩn nội dung
 */
export const getAdminRole = () => {
    try {
        const raw = localStorage.getItem('adminUser');
        if (!raw) return null;
        const user = JSON.parse(raw);
        return (user?.role || '').toUpperCase() || null;
    } catch {
        return null;
    }
};

export const isAdmin = () => getAdminRole() === 'ADMIN';

export const isModerator = () => {
    const role = getAdminRole();
    return role === 'MODERATOR' || role === 'STAFF';
};
