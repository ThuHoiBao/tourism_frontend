import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminLogin.module.scss';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Shield } from 'lucide-react';
import axios from '../../../../utils/axiosCustomize';

const AdminLogin = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
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
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let error = '';
    
    if (name === 'email') {
      error = validateEmail(value);
    } else if (name === 'password') {
      error = validatePassword(value);
    }
    
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setErrors({}); 
      
      console.log('🔐 Admin login attempt:', formData.email);
      
      const response = await axios.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });

      console.log('Admin login response:', response.data);
      
      const userRole = response.data.user.role;
      if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
        setErrors({ general: 'Bạn không có quyền truy cập vào hệ thống quản trị' });
        return;
      }

      localStorage.setItem('adminAccessToken', response.data.accessToken);
      localStorage.setItem('adminRefreshToken', response.data.refreshToken);
      
      const userInfo = {
        userId: response.data.user.userId,
        fullName: response.data.user.fullName,
        email: response.data.user.email,
        role: response.data.user.role,
        avatar: response.data.user.avatar || null
      };
      localStorage.setItem('adminUser', JSON.stringify(userInfo));

      console.log('Admin logged in successfully. Role:', userRole);
      
      navigate('/admin/dashboard', { replace: true });
      
    } catch (error) {
      console.error('Admin login error:', error);
      
      let errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại!';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        console.error('Response error:', { status, data });
        
        if (status === 401) {
          errorMessage = 'Email hoặc mật khẩu không đúng';
        } else if (status === 403) {
          errorMessage = 'Bạn không có quyền truy cập vào hệ thống quản trị';
        } else if (status === 400) {
          if (data.message?.includes('email')) {
            errorMessage = 'Vui lòng xác thực email trước khi đăng nhập';
          } else if (data.message?.includes('khóa')) {
            errorMessage = 'Tài khoản đã bị khóa';
          } else {
            errorMessage = data.message || errorMessage;
          }
        } else {
          errorMessage = data.message || errorMessage;
        }
      } else if (error.request) {
        console.error('Request error:', error.request);
        errorMessage = 'Không thể kết nối đến server';
      } else {
        console.error('Error:', error.message);
        errorMessage = error.message;
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e);
    }
  };

  const handleFocus = () => {
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.loginCard}>
        {/* Left Side - Branding */}
        <div className={styles.brandingSide}>
          <div className={styles.brandingContent}>
            <Shield className={styles.brandIcon} size={64} />
            <h2>Admin Portal</h2>
            <p>Hệ thống quản trị nội bộ</p>
            <div className={styles.features}>
              <div className={styles.feature}>
                <div className={styles.dot}></div>
                <span>Quản lý tour du lịch</span>
              </div>
              <div className={styles.feature}>
                <div className={styles.dot}></div>
                <span>Quản lý đặt chỗ</span>
              </div>
              <div className={styles.feature}>
                <div className={styles.dot}></div>
                <span>Báo cáo thống kê</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className={styles.formSide}>
          <div className={styles.formContainer}>
            <div className={styles.formHeader}>
              <h1>Đăng nhập Admin</h1>
              <p>Vui lòng đăng nhập để tiếp tục</p>
            </div>

            {errors.general && (
              <div className={styles.errorBox}>
                <AlertCircle size={20} />
                <span>{errors.general}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form} onKeyPress={handleKeyPress}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email
                </label>
                <div className={styles.inputWrapper}>
                  <Mail className={styles.icon} size={20} />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    placeholder="admin@example.com"
                    className={`${styles.input} ${errors.email ? styles.error : ''}`}
                    autoComplete="email"
                    disabled={loading}
                  />
                </div>
                {errors.email && <p className={styles.errorText}>{errors.email}</p>}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>
                  Mật khẩu
                </label>
                <div className={styles.inputWrapper}>
                  <Lock className={styles.icon} size={20} />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    placeholder="••••••••"
                    className={`${styles.input} ${errors.password ? styles.error : ''}`}
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
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <p className={styles.errorText}>{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={styles.submitBtn}
              >
                {loading ? (
                  <span className={styles.loading}>
                    <div className={styles.spinner}></div>
                    Đang xử lý...
                  </span>
                ) : (
                  <>
                    <Lock size={18} />
                    Đăng nhập
                  </>
                )}
              </button>
            </form>

            <div className={styles.footer}>
              <p className={styles.notice}>
                <Shield size={16} />
                Đây là hệ thống nội bộ. Chỉ dành cho quản trị viên.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;