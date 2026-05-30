import React from 'react';
import Badge from '../../../../shared/Badge/Badge';

// Colors mirror the user-side forum (UserPostsManagement.module.scss).
const STATUS_MAP = {
    PUBLISHED:      { label: 'Đã đăng',  color: '#059669' },
    DRAFT:          { label: 'Nháp',     color: '#d97706' },
    HIDDEN:         { label: 'Đã ẩn',    color: '#dc2626' },
    PENDING_REVIEW: { label: 'Chờ duyệt', color: '#7c3aed' },
};

const StatusBadge = ({ status }) => {
    const cfg = STATUS_MAP[status] || { label: status || '—', color: '#6b7280' };
    return (
        <Badge color={cfg.color} style={{ color: '#fff' }}>
            {cfg.label}
        </Badge>
    );
};

export default StatusBadge;
