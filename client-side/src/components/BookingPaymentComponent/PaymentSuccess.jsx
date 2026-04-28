// PaymentSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaDownload, FaEnvelope } from 'react-icons/fa';
import styles from './PaymentResult.module.scss';
import Confetti from 'react-confetti';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingCode = searchParams.get('bookingCode');
  const [showConfetti, setShowConfetti] = useState(true);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Hide confetti after 5 seconds
    const confettiTimer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    // Auto redirect countdown
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(confettiTimer);
      clearInterval(countdownInterval);
    };
  }, [navigate]);

  return (
    <div className={styles.container}>
      {showConfetti && <Confetti />}
      
      <div className={styles.resultCard}>
        <FaCheckCircle className={styles.iconSuccess} />
        <h1>Thanh toán thành công!</h1>
        <p>Cảm ơn bạn đã đặt tour. Đơn hàng của bạn đã được xác nhận.</p>
        
        <div className={styles.bookingCode}>{bookingCode}</div>

        <div className={styles.infoList}>
          <div className={styles.infoItem}>
            <span className={styles.label}>Trạng thái:</span>
            <span className={styles.value} style={{ color: '#52c41a' }}>
              ✓ Đã thanh toán
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Phương thức:</span>
            <span className={styles.value}>VNPay</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Thời gian:</span>
            <span className={styles.value}>
              {new Date().toLocaleString('vi-VN')}
            </span>
          </div>
        </div>

        <p style={{ marginTop: '20px', fontSize: '14px' }}>
          <FaEnvelope style={{ marginRight: '5px' }} />
          Chúng tôi đã gửi xác nhận đến email của bạn
        </p>

        <div className={styles.actions}>
          <button onClick={() => navigate(`/payment-booking?bookingCode=${bookingCode}`)}>
            <FaDownload style={{ marginRight: '8px' }} />
            Xem chi tiết
          </button>
          <button onClick={() => navigate('/')}>
            Về trang chủ
          </button>
        </div>

        <div className={styles.countdown}>
          Tự động chuyển về trang chủ sau{' '}
          <span className={styles.timer}>{countdown}s</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;