import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Phone, Mail, MessageSquare, CheckCircle, XCircle, Play, Clock, ExternalLink } from 'lucide-react';
import consultationApi from '../../../../services/consultations/consultationApi';
import ConsultationDetailModal from './ConsultationDetailModal';
import { useConsultationAlertsContext } from '../../../../context/ConsultationAlertsContext';
import styles from './ConsultationsPage.module.scss';

const TABS = [
    { value: '',           label: 'Tất cả' },
    { value: 'PENDING',    label: 'Chờ xử lý' },
    { value: 'IN_PROGRESS',label: 'Đang xử lý' },
    { value: 'RESOLVED',   label: 'Đã xử lý' },
    { value: 'CLOSED',     label: 'Đã đóng' },
];

const STATUS_LABEL = {
    PENDING:     { label: 'Chờ xử lý',  color: '#d97706' },
    IN_PROGRESS: { label: 'Đang xử lý', color: '#0ea5e9' },
    RESOLVED:    { label: 'Đã xử lý',   color: '#10b981' },
    CLOSED:      { label: 'Đã đóng',    color: '#64748b' },
};

const ConsultationsPage = () => {
    const [items, setItems] = useState([]);
    const [stats, setStats] = useState({ pending: 0, inProgress: 0, resolved: 0, closed: 0 });
    const [tab, setTab] = useState('PENDING');
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState(null);
    const { clearUnseen, refreshPendingCount, unseenCount } = useConsultationAlertsContext();

    // Vào trang → coi như admin đã xem các unseen → clear blink + buffer
    // Đồng thời sync pendingCount với BE (phòng khi buffer cũ stale)
    useEffect(() => {
        clearUnseen();
        refreshPendingCount();
    }, [clearUnseen, refreshPendingCount]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await consultationApi.list({ status: tab || undefined, page, size: 20 });
            setItems(data?.content || []);
            setTotalPages(data?.totalPages || 1);
        } catch { toast.error('Không tải được danh sách'); }
        finally { setLoading(false); }
    }, [tab, page]);

    const loadStats = useCallback(async () => {
        try { setStats(await consultationApi.stats() || {}); } catch {}
    }, []);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { loadStats(); }, [loadStats]);

    // WebSocket subscribe đã được mount ở AdminLayout (ConsultationAlertsProvider).
    // Khi context unseen tăng → tự refresh list/stats để admin thấy ngay.
    useEffect(() => {
        if (unseenCount > 0) {
            loadStats();
            if (tab === '' || tab === 'PENDING') load();
        }
    }, [unseenCount, tab, load, loadStats]);

    const updateStatus = async (id, status, adminNotes) => {
        try {
            await consultationApi.updateStatus(id, { status, adminNotes });
            toast.success('Đã cập nhật trạng thái');
            setSelected(null);
            load();
            loadStats();
            refreshPendingCount();   // sync badge global về BE thật
        } catch { toast.error('Cập nhật thất bại'); }
    };

    const fmt = (s) => (s || '').slice(0, 16).replace('T', ' ');

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Yêu cầu tư vấn</h1>
                    <p className={styles.pageSubtitle}>Quản lý các yêu cầu tư vấn tour từ khách hàng</p>
                </div>
                <div className={styles.statCards}>
                    <div className={`${styles.statCard} ${styles.statPending}`}>
                        <Clock size={16} />
                        <span><strong>{stats.pending || 0}</strong> chờ xử lý</span>
                    </div>
                    <div className={`${styles.statCard} ${styles.statProgress}`}>
                        <Play size={16} />
                        <span><strong>{stats.inProgress || 0}</strong> đang xử lý</span>
                    </div>
                    <div className={`${styles.statCard} ${styles.statResolved}`}>
                        <CheckCircle size={16} />
                        <span><strong>{stats.resolved || 0}</strong> đã xử lý</span>
                    </div>
                </div>
            </div>

            <div className={styles.filterBar}>
                {TABS.map(t => (
                    <button key={t.value}
                            className={`${styles.tab} ${tab === t.value ? styles.tabActive : ''}`}
                            onClick={() => { setTab(t.value); setPage(0); }}>
                        {t.label}
                    </button>
                ))}
            </div>

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Mã</th>
                            <th>Khách</th>
                            <th>Liên hệ</th>
                            <th>Tour</th>
                            <th>Trạng thái</th>
                            <th>Lúc</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7}><div className={styles.empty}>Đang tải…</div></td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={7}><div className={styles.empty}>Không có yêu cầu nào</div></td></tr>
                        ) : items.map(it => {
                            const st = STATUS_LABEL[it.status] || { label: it.status, color: '#64748b' };
                            return (
                                <tr key={it.consultationId}>
                                    <td><code className={styles.code}>{it.requestCode}</code></td>
                                    <td className={styles.titleCell}>{it.fullName}</td>
                                    <td>
                                        <div className={styles.contactCell}>
                                            <a href={`tel:${it.phone}`}><Phone size={11} /> {it.phone}</a>
                                            <a href={`mailto:${it.email}`}><Mail size={11} /> {it.email}</a>
                                        </div>
                                    </td>
                                    <td>{it.tourCode || <span className={styles.muted}>—</span>}</td>
                                    <td>
                                        <span className={styles.statusPill} style={{ background: st.color }}>
                                            {st.label}
                                        </span>
                                    </td>
                                    <td className={styles.muted}>{fmt(it.createdAt)}</td>
                                    <td>
                                        <button className={styles.btnDetail} onClick={() => setSelected(it)}>
                                            <ExternalLink size={12} /> Xem
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹ Trước</button>
                    <span>Trang {page + 1}/{totalPages}</span>
                    <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Sau ›</button>
                </div>
            )}

            <ConsultationDetailModal
                item={selected}
                onClose={() => setSelected(null)}
                onUpdateStatus={updateStatus}
            />
        </div>
    );
};

export default ConsultationsPage;
