import React from 'react';
import styles from './BookingSuccessCard.module.scss';

/**
 * BookingSuccessCard — hiển thị thông báo đặt tour thành công + link thanh toán.
 */
const BookingSuccessCard = ({ bookingCode, paymentUrl, paymentWaitingLink, totalPrice }) => {
  const fmt = (num) => num != null ? Number(num).toLocaleString('vi-VN') : '0';

  return (
    <div className={styles.card}>
      <div className={styles.iconWrap}>
        <span className={styles.successIcon}>🎉</span>
      </div>
      <h3 className={styles.title}>Đặt tour thành công!</h3>

      <div className={styles.codeBox}>
        <p className={styles.codeLabel}>Mã đặt tour của bạn</p>
        <p className={styles.code}>{bookingCode}</p>
      </div>

      {totalPrice != null && (
        <p className={styles.total}>
          💰 Tổng tiền: <strong>{fmt(totalPrice)}đ</strong>
        </p>
      )}

      <p className={styles.deadline}>
        ⏰ Vui lòng thanh toán trong <strong>24 giờ</strong>
      </p>

      {paymentUrl && (
        <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className={styles.payBtn}>
          💳 Thanh toán ngay qua PayOS
        </a>
      )}

      {paymentWaitingLink && (
        <a href={paymentWaitingLink} className={styles.waitingLink}>
          📊 Theo dõi trạng thái thanh toán
        </a>
      )}

      <p className={styles.note}>
        Lưu lại mã để tra cứu: gõ <em>tra cứu {bookingCode}</em>
      </p>
    </div>
  );
};

export default BookingSuccessCard;
