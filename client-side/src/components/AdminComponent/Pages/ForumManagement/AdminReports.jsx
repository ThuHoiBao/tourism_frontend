import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Flag, FileText, MessageSquare, Check, X, Clock } from 'lucide-react';
import adminForumApi from '../../../../services/forum/adminForumApi';
import ForumBreadcrumb from './shared/ForumBreadcrumb';
import ConfirmModal from './shared/ConfirmModal';
import styles from './ForumManagement.module.scss';

const TABS = [
    { value: 'PENDING', label: 'Chờ xử lý' },
    { value: 'RESOLVED', label: 'Đã xử lý' },
    { value: 'DISMISSED', label: 'Đã bỏ qua' },
    { value: '', label: 'Tất cả' },
];

const REASON_LABEL = {
    SPAM: 'Spam / quảng cáo',
    INAPPROPRIATE: 'Nội dung không phù hợp',
    HARASSMENT: 'Quấy rối / xúc phạm',
    MISINFORMATION: 'Thông tin sai lệch',
    OTHER: 'Khác',
};

const STATUS_LABEL = {
    PENDING: 'Chờ xử lý',
    RESOLVED: 'Đã xử lý (ẩn nội dung)',
    DISMISSED: 'Đã bỏ qua',
    REVIEWED: 'Đã xem',
};

const AdminReports = () => {
    const [reports, setReports] = useState([]);
    const [tab, setTab] = useState('PENDING');
    const [loading, setLoading] = useState(false);
    const [confirm, setConfirm] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminForumApi.getReports({ status: tab || undefined, size: 50 });
            setReports(data?.content || []);
        } catch {
            toast.error('Không tải được danh sách báo cáo');
        } finally {
            setLoading(false);
        }
    }, [tab]);

    useEffect(() => { load(); }, [load]);

    const resolve = async (reportId, action) => {
        try {
            await adminForumApi.resolveReport(reportId, action);
            toast.success(action === 'RESOLVE' ? 'Đã ẩn nội dung & xử lý báo cáo' : 'Đã bỏ qua báo cáo');
            load();
        } catch { toast.error('Xử lý báo cáo thất bại'); }
    };

    const fmt = (s) => (s || '').slice(0, 16).replace('T', ' ');

    return (
        <div className={styles.page}>
            <ForumBreadcrumb items={[
                { label: 'Forum', to: '/admin/forum' },
                { label: 'Báo cáo nội dung' },
            ]} />
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Báo cáo nội dung</h1>
                    <p className={styles.pageSubtitle}>Báo cáo từ người dùng về bài viết & bình luận vi phạm</p>
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
                            <th>Nội dung bị báo cáo</th>
                            <th>Lý do</th>
                            <th>Người báo cáo</th>
                            <th>Trạng thái</th>
                            <th>Lúc</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7}><div className={styles.loading}>Đang tải…</div></td></tr>
                        ) : reports.length === 0 ? (
                            <tr><td colSpan={7}><div className={styles.empty}>Không có báo cáo nào</div></td></tr>
                        ) : reports.map(r => (
                            <tr key={r.id}>
                                <td>
                                    <span className={styles.trashType}>
                                        {r.targetType === 'POST'
                                            ? <><FileText size={13} /> Bài viết</>
                                            : <><MessageSquare size={13} /> Bình luận</>}
                                    </span>
                                </td>
                                <td className={styles.titleCell} title={r.targetPreview}>
                                    {r.targetPreview || <span className={styles.muted}>#{r.targetId}</span>}
                                </td>
                                <td>
                                    <span className={styles.trashType}><Flag size={12} /> {REASON_LABEL[r.reason] || r.reason}</span>
                                    {r.detail && <div className={styles.muted}>{r.detail}</div>}
                                </td>
                                <td className={styles.muted}>#{r.reporterId}</td>
                                <td className={styles.muted}>{STATUS_LABEL[r.status] || r.status}</td>
                                <td className={styles.muted}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <Clock size={12} /> {fmt(r.createdAt)}
                                    </span>
                                </td>
                                <td>
                                    {r.status === 'PENDING' ? (
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className={styles.btnRestore}
                                                    onClick={() => setConfirm({
                                                        message: 'Ẩn nội dung này và đánh dấu báo cáo đã xử lý?',
                                                        onConfirm: () => resolve(r.id, 'RESOLVE'),
                                                    })}>
                                                <Check size={13} /> Xử lý & ẩn
                                            </button>
                                            <button className={styles.btnGhost}
                                                    onClick={() => resolve(r.id, 'DISMISS')}>
                                                <X size={13} /> Bỏ qua
                                            </button>
                                        </div>
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

export default AdminReports;
