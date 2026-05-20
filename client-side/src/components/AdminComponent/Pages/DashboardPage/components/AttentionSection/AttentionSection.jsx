// AttentionSection.jsx - Lucide React icons

import React from 'react';
import styles from './AttentionSection.module.scss';
import {
    AlertTriangle,
    RotateCcw,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AttentionSection = ({ tours, pendingRefund, pendingConfirmation }) => {
    const navigate = useNavigate();

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
                        <h2>Cần chú ý</h2>
                        <p>Tours và bookings cần hành động ngay</p>
                    </div>
                </div>
            </div>

            <div className={styles.actionCards}>
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
                            <span>Xem tất cả</span>
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>

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
                            <span>Xem tất cả</span>
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

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
