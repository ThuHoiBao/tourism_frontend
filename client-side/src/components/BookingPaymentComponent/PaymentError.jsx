// PaymentError.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaExclamationTriangle } from 'react-icons/fa';
import styles from './PaymentResult.module.scss';

const PaymentError = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.resultCard}>
        <FaExclamationTriangle className={styles.iconError} />
        <h1>Đã xảy ra lỗi!</h1>
        <p>Giao dịch của bạn không thể xử lý do lỗi hệ thống.</p>
        <p>Vui lòng liên hệ bộ phận hỗ trợ nếu vấn đề vẫn tiếp diễn.</p>
        
        <div className={styles.infoList}>
          <div className={styles.infoItem}>
            <span className={styles.label}>Hotline:</span>
            <span className={styles.value}>1900 1808</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Email:</span>
            <span className={styles.value}>support@tourism.com</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Thời gian hỗ trợ:</span>
            <span className={styles.value}>24/7</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button onClick={() => navigate('/my-bookings')}>
            Xem đơn của tôi
          </button>
          <button onClick={() => navigate('/')}>
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentError;