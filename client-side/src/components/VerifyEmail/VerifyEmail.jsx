import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/axiosCustomize';
import styles from './VerifyEmail.module.scss';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;

    const verifyEmail = async () => {
      if (!token || token.trim() === '') {
        setStatus('error');
        setMessage('Token xác thực không tìm thấy trong URL. Vui lòng kiểm tra lại link trong email.');
        return;
      }

      hasVerified.current = true;

      try {
        const response = await axios.get(`/auth/verify-email?token=${token}`);

        setStatus('success');
        setMessage(response.data?.message || 'Xác thực email thành công!');

        setTimeout(() => {
          navigate('/login');
        }, 10000);
      } catch (error) {
        setStatus('error');

        let errorMessage = 'Xác thực email thất bại.';

        if (error.response) {
          switch (error.response.status) {
            case 400:
              errorMessage = error.response.data?.message || 'Token đã hết hạn hoặc không hợp lệ.';
              break;
            case 404:
              errorMessage = 'Token không tồn tại trong hệ thống.';
              break;
            case 500:
              errorMessage = 'Lỗi server. Vui lòng thử lại sau.';
              break;
            default:
              errorMessage = error.response.data?.message || 'Đã xảy ra lỗi không xác định.';
          }
        } else if (error.request) {
          errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
        }

        setMessage(errorMessage);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className={styles.verifyContainer}>
      <div className={styles.verifyCard}>
        {status === 'loading' && (
          <div className={styles.loadingState}>
            <Loader size={80} className={styles.spinner} />
            <h2>Đang xác thực email...</h2>
            <p>Vui lòng đợi trong giây lát</p>
          </div>
        )}

        {status === 'success' && (
          <div className={styles.successState}>
            <CheckCircle size={80} className={styles.successIcon} />
            <h2>Xác thực thành công! </h2>
            <p className={styles.message}>{message}</p>
            <div className={styles.successBox}>
              <p>🎉 Tài khoản của bạn đã được kích hoạt</p>
              <p>📧 Email chào mừng đã được gửi</p>
            </div>
            <p className={styles.redirect}>
              Đang chuyển đến trang đăng nhập trong 10 giây...
            </p>
            <button 
              onClick={() => navigate('/login')}
              className={styles.btnPrimary}
            >
              Đăng nhập ngay
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className={styles.errorState}>
            <XCircle size={80} className={styles.errorIcon} />
            <h2>Xác thực thất bại </h2>
            <p className={styles.errorMessage}>{message}</p>

            <div className={styles.helpBox}>
              <p><strong>Có thể do các nguyên nhân sau:</strong></p>
              <ul>
                <li>Link xác thực đã hết hạn (quá 5 phút)</li>
                <li>Token không hợp lệ</li>
                <li>Tài khoản đã được xác thực trước đó</li>
              </ul>
            </div>

            <div className={styles.buttonGroup}>
              <button 
                className={styles.btnPrimary}
                onClick={() => navigate('/register')}
              >
                Đăng ký lại
              </button>
              <button 
                className={styles.btnSecondary}
                onClick={() => navigate('/login')}
              >
                Đăng nhập
              </button>
              <button 
                className={styles.btnSecondary}
                onClick={() => navigate('/')}
              >
                Về trang chủ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
