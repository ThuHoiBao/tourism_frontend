// src/components/InformationComponent/TransactionList/TransactionListItem/ConfirmCancellationModal/ConfirmCancellationModal.jsx

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './ConfirmCancellationModal.module.scss';
import CancelImage from '../../../../../assets/images/cancel.png'; 
import { cancelBookingApi } from '../../../../../services/booking/booking.ts'; 

const ConfirmCancellationModal = ({ bookingID, onClose, onBack, onRefetch }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    // ✅ HÀM XỬ LÝ ĐÓNG VÀ TẢI LẠI TRANG
    const handleCloseAndReload = () => {
        // Gọi onClose để đóng Modal
        onClose(); 
        // Sau đó tải lại trang
        window.location.reload(); 
    };

    const handleConfirmCancel = async () => {
        setIsProcessing(true);
        try {
            await cancelBookingApi(bookingID);
            
            // ✅ Bỏ setTimeout và window.location.reload() ở đây
            setSuccessMessage("Cảm ơn bạn! Yêu cầu hủy tour và hoàn điểm đã thành công.");
            
            // onRefetch() không cần thiết khi dùng window.location.reload()
            
        } catch (error) {
            console.error("Lỗi khi hủy tour (Hoàn Coin):", error);
            // Lấy thông báo lỗi cụ thể từ response nếu có
            const apiError = error.response?.data?.message || "Lỗi: Không thể hủy tour. Vui lòng thử lại sau.";
            setSuccessMessage(apiError); 
        } finally {
            setIsProcessing(false);
        }
    };

    // --- JSX cho Modal Thông báo Thành công/Lỗi ---
    if (successMessage) {
        const successModalJSX = (
            <div className={styles.modalOverlay} onClick={onClose}>
                <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                    <h3 className={styles.successTitle}>Thông báo</h3>
                    <p className={styles.successMessage}>{successMessage}</p>
                    {/* ✅ ĐÍNH KÈM HÀM XỬ LÝ MỚI VÀO NÚT ĐÓNG */}
                    <button 
                        className={styles.btnPrimary} 
                        onClick={handleCloseAndReload} 
                    >
                        Đóng
                    </button> 
                </div>
            </div>
        );
        return createPortal(successModalJSX, document.body); 
    }

    // --- JSX cho Modal Xác nhận Hủy Tour (Giữ nguyên) ---
    const confirmModalJSX = (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <img src={CancelImage} alt="Xác nhận hủy" className={styles.image} />
                <h3 className={styles.title}>Xác Nhận Hủy Tour</h3>
                <p className={styles.warning}>Bạn có chắc chắn muốn hủy tour và chuyển toàn bộ giá trị đơn hàng thành điểm cá nhân không?</p>

                <div className={styles.buttonGroup}>
                    <button 
                        className={styles.btnSecondary} 
                        onClick={onBack} 
                        disabled={isProcessing}
                    >
                        Quay lại
                    </button>
                    <button 
                        className={styles.btnDanger} 
                        onClick={handleConfirmCancel} 
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Đang xử lý...' : 'Xác nhận'}
                    </button>
                </div>
            </div>
        </div>
    );
    
    return createPortal(confirmModalJSX, document.body); 
};

export default ConfirmCancellationModal;