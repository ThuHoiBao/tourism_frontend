import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { UserX, ShieldOff, Clock, Infinity as InfinityIcon } from 'lucide-react';
import adminForumApi from '../../../../services/forum/adminForumApi';
import { isAdmin } from '../../../../services/forum/adminRole';
import ForumBreadcrumb from './shared/ForumBreadcrumb';
import ConfirmModal from './shared/ConfirmModal';
import styles from './ForumManagement.module.scss';

const AdminBannedUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [confirm, setConfirm] = useState(null);
    const canUnban = isAdmin();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminForumApi.getBannedUsers();
            setUsers(data || []);
        } catch {
            toast.error('Không tải được danh sách bị hạn chế');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const unban = async (userId) => {
        try {
            await adminForumApi.unbanUser(userId);
            toast.success('Đã gỡ hạn chế');
            load();
        } catch { toast.error('Gỡ hạn chế thất bại'); }
    };

    const fmt = (s) => (s || '').slice(0, 16).replace('T', ' ');

    return (
        <div className={styles.page}>
            <ForumBreadcrumb items={[
                { label: 'Forum', to: '/admin/forum' },
                { label: 'Người dùng bị hạn chế' },
            ]} />
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Người dùng bị hạn chế</h1>
                    <p className={styles.pageSubtitle}>
                        Chỉ hạn chế đăng bài & bình luận trong diễn đàn — không ảnh hưởng đặt tour hay các tính năng khác
                    </p>
                </div>
            </div>

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Người dùng</th>
                            <th>Lý do</th>
                            <th>Hết hạn</th>
                            <th>Bị hạn chế lúc</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5}><div className={styles.loading}>Đang tải…</div></td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={5}><div className={styles.empty}>Không có người dùng nào bị hạn chế</div></td></tr>
                        ) : users.map(u => (
                            <tr key={u.restrictionId}>
                                <td>
                                    <span className={styles.trashType}><UserX size={13} /> {u.userName || `#${u.userId}`}</span>
                                    {u.userEmail && <div className={styles.muted}>{u.userEmail}</div>}
                                </td>
                                <td>{u.reason || <span className={styles.muted}>—</span>}</td>
                                <td>
                                    {u.bannedUntil ? (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            <Clock size={12} /> {fmt(u.bannedUntil)}
                                        </span>
                                    ) : (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#dc2626' }}>
                                            <InfinityIcon size={12} /> Vĩnh viễn
                                        </span>
                                    )}
                                </td>
                                <td className={styles.muted}>{fmt(u.createdAt)}</td>
                                <td>
                                    {canUnban ? (
                                        <button className={styles.btnRestore}
                                                onClick={() => setConfirm({
                                                    message: `Gỡ hạn chế cho ${u.userName || '#' + u.userId}?`,
                                                    onConfirm: () => unban(u.userId),
                                                })}>
                                            <ShieldOff size={13} /> Gỡ hạn chế
                                        </button>
                                    ) : (
                                        <span className={styles.muted}>—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmModal
                isOpen={!!confirm}
                message={confirm?.message}
                onCancel={() => setConfirm(null)}
                onConfirm={() => { const fn = confirm.onConfirm; setConfirm(null); fn(); }}
            />
        </div>
    );
};

export default AdminBannedUsers;
