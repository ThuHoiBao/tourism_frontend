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
    MANUAL: 'Người dùng bấm cập nhật',
    SCHEDULED: 'Tự động theo lịch',
    EVENT_DEBOUNCED: 'Khi có thay đổi dữ liệu',
    CLEAR: 'Xóa dữ liệu',
};

// Loại dữ liệu được cập nhật cho trợ lý ảo (hiển thị dễ hiểu thay cho mã kỹ thuật)
const entityLabel = {
    ALL: 'Tất cả',
    TOUR: 'Tour',
    LOCATION: 'Địa điểm',
    REVIEW: 'Đánh giá',
    COUPON: 'Mã giảm giá',
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
            setError('Không tải được dữ liệu của trợ lý ảo. Vui lòng thử lại.');
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
            setError('Cập nhật dữ liệu chưa thành công. Vui lòng thử lại sau.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleClear = async () => {
        const confirmed = window.confirm('Xóa toàn bộ dữ liệu hiện có của trợ lý ảo?\n\nSau khi xóa, hãy bấm "Cập nhật dữ liệu ngay" để nạp lại. Trong lúc chưa nạp lại, trợ lý ảo có thể trả lời thiếu thông tin.');
        if (!confirmed) return;
        try {
            setActionLoading('clear');
            await manualVectorClearApi();
            await loadSummary();
        } catch (err) {
            setError('Xóa dữ liệu chưa thành công. Vui lòng thử lại sau.');
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
                    <h2>Dữ liệu trợ lý ảo (Chatbot)</h2>
                    <p>Cập nhật thông tin tour, địa điểm, đánh giá, mã giảm giá... để trợ lý ảo trả lời khách chính xác và mới nhất.</p>
                </div>
                <div className={styles.actions}>
                    <button className={styles.secondaryButton} onClick={loadSummary} disabled={loading || actionLoading} title="Tải lại danh sách">
                        <RefreshCw size={16} />
                    </button>
                    <button className={styles.primaryButton} onClick={handleSync} disabled={Boolean(actionLoading)} title="Nạp lại toàn bộ dữ liệu mới nhất cho trợ lý ảo">
                        <Database size={16} />
                        {actionLoading === 'sync' ? 'Đang cập nhật...' : 'Cập nhật dữ liệu ngay'}
                    </button>
                    <button className={styles.dangerButton} onClick={handleClear} disabled={Boolean(actionLoading)} title="Xóa toàn bộ dữ liệu hiện có của trợ lý ảo">
                        <Trash2 size={16} />
                        {actionLoading === 'clear' ? 'Đang xóa...' : 'Xóa dữ liệu'}
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
                <Metric label={allHistory ? 'Tổng số lần cập nhật' : 'Số lần cập nhật trong kỳ'} value={loading ? '...' : summary?.todaySyncCount ?? 0} />
                <Metric label="Cập nhật thành công" value={loading ? '...' : summary?.successCount ?? 0} tone="success" />
                <Metric label="Cập nhật lỗi" value={loading ? '...' : summary?.failedCount ?? 0} tone="danger" />
                <Metric label="Thay đổi đang chờ cập nhật" value={loading ? '...' : summary?.pendingEventCount ?? 0} tone="warning" />
                <Metric label="Tình trạng hiện tại" value={summary?.syncRunning ? 'Đang cập nhật...' : 'Sẵn sàng'} />
                <Metric label="Số mục dữ liệu (lần gần nhất)" value={lastRun?.totalDocs ?? 0} />
            </div>

            <div className={styles.lastRun}>
                <CheckCircle2 size={18} />
                <div>
                    <span>Lần gần nhất</span>
                    <strong>
                        {lastRun
                            ? `${triggerLabel[lastRun.triggerType] || lastRun.triggerType} - ${statusLabel[lastRun.status] || lastRun.status}`
                            : 'Chưa có lần cập nhật nào'}
                    </strong>
                    {lastRun?.startedAt && <small>{new Date(lastRun.startedAt).toLocaleString('vi-VN')}</small>}
                </div>
            </div>

            <div className={styles.tableWrap}>
                <table>
                    <thead>
                    <tr>
                        <th>Thời gian</th>
                        <th>Hình thức cập nhật</th>
                        <th>Kết quả</th>
                        <th>Số mục dữ liệu</th>
                        <th>Số thay đổi</th>
                        <th>Loại dữ liệu</th>
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
                            <td>{entityLabel[run.entityTypes] || run.entityTypes || '-'}</td>
                        </tr>
                    ))}
                    {!loading && (!summary?.recentRuns || summary.recentRuns.length === 0) && (
                        <tr>
                            <td colSpan="6" className={styles.empty}>
                                {allHistory ? 'Chưa có lần cập nhật nào' : 'Chưa có lần cập nhật nào trong kỳ'}
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {recentRuns.length > pageSize && (
                <div className={styles.pagination}>
                    <span>
                        Trang {currentPage}/{totalPages} · {recentRuns.length} lần cập nhật
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
