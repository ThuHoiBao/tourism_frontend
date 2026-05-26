import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './ForgotPassword.module.scss';
import {
  Mail, Lock, Eye, EyeOff, KeyRound, ShieldCheck, AlertCircle, CheckCircle,
  ArrowRight, ArrowLeft, RefreshCw, Plane
} from 'lucide-react';
import { authAPI } from '../../services/auth/auth';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

/**
 * Stages:
 *   1 = nhập email
 *   2 = nhập OTP + password mới
 *   3 = thành công
 */
const ForgotPassword = () => {
  const navigate = useNavigate();
  const inputsRef = useRef([]);

  const [stage, setStage] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Auto-focus OTP đầu khi sang stage 2
  useEffect(() => {
    if (stage === 2) setTimeout(() => inputsRef.current[0]?.focus(), 150);
  }, [stage]);

  const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  // ── Stage 1: gửi OTP ──
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!validateEmail(email)) {
      setError('Email không hợp lệ');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await authAPI.forgotPassword(email);
      setCooldown(RESEND_COOLDOWN);
      setStage(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Gửi OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      await authAPI.forgotPassword(email);
      setCooldown(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể gửi lại OTP');
    } finally {
      setResending(false);
    }
  };

  // ── OTP input handlers ──
  const handleOtpChange = (idx, value) => {
    const v = value.replace(/\D/g, '');
    if (!v) {
      const next = [...otp];
      next[idx] = '';
      setOtp(next);
      return;
    }
    if (v.length > 1) {
      const chars = v.slice(0, OTP_LENGTH).split('');
      const next = Array(OTP_LENGTH).fill('');
      chars.forEach((c, i) => { next[i] = c; });
      setOtp(next);
      inputsRef.current[Math.min(chars.length, OTP_LENGTH - 1)]?.focus();
      return;
    }
    const next = [...otp];
    next[idx] = v;
    setOtp(next);
    if (idx < OTP_LENGTH - 1) inputsRef.current[idx + 1]?.focus();
    setError('');
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputsRef.current[idx - 1]?.focus();
    else if (e.key === 'ArrowLeft' && idx > 0) inputsRef.current[idx - 1]?.focus();
    else if (e.key === 'ArrowRight' && idx < OTP_LENGTH - 1) inputsRef.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!text) return;
    const next = Array(OTP_LENGTH).fill('');
    text.split('').forEach((c, i) => { next[i] = c; });
    setOtp(next);
    inputsRef.current[Math.min(text.length, OTP_LENGTH - 1)]?.focus();
  };

  // ── Stage 2: reset password ──
  const handleResetPassword = async (e) => {
    e?.preventDefault();
    const code = otp.join('');
    if (code.length < OTP_LENGTH) { setError('Vui lòng nhập đủ 6 số OTP'); return; }
    if (newPassword.length < 8) { setError('Mật khẩu phải có ít nhất 8 ký tự'); return; }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setError('Mật khẩu phải có chữ hoa, chữ thường và số');
      return;
    }
    if (newPassword !== confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return; }

    setLoading(true);
    setError('');
    try {
      await authAPI.resetPassword(email, code, newPassword);
      setStage(3);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const maskEmail = (e) => {
    if (!e) return '';
    const [name, domain] = e.split('@');
    if (!domain) return e;
    const masked = name.length > 3 ? name.slice(0, 3) + '***' + name.slice(-1) : name[0] + '***';
    return `${masked}@${domain}`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}><Plane size={20} /></div>
            <span className={styles.logoText}>FUTURE TRAVEL</span>
          </div>
        </div>

        {/* Stepper */}
        {stage !== 3 && (
          <div className={styles.stepper}>
            <div className={`${styles.step} ${stage >= 1 ? styles.stepActive : ''} ${stage > 1 ? styles.stepDone : ''}`}>
              <div className={styles.stepCircle}>{stage > 1 ? <CheckCircle size={14} /> : '1'}</div>
              <span>Email</span>
            </div>
            <div className={styles.stepLine} />
            <div className={`${styles.step} ${stage >= 2 ? styles.stepActive : ''}`}>
              <div className={styles.stepCircle}>2</div>
              <span>Đặt lại</span>
            </div>
          </div>
        )}

        {/* ── Stage 1: Email ── */}
        {stage === 1 && (
          <>
            <div className={styles.iconBubble}><KeyRound size={32} /></div>
            <h1 className={styles.title}>Quên mật khẩu?</h1>
            <p className={styles.subtitle}>
              Nhập email tài khoản, chúng tôi sẽ gửi mã xác thực để đặt lại mật khẩu.
            </p>

            <form onSubmit={handleSendOtp} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <div className={`${styles.inputWrap} ${error ? styles.inputErr : ''}`}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="example@email.com"
                    className={styles.input}
                    autoFocus
                    disabled={loading}
                  />
                </div>
              </div>

              {error && (
                <div className={styles.errorBox}>
                  <AlertCircle size={14} /> <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading || !email} className={styles.btnPrimary}>
                {loading ? <><span className={styles.spinner} /> Đang gửi...</>
                  : <>Gửi mã OTP <ArrowRight size={16} /></>}
              </button>
            </form>

            <Link to="/login" className={styles.backLink}>
              <ArrowLeft size={14} /> Quay lại đăng nhập
            </Link>
          </>
        )}

        {/* ── Stage 2: OTP + new password ── */}
        {stage === 2 && (
          <>
            <div className={styles.iconBubble}><ShieldCheck size={32} /></div>
            <h1 className={styles.title}>Đặt lại mật khẩu</h1>
            <p className={styles.subtitle}>
              Mã OTP đã được gửi đến<br />
              <strong className={styles.emailText}><Mail size={13} /> {maskEmail(email)}</strong>
            </p>

            <form onSubmit={handleResetPassword} className={styles.form}>
              {/* OTP boxes */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Mã OTP (6 số)</label>
                <div className={styles.otpRow}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => (inputsRef.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={OTP_LENGTH}
                      value={digit}
                      onChange={e => handleOtpChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      onPaste={handlePaste}
                      className={`${styles.otpBox} ${digit ? styles.otpFilled : ''}`}
                      disabled={loading}
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>
              </div>

              {/* New password */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Mật khẩu mới</label>
                <div className={styles.inputWrap}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setError(''); }}
                    placeholder="Tối thiểu 8 ký tự, có chữ hoa + số"
                    className={styles.input}
                    disabled={loading}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className={styles.toggleBtn} tabIndex={-1}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Nhập lại mật khẩu</label>
                <div className={styles.inputWrap}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                    placeholder="Nhập lại mật khẩu mới"
                    className={styles.input}
                    disabled={loading}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className={styles.toggleBtn} tabIndex={-1}>
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className={styles.errorBox}>
                  <AlertCircle size={14} /> <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className={styles.btnPrimary}>
                {loading ? <><span className={styles.spinner} /> Đang xử lý...</>
                  : <>Đặt lại mật khẩu <ArrowRight size={16} /></>}
              </button>
            </form>

            {/* Resend */}
            <div className={styles.resendBox}>
              <span className={styles.resendLabel}>Không nhận được mã?</span>
              {cooldown > 0 ? (
                <span className={styles.resendCooldown}>Gửi lại sau <strong>{cooldown}s</strong></span>
              ) : (
                <button onClick={handleResend} disabled={resending} className={styles.resendBtn}>
                  <RefreshCw size={13} className={resending ? styles.spinning : ''} />
                  {resending ? 'Đang gửi...' : 'Gửi lại mã'}
                </button>
              )}
            </div>

            <button type="button" onClick={() => { setStage(1); setOtp(Array(OTP_LENGTH).fill('')); setError(''); }}
              className={styles.backLink}>
              <ArrowLeft size={14} /> Đổi email khác
            </button>
          </>
        )}

        {/* ── Stage 3: Success ── */}
        {stage === 3 && (
          <div className={styles.successBody}>
            <div className={styles.successIcon}><CheckCircle size={72} /></div>
            <h2 className={styles.successTitle}>Đặt lại thành công!</h2>
            <p className={styles.successText}>
              Mật khẩu mới đã được lưu. Đang chuyển đến trang đăng nhập...
            </p>
            <button className={styles.btnPrimary} onClick={() => navigate('/login')}>
              Đăng nhập ngay <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
