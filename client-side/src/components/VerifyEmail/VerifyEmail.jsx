import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './VerifyEmail.module.scss';
import {
  Mail, ShieldCheck, CheckCircle, AlertCircle, ArrowRight, RefreshCw, Plane
} from 'lucide-react';
import { authAPI } from '../../services/auth/auth';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

const VerifyEmail = () => {
  const navigate = useNavigate();
  const inputsRef = useRef([]);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Lấy email từ localStorage
  useEffect(() => {
    const saved = localStorage.getItem('registeredEmail');
    if (!saved) {
      navigate('/register');
      return;
    }
    setEmail(saved);
    // Auto-focus ô đầu tiên
    setTimeout(() => inputsRef.current[0]?.focus(), 100);
  }, [navigate]);

  // Đếm ngược cooldown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleChange = (idx, value) => {
    // chỉ chấp nhận số
    const v = value.replace(/\D/g, '');
    if (!v) {
      const next = [...otp];
      next[idx] = '';
      setOtp(next);
      return;
    }
    // Nếu user paste cả chuỗi
    if (v.length > 1) {
      const chars = v.slice(0, OTP_LENGTH).split('');
      const next = Array(OTP_LENGTH).fill('');
      chars.forEach((c, i) => { next[i] = c; });
      setOtp(next);
      const focusIdx = Math.min(chars.length, OTP_LENGTH - 1);
      inputsRef.current[focusIdx]?.focus();
      return;
    }
    const next = [...otp];
    next[idx] = v;
    setOtp(next);
    if (idx < OTP_LENGTH - 1) inputsRef.current[idx + 1]?.focus();
    setError('');
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!text) return;
    const next = Array(OTP_LENGTH).fill('');
    text.split('').forEach((c, i) => { next[i] = c; });
    setOtp(next);
    const focusIdx = Math.min(text.length, OTP_LENGTH - 1);
    inputsRef.current[focusIdx]?.focus();
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Vui lòng nhập đủ 6 số');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      await authAPI.verifyOtp(email, code);
      setSuccess(true);
      localStorage.removeItem('registeredEmail');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Xác thực thất bại. Vui lòng thử lại.');
      // Clear OTP để user nhập lại
      setOtp(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      await authAPI.resendVerification(email);
      setCooldown(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi lại OTP. Vui lòng thử lại.');
    } finally {
      setResending(false);
    }
  };

  // Mask email: tho***12309@gmail.com
  const maskEmail = (e) => {
    if (!e) return '';
    const [name, domain] = e.split('@');
    if (!domain) return e;
    const masked = name.length > 3
      ? name.slice(0, 3) + '***' + name.slice(-1)
      : name[0] + '***';
    return `${masked}@${domain}`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />

      <div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}><Plane size={20} /></div>
            <span className={styles.logoText}>FUTURE TRAVEL</span>
          </div>
        </div>

        {success ? (
          /* Success state */
          <div className={styles.successBody}>
            <div className={styles.successIcon}>
              <CheckCircle size={72} />
            </div>
            <h2 className={styles.successTitle}>Xác thực thành công!</h2>
            <p className={styles.successText}>
              Tài khoản của bạn đã được kích hoạt. Đang chuyển đến trang đăng nhập...
            </p>
            <button className={styles.btnPrimary} onClick={() => navigate('/login')}>
              Đăng nhập ngay <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <>
            {/* Body */}
            <div className={styles.iconBubble}>
              <ShieldCheck size={32} />
            </div>
            <h1 className={styles.title}>Xác thực email</h1>
            <p className={styles.subtitle}>
              Chúng tôi đã gửi mã xác thực 6 số đến
              <br />
              <strong className={styles.emailText}>
                <Mail size={13} /> {maskEmail(email)}
              </strong>
            </p>

            {/* OTP inputs */}
            <form onSubmit={handleVerify} className={styles.otpForm}>
              <div className={styles.otpRow}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => (inputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={OTP_LENGTH}
                    value={digit}
                    onChange={e => handleChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className={`${styles.otpBox} ${digit ? styles.otpFilled : ''} ${error ? styles.otpError : ''}`}
                    disabled={verifying}
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              {error && (
                <div className={styles.errorBox}>
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={verifying || otp.join('').length < OTP_LENGTH}
                className={styles.btnPrimary}
              >
                {verifying ? (
                  <><span className={styles.spinner} /> Đang xác thực...</>
                ) : (
                  <>Xác thực <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            {/* Resend */}
            <div className={styles.resendBox}>
              <span className={styles.resendLabel}>Không nhận được mã?</span>
              {cooldown > 0 ? (
                <span className={styles.resendCooldown}>
                  Gửi lại sau <strong>{cooldown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className={styles.resendBtn}
                >
                  <RefreshCw size={13} className={resending ? styles.spinning : ''} />
                  {resending ? 'Đang gửi...' : 'Gửi lại mã'}
                </button>
              )}
            </div>

            {/* Help */}
            <div className={styles.helpBox}>
              <strong>💡 Mẹo:</strong> Kiểm tra cả thư mục <strong>Spam</strong> hoặc <strong>Promotions</strong> nếu không thấy email.
              Mã có hiệu lực trong <strong>5 phút</strong>.
            </div>

            <p className={styles.footer}>
              Sai email? <Link to="/register" className={styles.linkAccent}>Đăng ký lại</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
