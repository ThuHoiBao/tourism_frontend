// src/components/AdminComponent/Pages/BookingsPage/AdminBookingModals/AdminBookingModals.jsx
import React, { useState, useEffect } from 'react';
import styles from './AdminBookingModals.module.scss';
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle, FaQrcode, FaInfoCircle } from 'react-icons/fa';
import { updateBookingStatusApi } from '../../../../../services/booking/booking.ts';

// CANCEL REASONS
const CANCEL_REASONS = [
    "Xin lỗi quý khách do tình hình thời tiết nên không thể khởi hành chuyến đi",
    "Không đủ số lượng khách tham gia tour",
    "Có sự cố về phương tiện vận chuyển",
    "Khác (Nhập lý do)"
];

// 🔥 NOTIFICATION MODAL (THAY THẾ ALERT)
const NotificationModal = ({ title, message, type, onClose }) => {
    let Icon;
    let iconClass;

    switch (type) {
        case 'success':
            Icon = FaCheckCircle;
            iconClass = styles.iconSuccess;
            break;
        case 'error':
            Icon = FaTimesCircle;
            iconClass = styles.iconDanger;
            break;
        case 'info':
        default:
            Icon = FaInfoCircle;
            iconClass = styles.iconSuccess; // Dùng màu xanh dương cho info
            break;
    }

    return (
        <div className={styles.notificationOverlay} onClick={onClose}>
            <div className={styles.notificationContent} onClick={(e) => e.stopPropagation()}>
                <Icon className={`${styles.notificationIcon} ${iconClass}`} />
                <h3 className={styles.notificationTitle}>{title}</h3>
                <p className={styles.notificationMessage}>{message}</p>
                <button className={styles.btnOk} onClick={onClose}>Đóng</button>
            </div>
        </div>
    );
};

// 🔥 CONFIRMATION MODAL (THAY THẾ WINDOW.CONFIRM)
const ConfirmationModal = ({ title, message, onConfirm, onCancel }) => {
    return (
        <div className={styles.confirmationOverlay} onClick={onCancel}>
            <div className={styles.confirmationContent} onClick={(e) => e.stopPropagation()}>
                <FaExclamationTriangle className={styles.iconWarningLg} />
                <h3>{title}</h3>
                <p>{message}</p>
                <div className={styles.confirmationActions}>
                    <button className={`${styles.btnConfirmAction} ${styles.btnConfirmNo}`} onClick={onCancel}>
                        Hủy
                    </button>
                    <button className={`${styles.btnConfirmAction} ${styles.btnConfirmYes}`} onClick={onConfirm}>
                        Xác nhận đã chuyển
                    </button>
                </div>
            </div>
        </div>
    );
};

// 🔥 VietQR Component
const VietQRCode = ({ bank, accountNumber, accountName, amount, bookingCode }) => {
    const transferContent = `HOANTIEN ${bookingCode}`;
    
    // Format theo chuẩn VietQR
    const vietQRUrl = `https://img.vietqr.io/image/${bank}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;
    
    return (
        <div className={styles.qrCodeSection}>
            <div className={styles.qrCodeHeader}>
                <FaQrcode className={styles.qrIcon} />
                <h4>Quét mã để chuyển khoản</h4>
            </div>
            <img src={vietQRUrl} alt="VietQR Code" className={styles.qrImage} />
            <div className={styles.qrInfo}>
                <p><strong>Ngân hàng:</strong> {bank}</p>
                <p><strong>Số TK:</strong> {accountNumber}</p>
                <p><strong>Chủ TK:</strong> {accountName}</p>
                <p><strong>Số tiền:</strong> {new Intl.NumberFormat('vi-VN').format(amount)} VND</p>
                <p><strong>Nội dung:</strong> {transferContent}</p>
            </div>
        </div>
    );
};

// 1. MODAL XÁC NHẬN ĐƠN HÀNG (PENDING_CONFIRMATION -> PAID)
export const ConfirmBookingModal = ({ booking, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null); // State quản lý thông báo

    const handleConfirm = async () => {
        try {
            setLoading(true);
            await updateBookingStatusApi({
                bookingID: booking.bookingID,
                bookingStatus: 'PAID'
            });
            // THAY THẾ ALERT BẰNG NOTIFICATION MODAL
            setNotification({
                title: 'Thành công!',
                message: 'Booking đã được xác nhận thanh toán thành công.',
                type: 'success'
            });
            onSuccess();
        } catch (error) {
            // THAY THẾ ALERT BẰNG NOTIFICATION MODAL
            setNotification({
                title: 'Thất bại!',
                message:  (error.response?.data?.message || error.message),
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClose = () => {
        setNotification(null);
        if (notification?.type === 'success') {
            onClose(); // Đóng modal chính sau khi thông báo thành công
        }
    }

    return (
        <>
            {notification && <NotificationModal {...notification} onClose={handleNotificationClose} />}

            <div className={styles.modalOverlay} onClick={onClose}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <FaCheckCircle className={styles.iconSuccess} />
                        <h2>Xác nhận booking</h2>
                    </div>
                    
                    <div className={styles.modalBody}>
                        <p className={styles.confirmText}>
                            Bạn chắc chắn sẽ xác nhận chuyến đi của khách hàng <strong>{booking.contactFullName}</strong> đúng không?
                        </p>
                        
                        <div className={styles.bookingInfo}>
                            <img src={booking.image || '/placeholder.png'} alt={booking.tourName} />
                            <div>
                                <p><strong>Booking:</strong> {booking.bookingCode}</p>
                                <p><strong>Tour:</strong> {booking.tourName}</p>
                                <p><strong>Mã Tour:</strong> {booking.tourCode}</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <button 
                            className={styles.btnCancel} 
                            onClick={onClose}
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button 
                            className={styles.btnConfirm} 
                            onClick={handleConfirm}
                            disabled={loading}
                        >
                            {loading ? 'Đang xử lý...' : 'Xác nhận'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};


// 2. MODAL HỦY ĐƠN VÀ HOÀN TIỀN (CHO PENDING_CONFIRMATION, PAID)
export const CancelWithRefundModal = ({ booking, onClose, onSuccess }) => {
    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);
    const [checkAttempts, setCheckAttempts] = useState(0);
    const [notification, setNotification] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false); // State mới cho Confirmation Modal

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const totalRefund = booking.totalPrice + (booking.paidByCoin || 0);

    // Auto-check giao dịch mỗi 5 giây (tối đa 12 lần = 1 phút)
    useEffect(() => {
        if (!checking || checkAttempts >= 12) return;

        const timer = setTimeout(async () => {
            try {
                console.log(`🔍 Checking transaction... Attempt ${checkAttempts + 1}/12`);
                
                const finalReason = selectedReason === CANCEL_REASONS[3] ? customReason : selectedReason;
                
                // Gọi API update status
                await updateBookingStatusApi({
                    bookingID: booking.bookingID,
                    bookingStatus: 'CANCELLED',
                    cancelReason: finalReason || 'Admin hủy và hoàn tiền'
                });
                
                // THAY THẾ ALERT BẰNG NOTIFICATION MODAL
                setChecking(false);
                setNotification({
                    title: 'Thành công!',
                    message: 'Đã xác nhận giao dịch chuyển khoản thành công và hủy booking.',
                    type: 'success'
                });
                onSuccess();
                
            } catch (error) {
                console.log('Transaction not found yet, retrying...');
                setCheckAttempts(prev => prev + 1);

                if (checkAttempts + 1 >= 12) {
                    setChecking(false);
                    setNotification({
                        title: 'Tự động kiểm tra thất bại',
                        message: 'Không tìm thấy giao dịch sau nhiều lần thử. Vui lòng thử lại hoặc xác nhận thủ công.',
                        type: 'error'
                    });
                }
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [checking, checkAttempts, selectedReason, customReason]);

    const handleStartAutoCheck = () => {
        const finalReason = selectedReason === CANCEL_REASONS[3] ? customReason : selectedReason;
        
        if (!finalReason || finalReason.trim() === '') {
            // THAY THẾ ALERT BẰNG NOTIFICATION MODAL
            setNotification({
                title: 'Thiếu thông tin',
                message: 'Vui lòng chọn hoặc nhập lý do hủy!',
                type: 'info'
            });
            return;
        }

        setChecking(true);
        setCheckAttempts(0);
        // THAY THẾ ALERT BẰNG NOTIFICATION MODAL
        setNotification({
            title: 'Bắt đầu kiểm tra',
            message: 'Bắt đầu kiểm tra giao dịch tự động. Vui lòng quét mã QR để chuyển khoản...',
            type: 'info'
        });
    };

    // 🔥 CHỨC NĂNG MỚI: Mở Confirmation Modal trước khi gọi API
    const handleManualConfirmClick = () => {
        const finalReason = selectedReason === CANCEL_REASONS[3] ? customReason : selectedReason;
        
        if (!finalReason || finalReason.trim() === '') {
            setNotification({
                title: 'Thiếu thông tin',
                message: 'Vui lòng chọn hoặc nhập lý do hủy!',
                type: 'info'
            });
            return;
        }
        setShowConfirm(true);
    };
    
    // 🔥 LOGIC THAY THẾ WINDOW.CONFIRM
    const handleManualConfirmation = async () => {
        setShowConfirm(false); // Đóng modal xác nhận
        const finalReason = selectedReason === CANCEL_REASONS[3] ? customReason : selectedReason;
        
        try {
            setLoading(true);
            await updateBookingStatusApi({
                bookingID: booking.bookingID,
                bookingStatus: 'CANCELLED',
                cancelReason: finalReason
            });
            setNotification({
                title: 'Thành công!',
                message: 'Hủy booking và hoàn tiền thành công!',
                type: 'success'
            });
            onSuccess();
        } catch (error) {
            setNotification({
                title: 'Thất Bại!',
                message:  (error.response?.data?.message || error.message),
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };


    const handleNotificationClose = () => {
        setNotification(null);
        if (notification?.type === 'success' || (notification?.type === 'error' && !checking)) {
            onClose(); 
        }
    }

    return (
        <>
            {notification && <NotificationModal {...notification} onClose={handleNotificationClose} />}
            {/* 🔥 RENDER CONFIRMATION MODAL */}
            {showConfirm && (
                <ConfirmationModal
                    title="Xác nhận hoàn tiền"
                    message="Bạn chắc chắn đã thực hiện giao dịch chuyển khoản hoàn tiền cho khách hàng? Hệ thống sẽ cập nhật trạng thái ngay lập tức."
                    onConfirm={handleManualConfirmation}
                    onCancel={() => setShowConfirm(false)}
                />
            )}

            <div className={styles.modalOverlay} onClick={onClose}>
                <div className={`${styles.modalContent} ${styles.wideModal}`} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <FaExclamationTriangle className={styles.iconWarning} />
                        <h2>Xác nhận hủy tour và hoàn tiền</h2>
                    </div>
                    
                    <div className={styles.modalBody}>
                        <div className={styles.bookingInfo}>
                            <img src={booking.image || '/placeholder.png'} alt={booking.tourName} />
                            <div>
                                <p><strong>Booking:</strong> {booking.bookingCode}</p>
                                <p><strong>Tour:</strong> {booking.tourName}</p>
                                <p><strong>Mã Tour:</strong> {booking.tourCode}</p>
                            </div>
                        </div>

                        {/* 🔥 VIETQR CODE */}
                        <VietQRCode
                            bank={booking.refundBank || booking.bank || 'MB'}
                            accountNumber={booking.refundAccountNumber || booking.accountNumber || ''}
                            accountName={booking.refundAccountName || booking.accountName || ''}
                            amount={totalRefund}
                            bookingCode={booking.bookingCode}
                        />

                        {/* <div className={styles.refundInfo}>
                            <h4>Thông tin hoàn tiền</h4>
                            <p className={styles.refundAmount}>
                                <strong>Số tiền hoàn:</strong> {formatPrice(totalRefund)}
                            </p>
                        </div> */}

                        <div className={styles.reasonSection}>
                            <h4>Chọn lý do hủy chuyến đi <span className={styles.required}>*</span></h4>
                            {CANCEL_REASONS.map((reason, index) => (
                                <label key={index} className={styles.radioLabel}>
                                    <input 
                                        type="radio" 
                                        name="cancelReason" 
                                        value={reason}
                                        checked={selectedReason === reason}
                                        onChange={(e) => setSelectedReason(e.target.value)}
                                    />
                                    {reason}
                                </label>
                            ))}
                            
                            {selectedReason === CANCEL_REASONS[3] && (
                                <textarea
                                    className={styles.customReasonInput}
                                    placeholder="Nhập lý do khác..."
                                    value={customReason}
                                    onChange={(e) => setCustomReason(e.target.value)}
                                    rows={3}
                                />
                            )}
                        </div>

                        {checking && (
                            <div className={styles.checkingStatus}>
                                <div className={styles.spinner}></div>
                                <p>Đang kiểm tra giao dịch... ({checkAttempts}/12)</p>
                            </div>
                        )}
                    </div>

                    <div className={styles.modalFooter}>
                        <button 
                            className={styles.btnCancel} 
                            onClick={onClose}
                            disabled={loading || checking}
                        >
                            Đóng
                        </button>
                        <button 
                            className={styles.btnDanger} 
                            onClick={handleManualConfirmClick} // Gọi modal xác nhận
                            disabled={loading || checking}
                        >
                            {loading ? 'Đang xử lý...' : 'Xác nhận'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

// 4. MODAL HOÀN TIỀN (CHO PENDING_REFUND) - Cũng có QR
export const ProcessRefundModal = ({ booking, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(false);
    const [checkAttempts, setCheckAttempts] = useState(0);
    const [notification, setNotification] = useState(null); // State quản lý thông báo

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const totalRefund = booking.refundAmount || 0;

    // Auto-check
    useEffect(() => {
        if (!checking || checkAttempts >= 12) return;

        const timer = setTimeout(async () => {
            try {
                await updateBookingStatusApi({
                    bookingID: booking.bookingID,
                    bookingStatus: 'CANCELLED',
                    cancelReason: 'Khách hàng yêu cầu hủy đơn và hoàn tiền tài khoản.'
                });
                
                // THAY THẾ ALERT BẰNG NOTIFICATION MODAL
                setChecking(false);
                setNotification({
                    title: 'Thành công!',
                    message: 'Đã xác nhận giao dịch chuyển khoản thành công và hoàn tiền.',
                    type: 'success'
                });
                onSuccess();
                
            } catch (error) {
                setCheckAttempts(prev => prev + 1);
                if (checkAttempts + 1 >= 12) {
                    setChecking(false);
                    setNotification({
                        title: 'Tự động kiểm tra thất bại',
                        message: 'Không tìm thấy giao dịch sau nhiều lần thử. Vui lòng thử lại hoặc xác nhận thủ công.',
                        type: 'error'
                    });
                }
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [checking, checkAttempts]);
    
    const [showConfirm, setShowConfirm] = useState(false); // State cho Confirmation Modal

    const handleStartAutoCheck = () => {
        setChecking(true);
        setCheckAttempts(0);
        // THAY THẾ ALERT BẰNG NOTIFICATION MODAL
        setNotification({
            title: 'Bắt đầu kiểm tra',
            message: 'Bắt đầu kiểm tra giao dịch tự động. Vui lòng quét mã QR để chuyển khoản...',
            type: 'info'
        });
    };

    const handleManualConfirmClick = () => {
        // Mở Confirmation Modal
        setShowConfirm(true);
    };

    const handleManualConfirmation = async () => {
        setShowConfirm(false); // Đóng modal xác nhận

        try {
            setLoading(true);
            await updateBookingStatusApi({
                bookingID: booking.bookingID,
                bookingStatus: 'CANCELLED',
                cancelReason: 'Khách hàng yêu cầu hủy đơn và hoàn tiền tài khoản.'
            });
            // THAY THẾ ALERT BẰNG NOTIFICATION MODAL
            setNotification({
                title: 'Thành công!',
                message: 'Xác nhận hoàn tiền thành công!',
                type: 'success'
            });
            onSuccess();
        } catch (error) {
            // THAY THẾ ALERT BẰNG NOTIFICATION MODAL
            setNotification({
                title: 'Thất Bại!',
                message:   (error.response?.data?.message || error.message),
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClose = () => {
        setNotification(null);
        if (notification?.type === 'success' || (notification?.type === 'error' && !checking)) {
            onClose();
        }
    }

    return (
        <>
            {notification && <NotificationModal {...notification} onClose={handleNotificationClose} />}
            {/* RENDER CONFIRMATION MODAL */}
            {showConfirm && (
                <ConfirmationModal
                    title="Xác nhận hoàn tiền"
                    message="Bạn chắc chắn đã thực hiện giao dịch chuyển khoản hoàn tiền cho khách hàng? Hệ thống sẽ cập nhật trạng thái ngay lập tức."
                    onConfirm={handleManualConfirmation}
                    onCancel={() => setShowConfirm(false)}
                />
            )}

            <div className={styles.modalOverlay} onClick={onClose}>
                <div className={`${styles.modalContent} ${styles.wideModal}`} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <FaCheckCircle className={styles.iconSuccess} />
                        <h2>Xác nhận hoàn tiền và hủy tour</h2>
                    </div>
                    
                    <div className={styles.modalBody}>
                        <div className={styles.bookingInfo}>
                            <img src={booking.image || '/placeholder.png'} alt={booking.tourName} />
                            <div>
                                <p><strong>Booking:</strong> {booking.bookingCode}</p>
                                <p><strong>Tour:</strong> {booking.tourName}</p>
                            </div>
                        </div>

                        <VietQRCode
                            bank={booking.refundBank || 'MB'}
                            accountNumber={booking.refundAccountNumber || ''}
                            accountName={booking.refundAccountName || ''}
                            amount={totalRefund}
                            bookingCode={booking.bookingCode}
                        />

                        {checking && (
                            <div className={styles.checkingStatus}>
                                <div className={styles.spinner}></div>
                                <p>Đang kiểm tra giao dịch... ({checkAttempts}/12)</p>
                            </div>
                        )}
                    </div>

                    <div className={styles.modalFooter}>
                        <button className={styles.btnCancel} onClick={onClose} disabled={loading || checking}>
                            Đóng
                        </button>
                        {/* <button className={styles.btnAutoCheck} onClick={handleStartAutoCheck} disabled={loading || checking}>
                            {checking ? 'Đang kiểm tra...' : '🔍 Tự động kiểm tra'}
                        </button> */}
                        <button className={styles.btnConfirm} onClick={handleManualConfirmClick} disabled={loading || checking}>
                            {loading ? 'Đang xử lý...' : 'Xác nhận'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

// 3. MODAL HỦY ĐƠN KHÔNG HOÀN TIỀN (CHO PENDING_PAYMENT)
export const CancelWithoutRefundModal = ({ booking, onClose, onSuccess }) => {
    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null); // State quản lý thông báo

    const handleCancel = async () => {
        const finalReason = selectedReason === CANCEL_REASONS[3] ? customReason : selectedReason;
        
        if (!finalReason || finalReason.trim() === '') {
            // THAY THẾ ALERT BẰNG NOTIFICATION MODAL
            setNotification({
                title: 'Thiếu thông tin',
                message: 'Vui lòng chọn hoặc nhập lý do hủy!',
                type: 'info'
            });
            return;
        }

        try {
            setLoading(true);
            await updateBookingStatusApi({
                bookingID: booking.bookingID,
                bookingStatus: 'CANCELLED',
                cancelReason: finalReason
            });
            // THAY THẾ ALERT BẰNG NOTIFICATION MODAL
            setNotification({
                title: 'Thành công!',
                message: 'Hủy booking thành công!',
                type: 'success'
            });
            onSuccess();
        } catch (error) {
            // THAY THẾ ALERT BẰNG NOTIFICATION MODAL
            setNotification({
                title: 'Thất Bại!',
                message:  (error.response?.data?.message || error.message),
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClose = () => {
        setNotification(null);
        if (notification?.type === 'success') {
            onClose(); // Đóng modal chính sau khi thông báo thành công
        }
    }

    return (
        <>
            {notification && <NotificationModal {...notification} onClose={handleNotificationClose} />}
            
            <div className={styles.modalOverlay} onClick={onClose}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.modalHeader}>
                        <FaExclamationTriangle className={styles.iconWarning} />
                        <h2>Xác nhận hủy tour</h2>
                    </div>
                    
                    <div className={styles.modalBody}>
                        <div className={styles.bookingInfo}>
                            <img src={booking.image || '/placeholder.png'} alt={booking.tourName} />
                            <div>
                                <p><strong>Booking:</strong> {booking.bookingCode}</p>
                                <p><strong>Tour:</strong> {booking.tourName}</p>
                                <p><strong>Mã Tour:</strong> {booking.tourCode}</p>
                            </div>
                        </div>

                        <div className={styles.reasonSection}>
                            <h4>Chọn lý do hủy chuyến đi <span className={styles.required}>*</span></h4>
                            {CANCEL_REASONS.map((reason, index) => (
                                <label key={index} className={styles.radioLabel}>
                                    <input 
                                        type="radio" 
                                        name="cancelReason" 
                                        value={reason}
                                        checked={selectedReason === reason}
                                        onChange={(e) => setSelectedReason(e.target.value)}
                                    />
                                    {reason}
                                </label>
                            ))}
                            
                            {selectedReason === CANCEL_REASONS[3] && (
                                <textarea
                                    className={styles.customReasonInput}
                                    placeholder="Nhập lý do khác..."
                                    value={customReason}
                                    onChange={(e) => setCustomReason(e.target.value)}
                                    rows={3}
                                />
                            )}
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <button 
                            className={styles.btnCancel} 
                            onClick={onClose}
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        <button 
                            className={styles.btnDanger} 
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            {loading ? 'Đang xử lý...' : 'Xác nhận hủy'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};