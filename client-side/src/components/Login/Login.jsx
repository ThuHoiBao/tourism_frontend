import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useGoogleLogin } from '../../hook/useGoogleLogin';
import styles from './Login.module.scss';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { initiateGoogleLogin } = useGoogleLogin();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
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
      
      console.log('🔐 Attempting login with:', formData.email);
      
      const result = await login(formData.email, formData.password);
      
      console.log('Login result:', result);
      console.log('Tokens saved:', {
        accessToken: localStorage.getItem('accessToken') ? 'Có' : 'Không',
        refreshToken: localStorage.getItem('refreshToken') ? 'Có' : 'Không',
        user: localStorage.getItem('user') ? 'Có' : 'Không'
      });
      
      const userRole = result.user.role;
      console.log('👤 User role:', userRole);
      
      if (userRole === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        window.location.replace('/');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại!';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        console.error('Response error:', { status, data });
        
        if (status === 401) {
          errorMessage = 'Email hoặc mật khẩu không đúng';
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
      <div className={styles.formCard}>
        <div className={styles.brandLogo}>
          <h2 style={{ textAlign: 'center', color: '#d97706', marginBottom: '0.5rem' }}>
          </h2>
        </div>

        <h1 className={styles.title}>Đăng nhập</h1>
        <p className={styles.description}>
          Chào mừng bạn trở lại! Đăng nhập để khám phá những chuyến đi tuyệt vời.
        </p>

        {errors.general && (
          <div className={styles.errorBox}>
            <AlertCircle size={20} />
            {errors.general}
          </div>
        )}

       <button
          type="button"
          className={styles.socialLoginBtn}
          onClick={initiateGoogleLogin}
          disabled={loading}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Đăng nhập với Google
      </button>

        <div className={styles.divider}>
          <span>hoặc</span>
        </div>

        <form onSubmit={handleSubmit} className={styles.formWrapper} onKeyPress={handleKeyPress}>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <div className={styles.inputWrapper}>
              <Mail className={styles.icon} />
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus} 
                placeholder="nguyenvana@email.com"
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
              <Lock className={styles.icon} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus} 
                placeholder="••••••••"
                className={`${styles.input} ${styles.withToggle} ${errors.password ? styles.error : ''}`}
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

          <div className={styles.forgotPassword}>
            <Link to="/forgot-password">Quên mật khẩu?</Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
          >
            {loading ? (
              <span className={styles.loading}>Đang đăng nhập...</span>
            ) : (
              'Đăng nhập'
            )}
          </button>
        </form>

        <p className={styles.footer}>
          Chưa có tài khoản?{' '}
          <Link to="/register" className={styles.linkBold}>
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;