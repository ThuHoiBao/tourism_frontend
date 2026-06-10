import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Database, RefreshCw, Trash2 } from 'lucide-react';
import {
    getVectorSyncSummaryApi,
    manualVectorClearApi,
    manualVectorSyncApi,
} from '../../../../../../services/dashboard/dashboard.ts';
import styles from './VectorSyncSection.module.scss';

const statusLabel = {
    RUNNING: 'Đang chạy',
    SUCCESS: 'Thành công',
    FAILED: 'Thất bại',
};

const triggerLabel = {
    MANUAL: 'Thủ công',
    SCHEDULED: 'Tự động',
    EVENT_DEBOUNCED: 'Theo thay đổi',
    CLEAR: 'Clear vector',
};

const VectorSyncSection = ({ dateRange, allHistory = false }) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    const loadSummary = useCallback(async () => {
        try {
            setError('');
            setLoading(true);
            const data = await getVectorSyncSummaryApi(dateRange?.from, dateRange?.to, allHistory);
            setSummary(data);
            setCurrentPage(1);
        } catch (err) {
            setError('Không tải được thống kê đồng bộ chatbot');
        } finally {
            setLoading(false);
        }
    }, [dateRange?.from, dateRange?.to, allHistory]);

    useEffect(() => {
        loadSummary();
    }, [loadSummary]);

    const handleSync = async () => {
        try {
            setActionLoading('sync');
            await manualVectorSyncApi();
            await loadSummary();
        } catch (err) {
            setError('Sync thủ công thất bại');
        } finally {
            setActionLoading(null);
        }
    };

    const handleClear = async () => {
        const confirmed = window.confirm('Xóa toàn bộ vector chatbot? Sau khi clear cần bấm Sync ngay để nạp lại dữ liệu.');
        if (!confirmed) return;
        try {
            setActionLoading('clear');
            await manualVectorClearApi();
            await loadSummary();
        } catch (err) {
            setError('Clear vector thất bại');
        } finally {
            setActionLoading(null);
        }
    };

    const lastRun = summary?.lastRun;
    const recentRuns = summary?.recentRuns || [];
    const totalPages = Math.max(1, Math.ceil(recentRuns.length / pageSize));
    const pagedRuns = recentRuns.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <div>
                    <h2>Đồng bộ Chatbot</h2>
                    <p>Pinecone vector sync, Rabbit debounce và thao tác thủ công</p>
                </div>
                <div className={styles.actions}>
                    <button className={styles.secondaryButton} onClick={loadSummary} disabled={loading || actionLoading}>
                        <RefreshCw size={16} />
                    </button>
                    <button className={styles.primaryButton} onClick={handleSync} disabled={Boolean(actionLoading)}>
                        <Database size={16} />
                        {actionLoading === 'sync' ? 'Đang sync' : 'Sync ngay'}
                    </button>
                    <button className={styles.dangerButton} onClick={handleClear} disabled={Boolean(actionLoading)}>
                        <Trash2 size={16} />
                        {actionLoading === 'clear' ? 'Đang clear' : 'Clear vector'}
                    </button>
                </div>
            </div>

            {error && (
                <div className={styles.error}>
                    <AlertTriangle size={16} />
                    {error}
                </div>
            )}

            <div className={styles.statsGrid}>
                <Metric label={allHistory ? 'Tổng sync' : 'Sync trong kỳ'} value={loading ? '...' : summary?.todaySyncCount ?? 0} />
                <Metric label="Thành công" value={loading ? '...' : summary?.successCount ?? 0} tone="success" />
                <Metric label="Thất bại" value={loading ? '...' : summary?.failedCount ?? 0} tone="danger" />
                <Metric label="Pending events" value={loading ? '...' : summary?.pendingEventCount ?? 0} tone="warning" />
                <Metric label="Trạng thái" value={summary?.syncRunning ? 'Đang sync' : 'Sẵn sàng'} />
                <Metric label="Docs lần cuối" value={lastRun?.totalDocs ?? 0} />
            </div>

            <div className={styles.lastRun}>
                <CheckCircle2 size={18} />
                <div>
                    <span>Lần gần nhất</span>
                    <strong>
                        {lastRun
                            ? `${triggerLabel[lastRun.triggerType] || lastRun.triggerType} - ${statusLabel[lastRun.status] || lastRun.status}`
                            : 'Chưa có lịch sử sync'}
                    </strong>
                    {lastRun?.startedAt && <small>{new Date(lastRun.startedAt).toLocaleString('vi-VN')}</small>}
                </div>
            </div>

            <div className={styles.tableWrap}>
                <table>
                    <thead>
                    <tr>
                        <th>Thời gian</th>
                        <th>Trigger</th>
                        <th>Trạng thái</th>
                        <th>Docs</th>
                        <th>Events</th>
                        <th>Entity</th>
                    </tr>
                    </thead>
                    <tbody>
                    {pagedRuns.map(run => (
                        <tr key={run.id}>
                            <td>{run.startedAt ? new Date(run.startedAt).toLocaleString('vi-VN') : '-'}</td>
                            <td>{triggerLabel[run.triggerType] || run.triggerType}</td>
                            <td>
                                <span className={`${styles.badge} ${styles[(run.status || '').toLowerCase()] || ''}`}>
                                    {statusLabel[run.status] || run.status}
                                </span>
                            </td>
                            <td>{run.totalDocs ?? 0}</td>
                            <td>{run.eventCount ?? 0}</td>
                            <td>{run.entityTypes || '-'}</td>
                        </tr>
                    ))}
                    {!loading && (!summary?.recentRuns || summary.recentRuns.length === 0) && (
                        <tr>
                            <td colSpan="6" className={styles.empty}>
                                {allHistory ? 'Chưa có lịch sử sync nào' : 'Chưa có lần sync nào trong kỳ'}
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {recentRuns.length > pageSize && (
                <div className={styles.pagination}>
                    <span>
                        Trang {currentPage}/{totalPages} · {recentRuns.length} lần sync
                    </span>
                    <div className={styles.pageActions}>
                        <button
                            type="button"
                            onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                            disabled={currentPage === 1}
                            aria-label="Trang trước"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                            disabled={currentPage === totalPages}
                            aria-label="Trang sau"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
};

const Metric = ({ label, value, tone = '' }) => (
    <div className={`${styles.metric} ${tone ? styles[tone] : ''}`}>
        <span>{label}</span>
        <strong>{value}</strong>
    </div>
);

export default VectorSyncSection;
