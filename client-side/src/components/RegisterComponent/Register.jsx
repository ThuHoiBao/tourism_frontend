import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Register.module.scss';
import {
  Mail, Lock, Eye, EyeOff, User, MapPin, CheckCircle, AlertCircle,
  Plane, Sparkles, Compass, Heart, ArrowRight, Shield
} from 'lucide-react';
import { authAPI } from '../../services/auth/auth';

const Register = () => {
  const navigate = useNavigate();
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
  const [submitting, setSubmitting] = useState(false);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  useEffect(() => { fetchProvinces(); }, []);

  const fetchProvinces = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://raw.githubusercontent.com/kenzouno1/DiaGioiHanhChinhVN/master/data.json');
      const data = await response.json();
      setProvinces(data);
      setLoading(false);
    } catch (error) {
      console.error('Lỗi tải tỉnh thành:', error);
      setLoading(false);
    }
  };

  const fetchDistricts = async (provinceCode) => {
    try {
      const selectedProvince = provinces.find(p => p.Id === provinceCode);
      if (selectedProvince && selectedProvince.Districts) setDistricts(selectedProvince.Districts);
      else setDistricts([]);
    } catch (error) {
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
    if (!/(?=.*[a-z])/.test(password)) return 'Phải có ít nhất 1 chữ thường';
    if (!/(?=.*[A-Z])/.test(password)) return 'Phải có ít nhất 1 chữ hoa';
    if (!/(?=.*\d)/.test(password)) return 'Phải có ít nhất 1 chữ số';
    return '';
  };
  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return 'Vui lòng nhập lại mật khẩu';
    if (confirmPassword !== password) return 'Mật khẩu không khớp';
    return '';
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'fullName': return validateFullName(value);
      case 'email': return validateEmail(value);
      case 'password': return validatePassword(value);
      case 'confirmPassword': return validateConfirmPassword(value, formData.password);
      case 'province': return !value ? 'Vui lòng chọn Tỉnh/Thành' : '';
      case 'district': return !value ? 'Vui lòng chọn Quận/Huyện' : '';
      case 'agreeTerms': return !value ? 'Vui lòng đồng ý với điều khoản' : '';
      default: return '';
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
    if (name === 'province' && value) await fetchDistricts(value);
    if (touched[name]) {
      setErrors(prev => ({ ...prev, [name]: validateField(name, newValue) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    setErrors(prev => ({ ...prev, [name]: validateField(name, value) }));
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
      setSubmitting(true);
      const selectedProvince = provinces.find(p => p.Id === formData.province);
      const selectedDistrict = districts.find(d => d.Id === formData.district);
      const requestData = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        provinceCode: formData.province,
        provinceName: selectedProvince?.Name || '',
        districtCode: formData.district,
        districtName: selectedDistrict?.Name || ''
      };
      await authAPI.register(requestData);
      localStorage.setItem('registeredEmail', formData.email);
      // Redirect thẳng sang trang nhập OTP
      navigate('/verify-email');
    } catch (error) {
      alert(error.response?.data?.message || error.message || 'Đăng ký thất bại. Vui lòng thử lại!');
    } finally {
      setSubmitting(false);
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
              <div className={styles.brandLogoIcon}><Plane size={22} /></div>
              <span className={styles.brandName}>FUTURE TRAVEL</span>
            </div>

            <h1 className={styles.brandTitle}>
              Tham gia cộng đồng,
              <br />
              <span className={styles.brandTitleAccent}>kết nối đam mê du lịch</span>
            </h1>
            <p className={styles.brandSubtitle}>
              Đăng ký tài khoản miễn phí để nhận ưu đãi độc quyền và chia sẻ hành trình của bạn.
            </p>

            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}><Sparkles size={16} /></div>
                <div>
                  <div className={styles.featureTitle}>Ưu đãi hội viên</div>
                  <div className={styles.featureDesc}>Giảm tới 40% tour, voucher khách sạn riêng</div>
                </div>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}><Compass size={16} /></div>
                <div>
                  <div className={styles.featureTitle}>Lưu lộ trình</div>
                  <div className={styles.featureDesc}>Lưu tour yêu thích, lên kế hoạch dễ dàng</div>
                </div>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}><Heart size={16} /></div>
                <div>
                  <div className={styles.featureTitle}>Cộng đồng tích cực</div>
                  <div className={styles.featureDesc}>Chia sẻ trải nghiệm, kết nối tín đồ du lịch</div>
                </div>
              </div>
            </div>

            <div className={styles.brandFooter}>
              <Shield size={13} />
              <span>Thông tin được mã hóa và bảo mật tuyệt đối</span>
            </div>
          </div>

          <div className={styles.mosaicPlane1} />
          <div className={styles.mosaicPlane2} />
        </div>

        {/* ── Right: Form ── */}
        <div className={styles.formSide}>
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Đăng ký tài khoản</h2>
              <p className={styles.formSubtitle}>
                Hoàn tất thông tin để bắt đầu hành trình của bạn
              </p>
            </div>

            {loading ? (
              <div className={styles.loadingBox}>
                <div className={styles.spinner} />
                <span>Đang tải dữ liệu tỉnh thành...</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>
                {/* Full Name */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Họ và tên <span className={styles.required}>*</span></label>
                  <div className={`${styles.inputWrap} ${errors.fullName && touched.fullName ? styles.inputErr : ''}`}>
                    <User size={16} className={styles.inputIcon} />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Nguyễn Văn A"
                      className={styles.input}
                      disabled={submitting}
                    />
                  </div>
                  {errors.fullName && touched.fullName && (
                    <span className={styles.errText}><AlertCircle size={11} /> {errors.fullName}</span>
                  )}
                </div>

                {/* Email */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email <span className={styles.required}>*</span></label>
                  <div className={`${styles.inputWrap} ${errors.email && touched.email ? styles.inputErr : ''}`}>
                    <Mail size={16} className={styles.inputIcon} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="example@email.com"
                      className={styles.input}
                      disabled={submitting}
                    />
                  </div>
                  {errors.email && touched.email && (
                    <span className={styles.errText}><AlertCircle size={11} /> {errors.email}</span>
                  )}
                </div>

                {/* Password row — 2 cột */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Mật khẩu <span className={styles.required}>*</span></label>
                    <div className={`${styles.inputWrap} ${errors.password && touched.password ? styles.inputErr : ''}`}>
                      <Lock size={16} className={styles.inputIcon} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Tối thiểu 8 ký tự"
                        className={styles.input}
                        disabled={submitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={styles.toggleBtn}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && touched.password && (
                      <span className={styles.errText}><AlertCircle size={11} /> {errors.password}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nhập lại mật khẩu <span className={styles.required}>*</span></label>
                    <div className={`${styles.inputWrap} ${errors.confirmPassword && touched.confirmPassword ? styles.inputErr : ''}`}>
                      <Lock size={16} className={styles.inputIcon} />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Nhập lại mật khẩu"
                        className={styles.input}
                        disabled={submitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className={styles.toggleBtn}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.confirmPassword && touched.confirmPassword && (
                      <span className={styles.errText}><AlertCircle size={11} /> {errors.confirmPassword}</span>
                    )}
                  </div>
                </div>

                {/* Province + District — 2 cột */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Tỉnh / Thành <span className={styles.required}>*</span></label>
                    <div className={`${styles.inputWrap} ${errors.province && touched.province ? styles.inputErr : ''}`}>
                      <MapPin size={16} className={styles.inputIcon} />
                      <select
                        name="province"
                        value={formData.province}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`${styles.input} ${styles.select}`}
                        disabled={submitting}
                      >
                        <option value="">Chọn Tỉnh/Thành</option>
                        {provinces.map((p) => (
                          <option key={`province-${p.Id}`} value={p.Id}>{p.Name}</option>
                        ))}
                      </select>
                    </div>
                    {errors.province && touched.province && (
                      <span className={styles.errText}><AlertCircle size={11} /> {errors.province}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Quận / Huyện <span className={styles.required}>*</span></label>
                    <div className={`${styles.inputWrap} ${errors.district && touched.district ? styles.inputErr : ''} ${!formData.province ? styles.inputDisabled : ''}`}>
                      <MapPin size={16} className={styles.inputIcon} />
                      <select
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={!formData.province || districts.length === 0 || submitting}
                        className={`${styles.input} ${styles.select}`}
                      >
                        <option value="">
                          {!formData.province ? 'Chọn Tỉnh trước' : 'Chọn Quận/Huyện'}
                        </option>
                        {districts.map((d) => (
                          <option key={`district-${d.Id}`} value={d.Id}>{d.Name}</option>
                        ))}
                      </select>
                    </div>
                    {errors.district && touched.district && (
                      <span className={styles.errText}><AlertCircle size={11} /> {errors.district}</span>
                    )}
                  </div>
                </div>

                {/* Terms */}
                <div className={styles.termsWrap}>
                  <label className={styles.termsLabel}>
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={formData.agreeTerms}
                      onChange={handleChange}
                      className={styles.checkbox}
                      disabled={submitting}
                    />
                    <span>
                      Tôi đã đọc và đồng ý với{' '}
                      <a href="#" className={styles.linkAccent}>Điều khoản</a>{' '}và{' '}
                      <a href="#" className={styles.linkAccent}>Chính sách bảo mật</a>
                    </span>
                  </label>
                  {errors.agreeTerms && touched.agreeTerms && (
                    <span className={styles.errText}><AlertCircle size={11} /> {errors.agreeTerms}</span>
                  )}
                </div>

                <button type="submit" disabled={submitting} className={styles.submitBtn}>
                  {submitting ? (
                    <><span className={styles.spinner} /> Đang xử lý...</>
                  ) : (
                    <>Đăng ký tài khoản <ArrowRight size={16} /></>
                  )}
                </button>
              </form>
            )}

            <p className={styles.formFooter}>
              Đã có tài khoản?{' '}
              <Link to="/login" className={styles.linkAccent}>Đăng nhập</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSuccessModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}>
              <CheckCircle size={56} color="#10b981" />
            </div>
            <h2 className={styles.modalTitle}>Đăng ký thành công!</h2>
            <p className={styles.modalText}>Chúng tôi đã gửi email xác thực đến:</p>
            <p className={styles.modalEmail}>{registeredEmail}</p>
            <p className={styles.modalInstruction}>
              Vui lòng kiểm tra hộp thư và nhấn vào link xác thực để kích hoạt tài khoản.
            </p>
            <div className={styles.modalNote}>
              <strong>Lưu ý:</strong>
              <ul>
                <li>Link xác thực có hiệu lực trong 5 phút</li>
                <li>Kiểm tra cả thư mục Spam nếu không thấy email</li>
              </ul>
            </div>
            <button onClick={() => setShowSuccessModal(false)} className={styles.modalButton}>
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
