import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './UserModals.module.scss';
import { 
    FaTimes, FaLock, FaUnlock, 
    FaInfoCircle, FaStar, 
    FaCheckCircle, FaTimesCircle, FaExclamationTriangle 
} from 'react-icons/fa';
import { lockUnlockUserApi } from '../../../../../services/user/user.ts';
import useBookings from '../../../../../hook/useBookings.ts';
import TransactionDetailModal from '../../../../InformationComponent/TransactionList/TransactionListItem/TransactionDetailModal/TransactionDetailModal.jsx';
import ViewReviewModal from '../../../../InformationComponent/TransactionList/ViewReviewModal/ViewReviewModal';

// --- COMPONENT THÔNG BÁO (NOTIFICATION MODAL) ---
const NotificationModal = ({ type, title, message, onClose }) => {
    let Icon = FaInfoCircle;
    let iconClass = styles.iconInfo;

    if (type === 'success') {
        Icon = FaCheckCircle;
        iconClass = styles.iconSuccess;
    } else if (type === 'error') {
        Icon = FaTimesCircle;
        iconClass = styles.iconDanger;
    } else if (type === 'warning') {
        Icon = FaExclamationTriangle;
        iconClass = styles.iconWarning;
    }

    return (
        <div className={styles.notificationOverlay} onClick={onClose}>
            <div className={styles.notificationContent} onClick={e => e.stopPropagation()}>
                <Icon className={`${styles.notificationIcon} ${iconClass}`} />
                <h3>{title}</h3>
                <p>{message}</p>
                <button className={styles.btnOk} onClick={onClose}>Đóng</button>
            </div>
        </div>
    );
};

// --- DATA CONSTANTS ---
const LOCK_REASONS = [
    "Vi phạm điều khoản sử dụng",
    "Spam hoặc hành vi đáng ngờ",
    "Yêu cầu từ cơ quan chức năng",
    "Khác (Nhập lý do)"
];

const UNLOCK_REASONS = [
    "Xin lỗi khách hàng về sự nhầm lẫn",
    "Đã xác minh danh tính thành công",
    "Hết thời hạn khóa tài khoản",
    "Khác (Nhập lý do)"
];

// --- 1. LOCK / UNLOCK USER MODAL ---
export const LockUserModal = ({ user, onClose, onSuccess }) => {
    const isLocking = user.status; 
    const options = isLocking ? LOCK_REASONS : UNLOCK_REASONS;
    const title = isLocking ? "Khóa tài khoản khách hàng" : "Mở khóa tài khoản khách hàng";
    
    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [loading, setLoading] = useState(false);
    
    // State quản lý thông báo thay vì alert
    const [notification, setNotification] = useState(null);

    const handleSubmit = async () => {
        const finalReason = selectedReason === options[3] ? customReason : selectedReason;
        
        if (!finalReason) {
            setNotification({
                type: 'warning',
                title: 'Thiếu thông tin',
                message: 'Vui lòng chọn lý do trước khi tiếp tục!'
            });
            return;
        }

        try {
            setLoading(true);
            await lockUnlockUserApi(user.userID, !user.status, finalReason);
            
            // Hiện thông báo thành công
            setNotification({
                type: 'success',
                title: 'Thành công!',
                message: `Đã ${isLocking ? 'khóa' : 'mở khóa'} tài khoản thành công.`
            });
        } catch (error) {
            // Hiện thông báo lỗi
            setNotification({
                type: 'error',
                title: 'Đã xảy ra lỗi',
                message: error.response?.data?.message || error.message
            });
        } finally {
            setLoading(false);
        }
    };

    // Xử lý khi đóng thông báo
    const handleCloseNotification = () => {
        const isSuccess = notification?.type === 'success';
        setNotification(null);
        
        if (isSuccess) {
            onSuccess(); // Refresh list user
            onClose();   // Đóng modal chính
        }
    };

    const modalJSX = (
        <div className={styles.modalOverlay} onClick={onClose}>
            {/* Render Notification đè lên Modal chính */}
            {notification && (
                <NotificationModal 
                    type={notification.type}
                    title={notification.title}
                    message={notification.message}
                    onClose={handleCloseNotification}
                />
            )}

            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={`${styles.header} ${isLocking ? styles.headerLock : styles.headerUnlock}`}>
                    {isLocking ? <FaLock /> : <FaUnlock />}
                    <h2>{title}</h2>
                </div>

                <div className={styles.body}>
                    <div className={styles.userInfoBox}>
                        <img src={user.avatar} alt="Avatar" />
                        <div>
                            <p><strong>{user.fullName}</strong></p>
                            <p>{user.email} - {user.phone}</p>
                        </div>
                    </div>

                    <h4>Chọn lý do {isLocking ? 'khóa' : 'mở khóa'}:</h4>
                    <div className={styles.optionsList}>
                        {options.map((option, idx) => (
                            <label key={idx} className={styles.radioLabel}>
                                <input 
                                    type="radio" name="reason" value={option}
                                    checked={selectedReason === option}
                                    onChange={e => setSelectedReason(e.target.value)}
                                />
                                {option}
                            </label>
                        ))}
                    </div>

                    {selectedReason === options[3] && (
                        <textarea 
                            className={styles.customInput} 
                            placeholder="Nhập lý do cụ thể..."
                            value={customReason}
                            onChange={e => setCustomReason(e.target.value)}
                        />
                    )}
                </div>

                <div className={styles.footer}>
                    <button className={styles.btnCancel} onClick={onClose} disabled={loading}>Hủy</button>
                    <button 
                        className={`${styles.btnConfirm} ${isLocking ? styles.btnConfirmLock : styles.btnConfirmUnlock}`}
                        onClick={handleSubmit} disabled={loading}
                    >
                        {loading ? 'Đang xử lý...' : 'Xác nhận'}
                    </button>
                </div>
            </div>
        </div>
    );
    return createPortal(modalJSX, document.body);
};

// --- 2. VIEW ORDERS MODAL ---
export const UserOrdersModal = ({ user, onClose }) => {
    const { bookings, loading, error } = useBookings(user.userID, null);
    
    const [detailBooking, setDetailBooking] = useState(null);
    const [reviewBooking, setReviewBooking] = useState(null);

    const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    const formatDate = (date) => date ? new Date(date).toLocaleDateString('vi-VN') : 'N/A';

    const getStatusLabel = (status) => {
        const map = {
            'PENDING_PAYMENT': 'Chờ thanh toán',
            'PENDING_CONFIRMATION': 'Chờ xác nhận',
            'PAID': 'Đã thanh toán',
            'CANCELLED': 'Đã hủy',
            'REVIEWED': 'Đã đánh giá',
            'PENDING_REFUND': 'Chờ hoàn tiền',
            'OVERDUE_PAYMENT': 'Quá hạn thanh toán'
        };
        return map[status] || status;
    };

    const modalJSX = (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={`${styles.modalContent} ${styles.wideModal}`} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtnTop} onClick={onClose}><FaTimes /></button>
                
                <div className={styles.orderHeader}>
                    <h2>Các chuyến đi của {user.fullName}</h2>
                    <div className={styles.stats}>
                        <span>Tổng chuyến đi: {bookings.length}</span>
                    </div>
                </div>

                <div className={styles.tableContainer}>
                    {loading ? <div className={styles.loading}>Đang tải dữ liệu...</div> : 
                     error ? <div className={styles.error}>{error}</div> : (
                        bookings.length === 0 ? <p className={styles.empty}>Khách hàng chưa có chuyến đi nào.</p> :
                        <table className={styles.orderTable}>
                            <thead>
                                <tr>
                                    <th>Mã Booking</th>
                                    <th>Tour</th>
                                    <th>Ngày đặt</th>
                                    <th>Tổng tiền</th>
                                    <th className={styles.statusHeader}>Trạng thái</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map(bk => (
                                    <tr key={bk.bookingID}>
                                        <td className={styles.code}>{bk.bookingCode}</td>
                                        <td className={styles.tourName}>
                                            <div className={styles.tourInfo}>
                                                <img src={bk.image || 'placeholder.png'} alt="" />
                                                <span title={bk.tourName}>{bk.tourName}</span>
                                            </div>
                                        </td>
                                        <td>{formatDate(bk.bookingDate)}</td>
                                        <td className={styles.price}>{formatPrice(bk.totalPrice)}</td>
                                        
                                        <td className={styles.statusCell}>
                                            <span className={`${styles.badge} ${styles[bk.bookingStatus]}`}>
                                                {getStatusLabel(bk.bookingStatus)}
                                            </span>
                                        </td>
                                        
                                        <td>
                                            <div className={styles.rowActions}>
                                                <button 
                                                    className={`${styles.btnIconAction} ${styles.detailIcon}`} 
                                                    onClick={() => setDetailBooking(bk)}
                                                    title="Xem chi tiết"
                                                >
                                                    <FaInfoCircle />
                                                </button>

                                                {bk.bookingStatus === 'REVIEWED' && (
                                                    <button 
                                                        className={`${styles.btnIconAction} ${styles.starIcon}`} 
                                                        onClick={() => setReviewBooking(bk)}
                                                        title="Xem đánh giá"
                                                    >
                                                        <FaStar />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {detailBooking && (
                <TransactionDetailModal 
                    booking={detailBooking} 
                    onClose={() => setDetailBooking(null)}
                    formatPrice={formatPrice}
                    formatDate={formatDate}
                />
            )}
            {reviewBooking && (
                <ViewReviewModal 
                    booking={reviewBooking} 
                    onClose={() => setReviewBooking(null)}
                    formatPrice={formatPrice}
                    formatDate={formatDate}
                />
            )}
        </div>
    );
    return createPortal(modalJSX, document.body);
};