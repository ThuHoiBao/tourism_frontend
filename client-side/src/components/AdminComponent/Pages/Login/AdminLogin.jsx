import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminLogin.module.scss';
import {
  Mail, Lock, Eye, EyeOff, AlertCircle, Shield, ArrowRight,
  LayoutDashboard, BarChart3, Users, Settings, ShieldCheck
} from 'lucide-react';
import axios from '../../../../utils/axiosCustomize';

const AdminLogin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
      const response = await axios.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });

      const userRole = response.data.user.role;
      if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
        setErrors({ general: 'Bạn không có quyền truy cập vào hệ thống quản trị' });
        return;
      }

      localStorage.setItem('adminAccessToken', response.data.accessToken);
      localStorage.setItem('adminRefreshToken', response.data.refreshToken);
      localStorage.setItem('adminUser', JSON.stringify({
        userId: response.data.user.userId,
        fullName: response.data.user.fullName,
        email: response.data.user.email,
        role: response.data.user.role,
        avatar: response.data.user.avatar || null
      }));

      navigate('/admin/dashboard', { replace: true });
    } catch (error) {
      let errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại!';
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        if (status === 401) errorMessage = 'Email hoặc mật khẩu không đúng';
        else if (status === 403) errorMessage = 'Bạn không có quyền truy cập vào hệ thống quản trị';
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

      <div className={styles.container}>
        {/* ── Left: Brand panel ── */}
        <div className={styles.brandSide}>
          <div className={styles.brandInner}>
            <div className={styles.brandLogo}>
              <div className={styles.brandLogoIcon}><Shield size={22} /></div>
              <span className={styles.brandName}>ADMIN PORTAL</span>
            </div>

            <div className={styles.adminBadge}>
              <ShieldCheck size={12} /> Internal System
            </div>

            <h1 className={styles.brandTitle}>
              Hệ thống quản trị
              <br />
              <span className={styles.brandTitleAccent}>Future Travel</span>
            </h1>
            <p className={styles.brandSubtitle}>
              Quản lý toàn diện tour du lịch, người dùng, đơn đặt và doanh thu trên nền tảng.
            </p>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}><LayoutDashboard size={16} /></div>
                <div>
                  <div className={styles.featureTitle}>Dashboard tổng quan</div>
                  <div className={styles.featureDesc}>Theo dõi KPI, doanh thu, booking realtime</div>
                </div>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}><Users size={16} /></div>
                <div>
                  <div className={styles.featureTitle}>Quản lý người dùng</div>
                  <div className={styles.featureDesc}>Phân quyền, xử lý vi phạm, khóa tài khoản</div>
                </div>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}><BarChart3 size={16} /></div>
                <div>
                  <div className={styles.featureTitle}>Báo cáo thống kê</div>
                  <div className={styles.featureDesc}>Phân tích doanh thu, tour bán chạy, xu hướng</div>
                </div>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}><Settings size={16} /></div>
                <div>
                  <div className={styles.featureTitle}>Cấu hình hệ thống</div>
                  <div className={styles.featureDesc}>Tour, voucher, danh mục, mã giảm giá</div>
                </div>
              </div>
            </div>

            <div className={styles.brandFooter}>
              <ShieldCheck size={13} />
              <span>Mọi phiên đăng nhập đều được ghi log và giám sát</span>
            </div>
          </div>

          <div className={styles.mosaicPlane1} />
          <div className={styles.mosaicPlane2} />
        </div>

        {/* ── Right: Form ── */}
        <div className={styles.formSide}>
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <div className={styles.formHeaderTop}>
                <div className={styles.shieldBubble}><Shield size={20} /></div>
                <h2 className={styles.formTitle}>Đăng nhập Admin</h2>
              </div>
              <p className={styles.formSubtitle}>
                Chỉ dành cho quản trị viên có quyền truy cập
              </p>
            </div>

            {errors.general && (
              <div className={styles.errorBox}>
                <AlertCircle size={16} />
                <span>{errors.general}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Email quản trị</label>
                <div className={`${styles.inputWrap} ${errors.email ? styles.inputErr : ''}`}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    placeholder="admin@futuretravel.vn"
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
                <label className={styles.label}>Mật khẩu</label>
                <div className={`${styles.inputWrap} ${errors.password ? styles.inputErr : ''}`}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    placeholder="Nhập mật khẩu admin"
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
                  <><span className={styles.spinner} /> Đang xác thực...</>
                ) : (
                  <><Shield size={16} /> Truy cập hệ thống <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <div className={styles.warningNote}>
              <ShieldCheck size={14} />
              <div>
                <strong>Đây là hệ thống nội bộ.</strong> Mọi truy cập trái phép sẽ bị ghi log và xử lý theo quy định.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
