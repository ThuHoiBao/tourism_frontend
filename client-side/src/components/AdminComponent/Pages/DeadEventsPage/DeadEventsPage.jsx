// DeadEventsPage.jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FaRedo, FaSyncAlt, FaCoins, FaBell, FaListAlt, FaExclamationTriangle } from 'react-icons/fa';
import { Mail, RefreshCw, Server, AlertTriangle, CheckCircle2, TriangleAlert } from 'lucide-react';
import styles from './DeadEventsPage.module.scss';
import useDeadEvents from '../../../../hook/useDeadEvents.ts';
import useQueueHealth from '../../../../hook/useQueueHealth.ts';
import DeadEventItem from './DeadEventItem';
import DeadEventDetailModal from './DeadEventDetailModal/DeadEventDetailModal';

/** Lọc nhanh theo routingKey */
const FILTERS = [
    { label: 'Tất cả',               value: '',                           icon: <FaListAlt /> },
    { label: 'Hoàn xu',              value: 'booking.coin.refund',        icon: <FaCoins /> },
    { label: 'Gửi email/thông báo', value: 'booking.notification.event', icon: <FaBell /> },
];

/** Dialog xác nhận Thử lại tất cả */
const ConfirmDialog = ({ routingKey, totalCount, onConfirm, onCancel }) => {
    const label = routingKey
        ? routingKey === 'booking.coin.refund' ? '"Hoàn xu"' : '"Gửi email/thông báo"'
        : 'tất cả';
    return (
        <div className={styles.confirmOverlay} onClick={onCancel}>
            <div className={styles.confirmBox} onClick={(e) => e.stopPropagation()}>
                <FaExclamationTriangle style={{ fontSize: 36, color: '#f59e0b', marginBottom: 12 }} />
                <h3>Xác nhận thử lại</h3>
                <p>
                    Bạn có chắc muốn thử lại <strong>{totalCount}</strong> tác vụ thuộc nhóm {label}?
                    <br />Hệ thống sẽ tự động xử lý lại trong vài giây.
                </p>
                <p className={styles.confirmNote}>
                    Lưu ý: Nếu nguyên nhân lỗi chưa được khắc phục, tác vụ có thể lỗi lại.
                </p>
                <div className={styles.confirmActions}>
                    <button className={styles.btnCancel} onClick={onCancel}>Hủy</button>
                    <button className={styles.btnConfirm} onClick={onConfirm}>Xác nhận</button>
                </div>
            </div>
        </div>
    );
};

/** Banner trạng thái Queue Health */
const QueueHealthBanner = ({ health }) => {
    if (!health || health.status === 'HEALTHY') return null;

    const isRed = health.status === 'DLQ_ATTENTION' || health.status === 'BROKER_DOWN';
    const bannerClass = isRed ? styles.bannerDanger : styles.bannerWarning;
    const Icon = isRed ? TriangleAlert : AlertTriangle;

    return (
        <div className={`${styles.healthBanner} ${bannerClass}`}>
            <Icon size={16} />
            <span>{health.message}</span>
        </div>
    );
};

const DeadEventsPage = () => {
    const [activeFilter, setActiveFilter] = useState('');
    const [detailEvent, setDetailEvent]   = useState(null);
    const [confirmRetryAll, setConfirmRetryAll] = useState(false);

    const {
        events,
        count,
        loading,
        actionLoading,
        error,
        totalPages,
        totalElements,
        currentPage,
        refetch,
        retryOne,
        retryAll,
        setPage,
    } = useDeadEvents(20);

    const { health, loading: healthLoading, refresh: refreshHealth } = useQueueHealth();

    /* ── Lọc phía client theo routingKey ── */
    const filtered = activeFilter
        ? events.filter((e) => e.routingKey === activeFilter)
        : events;

    /* ── Handler: retry 1 event ── */
    const handleRetryOne = async (id) => {
        try {
            await retryOne(id);
            toast.success(`Tác vụ #${id} đã được đưa về hàng chờ. Hệ thống sẽ thử xử lý lại.`);
        } catch (err) {
            const msg = err?.response?.data?.message ?? err?.message ?? 'Lỗi khi thử lại';
            toast.error(`Thử lại thất bại: ${msg}`);
        }
    };

    /* ── Handler: retry all (sau xác nhận) ── */
    const handleRetryAll = async () => {
        setConfirmRetryAll(false);
        const routingKey = activeFilter || undefined;
        try {
            const retried = await retryAll(routingKey);
            toast.success(`Đã đưa ${retried} tác vụ về hàng chờ. Hệ thống sẽ thử xử lý lại trong vài giây.`);
        } catch (err) {
            const msg = err?.response?.data?.message ?? err?.message ?? 'Lỗi khi thử lại tất cả';
            toast.error(`Thử lại tất cả thất bại: ${msg}`);
        }
    };

    /* ── Làm mới cả 2 nguồn dữ liệu ── */
    const handleRefresh = () => {
        refetch();
        refreshHealth();
    };

    /* ── Tổng count hiển thị cho nút Thử lại tất cả ── */
    const filteredCount = activeFilter === 'booking.coin.refund'
        ? count.coinRefund
        : activeFilter === 'booking.notification.event'
            ? count.notification
            : count.total;

    return (
        <div className={styles.page}>

            {/* ── Page Header ── */}
            <div className={styles.pageHeader}>
                <div className={styles.titleBlock}>
                    <h1>Sự cố xử lý nền</h1>
                    <p>Theo dõi các tác vụ gửi thông báo và hoàn xu bị lỗi, hoặc đang chờ hệ thống xử lý.</p>
                </div>
                <div className={styles.headerActions}>
                    <button
                        className={styles.btnRefresh}
                        onClick={handleRefresh}
                        disabled={loading || actionLoading}
                    >
                        <FaSyncAlt className={loading ? styles.spinning : ''} />
                        Làm mới
                    </button>
                    {count.total > 0 && (
                        <button
                            className={styles.btnRetryAll}
                            onClick={() => setConfirmRetryAll(true)}
                            disabled={actionLoading || filteredCount === 0}
                        >
                            <FaRedo />
                            Thử lại tất cả {filteredCount > 0 ? `(${filteredCount})` : ''}
                        </button>
                    )}
                </div>
            </div>

            {/* ── Summary Cards ── */}
            <div className={styles.summaryCards}>
                <div className={styles.card}>
                    <div className={`${styles.cardIcon} ${styles.danger}`}><FaExclamationTriangle /></div>
                    <div className={styles.cardBody}>
                        <h3>{loading ? '…' : count.total}</h3>
                        <p>Tác vụ cần xử lý</p>
                    </div>
                </div>
                <div className={styles.card}>
                    <div className={`${styles.cardIcon} ${styles.warning}`}><FaCoins /></div>
                    <div className={styles.cardBody}>
                        <h3>{loading ? '…' : count.coinRefund}</h3>
                        <p>Hoàn xu lỗi</p>
                    </div>
                </div>
                <div className={styles.card}>
                    <div className={`${styles.cardIcon} ${styles.info}`}><FaBell /></div>
                    <div className={styles.cardBody}>
                        <h3>{loading ? '…' : count.notification}</h3>
                        <p>Thông báo lỗi</p>
                    </div>
                </div>
            </div>

            {/* ── Queue Health Section ── */}
            <div className={styles.queueHealthSection}>
                <div className={styles.queueHealthHeader}>
                    <span className={styles.queueHealthTitle}>Tình trạng gửi thông báo</span>
                    {health && (
                        <span className={styles.queueCheckedAt}>
                            Cập nhật: {new Date(health.checkedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>
                <div className={styles.queueCards}>
                    <div className={styles.queueCard}>
                        <Mail size={20} className={styles.queueCardIcon} />
                        <div className={styles.queueCardBody}>
                            <span className={styles.queueCardValue}>
                                {healthLoading ? '…' : (health?.ready ?? '—')}
                            </span>
                            <span className={styles.queueCardLabel}>Thông báo đang chờ gửi</span>
                        </div>
                    </div>
                    <div className={styles.queueCard}>
                        <RefreshCw size={20} className={styles.queueCardIcon} />
                        <div className={styles.queueCardBody}>
                            <span className={styles.queueCardValue}>
                                {healthLoading ? '…' : (health?.unacked ?? '—')}
                            </span>
                            <span className={styles.queueCardLabel}>Đang được xử lý</span>
                        </div>
                    </div>
                    <div className={`${styles.queueCard} ${health && health.consumers === 0 && !healthLoading ? styles.queueCardWarn : ''}`}>
                        <Server size={20} className={styles.queueCardIcon} />
                        <div className={styles.queueCardBody}>
                            <span className={styles.queueCardValue}>
                                {healthLoading ? '…' : (health != null ? (health.consumers > 0 ? 'Có' : 'Không') : '—')}
                            </span>
                            <span className={styles.queueCardLabel}>Dịch vụ đang hoạt động</span>
                        </div>
                    </div>
                    <div className={`${styles.queueCard} ${health && health.dlqReady > 0 && !healthLoading ? styles.queueCardDanger : ''}`}>
                        <AlertTriangle size={20} className={styles.queueCardIcon} />
                        <div className={styles.queueCardBody}>
                            <span className={styles.queueCardValue}>
                                {healthLoading ? '…' : (health?.dlqReady ?? '—')}
                            </span>
                            <span className={styles.queueCardLabel}>Thông báo lỗi</span>
                        </div>
                    </div>
                </div>
                {health && health.status === 'HEALTHY' && (
                    <div className={`${styles.healthBanner} ${styles.bannerHealthy}`}>
                        <CheckCircle2 size={16} />
                        <span>Hệ thống thông báo hoạt động bình thường.</span>
                    </div>
                )}
                <QueueHealthBanner health={health} />
            </div>

            {/* ── Error ── */}
            {error && (
                <div className={styles.errorMsg}>
                    <FaExclamationTriangle />
                    {error}
                    <button onClick={handleRefresh} style={{ marginLeft: 'auto', border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 600 }}>
                        Thử lại
                    </button>
                </div>
            )}

            {/* ── Filter Bar ── */}
            <div className={styles.filterBar}>
                <span className={styles.filterLabel}>Lọc theo loại:</span>
                <div className={styles.filterBtnGroup}>
                    {FILTERS.map((f) => (
                        <button
                            key={f.value}
                            className={`${styles.filterBtn} ${activeFilter === f.value ? styles.active : ''}`}
                            onClick={() => { setActiveFilter(f.value); setPage(0); }}
                        >
                            {f.icon} {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Table ── */}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Mã sự cố</th>
                            <th>Loại tác vụ</th>
                            <th>Số lần thử</th>
                            <th>Thời điểm phát sinh</th>
                            <th>Lần thử tiếp theo</th>
                            <th>Nguyên nhân gần nhất</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} className={styles.centered}>Đang tải...</td>
                            </tr>
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} className={styles.centered}>
                                    {count.total === 0
                                        ? 'Không có sự cố nào. Hệ thống đang hoạt động tốt!'
                                        : 'Không có tác vụ nào khớp với bộ lọc.'}
                                </td>
                            </tr>
                        ) : (
                            filtered.map((event) => (
                                <DeadEventItem
                                    key={event.id}
                                    event={event}
                                    onViewDetail={setDetailEvent}
                                    onRetry={handleRetryOne}
                                    actionLoading={actionLoading}
                                />
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {!loading && totalPages > 1 && (
                    <div className={styles.pagination}>
                        <span className={styles.pageInfo}>
                            Trang {currentPage + 1} / {totalPages} — {totalElements} tác vụ
                        </span>
                        <div className={styles.pageButtons}>
                            <button
                                className={styles.pageBtn}
                                onClick={() => setPage(currentPage - 1)}
                                disabled={currentPage === 0}
                            >‹</button>
                            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                                const maxPages = totalPages;
                                let page;
                                if (maxPages <= 7) {
                                    page = i;
                                } else if (currentPage < 4) {
                                    page = i < 6 ? i : maxPages - 1;
                                } else if (currentPage > maxPages - 5) {
                                    page = i === 0 ? 0 : maxPages - 6 + i;
                                } else {
                                    const map = [0, null, currentPage - 1, currentPage, currentPage + 1, null, maxPages - 1];
                                    if (map[i] === null) return <span key={i} style={{ padding: '0 4px', color: '#9ca3af', alignSelf: 'center' }}>…</span>;
                                    page = map[i];
                                }
                                return (
                                    <button
                                        key={i}
                                        className={`${styles.pageBtn} ${page === currentPage ? styles.active : ''}`}
                                        onClick={() => setPage(page)}
                                    >
                                        {page + 1}
                                    </button>
                                );
                            })}
                            <button
                                className={styles.pageBtn}
                                onClick={() => setPage(currentPage + 1)}
                                disabled={currentPage >= totalPages - 1}
                            >›</button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Detail Modal ── */}
            {detailEvent && (
                <DeadEventDetailModal
                    event={detailEvent}
                    onClose={() => setDetailEvent(null)}
                    onRetry={handleRetryOne}
                    actionLoading={actionLoading}
                />
            )}

            {/* ── Confirm Thử lại tất cả ── */}
            {confirmRetryAll && (
                <ConfirmDialog
                    routingKey={activeFilter || undefined}
                    totalCount={filteredCount}
                    onConfirm={handleRetryAll}
                    onCancel={() => setConfirmRetryAll(false)}
                />
            )}

        </div>
    );
};

export default DeadEventsPage;

