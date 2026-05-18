// DeadEventItem.jsx
import React from 'react';
import { FaEye, FaRedo } from 'react-icons/fa';
import styles from './DeadEventItem.module.scss';

const TASK_LABELS = {
    'booking.coin.refund':        'Hoàn xu cho khách',
    'booking.notification.event': 'Gửi email/thông báo',
};

/**
 * Một dòng trong bảng Sự cố xử lý nền.
 * Props:
 *  - event: OutboxEventDTO
 *  - onViewDetail: (event) => void
 *  - onRetry: (id) => void
 *  - actionLoading: boolean
 */
const DeadEventItem = ({ event, onViewDetail, onRetry, actionLoading }) => {
    const fmtDate = (iso) => {
        if (!iso) return '—';
        try {
            return new Date(iso).toLocaleString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch {
            return iso;
        }
    };

    return (
        <tr className={styles.row}>
            <td className={styles.idCell}>#{event.id}</td>
            <td>
                <span className={styles.taskLabel} title={event.routingKey}>
                    {TASK_LABELS[event.routingKey] ?? event.routingKey}
                </span>
            </td>
            <td>
                <span className={styles.retryBadge}>
                    {event.retries}/{event.maxRetries}
                </span>
            </td>
            <td className={styles.dateText}>{fmtDate(event.createdAt)}</td>
            <td className={styles.dateText}>{fmtDate(event.nextRetryAt)}</td>
            <td>
                <span className={styles.errorText} title={event.errorMessage ?? ''}>
                    {event.errorMessage ?? '—'}
                </span>
            </td>
            <td>
                <div className={styles.actions}>
                    <button
                        className={styles.btnDetail}
                        onClick={() => onViewDetail(event)}
                        title="Xem chi tiết"
                    >
                        <FaEye /> Xem chi tiết
                    </button>
                    <button
                        className={styles.btnRetry}
                        onClick={() => onRetry(event.id)}
                        disabled={actionLoading}
                        title="Đưa tác vụ về hàng chờ để hệ thống thử xử lý lại"
                    >
                        <FaRedo /> Thử xử lý lại
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default DeadEventItem;
