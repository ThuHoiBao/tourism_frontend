import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
    Check, EyeOff, Trash2, RotateCcw, Pin, Star, Edit2, Shield,
    FileText, MessageSquare, User, Bot
} from 'lucide-react';
import adminForumApi from '../../../../services/forum/adminForumApi';
import Pagination from './shared/Pagination';
import ForumBreadcrumb from './shared/ForumBreadcrumb';
import styles from './ForumManagement.module.scss';

const PAGE_SIZE = 30;

const ACTION_META = {
    APPROVE:       { label: 'Duyệt', icon: Check, color: '#059669', bg: '#ecfdf5' },
    HIDE:          { label: 'Ẩn', icon: EyeOff, color: '#dc2626', bg: '#fef2f2' },
    DELETE:        { label: 'Xóa', icon: Trash2, color: '#b91c1c', bg: '#fef2f2' },
    RESTORE:       { label: 'Khôi phục', icon: RotateCcw, color: '#0891b2', bg: '#ecfeff' },
    PIN:           { label: 'Ghim', icon: Pin, color: '#7c3aed', bg: '#f5f3ff' },
    UNPIN:         { label: 'Bỏ ghim', icon: Pin, color: '#64748b', bg: '#f1f5f9' },
    FEATURE:       { label: 'Nổi bật', icon: Star, color: '#d97706', bg: '#fffbeb' },
    UNFEATURE:     { label: 'Bỏ nổi bật', icon: Star, color: '#64748b', bg: '#f1f5f9' },
    EDIT:          { label: 'Sửa', icon: Edit2, color: '#2563eb', bg: '#eff6ff' },
    STATUS_CHANGE: { label: 'Đổi trạng thái', icon: Shield, color: '#475569', bg: '#f1f5f9' },
};

const AdminAuditLog = () => {
    const [logs, setLogs] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminForumApi.getAuditLogs({ page, size: PAGE_SIZE });
            setLogs(data?.content || []);
            setTotalPages(data?.totalPages || 0);
            setTotalElements(data?.totalElements ?? 0);
        } catch {
            toast.error('Không tải được nhật ký');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => { load(); }, [load]);

    const fmt = (s) => (s || '').slice(0, 19).replace('T', ' ');

    return (
        <div className={styles.page}>
            <ForumBreadcrumb items={[
                { label: 'Forum', to: '/admin/forum' },
                { label: 'Nhật ký kiểm duyệt' },
            ]} />
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Nhật ký kiểm duyệt</h1>
                    <p className={styles.pageSubtitle}>Lịch sử mọi hành động duyệt / ẩn / xóa / khôi phục</p>
                </div>
            </div>

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Thời gian</th>
                            <th>Người thực hiện</th>
                            <th>Hành động</th>
                            <th>Đối tượng</th>
                            <th>Lý do / Chi tiết</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5}><div className={styles.loading}>Đang tải…</div></td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={5}><div className={styles.empty}>Chưa có nhật ký nào</div></td></tr>
                        ) : logs.map(log => {
                            const meta = ACTION_META[log.action] || { label: log.action, icon: Shield, color: '#64748b', bg: '#f1f5f9' };
                            const Icon = meta.icon;
                            return (
                                <tr key={log.id}>
                                    <td className={styles.muted} style={{ whiteSpace: 'nowrap' }}>{fmt(log.createdAt)}</td>
                                    <td>
                                        <span className={styles.actorChip}>
                                            {log.actorType === 'AI' ? <Bot size={12} /> : <User size={12} />}
                                            {log.actorType === 'AI' ? 'AI' : (log.actorEmail || `#${log.actorId}` || 'Admin')}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={styles.actionChip}
                                              style={{ color: meta.color, background: meta.bg }}>
                                            <Icon size={12} /> {meta.label}
                                        </span>
                                        {log.oldValue && log.newValue && (
                                            <span className={styles.statusChange}>
                                                {log.oldValue} → {log.newValue}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={styles.targetChip}>
                                            {log.targetType === 'POST'
                                                ? <FileText size={12} /> : <MessageSquare size={12} />}
                                            #{log.targetId}
                                        </span>
                                        <span className={styles.targetTitle} title={log.targetTitle}>
                                            {log.targetTitle}
                                        </span>
                                    </td>
                                    <td className={styles.muted}>{log.reason || '—'}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <Pagination currentPage={page} totalPages={totalPages} totalElements={totalElements} onPageChange={setPage} />
        </div>
    );
};

export default AdminAuditLog;
