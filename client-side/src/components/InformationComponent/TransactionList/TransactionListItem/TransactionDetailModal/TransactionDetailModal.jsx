// src/components/InformationComponent/TransactionList/TransactionDetailModal/TransactionDetailModal.jsx
import React, { useEffect } from 'react'; 
import { createPortal } from 'react-dom'; // 👈 BẮT BUỘC: Import createPortal
import styles from './TransactionDetailModal.module.scss';
import { FaTimes, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaTicketAlt, FaInfoCircle } from 'react-icons/fa';
import { LuUsers, LuCalendar, LuDollarSign } from 'react-icons/lu';

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

            </div>
        </div>
    );

    // 💡 SỬ DỤNG PORTAL: Render Modal vào body của DOM
    return createPortal(modalJSX, document.body);
};

export default TransactionDetailModal;