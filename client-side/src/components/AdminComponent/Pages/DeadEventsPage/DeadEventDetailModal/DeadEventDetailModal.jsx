// DeadEventDetailModal.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
    FaTimes,
    FaRedo,
    FaExclamationTriangle,
    FaUser,
    FaRoute,
    FaCoins,
    FaBell,
    FaChevronDown,
} from 'react-icons/fa';
import { getDeadEventDetailApi } from '../../../../../services/booking/booking.ts';
import styles from './DeadEventDetailModal.module.scss';

const TASK_LABELS = {
    'Hoan xu cho khach': 'Hoàn xu cho khách',
    'Gui email/thong bao': 'Gửi email/thông báo',
};

const STATUS_LABELS = {
    DEAD: 'Cần xử lý',
    NEW: 'Đang chờ xử lý lại',
    SENDING: 'Đang xử lý',
    SENT: 'Đã xử lý',
};

const COIN_STATUS_LABELS = {
    PENDING: 'Đang chờ cộng xu',
    COMPLETED: 'Đã cộng xu',
    FAILED: 'Cộng xu lỗi',
};

const EMPTY = '—';

const isBlank = (value) => (
    value == null ||
    String(value).trim() === '' ||
    String(value).trim().toLowerCase() === 'null'
);

const text = (value) => (isBlank(value) ? EMPTY : value);

const taskLabel = (detail, event) => {
    const raw = detail?.taskType;
    if (raw && TASK_LABELS[raw]) return TASK_LABELS[raw];
    if (raw) return raw;
    if (event?.routingKey === 'booking.coin.refund') return 'Hoàn xu cho khách';
    if (event?.routingKey === 'booking.notification.event') return 'Gửi email/thông báo';
    return 'Tác vụ hệ thống';
};

const statusLabel = (detail, event) => (
    TASK_LABELS[detail?.statusLabel] ||
    STATUS_LABELS[detail?.status] ||
    STATUS_LABELS[event?.status] ||
    detail?.statusLabel ||
    event?.status ||
    EMPTY
);

const formatPayload = (raw) => {
    try {
        return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
        return raw ?? '(empty)';
    }
};

const formatDateTime = (value) => {
    if (isBlank(value)) return EMPTY;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const formatMoney = (value) => {
    if (value == null || value === '') return EMPTY;
    const number = Number(value);
    if (Number.isNaN(number)) return value;
    return `${number.toLocaleString('vi-VN')} đ`;
};

const formatCoin = (value) => {
    if (value == null || value === '') return EMPTY;
    const number = Number(value);
    if (Number.isNaN(number)) return value;
    return `${number.toLocaleString('vi-VN')} xu`;
};

const parsePayload = (raw) => {
    try {
        return JSON.parse(raw || '{}');
    } catch {
        return {};
    }
};

const InfoRow = ({ label, value, strong = false, danger = false }) => (
    <div className={styles.infoRow}>
        <span>{label}</span>
        <strong className={`${strong ? styles.strongValue : ''} ${danger ? styles.dangerValue : ''}`}>
            {text(value)}
        </strong>
    </div>
);

const DeadEventDetailModal = ({ event, onClose, onRetry, actionLoading }) => {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const fetchDetail = async () => {
            if (!event?.id) return;
            setLoading(true);
            setError(null);
            try {
                const data = await getDeadEventDetailApi(event.id);
                if (!cancelled) setDetail(data);
            } catch (err) {
                if (!cancelled) {
                    setError(err?.response?.data?.message || err?.message || 'Không tải được chi tiết sự cố.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchDetail();
        return () => { cancelled = true; };
    }, [event?.id]);

    const payload = useMemo(() => parsePayload(detail?.rawPayload ?? event?.payload), [detail?.rawPayload, event?.payload]);

    if (!event) return null;

    const booking = detail?.booking || {};
    const refund = detail?.refund || {};
    const latestError = detail?.latestError || event.errorMessage;
    const rawPayload = detail?.rawPayload ?? event.payload;
    const currentTaskLabel = taskLabel(detail, event);
    const isCoinTask = event.routingKey === 'booking.coin.refund' || detail?.eventType === 'COIN_REFUND';
    const retryText = detail?.retryText || `${event.retries} / ${event.maxRetries}`;
    const coinStatus = !isBlank(booking.coinRefundStatus)
        ? COIN_STATUS_LABELS[String(booking.coinRefundStatus).trim()] || booking.coinRefundStatus
        : EMPTY;

    const handleRetry = async () => {
        await onRetry(event.id);
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div>
                        <h2>
                            <FaExclamationTriangle />
                            Sự cố #{event.id}
                        </h2>
                        <p>{currentTaskLabel}</p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
                        <FaTimes />
                    </button>
                </div>

                <div className={styles.body}>
                    {loading && (
                        <div className={styles.loadingBox}>Đang tải thông tin chi tiết...</div>
                    )}

                    {error && (
                        <div className={styles.errorBox}>
                            Không tải được dữ liệu đã xử lý. Tạm thời hiển thị dữ liệu kỹ thuật cũ. Lỗi: {error}
                        </div>
                    )}

                    <section className={styles.summaryPanel}>
                        <div className={styles.summaryItem}>
                            <span>Trạng thái</span>
                            <strong className={styles.statusPill}>{statusLabel(detail, event)}</strong>
                        </div>
                        <div className={styles.summaryItem}>
                            <span>Số lần thử</span>
                            <strong>{retryText}</strong>
                        </div>
                        <div className={styles.summaryItem}>
                            <span>Phát sinh</span>
                            <strong>{formatDateTime(detail?.createdAt || event.createdAt)}</strong>
                        </div>
                        <div className={styles.summaryItem}>
                            <span>Lần thử tiếp theo</span>
                            <strong>{formatDateTime(detail?.nextRetryAt || event.nextRetryAt)}</strong>
                        </div>
                    </section>

                    {latestError && (
                        <section className={styles.section}>
                            <h3>Nguyên nhân gần nhất</h3>
                            <div className={styles.errorBox}>{latestError}</div>
                        </section>
                    )}

                    <section className={styles.section}>
                        <h3><FaUser /> Khách hàng cần hỗ trợ</h3>
                        <div className={styles.infoGrid}>
                            <InfoRow label="Họ tên" value={booking.customerName || payload.contactFullName} strong />
                            <InfoRow label="Mã booking" value={booking.bookingCode || payload.bookingCode} strong />
                            <InfoRow label="Email liên hệ" value={booking.contactEmail || payload.contactEmail} />
                            <InfoRow label="Số điện thoại" value={booking.contactPhone || payload.contactPhone} />
                            <InfoRow label="User ID" value={booking.userId || payload.userId} />
                            <InfoRow label="Địa chỉ" value={booking.contactAddress || payload.contactAddress} />
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h3><FaRoute /> Booking và tour</h3>
                        <div className={styles.infoGrid}>
                            <InfoRow label="Trạng thái booking" value={booking.bookingStatus || payload.bookingStatus} strong />
                            <InfoRow label="Tên tour" value={booking.tourName || payload.tourName} strong />
                            <InfoRow label="Mã tour" value={booking.tourCode || payload.tourCode} />
                            <InfoRow label="Ngày khởi hành" value={formatDateTime(booking.departureDate || payload.departureDate)} />
                            <InfoRow label="Lý do hủy" value={booking.cancelReason || payload.cancelReason} />
                            <InfoRow label="Trạng thái hoàn xu" value={coinStatus} />
                        </div>
                    </section>

                    <section className={styles.section}>
                        <h3>{isCoinTask ? <FaCoins /> : <FaBell />} Thông tin xử lý</h3>
                        <div className={styles.infoGrid}>
                            <InfoRow label="Loại tác vụ" value={currentTaskLabel} strong />
                            <InfoRow label="Event type" value={detail?.eventType || payload.eventType || (isCoinTask ? 'COIN_REFUND' : EMPTY)} />
                            <InfoRow label="Số tiền hoàn" value={formatMoney(refund.refundAmount ?? payload.refundAmount)} strong />
                            <InfoRow label="Xu cần cộng" value={formatCoin(refund.coinRefundAmount ?? payload.coinRefundAmount)} strong />
                            <InfoRow label="Tổng giá trị booking" value={formatMoney(refund.totalPrice ?? payload.totalPrice)} />
                            <InfoRow label="Giá trị điểm đã dùng" value={formatMoney(refund.paidByCoin ?? payload.paidByCoin)} />
                            <InfoRow label="Ngân hàng" value={refund.refundBank || payload.refundBank} />
                            <InfoRow label="Số tài khoản" value={refund.refundAccountNumberMasked || payload.refundAccountNumber} />
                            <InfoRow label="Chủ tài khoản" value={refund.refundAccountName || payload.refundAccountName} />
                            <InfoRow label="Routing key" value={detail?.routingKey || event.routingKey} />
                        </div>
                    </section>

                    <section className={styles.guidanceBox}>
                        <strong>Hướng xử lý đề xuất</strong>
                        <p>{detail?.suggestion || 'Kiểm tra nguyên nhân lỗi, sau đó bấm Thử xử lý lại nếu hệ thống đã ổn định.'}</p>
                    </section>

                    <details className={styles.technicalBlock}>
                        <summary>
                            <FaChevronDown />
                            Xem dữ liệu kỹ thuật của event
                        </summary>
                        <div className={styles.techGrid}>
                            <InfoRow label="Idempotency key" value={detail?.idempotencyKey || event.idempotencyKey} />
                            <InfoRow label="Max backoff" value={`${detail?.maxBackoffSecs ?? event.maxBackoffSecs} giây`} />
                            <InfoRow label="Sent at" value={formatDateTime(detail?.sentAt || event.sentAt)} />
                            <InfoRow label="Locked by" value={detail?.lockedBy || event.lockedBy} />
                        </div>
                        <pre className={styles.payloadBox}>{formatPayload(rawPayload)}</pre>
                    </details>
                </div>

                <div className={styles.footer}>
                    <button className={styles.btnClose} onClick={onClose}>Đóng</button>
                    <button
                        className={styles.btnRetry}
                        onClick={handleRetry}
                        disabled={actionLoading}
                    >
                        <FaRedo />
                        {actionLoading ? 'Đang thử lại...' : 'Thử xử lý lại'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeadEventDetailModal;
