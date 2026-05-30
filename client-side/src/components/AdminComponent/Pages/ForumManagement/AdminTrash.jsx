import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FileText, MessageSquare, RotateCcw, Trash2, User, Clock } from 'lucide-react';
import adminForumApi from '../../../../services/forum/adminForumApi';
import ForumBreadcrumb from './shared/ForumBreadcrumb';
import ConfirmModal from './shared/ConfirmModal';
import styles from './ForumManagement.module.scss';

const TABS = [
    { value: '', label: 'Tất cả' },
    { value: 'POST', label: 'Bài viết' },
    { value: 'COMMENT', label: 'Bình luận' },
];

const AdminTrash = () => {
    const [items, setItems] = useState([]);
    const [tab, setTab] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirm, setConfirm] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminForumApi.getTrash(tab || undefined);
            setItems(data || []);
        } catch {
            toast.error('Không tải được thùng rác');
        } finally {
            setLoading(false);
        }
    }, [tab]);

    useEffect(() => { load(); }, [load]);

    const restore = async (item) => {
        try {
            if (item.type === 'POST') await adminForumApi.restorePost(item.id);
            else await adminForumApi.restoreComment(item.id);
            toast.success('Đã khôi phục');
            load();
        } catch { toast.error('Khôi phục thất bại'); }
    };

    const fmt = (s) => (s || '').slice(0, 16).replace('T', ' ');

    return (
        <div className={styles.page}>
            <ForumBreadcrumb items={[
                { label: 'Forum', to: '/admin/forum' },
                { label: 'Thùng rác' },
            ]} />
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Thùng rác</h1>
                    <p className={styles.pageSubtitle}>Bài viết & bình luận đã xóa — có thể khôi phục</p>
                </div>
            </div>

            <div className={styles.filterBar}>
                {TABS.map(t => (
                    <button key={t.value}
                            className={`${styles.quickTab} ${tab === t.value ? styles.quickTabActive : ''}`}
                            onClick={() => setTab(t.value)}>
                        {t.label}
                    </button>
                ))}
            </div>

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Loại</th>
                            <th>Nội dung</th>
                            <th>Tác giả</th>
                            <th>Lý do xóa</th>
                            <th>Xóa lúc</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6}><div className={styles.loading}>Đang tải…</div></td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={6}><div className={styles.empty}>Thùng rác trống</div></td></tr>
                        ) : items.map(item => (
                            <tr key={`${item.type}-${item.id}`}>
                                <td>
                                    <span className={styles.trashType}>
                                        {item.type === 'POST'
                                            ? <><FileText size={13} /> Bài viết</>
                                            : <><MessageSquare size={13} /> Bình luận</>}
                                    </span>
                                </td>
                                <td className={styles.titleCell} title={item.title}>{item.title}</td>
                                <td>{item.authorName || <span className={styles.muted}>#{item.authorId}</span>}</td>
                                <td>{item.deleteReason || <span className={styles.muted}>—</span>}</td>
                                <td className={styles.muted}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <Clock size={12} /> {fmt(item.deletedAt)}
                                    </span>
                                </td>
                                <td>
                                    <button className={styles.btnRestore}
                                            onClick={() => setConfirm({
                                                message: `Khôi phục ${item.type === 'POST' ? 'bài viết' : 'bình luận'} này?`,
                                                onConfirm: () => restore(item),
                                            })}>
                                        <RotateCcw size={13} /> Khôi phục
                                    </button>
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

export default AdminTrash;
