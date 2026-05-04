// src/components/InformationComponent/TransactionList/TransactionListItem/CancelOptionModal/CancelOptionModal.jsx

import React, { useState } from 'react';
import { createPortal } from 'react-dom';

import styles from './CancelOptionModal.module.scss';
import CancelImage from '../../../../../assets/images/cancel.png';

import ConfirmCancellationModal from '../ConfirmCancellationModal/ConfirmCancellationModal';
import RefundInfoModal from '../RefundInfoModal/RefundInfoModal';


const CancelOptionModal = ({ booking, bookingID, onClose, onRefetch }) => {
    const [activeSubModal, setActiveSubModal] = useState(null);
    const [agreedPolicy, setAgreedPolicy] = useState(false);
    const [showPolicyModal, setShowPolicyModal] = useState(false);

    // Tính toán ước tính hoàn tiền (khớp logic backend BookingServiceImpl)
    const refundPreview = React.useMemo(() => {
        const totalPrice = parseFloat(booking?.totalPrice) || 0;
        const paidByCoin  = parseFloat(booking?.paidByCoin)  || 0;
        const base = totalPrice + paidByCoin;

        let daysUntil = Infinity;
        if (booking?.departureDate) {
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const dep   = new Date(booking.departureDate); dep.setHours(0, 0, 0, 0);
            daysUntil = Math.round((dep - today) / 86400000);
        }

        let feePercent, feeLabel, feeNote;
        if      (daysUntil > 15) { feePercent = 0.10; feeLabel = '10%';  feeNote = 'hơn 15 ngày trước khởi hành'; }
        else if (daysUntil > 5)  { feePercent = 0.50; feeLabel = '50%';  feeNote = '6–15 ngày trước khởi hành'; }
        else if (daysUntil > 2)  { feePercent = 0.70; feeLabel = '70%';  feeNote = '3–5 ngày trước khởi hành'; }
        else if (daysUntil >= 0) { feePercent = 0.90; feeLabel = '90%';  feeNote = '0–2 ngày trước khởi hành'; }
        else                     { feePercent = 1.00; feeLabel = '100%'; feeNote = 'tour đã khởi hành'; }

        const feeAmount  = Math.floor(base * feePercent);
        const refundable = base - feeAmount;
        const coins      = Math.floor(refundable / 1000);
        return { base, feePercent, feeLabel, feeNote, feeAmount, refundable, coins };
    }, [booking]);

    const formatVND = (val) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    // Nếu đang ở modal con, hiển thị modal con đó
    if (activeSubModal === 'confirm_coin') {
        return (
            <ConfirmCancellationModal
                bookingID={bookingID}
                onClose={onClose} // Đóng hết modal gốc
                onBack={() => setActiveSubModal(null)}
                onRefetch={onRefetch}
            />
        );
    }

    if (activeSubModal === 'refund_bank') {
        return (
            <RefundInfoModal
                bookingID={bookingID}
                booking={booking}
                onClose={onClose} // Đóng hết modal gốc
                onBack={() => setActiveSubModal(null)}
                onRefetch={onRefetch}
            />
        );
    }

    // Modal chính: Chọn phương thức hủy
    const modalContent = (
        // ❌ KHÔNG BỌC NỀN OVERLAY BẰNG PORTAL MÀ CHỈ BỌC NỘI DUNG CHÍNH (modalContent) BẰNG OVERLAY
        // VÌ VẬY, CHÚNG TA CHỈ BỌC TOÀN BỘ PHẦN NỀN VÀ NỘI DUNG CỦA MODAL.
        
        // 1. Lớp Overlay (lắng nghe sự kiện đóng khi click ra ngoài)
        <div className={styles.modalOverlay} onClick={onClose}>
            {/* 2. Lớp Nội dung Modal (chặn sự kiện lan truyền) */}
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <img src={CancelImage} alt="Hủy tour" className={styles.image} />
                <h3 className={styles.title}>Xác Nhận Hủy Tour</h3>
                <p className={styles.description}>Vui lòng chọn phương thức hoàn tiền bên dưới :</p>

                {/* ── Tóm tắt ước tính hoàn tiền ── */}
                <div className={styles.refundSummary}>
                    <div className={styles.refundSummaryTitle}>Ước tính số tiền hoàn</div>
                    <div className={styles.refundRow}>
                        <span className={styles.refundLabel}>Tổng tiền đã thanh toán</span>
                        <span className={styles.refundValue}>{formatVND(refundPreview.base)}</span>
                    </div>
                    <div className={styles.refundRow}>
                        <span className={styles.refundLabel}>
                            Phí hủy&nbsp;
                            <span className={styles.feeBadge}>{refundPreview.feeLabel}</span>
                            <span className={styles.feeNote}>&nbsp;({refundPreview.feeNote})</span>
                        </span>
                        <span className={`${styles.refundValue} ${styles.feeDeduct}`}>
                            − {formatVND(refundPreview.feeAmount)}
                        </span>
                    </div>
                    <div className={styles.refundDivider} />
                    <div className={`${styles.refundRow} ${styles.refundHighlightRow}`}>
                        <span className={styles.refundHighlightLabel}>Số tiền được hoàn</span>
                        <span className={styles.refundHighlightValue}>{formatVND(refundPreview.refundable)}</span>
                    </div>
                </div>

                <div className={styles.optionsContainer}>
                    {/* Tùy chọn 1: Hoàn tiền bằng COIN */}
                    <div className={styles.optionItem}>
                        <div className={styles.optionDetail}>
                            <h4>Hoàn tiền thành điểm cá nhân</h4>
                            <p>Khi hủy Tour này, số tiền thanh toán của bạn sẽ được chuyển thành điểm cá nhân (1.000 VNĐ = 1 điểm) để tiếp tục sử dụng cho các giao dịch khác.</p>
                            <div className={styles.optionAmount}>
                                Nhận được: <strong>{refundPreview.coins.toLocaleString('vi-VN')} điểm</strong>
                                <span className={styles.optionAmountSub}>≈ {formatVND(refundPreview.coins * 1000)}</span>
                            </div>
                        </div>
                        <button
                            className={styles.btnPrimary}
                            onClick={() => setActiveSubModal('confirm_coin')}
                            disabled={!agreedPolicy}
                        >
                            Áp dụng
                        </button>
                    </div>

                    {/* Tùy chọn 2: Hoàn tiền qua NGÂN HÀNG */}
                    <div className={styles.optionItem}>
                        <div className={styles.optionDetail}>
                            <h4>Hoàn tiền về tài khoản ngân hàng</h4>
                            <p>Hệ thống sẽ hoàn tiền lại vào tài khoản ngân hàng của bạn. Vui lòng nhấn Áp dụng để điền các thông tin cần thiết. Quá trình xử lý sẽ mất khoảng 24h làm việc.</p>
                            <div className={`${styles.optionAmount} ${styles.optionAmountBank}`}>
                                Nhận được: <strong>{formatVND(refundPreview.refundable)}</strong>
                            </div>
                        </div>
                        <button
                            className={styles.btnSecondary}
                            onClick={() => setActiveSubModal('refund_bank')}
                            disabled={!agreedPolicy}
                        >
                            Áp dụng
                        </button>
                    </div>
                </div>

                <div className={styles.policyRow}>
                    <label className={styles.policyLabel}>
                        <input
                            type="checkbox"
                            checked={agreedPolicy}
                            onChange={(e) => setAgreedPolicy(e.target.checked)}
                        />
                        <span>
                            Đồng ý với các <span className={styles.policyLink} onClick={() => setShowPolicyModal(true)}>chính sách hủy tour</span>
                        </span>
                    </label>
                </div>

                <button className={styles.btnClose} onClick={onClose}>Đóng</button>
            </div>
        </div>
    );

    const policyModal = showPolicyModal ? (
        <div className={styles.policyModalOverlay} onClick={() => setShowPolicyModal(false)}>
            <div className={styles.policyModal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.policyHeader}>
                    <div className={styles.policyTitle}>Chính sách hủy tour</div>
                    <button
                        type="button"
                        className={styles.policyClose}
                        aria-label="Đóng"
                        onClick={() => setShowPolicyModal(false)}
                    >
                        ✕
                    </button>
                </div>

                <div className={styles.policyBody}>
                    <p>Future Travel áp dụng phí hủy theo từng mốc thời gian trước ngày khởi hành:</p>
                    <ul>
                        <li><strong>Sau khi đăng ký:</strong> Phí hủy 10% giá vé du lịch.</li>
                        <li><strong>Trước 15 ngày:</strong> Phí hủy 50% giá vé du lịch.</li>
                        <li><strong>Trước 05 ngày:</strong> Phí hủy 70% giá vé du lịch.</li>
                        <li><strong>Trước 02 ngày:</strong> Phí hủy 90% giá vé du lịch.</li>
                    </ul>
                    <div className={styles.policyNote}>Phí hủy được tính trên tổng giá vé đã thanh toán. Vui lòng cân nhắc trước khi xác nhận.</div>
                </div>

                <div className={styles.policyFooter}>
                    <button className={styles.btnPrimary} onClick={() => setShowPolicyModal(false)}>Đã hiểu</button>
                </div>
            </div>
        </div>
    ) : null;

    // ✅ RENDER BẰNG PORTAL: Đẩy toàn bộ Modal ra ngoài DOM body
    return createPortal(
        <>
            {modalContent}
            {policyModal}
        </>,
        document.body
    );
};


export default CancelOptionModal;