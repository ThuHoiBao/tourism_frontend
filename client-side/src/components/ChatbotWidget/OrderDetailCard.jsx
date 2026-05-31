import React from 'react';
import styles from './OrderDetailCard.module.scss';

/**
 * OrderDetailCard — hiển thị chi tiết đơn hàng khi user tra cứu.
 */
const OrderDetailCard = ({ data }) => {
  if (!data) return null;

  const fmt = (num) => num != null ? Number(num).toLocaleString('vi-VN') : '0';

  const statusMap = {
    PENDING_PAYMENT:      { label: 'Chờ thanh toán',      color: '#f57c00', bg: '#fff8e1' },
    OVERDUE_PAYMENT:      { label: 'Quá hạn thanh toán',  color: '#d32f2f', bg: '#ffebee' },
    PENDING_CONFIRMATION: { label: 'Chờ xác nhận',        color: '#1565c0', bg: '#e3f2fd' },
    PAID:                 { label: 'Đã thanh toán ✅',    color: '#2e7d32', bg: '#e8f5e9' },
    CANCELLED:            { label: 'Đã hủy',              color: '#757575', bg: '#f5f5f5' },
    PENDING_REVIEW:       { label: 'Chờ đánh giá ⭐',    color: '#7b1fa2', bg: '#f3e5f5' },
    REVIEWED:             { label: 'Đã đánh giá',         color: '#2e7d32', bg: '#e8f5e9' },
    PENDING_REFUND:       { label: 'Chờ hoàn tiền 💸',   color: '#e65100', bg: '#fff3e0' },
  };

  const statusInfo = statusMap[data.status] || { label: data.status, color: '#555', bg: '#f5f5f5' };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span>📋</span>
        <span>CHI TIẾT ĐƠN HÀNG</span>
      </div>

      <div className={styles.body}>
        {/* Booking code + status */}
        <div className={styles.codeRow}>
          <span className={styles.code}>{data.bookingCode}</span>
          <span className={styles.status} style={{ color: statusInfo.color, background: statusInfo.bg }}>
            {statusInfo.label}
          </span>
        </div>

        {/* Tour info */}
        <div className={styles.tourRow}>
          {data.tourImage && <img src={data.tourImage} alt="" className={styles.tourImg} />}
          <div>
            <p className={styles.tourName}>{data.tourName}</p>
            {data.duration && <p className={styles.meta}>⏱️ {data.duration}</p>}
          </div>
        </div>

        {/* Payment info */}
        <div className={styles.paymentGrid}>
          <div className={styles.payItem}>
            <span className={styles.payLabel}>Tổng tiền</span>
            <span className={styles.payValue}>{fmt(data.originalPrice)}đ</span>
          </div>
          <div className={styles.payItem}>
            <span className={styles.payLabel}>Đã thanh toán</span>
            <span className={styles.payValue} style={{ color: '#2e7d32' }}>{fmt(data.paidAmount)}đ</span>
          </div>
          <div className={styles.payItem}>
            <span className={styles.payLabel}>Còn lại</span>
            <span className={styles.payValue} style={{ color: data.remainingAmount > 0 ? '#d32f2f' : '#2e7d32' }}>
              {fmt(data.remainingAmount)}đ
            </span>
          </div>
          {data.paymentDeadline && (
            <div className={styles.payItem}>
              <span className={styles.payLabel}>Hạn thanh toán</span>
              <span className={styles.payValue} style={{ color: '#f57c00' }}>
                {data.paymentDeadline.substring(0, 16).replace('T', ' ')}
              </span>
            </div>
          )}
        </div>

        {/* Passengers */}
        {data.passengers && data.passengers.length > 0 && (
          <div className={styles.passengers}>
            <p className={styles.sectionTitle}>👥 Hành khách</p>
            {data.passengers.map((p, i) => (
              <p key={i} className={styles.passenger}>
                • {p.fullName} ({p.gender === 'FEMALE' ? 'Nữ' : p.gender === 'MALE' ? 'Nam' : 'Khác'}, {typeVi(p.type)})
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function typeVi(type) {
  const map = { ADULT: 'Người lớn', CHILD: 'Trẻ em', TODDLER: 'Trẻ nhỏ', INFANT: 'Em bé' };
  return map[type] || type;
}

export default OrderDetailCard;
