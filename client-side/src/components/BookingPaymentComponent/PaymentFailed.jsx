// PaymentFailed.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaTimesCircle, FaRedo } from 'react-icons/fa';
import styles from './PaymentResult.module.scss';

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingCode = searchParams.get('bookingCode');
  const errorCode = searchParams.get('errorCode');
  const [retryCount, setRetryCount] = useState(0);

  const getErrorMessage = (code) => {
    const errorMessages = {
      '07': 'Giao dịch bị nghi ngờ là giao dịch gian lận',
      '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ Internet Banking',
      '10': 'Thẻ/Tài khoản chưa được kích hoạt',
      '11': 'Thẻ/Tài khoản hết hạn',
      '12': 'Thẻ/Tài khoản bị khóa',
      '13': 'Sai mật khẩu xác thực giao dịch',
      '24': 'Giao dịch bị hủy',
      '51': 'Tài khoản không đủ số dư',
      '65': 'Tài khoản đã vượt quá hạn mức giao dịch',
      '75': 'Ngân hàng thanh toán đang bảo trì',
      '79': 'Giao dịch vượt quá số lần nhập sai mật khẩu',
      '99': 'Lỗi không xác định'
    };
    return errorMessages[code] || 'Giao dịch không thành công';
  };

  const handleRetry = () => {
    setRetryCount(retryCount + 1);
    navigate(`/payment-booking?bookingCode=${bookingCode}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.resultCard}>
        <FaTimesCircle className={styles.iconFailed} />
        <h1>Thanh toán thất bại!</h1>
        <p>{getErrorMessage(errorCode)}</p>
        
        <div className={styles.bookingCode}>{bookingCode}</div>

        <div className={styles.infoList}>
          <div className={styles.infoItem}>
            <span className={styles.label}>Trạng thái:</span>
            <span className={styles.value} style={{ color: '#ff4d4f' }}>
              ✗ Chưa thanh toán
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Mã lỗi:</span>
            <span className={styles.value}>{errorCode || 'N/A'}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.label}>Thời gian:</span>
            <span className={styles.value}>
              {new Date().toLocaleString('vi-VN')}
            </span>
          </div>
        </div>

        <p style={{ marginTop: '20px', fontSize: '14px', color: '#8c8c8c' }}>
          Đơn hàng của bạn vẫn được giữ trong 24h. Vui lòng thử lại.
        </p>

        <div className={styles.actions}>
          <button onClick={handleRetry}>
            <FaRedo style={{ marginRight: '8px' }} />
            Thử lại {retryCount > 0 && `(${retryCount})`}
          </button>
          <button onClick={() => navigate('/')}>
            Về trang chủ
          </button>
        </div>

        {retryCount >= 3 && (
          <p style={{ marginTop: '15px', fontSize: '13px', color: '#ff4d4f' }}>
            Nếu vẫn gặp lỗi, vui lòng liên hệ: <strong>1900 1808</strong>
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentFailed;