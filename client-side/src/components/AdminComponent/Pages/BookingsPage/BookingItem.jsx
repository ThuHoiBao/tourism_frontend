// src/components/AdminComponent/Pages/BookingsPage/BookingItem.jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import styles from './BookingItem.module.scss';
import { FaEye, FaStar, FaDollarSign, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import TransactionDetailModal from '../../../InformationComponent/TransactionList/TransactionListItem/TransactionDetailModal/TransactionDetailModal';
import ViewReviewModal from '../../../InformationComponent/TransactionList/ViewReviewModal/ViewReviewModal';
import { 
    ConfirmBookingModal, 
    CancelWithRefundModal, 
    CancelWithoutRefundModal, 
    ProcessRefundModal 
} from './AdminBookingModals/AdminBookingModals';

const statusMap = {
    PENDING_PAYMENT: { label: 'Chờ thanh toán', class: 'statusPending' },
    PENDING_CONFIRMATION: { label: 'Chờ xác nhận', class: 'statusProcessing' },
    PAID: { label: 'Đã thanh toán', class: 'statusCompleted' },
    CANCELLED: { label: 'Đã hủy', class: 'statusRejected' },
    OVERDUE_PAYMENT: { label: 'Quá hạn', class: 'statusOnHold' },
    REVIEWED: { label: 'Đã đánh giá', class: 'statusReviewed' },
    PENDING_REFUND: { label: 'Chờ hoàn tiền', class: 'statusRefund' }
};

const BookingItem = ({ booking, formatPrice, formatDate, refetch }) => {
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    
    // NEW: State cho các modal hành động admin
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isCancelWithRefundModalOpen, setIsCancelWithRefundModalOpen] = useState(false);
    const [isCancelWithoutRefundModalOpen, setIsCancelWithoutRefundModalOpen] = useState(false);
    const [isProcessRefundModalOpen, setIsProcessRefundModalOpen] = useState(false);

    const statusInfo = statusMap[booking.bookingStatus] || { label: booking.bookingStatus, class: 'statusDefault' };

    // Guard: tour đã khởi hành?
    const hasDeparted = React.useMemo(() => {
        if (!booking?.departureDate) return false;
        const departureTime = new Date(booking.departureDate).getTime();
        return departureTime < Date.now();
    }, [booking?.departureDate]);

    const handleAdminConfirm = () => {
        if (hasDeparted) {
            toast.warn('Tour đã khởi hành, không thể xác nhận.');
            return;
        }
        setIsConfirmModalOpen(true);
    };

    const handleAdminCancelWithRefund = () => {
        if (hasDeparted) {
            toast.warn('Tour đã khởi hành, không thể hủy.');
            return;
        }
        setIsCancelWithRefundModalOpen(true);
    };

    // Render các nút action dựa trên trạng thái
    const renderActionButtons = () => {
        const status = booking.bookingStatus;

        return (
            <div className={styles.actionIcons}>
                {/* XEM CHI TIẾT - Luôn hiển thị */}
                <button 
                    className={styles.actionBtn} 
                    onClick={() => setIsDetailModalOpen(true)} 
                    title="Xem Chi Tiết"
                >
                    <FaEye />
                </button>

                {/* TRẠNG THÁI: PENDING_CONFIRMATION */}
                {status === 'PENDING_CONFIRMATION' && (
                    <>
                        <button 
                            className={`${styles.actionBtn} ${styles.btnSuccess}`}
                            onClick={handleAdminConfirm}
                            title="Xác nhận booking"
                        >
                            <FaCheckCircle />
                        </button>
                        <button 
                            className={`${styles.actionBtn} ${styles.btnDanger}`}
                            onClick={handleAdminCancelWithRefund}
                            title="Hủy chuyến đi"
                        >
                            <FaTimesCircle />
                        </button>
                    </>
                )}

                {/* TRẠNG THÁI: PENDING_PAYMENT */}
                {status === 'PENDING_PAYMENT' && (
                    <button 
                        className={`${styles.actionBtn} ${styles.btnDanger}`}
                        onClick={() => setIsCancelWithoutRefundModalOpen(true)}
                        title="Hủy chuyến đi"
                    >
                        <FaTimesCircle />
                    </button>
                )}

                {/* TRẠNG THÁI: PAID */}
                {status === 'PAID' && (
                    <button 
                        className={`${styles.actionBtn} ${styles.btnDanger}`}
                        onClick={handleAdminCancelWithRefund}
                        title="Hủy chuyến đi"
                    >
                        <FaTimesCircle />
                    </button>
                )}

                {/* TRẠNG THÁI: PENDING_REFUND */}
                {status === 'PENDING_REFUND' && (
                    <button 
                        className={`${styles.actionBtn} ${styles.btnRefund}`}
                        onClick={() => setIsProcessRefundModalOpen(true)}
                        title="Hoàn tiền khách hàng"
                    >
                        <FaDollarSign />
                    </button>
                )}

                {/* TRẠNG THÁI: REVIEWED - Xem đánh giá */}
                {status === 'REVIEWED' && (
                    <button 
                        className={`${styles.actionBtn} ${styles.reviewBtn}`}
                        onClick={() => setIsReviewModalOpen(true)}
                        title="Xem Đánh Giá"
                    >
                        <FaStar />
                    </button>
                )}
            </div>
        );
    };

    return (
        <>
            <tr className={styles.bookingItem}>
                <td>
                    <div className={styles.bookingCode}>{booking.bookingCode}</div>
                </td>
                <td>
                    <div className={styles.tourInfo}>
                        <img src={booking.image || 'placeholder.png'} alt={booking.tourName} className={styles.tourImage} />
                        <div>
                            <p className={styles.tourName}>{booking.tourName}</p>
                            <p className={styles.tourCode}>Mã: {booking.tourCode}</p>
                        </div>
                    </div>
                </td>
                <td>{formatDate(booking.departureDate)}</td>
                <td>{formatDate(booking.bookingDate)}</td>
                <td>
                    <div className={`${styles.statusBadge} ${styles[statusInfo.class]}`}>
                        {statusInfo.label}
                    </div>
                </td>
                <td>
                    {renderActionButtons()}
                </td>
            </tr>

            {/* MODAL XEM CHI TIẾT */}
            {isDetailModalOpen && (
                <TransactionDetailModal 
                    booking={booking} 
                    onClose={() => setIsDetailModalOpen(false)} 
                    formatPrice={formatPrice} 
                    formatDate={formatDate}
                />
            )}

            {/* MODAL XEM ĐÁNH GIÁ */}
            {isReviewModalOpen && (
                <ViewReviewModal 
                    booking={booking} 
                    onClose={() => setIsReviewModalOpen(false)} 
                    formatPrice={formatPrice} 
                    formatDate={formatDate}
                />
            )}

            {/* MODAL XÁC NHẬN BOOKING (PENDING_CONFIRMATION) */}
            {isConfirmModalOpen && (
                <ConfirmBookingModal
                    booking={booking}
                    onClose={() => setIsConfirmModalOpen(false)}
                    onSuccess={refetch}
                />
            )}

            {/* MODAL HỦY VỚI HOÀN TIỀN (PENDING_CONFIRMATION, PAID) */}
            {isCancelWithRefundModalOpen && (
                <CancelWithRefundModal
                    booking={booking}
                    onClose={() => setIsCancelWithRefundModalOpen(false)}
                    onSuccess={refetch}
                />
            )}

            {/* MODAL HỦY KHÔNG HOÀN TIỀN (PENDING_PAYMENT) */}
            {isCancelWithoutRefundModalOpen && (
                <CancelWithoutRefundModal
                    booking={booking}
                    onClose={() => setIsCancelWithoutRefundModalOpen(false)}
                    onSuccess={refetch}
                />
            )}

            {/* MODAL XỬ LÝ HOÀN TIỀN (PENDING_REFUND) */}
            {isProcessRefundModalOpen && (
                <ProcessRefundModal
                    booking={booking}
                    onClose={() => setIsProcessRefundModalOpen(false)}
                    onSuccess={refetch}
                />
            )}
        </>
    );
};

export default BookingItem;