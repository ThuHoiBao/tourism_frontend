import React, { useState, useEffect, useMemo } from 'react';
import {
    CalendarDays,
    Clock3,
    CreditCard,
    Eye,
    FileText,
    Star,
    Ticket,
    XCircle,
    Zap,
} from 'lucide-react';
import { toast } from 'react-toastify';
import TransactionDetailModal from './TransactionDetailModal/TransactionDetailModal';
import CancelOptionModal from './CancelOptionModal/CancelOptionModal';
import ReviewComponent from '../ReviewComponent/ReviewComponent';
import ViewReviewModal from '../ViewReviewModal/ViewReviewModal';
import styles from './TransactionListItem.module.scss';

const TransactionListItem = ({ booking, refetch }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isViewReviewModalOpen, setIsViewReviewModalOpen] = useState(false);
    const [isPaymentLoading] = useState(false);

    const hasDeparted = useMemo(() => {
        if (!booking?.departureDate) return false;
        const departureTime = new Date(booking.departureDate).getTime();
        return departureTime < Date.now();
    }, [booking?.departureDate]);

    const tourDurationDays = useMemo(() => {
        if (!booking?.duration) return 0;
        const match = booking.duration.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    }, [booking?.duration]);

    const hasTourEnded = useMemo(() => {
        if (!booking?.departureDate) return false;
        if (tourDurationDays === 0) return hasDeparted;
        const endTime = new Date(booking.departureDate).getTime() + tourDurationDays * 24 * 60 * 60 * 1000;
        return Date.now() > endTime;
    }, [booking?.departureDate, tourDurationDays, hasDeparted]);

    const handlePaymentClick = () => {
        if (!booking || !booking.bookingCode) {
            toast.error('Không tìm thấy thông tin booking!');
            return;
        }

        window.location.href = `/payment-booking?bookingCode=${booking.bookingCode}`;
    };

    const handleCancelClick = () => {
        if (hasDeparted) {
            toast.warn('Chuyến đi đã khởi hành, không thể hủy.');
            return;
        }
        setIsCancelModalOpen(true);
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'PENDING_PAYMENT': return 'Chờ thanh toán';
            case 'PENDING_CONFIRMATION': return 'Chờ xác nhận';
            case 'PAID': return 'Đã thanh toán';
            case 'CANCELLED': return 'Đã hủy';
            case 'OVERDUE_PAYMENT': return 'Quá hạn thanh toán';
            case 'PENDING_REVIEW': return 'Chờ đánh giá';
            case 'REVIEWED': return 'Đã đánh giá';
            case 'PENDING_REFUND': return 'Chờ hoàn tiền';
            default: return status;
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'PENDING_PAYMENT': return styles.statusPendingPayment;
            case 'PENDING_CONFIRMATION': return styles.statusPendingConfirmation;
            case 'PAID': return styles.statusPaid;
            case 'CANCELLED': return styles.statusCancelled;
            case 'OVERDUE_PAYMENT': return styles.statusOverdue;
            case 'PENDING_REVIEW': return styles.statusPendingReview;
            case 'REVIEWED': return styles.statusReviewed;
            case 'PENDING_REFUND': return styles.statusPendingRefund;
            default: return styles.statusDefault;
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    useEffect(() => {
        if (booking.bookingStatus !== 'PENDING_PAYMENT' || !booking.timeLimit) {
            setTimeLeft('');
            return undefined;
        }

        let interval;

        const updateCountdown = () => {
            const now = new Date();
            const limit = new Date(booking.timeLimit);
            const diff = limit.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeLeft('Đã hết hạn');
                clearInterval(interval);
                return;
            }

            const totalSeconds = Math.floor(diff / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            setTimeLeft(`${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`);
        };

        updateCountdown();
        interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [booking.timeLimit, booking.bookingStatus]);

    const renderActionArea = () => {
        let primaryButton = null;
        let statusDisplay = null;
        let timeLimitDisplay = null;

        const detailButton = (
            <button
                key="detail"
                className={styles.btnDetail}
                onClick={() => setIsModalOpen(true)}
                type="button"
            >
                <FileText size={16} /> Xem chi tiết
            </button>
        );

        switch (booking.bookingStatus) {
            case 'PENDING_PAYMENT':
                primaryButton = (
                    <button
                        key="pay"
                        className={`${styles.btnPrimary} ${styles.btnPay}`}
                        onClick={handlePaymentClick}
                        disabled={isPaymentLoading}
                        type="button"
                    >
                        {isPaymentLoading ? (
                            <>
                                <Clock3 size={16} /> Đang chuyển...
                            </>
                        ) : (
                            <>
                                <Zap size={16} /> Thanh toán
                            </>
                        )}
                    </button>
                );
                timeLimitDisplay = timeLeft && (
                    <div className={styles.timeLimit}>
                        <Clock3 size={15} /> Thời hạn: {timeLeft}
                    </div>
                );
                break;

            case 'PENDING_CONFIRMATION':
                primaryButton = (
                    <button
                        key="cancel"
                        className={styles.btnDanger}
                        onClick={handleCancelClick}
                        type="button"
                    >
                        <XCircle size={16} /> Hủy chuyến
                    </button>
                );
                break;

            case 'PAID':
                if (hasTourEnded) {
                    primaryButton = (
                        <button
                            key="review"
                            className={`${styles.btnPrimary} ${styles.btnReview}`}
                            onClick={() => setIsReviewModalOpen(true)}
                            type="button"
                        >
                            <Star size={16} /> Đánh giá
                        </button>
                    );
                } else {
                    primaryButton = (
                        <button
                            key="cancel-paid"
                            className={styles.btnDanger}
                            onClick={handleCancelClick}
                            type="button"
                        >
                            <XCircle size={16} /> Hủy chuyến
                        </button>
                    );
                }
                break;

            case 'PENDING_REVIEW':
                primaryButton = (
                    <button
                        key="review"
                        className={`${styles.btnPrimary} ${styles.btnReview}`}
                        onClick={() => setIsReviewModalOpen(true)}
                        type="button"
                    >
                        <Star size={16} /> Đánh giá
                    </button>
                );
                break;

            case 'REVIEWED':
                primaryButton = (
                    <button
                        key="view-review"
                        className={`${styles.btnSecondary} ${styles.btnViewReview}`}
                        onClick={() => setIsViewReviewModalOpen(true)}
                        type="button"
                    >
                        <Eye size={16} /> Xem đánh giá
                    </button>
                );
                break;

            case 'OVERDUE_PAYMENT':
                statusDisplay = (
                    <div className={styles.noticeDanger}>
                        Đơn đã quá hạn thanh toán và được hệ thống hủy tự động.
                    </div>
                );
                break;

            case 'CANCELLED':
                statusDisplay = booking.cancelReason && booking.cancelReason.trim() ? (
                    <div className={styles.noticeMuted}>
                        <strong>Lý do hủy:</strong> {booking.cancelReason}
                    </div>
                ) : null;
                break;

            default:
                break;
        }

        const actionButtons = [primaryButton, detailButton].filter(Boolean);

        return (
            <div className={styles.actions}>
                <span className={`${styles.statusBadge} ${getStatusClass(booking.bookingStatus)}`}>
                    {getStatusLabel(booking.bookingStatus)}
                </span>

                <div className={styles.price}>
                    {formatPrice(booking.totalPrice)}
                </div>

                <div className={styles.buttonGroup}>
                    {actionButtons}
                </div>

                {timeLimitDisplay}
                {statusDisplay}
            </div>
        );
    };

    return (
        <article className={styles.transactionItem}>
            <div className={styles.header}>
                <span>Booking: <strong>{booking.bookingCode}</strong></span>
                <span>Ngày tạo: {formatDate(booking.bookingDate)}</span>
            </div>

            <div className={styles.content}>
                <div className={styles.imageWrap}>
                    <img
                        src={booking.image || 'https://via.placeholder.com/200x180?text=Chuyen+di'}
                        alt={booking.tourName}
                        className={styles.image}
                    />
                </div>

                <div className={styles.info}>
                    <h3 className={styles.tourName}>{booking.tourName}</h3>

                    <div className={styles.metaGrid}>
                        <p className={styles.detail}>
                            <CalendarDays size={16} /> Khởi hành: {formatDate(booking.departureDate)}
                        </p>
                        <p className={styles.detail}>
                            <Ticket size={16} /> Mã chuyến: {booking.tourCode}
                        </p>
                        {booking.duration && (
                            <p className={styles.detail}>
                                <Clock3 size={16} /> Thời gian: {booking.duration}
                            </p>
                        )}
                        {booking.bookingStatus === 'PENDING_PAYMENT' && (
                            <p className={styles.detail}>
                                <CreditCard size={16} /> Thanh toán trực tuyến
                            </p>
                        )}
                    </div>
                </div>

                {renderActionArea()}
            </div>

            {isModalOpen && (
                <TransactionDetailModal
                    booking={booking}
                    onClose={() => setIsModalOpen(false)}
                    formatPrice={formatPrice}
                    formatDate={formatDate}
                />
            )}

            {isCancelModalOpen && (
                <CancelOptionModal
                    booking={booking}
                    bookingID={booking.bookingID}
                    onClose={() => setIsCancelModalOpen(false)}
                    onRefetch={refetch}
                />
            )}

            {isReviewModalOpen && (
                <ReviewComponent
                    booking={booking}
                    onClose={() => setIsReviewModalOpen(false)}
                    onRefetch={refetch}
                />
            )}

            {isViewReviewModalOpen && (
                <ViewReviewModal
                    booking={booking}
                    onClose={() => setIsViewReviewModalOpen(false)}
                    formatPrice={formatPrice}
                    formatDate={formatDate}
                />
            )}
        </article>
    );
};

export default TransactionListItem;
