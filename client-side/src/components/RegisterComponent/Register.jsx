import React, { useState, useEffect } from 'react';
import styles from './Register.module.scss';
import { Mail, Lock, Eye, EyeOff, User, MapPin, CheckCircle } from 'lucide-react';
import { authAPI } from '../../services/auth/auth';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    province: '',
    district: '',
    agreeTerms: false
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({});
  
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  useEffect(() => {
    fetchProvinces();
  }, []);

  const fetchProvinces = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://raw.githubusercontent.com/kenzouno1/DiaGioiHanhChinhVN/master/data.json');
      const data = await response.json();
      
      console.log('Provinces loaded:', data.length);
      setProvinces(data);
      setLoading(false);
    } catch (error) {
      console.error('Lỗi tải tỉnh thành:', error);
      setLoading(false);
    }
  };

  const fetchDistricts = async (provinceCode) => {
    try {
      console.log('Fetching districts for province:', provinceCode);
      
      const selectedProvince = provinces.find(p => p.Id === provinceCode);
      if (selectedProvince && selectedProvince.Districts) {
        console.log('Districts loaded:', selectedProvince.Districts.length);
        setDistricts(selectedProvince.Districts);
      } else {
        setDistricts([]);
      }
    } catch (error) {
      console.error('Lỗi tải quận huyện:', error);
      setDistricts([]);
    }
  };


  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email không được để trống';
    if (!re.test(email)) return 'Email không hợp lệ';
    return '';
  };

  const validateFullName = (name) => {
    if (!name) return 'Họ và tên không được để trống';
    if (name.length < 3) return 'Họ và tên phải có ít nhất 3 ký tự';
    if (!/^[a-zA-ZÀ-ỹ\s]+$/.test(name)) return 'Họ và tên chỉ được chứa chữ cái';
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Mật khẩu không được để trống';
    if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
    if (!/(?=.*[a-z])/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ thường';
    if (!/(?=.*[A-Z])/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ hoa';
    if (!/(?=.*\d)/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ số';
    return '';
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return 'Vui lòng nhập lại mật khẩu';
    if (confirmPassword !== password) return 'Mật khẩu không khớp';
    return '';
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'fullName':
        return validateFullName(value);
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePassword(value);
      case 'confirmPassword':
        return validateConfirmPassword(value, formData.password);
      case 'province':
        return !value ? 'Vui lòng chọn Tỉnh/Thành' : '';
      case 'district':
        return !value ? 'Vui lòng chọn Quận/Huyện' : '';
      case 'agreeTerms':
        return !value ? 'Vui lòng đồng ý với điều khoản' : '';
      default:
        return '';
    }
  };

  const handleChange = async (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue,
      ...(name === 'province' && { district: '' })
    }));

    if (name === 'province' && value) {
      await fetchDistricts(value);
    }

    if (touched[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: validateField(name, newValue)
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({
      ...prev,
      [name]: validateField(name, value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);
    setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    if (Object.keys(newErrors).length > 0) return;

    try {
      const selectedProvince = provinces.find(p => p.Id === formData.province);
      const selectedDistrict = districts.find(d => d.Id === formData.district);

      console.log('Selected Province:', selectedProvince);
      console.log('Selected District:', selectedDistrict);

      const requestData = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        provinceCode: formData.province,
        provinceName: selectedProvince?.Name || "",
        districtCode: formData.district,
        districtName: selectedDistrict?.Name || ""
      };

      console.log("Sending request:", requestData);

      await authAPI.register(requestData);

      // Save email to localStorage for resend verification
      localStorage.setItem('registeredEmail', formData.email);

      setRegisteredEmail(formData.email);
      setShowSuccessModal(true);

      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        province: '',
        district: '',
        agreeTerms: false
      });
      setTouched({});
      setDistricts([]);

    } catch (error) {
      console.error("Register error:", error);

      alert(
        error.response?.data?.message ||
        error.message ||
        "Đăng ký thất bại. Vui lòng thử lại!"
      );
    }
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.formCard}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <p>Đang tải dữ liệu tỉnh thành...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formCard}>
        <h1 className={styles.title}>Đăng ký hội viên</h1>
        <p className={styles.description}>
          Để hoàn tất đăng ký Hội viên Future Travel, vui lòng điền đầy đủ thông tin vào mẫu dưới đây
        </p>

        <div className={styles.formWrapper}>
          {/* Full Name */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Họ và tên <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <User className={styles.icon} />
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nhập họ tên"
                className={`${styles.input} ${errors.fullName && touched.fullName ? styles.error : ''}`}
              />
            </div>
            {errors.fullName && touched.fullName && (
              <p className={styles.errorText}>{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Email <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <Mail className={styles.icon} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="nguyenvana@gmail.com"
                className={`${styles.input} ${errors.email && touched.email ? styles.error : ''}`}
              />
            </div>
            {errors.email && touched.email && (
              <p className={styles.errorText}>{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Mật khẩu <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <Lock className={styles.icon} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="••••••••"
                className={`${styles.input} ${styles.withToggle} ${errors.password && touched.password ? styles.error : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.toggleBtn}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {errors.password && touched.password && (
              <p className={styles.errorText}>{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Nhập lại mật khẩu <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <Lock className={styles.icon} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Nhập lại mật khẩu"
                className={`${styles.input} ${styles.withToggle} ${errors.confirmPassword && touched.confirmPassword ? styles.error : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className={styles.toggleBtn}
              >
                {showConfirmPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            {errors.confirmPassword && touched.confirmPassword && (
              <p className={styles.errorText}>{errors.confirmPassword}</p>
            )}
          </div>

          {/* Province */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Tỉnh / Thành <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <MapPin className={styles.icon} />
              <select
                name="province"
                value={formData.province}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.input} ${styles.select} ${errors.province && touched.province ? styles.error : ''}`}
              >
                <option value="">Chọn Tỉnh/Thành</option>
                {provinces.map((province) => (
                  <option 
                    key={`province-${province.Id}`} 
                    value={province.Id}
                  >
                    {province.Name}
                  </option>
                ))}
              </select>
            </div>
            {errors.province && touched.province && (
              <p className={styles.errorText}>{errors.province}</p>
            )}
          </div>

          {/* District */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Quận / Huyện <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <MapPin className={styles.icon} />
              <select
                name="district"
                value={formData.district}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={!formData.province || districts.length === 0}
                className={`${styles.input} ${styles.select} ${errors.district && touched.district ? styles.error : ''} 
                ${!formData.province ? styles.disabled : ''}`}
              >
                <option value="">
                  {!formData.province ? 'Chọn Tỉnh/Thành trước' : 'Chọn Quận/Huyện'}
                </option>
                {districts.map((district) => (
                  <option 
                    key={`district-${district.Id}`} 
                    value={district.Id}
                  >
                    {district.Name}
                  </option>
                ))}
              </select>
            </div>
            {errors.district && touched.district && (
              <p className={styles.errorText}>{errors.district}</p>
            )}
          </div>

          {/* Terms */}
          <div className={styles.termsWrapper}>
            <input
              type="checkbox"
              name="agreeTerms"
              id="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
              className={styles.checkbox}
            />
            <label htmlFor="agreeTerms" className={styles.termsLabel}>
              Tôi đã đọc và đồng ý các{' '}
              <a href="#" className={styles.link}>
                Điều khoản đăng ký hội viên
              </a>
            </label>
          </div>
          {errors.agreeTerms && touched.agreeTerms && (
            <p className={styles.errorText}>{errors.agreeTerms}</p>
          )}

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            className={styles.submitBtn}
          >
            Đăng ký
          </button>
        </div>

        <p className={styles.footer}>
          Đã có tài khoản?{' '}
          <a href="/login" className={styles.linkBold}>
            Đăng nhập ngay
          </a>
        </p>
      </div>

      {showSuccessModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalIcon}>
              <CheckCircle size={64} color="#10b981" />
            </div>
            <h2 className={styles.modalTitle}>Đăng ký thành công! 🎉</h2>
            <p className={styles.modalText}>
              Chúng tôi đã gửi email xác thực đến:
            </p>
            <p className={styles.modalEmail}>{registeredEmail}</p>
            <p className={styles.modalInstruction}>
              Vui lòng kiểm tra hộp thư và nhấn vào link xác thực để kích hoạt tài khoản.
            </p>
            <div className={styles.modalNote}>
              <p><strong>Lưu ý:</strong></p>
              <ul>
                <li>Link xác thực có hiệu lực trong 5 phút</li>
                <li>Kiểm tra cả thư mục Spam nếu không thấy email</li>
              </ul>
            </div>
            <button 
              onClick={() => setShowSuccessModal(false)} 
              className={styles.modalButton}
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;