// AttentionSection.jsx — Lucide React icons

import React from 'react';
import styles from './AttentionSection.module.scss';
import {
    AlertTriangle, RotateCcw, TrendingDown,
    Star, CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AttentionSection = ({ tours, pendingRefund, pendingConfirmation }) => {
    const navigate = useNavigate();

    // Lấy icon theo lý do
    const getReasonIcon = (reason) => {
        switch (reason) {
            case 'REFUND_REQUEST': return <RotateCcw size={16} />;
            case 'LOW_BOOKING': return <TrendingDown size={16} />;
            case 'NEGATIVE_REVIEW': return <Star size={16} />;
            default: return <AlertTriangle size={16} />;
        }
    };

    // Lấy nhãn tiếng Việt cho lý do
    const getReasonLabel = (reason) => {
        switch (reason) {
            case 'REFUND_REQUEST': return 'Nhiều yêu cầu hoàn tiền';
            case 'LOW_BOOKING': return 'Booking thấp';
            case 'NEGATIVE_REVIEW': return 'Đánh giá tiêu cực';
            default: return reason;
        }
    };

    // Lấy class CSS theo mức độ khẩn cấp
    const getUrgencyClass = (urgency) => {
        switch (urgency) {
            case 'HIGH': return styles.high;
            case 'MEDIUM': return styles.medium;
            case 'LOW': return styles.low;
            default: return styles.medium;
        }
    };

    // Xử lý click vào tour
    const handleTourClick = (tourId) => {
        navigate(`/admin/tours/${tourId}`);
    };

    // Xử lý click vào action card
    const handleActionClick = (action) => {
        if (action === 'REFUND') {
            navigate('/admin/bookings?status=PENDING_REFUND');
        } else if (action === 'CONFIRMATION') {
            navigate('/admin/bookings?status=PENDING_CONFIRMATION');
        }
    };

    return (
        <div className={styles.attentionSection}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <AlertTriangle className={styles.warningIcon} size={22} />
                    <div>
                        <h2>Cần Chú Ý</h2>
                        <p>Tours và bookings cần hành động ngay</p>
                    </div>
                </div>
            </div>

            {/* Action Cards - Thẻ hành động nhanh */}
            <div className={styles.actionCards}>
                {/* Card Hoàn tiền */}
                <div
                    className={`${styles.actionCard} ${styles.urgent}`}
                    onClick={() => handleActionClick('REFUND')}
                >
                    <div className={styles.cardIcon}>
                        <RotateCcw size={32} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>{pendingRefund}</h3>
                        <p>Yêu cầu hoàn tiền</p>
                    </div>
                    <div className={styles.cardAction}>
                        <button className={styles.viewBtn}>
                            Xem tất cả →
                        </button>
                    </div>
                </div>

                {/* Card Xác nhận */}
                <div
                    className={`${styles.actionCard} ${styles.warning}`}
                    onClick={() => handleActionClick('CONFIRMATION')}
                >
                    <div className={styles.cardIcon}>
                        <CheckCircle2 size={32} />
                    </div>
                    <div className={styles.cardContent}>
                        <h3>{pendingConfirmation}</h3>
                        <p>Chờ xác nhận</p>
                    </div>
                    <div className={styles.cardAction}>
                        <button className={styles.viewBtn}>
                            Xem tất cả →
                        </button>
                    </div>
                </div>
            </div>

            {/* Empty State - Hiển thị khi không có tour nào */}
            {tours.length === 0 && (
                <div className={styles.emptyState}>
                    <CheckCircle2 size={48} />
                    <p>Không có tour nào cần chú ý</p>
                    <span>Tất cả các tour đang hoạt động tốt</span>
                </div>
            )}
        </div>
    );
};

export default AttentionSection;