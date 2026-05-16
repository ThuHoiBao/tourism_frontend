// src/components/InformationComponent/TransactionList/TransactionDetailModal/TransactionDetailModal.jsx
import React, { useEffect } from 'react'; 
import { createPortal } from 'react-dom'; // 👈 BẮT BUỘC: Import createPortal
import styles from './TransactionDetailModal.module.scss';
import { FaTimes, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaTicketAlt, FaInfoCircle } from 'react-icons/fa';
import { LuUsers, LuCalendar, LuDollarSign } from 'react-icons/lu';
import { Coins, Clock3, CheckCircle2, AlertTriangle, DollarSign, Bell } from 'lucide-react';

const TransactionDetailModal = ({ booking, onClose, formatPrice, formatDate }) => {
    // Helper functions (Giữ nguyên)
    const formatBookingDateTime = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleString('vi-VN', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };
    const getGenderLabel = (gender) => (gender === 'MALE' ? 'Nam' : gender === 'FEMALE' ? 'Nữ' : 'Khác');
    const getPassengerTypeLabel = (type) => (type === 'ADULT' ? 'Người lớn' : type === 'CHILD' ? 'Trẻ em' : 'Em bé');
    const normalizedCoinRefundStatus = typeof booking.coinRefundStatus === 'string'
        ? booking.coinRefundStatus.trim().toUpperCase()
        : null;
    const validCoinStatus = ['PENDING', 'COMPLETED', 'FAILED'].includes(normalizedCoinRefundStatus)
        ? normalizedCoinRefundStatus
        : null;
    const refundAmount = Number(booking.refundAmount || 0);
    const refundBaseAmount = Number(booking.totalPrice || 0) + Number(booking.paidByCoin || 0);
    const refundDeductionAmount = Math.max(refundBaseAmount - refundAmount, 0);
    const coinRefundAmount = Math.floor(refundAmount / 1000);
    const usedCoinValue = Number(booking.paidByCoin || 0);
    const hasBankRefundInfo = Boolean(
        booking.refundBank ||
        booking.refundAccountNumber ||
        booking.refundAccountName
    );
    const showCoinRefund = Boolean(validCoinStatus) && refundAmount > 0;
    const showBankRefund = refundAmount > 0 && !showCoinRefund && hasBankRefundInfo;
    const showGenericRefund = refundAmount > 0 && !showCoinRefund && !hasBankRefundInfo;

    // Chặn scroll khi modal mở
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    const modalJSX = (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                
                <button className={styles.closeButton} onClick={onClose}>
                    <FaTimes />
                </button>

                <h2 className={styles.modalTitle}>Chi tiết giao dịch</h2>
                
                {/* --- Phần 1: Thông tin Tour & Booking --- */}
                <div className={styles.section}>
                    <div className={styles.tourSummary}>
                        <img src={booking.image || 'https://via.placeholder.com/100x70?text=Tour+Image'} alt={booking.tourName} className={styles.tourImage} />
                        <div className={styles.tourInfo}>
                            <h3>{booking.tourName}</h3>
                            <p><FaTicketAlt /> Mã Booking: {booking.bookingCode}</p>
                            <p><LuCalendar /> Ngày đặt: {formatBookingDateTime(booking.bookingDate)}</p>
                        </div>
                    </div>
                </div>

                {/* --- Phần 2: Thông tin Người đặt --- */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}><FaUser /> Thông tin người đặt</h3>
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}><FaUser /> Họ tên: {booking.contactFullName}</div>
                        <div className={styles.infoItem}><FaEnvelope /> Email: {booking.contactEmail}</div>
                        <div className={styles.infoItem}><FaPhone /> SĐT: {booking.contactPhone}</div>
                        <div className={styles.infoItemFull}><FaMapMarkerAlt /> Địa chỉ: {booking.contactAddress || 'N/A'}</div>
                        <div className={styles.infoItemFull}><FaInfoCircle /> Ghi chú: {booking.customerNote || 'Không có'}</div>
                    </div>
                </div>

                {/* --- Phần 3: Danh sách Hành khách --- */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}><LuUsers /> Danh sách hành khách ({booking.totalPassengers})</h3>
                    <div className={styles.passengerList}>
                        {booking.passengers && booking.passengers.map((passenger, index) => (
                            <div key={index} className={styles.passengerItem}>
                                <h4>{index + 1}. {passenger.fullName}</h4>
                                <p><strong>Loại khách:</strong> {getPassengerTypeLabel(passenger.passengerType)}</p>
                                <p><strong>Giới tính:</strong> {getGenderLabel(passenger.gender)}</p>
                                <p><strong>Ngày sinh:</strong> {formatDate(passenger.dateOfBirth)}</p>
                                <p><strong>Giá Cơ Bản:</strong> {formatPrice(passenger.basePrice)}</p>
                                {
                                passenger.requiresSingleRoom && <p className={styles.singleRoom}>Phụ phí phòng đơn: {formatPrice(passenger.singleRoomSurcharge)}</p>
                                }
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* --- Phần 4: Thông tin Thanh toán --- */}
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}><LuDollarSign /> Thông tin thanh toán</h3>
                    <div className={styles.paymentSummary}>
                        
                        <div className={styles.paymentItem}>
                            <span>Tổng giá vé :</span>
                            <strong>{formatPrice(booking.subtotalPrice)}</strong>
                        </div>
                        
                        <div className={styles.paymentItem}>
                            <span>Phụ phí (Phòng đơn/Khác):</span>
                            <strong className={styles.surcharge}>+ {formatPrice(booking.surcharge)}</strong>
                        </div>

                        <div className={styles.paymentItem}>
                            <span>Giảm giá (Coupon):</span>
                            <strong className={styles.discount}>- {formatPrice(booking.couponDiscount)}</strong>
                        </div>
                        
                        <div className={styles.paymentItem}>
                            <span>Sử dụng điểm cá nhân:</span>
                            <strong className={styles.coinUsed}>- {formatPrice(booking.paidByCoin)}</strong>
                        </div>
                        
                        <div className={`${styles.paymentItem} ${styles.total}`}>
                            <span>Tổng tiền thanh toán:</span>
                            <strong>{formatPrice(booking.totalPrice)}</strong>
                        </div>
                    </div>
                </div>

                {/* --- Phần 5: Thông tin hoàn sau hủy bằng xu --- */}
                {showCoinRefund && (
                    <div className={`${styles.section} ${styles.refundSection}`}>
                        <div className={styles.refundHeader}>
                            <h3 className={styles.sectionTitle}><Coins size={16} /> Thông tin hoàn sau hủy</h3>
                            <span className={
                                validCoinStatus === 'PENDING' ? styles.statusPending
                                : validCoinStatus === 'COMPLETED' ? styles.statusDone
                                : styles.statusFailed
                            }>
                                {validCoinStatus === 'PENDING' && <><Clock3 size={13} /> Đang xử lý</>}
                                {validCoinStatus === 'COMPLETED' && <><CheckCircle2 size={13} /> Đã hoàn xu</>}
                                {validCoinStatus === 'FAILED' && <><AlertTriangle size={13} /> Cần hỗ trợ</>}
                            </span>
                        </div>

                        <div className={styles.refundCard}>
                            <div className={`${styles.refundRow} ${styles.refundTotalRow}`}>
                                <span>Số xu được cộng vào tài khoản</span>
                                <strong className={styles.coinRefundValue}>
                                    {coinRefundAmount.toLocaleString('vi-VN')} xu
                                </strong>
                            </div>
                            <div className={styles.refundRow}>
                                <span>Giá trị hoàn dùng để quy đổi</span>
                                <strong>{formatPrice(refundAmount)}</strong>
                            </div>
                            <div className={styles.refundRow}>
                                <span>Giá trị thanh toán và điểm dùng ban đầu</span>
                                <strong>{formatPrice(refundBaseAmount)}</strong>
                            </div>
                            {usedCoinValue > 0 && (
                                <div className={styles.refundRow}>
                                    <span>Giá trị điểm đã dùng được tính vào hoàn</span>
                                    <strong>{formatPrice(usedCoinValue)}</strong>
                                </div>
                            )}
                            <div className={styles.refundRow}>
                                <span>Phí/khấu trừ đã áp dụng</span>
                                <strong className={styles.refundDeduction}>- {formatPrice(refundDeductionAmount)}</strong>
                            </div>
                        </div>

                        <p className={styles.refundNote}>
                            Khoản hoàn sau hủy được cộng vào tài khoản dưới dạng xu.
                            Nếu đơn có sử dụng điểm cá nhân, giá trị điểm đã dùng được tính vào công thức hoàn.
                            Giá trị hoàn được quy đổi theo tỉ lệ 1 xu = 1.000đ.
                            Ví dụ: 4.000đ tương ứng 4 xu; nếu phát sinh phần lẻ như 2.500.500đ,
                            số xu cuối cùng sẽ theo quy tắc làm tròn đang áp dụng trước khi cộng vào tài khoản.
                        </p>
                    </div>
                )}

                {/* --- Thông báo email hủy --- */}
                {booking.bookingStatus === 'CANCELLED' && (
                    <div className={styles.notificationHint}>
                        <Bell size={13} />
                        <span>Email xác nhận hủy sẽ được gửi đến hòm thư của bạn trong ít phút. Nếu chưa nhận được, hãy kiểm tra thư mục spam.</span>
                    </div>
                )}

                {/* --- Phần 6: Thông tin hoàn tiền/hoàn sau hủy (chỉ hiện khi có refund) --- */}
                {refundAmount > 0 && !showCoinRefund && (
                    <div className={`${styles.section} ${styles.refundSection}`}>
                        <div className={styles.refundHeader}>
                            <h3 className={styles.sectionTitle}>
                                <DollarSign size={16} />
                                {showBankRefund ? 'Thông tin hoàn tiền ngân hàng' : 'Thông tin hoàn sau hủy'}
                            </h3>
                            <span className={
                                booking.bookingStatus === 'PENDING_REFUND'
                                    ? styles.statusPending : styles.statusDone
                            }>
                                {booking.bookingStatus === 'PENDING_REFUND'
                                    ? <><Clock3 size={13} /> Đang xử lý</>
                                    : <><CheckCircle2 size={13} /> {showGenericRefund ? 'Đã ghi nhận' : 'Đã hoàn'}</>}
                            </span>
                        </div>

                        <div className={styles.refundCard}>
                            <div className={styles.refundRow}>
                                <span>Phương thức hoàn</span>
                                <strong>
                                    {showBankRefund
                                        ? 'Hoàn về tài khoản ngân hàng'
                                        : 'Đang cập nhật phương thức hoàn'}
                                </strong>
                            </div>
                            <div className={`${styles.refundRow} ${styles.refundTotalRow}`}>
                                <span>Số tiền được hoàn</span>
                                <strong>{formatPrice(refundAmount)}</strong>
                            </div>
                            <div className={styles.refundRow}>
                                <span>Giá trị thanh toán và điểm dùng ban đầu</span>
                                <strong>{formatPrice(refundBaseAmount)}</strong>
                            </div>
                            {usedCoinValue > 0 && (
                                <div className={styles.refundRow}>
                                    <span>Giá trị điểm đã dùng được tính vào hoàn</span>
                                    <strong>{formatPrice(usedCoinValue)}</strong>
                                </div>
                            )}
                            <div className={styles.refundRow}>
                                <span>Phí/khấu trừ đã áp dụng</span>
                                <strong className={styles.refundDeduction}>- {formatPrice(refundDeductionAmount)}</strong>
                            </div>
                            {booking.refundBank && (
                                <div className={styles.refundRow}>
                                    <span>Ngân hàng:</span>
                                    <span>{booking.refundBank}</span>
                                </div>
                            )}
                            {booking.refundAccountNumber && (
                                <div className={styles.refundRow}>
                                    <span>Số tài khoản:</span>
                                    <span>****{booking.refundAccountNumber.slice(-4)}</span>
                                </div>
                            )}
                            {booking.refundAccountName && (
                                <div className={styles.refundRow}>
                                    <span>Chủ tài khoản:</span>
                                    <span>{booking.refundAccountName}</span>
                                </div>
                            )}
                            {booking.cancelReason && booking.cancelReason.trim() && (
                                <div className={styles.refundRow}>
                                    <span>Lý do hủy:</span>
                                    <span>{booking.cancelReason}</span>
                                </div>
                            )}
                        </div>

                        <p className={styles.refundNote}>
                            Số tiền được hoàn là số cuối cùng hệ thống ghi nhận trong đơn.
                            Nếu đơn có sử dụng điểm cá nhân, giá trị điểm đã dùng được tính vào công thức hoàn.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );

    // 💡 SỬ DỤNG PORTAL: Render Modal vào body của DOM
    return createPortal(modalJSX, document.body);
};

export default TransactionDetailModal;
