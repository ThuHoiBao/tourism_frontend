import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useGoogleLogin } from '../../hook/useGoogleLogin';
import styles from './Login.module.scss';
import {
  Mail, Lock, Eye, EyeOff, AlertCircle, Plane, MapPin, Compass,
  Sparkles, ArrowRight, Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { initiateGoogleLogin } = useGoogleLogin();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email không được để trống';
    if (!re.test(email)) return 'Email không hợp lệ';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Mật khẩu không được để trống';
    if (password.length < 6) return 'Mật khẩu phải có ít nhất 6 ký tự';
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let error = '';
    if (name === 'email') error = validateEmail(value);
    else if (name === 'password') error = validatePassword(value);
    if (error) setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleFocus = () => {
    if (errors.general) setErrors(prev => ({ ...prev, general: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    try {
      setLoading(true);
      setErrors({});
      const result = await login(formData.email, formData.password);
      const userRole = result.user.role;
      if (userRole === 'ADMIN') navigate('/admin/dashboard', { replace: true });
      else window.location.replace('/');
    } catch (error) {
      let errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại!';
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        if (status === 401) errorMessage = 'Email hoặc mật khẩu không đúng';
        else if (status === 400) {
          if (data.message?.includes('email')) errorMessage = 'Vui lòng xác thực email trước khi đăng nhập';
          else if (data.message?.includes('khóa')) errorMessage = 'Tài khoản đã bị khóa';
          else errorMessage = data.message || errorMessage;
        } else errorMessage = data.message || errorMessage;
      } else if (error.request) errorMessage = 'Không thể kết nối đến server';
      else errorMessage = error.message;
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bgShape1} />
      <div className={styles.bgShape2} />
      <div className={styles.bgShape3} />

      <div className={styles.container}>
        {/* ── Left: Branding side ── */}
        <div className={styles.brandSide}>
          <div className={styles.brandInner}>
            <div className={styles.brandLogo}>
              <div className={styles.brandLogoIcon}><Plane size={22} /></div>
              <span className={styles.brandName}>FUTURE TRAVEL</span>
            </div>

            <h1 className={styles.brandTitle}>
              Khám phá Việt Nam,
              <br />
              <span className={styles.brandTitleAccent}>chinh phục mọi điểm đến</span>
            </h1>
            <p className={styles.brandSubtitle}>
              Đặt tour, chia sẻ trải nghiệm, kết nối cộng đồng yêu du lịch khắp Việt Nam.
            </p>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}><MapPin size={16} /></div>
                <div>
                  <div className={styles.featureTitle}>Hơn 500+ điểm đến</div>
                  <div className={styles.featureDesc}>Từ Bắc vào Nam, biển đảo đến núi rừng</div>
                </div>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}><Compass size={16} /></div>
                <div>
                  <div className={styles.featureTitle}>Lộ trình tự thiết kế</div>
                  <div className={styles.featureDesc}>Cá nhân hóa cho từng phong cách du lịch</div>
                </div>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}><Sparkles size={16} /></div>
                <div>
                  <div className={styles.featureTitle}>Ưu đãi mỗi ngày</div>
                  <div className={styles.featureDesc}>Giảm tới 40% cho tour đặt sớm</div>
                </div>
              </div>
            </div>

            <div className={styles.brandFooter}>
              <Shield size={13} />
              <span>Bảo mật chuẩn ngân hàng — Thanh toán an toàn 100%</span>
            </div>
          </div>

          <div className={styles.mosaicPlane1} />
          <div className={styles.mosaicPlane2} />
        </div>

        {/* ── Right: Form side ── */}
        <div className={styles.formSide}>
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Đăng nhập</h2>
              <p className={styles.formSubtitle}>
                Chào mừng quay lại! Tiếp tục hành trình của bạn.
              </p>
            </div>

            {errors.general && (
              <div className={styles.errorBox}>
                <AlertCircle size={16} />
                <span>{errors.general}</span>
              </div>
            )}

            <button
              type="button"
              className={styles.googleBtn}
              onClick={initiateGoogleLogin}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Tiếp tục với Google</span>
            </button>

            <div className={styles.divider}>
              <span>hoặc đăng nhập với email</span>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>Email</label>
                <div className={`${styles.inputWrap} ${errors.email ? styles.inputErr : ''}`}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    placeholder="example@email.com"
                    className={styles.input}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <span className={styles.errText}>
                    <AlertCircle size={11} /> {errors.email}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor="password" className={styles.label}>Mật khẩu</label>
                  <Link to="/forgot-password" className={styles.forgotLink}>
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className={`${styles.inputWrap} ${errors.password ? styles.inputErr : ''}`}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    placeholder="Nhập mật khẩu của bạn"
                    className={styles.input}
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.toggleBtn}
                    tabIndex={-1}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <span className={styles.errText}>
                    <AlertCircle size={11} /> {errors.password}
                  </span>
                )}
              </div>

              <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? (
                  <><span className={styles.spinner} /> Đang đăng nhập...</>
                ) : (
                  <>Đăng nhập <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <p className={styles.formFooter}>
              Chưa có tài khoản?{' '}
              <Link to="/register" className={styles.linkAccent}>
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
