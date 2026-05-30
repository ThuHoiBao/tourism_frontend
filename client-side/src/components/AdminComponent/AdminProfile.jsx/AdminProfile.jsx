import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Calendar, MapPin, Shield, Camera, Save, X,
  Lock, Edit2, CheckCircle, AlertCircle, ShieldCheck, Coins
} from 'lucide-react';
import styles from './AdminProfile.module.scss';
import axios from '../../../utils/axiosCustomize';
import { toast } from 'react-toastify';
import { authAPI } from '../../../services/auth/auth';

const AdminProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [profile, setProfile] = useState(null);
  const [editedProfile, setEditedProfile] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const getAdminUser = () => {
    try {
      return JSON.parse(localStorage.getItem('adminUser') || '{}');
    } catch { return {}; }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const adminUser = getAdminUser();
      const userId = adminUser.userId;
      if (!userId) {
        toast.error('Không tìm thấy thông tin đăng nhập');
        return;
      }
      const res = await axios.get(`/users/${userId}`);
      const data = res.data?.data || res.data;
      setProfile(data);
      setEditedProfile(data);
    } catch (error) {
      console.error('Fetch profile error:', error);
      toast.error('Không thể tải thông tin cá nhân');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ảnh không được vượt quá 5MB');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const adminUser = getAdminUser();
      const userId = adminUser.userId;
      const formData = new FormData();
      if (editedProfile.fullName) formData.append('fullName', editedProfile.fullName);
      if (editedProfile.phone) formData.append('phone', editedProfile.phone);
      if (editedProfile.dateOfBirth) formData.append('dateOfBirth', editedProfile.dateOfBirth);
      if (avatarFile) formData.append('avatar', avatarFile);

      const res = await axios.put(`/users/${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const updated = res.data?.data || res.data;
      setProfile(updated);
      setEditedProfile(updated);

      // Cập nhật localStorage để header cập nhật ngay
      localStorage.setItem('adminUser', JSON.stringify({
        ...adminUser,
        fullName: updated.fullName,
        avatar: updated.avatar
      }));
      window.dispatchEvent(new Event('storage'));

      toast.success('Cập nhật thông tin thành công');
      setEditMode(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật thông tin');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile(profile);
    setEditMode(false);
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('Mật khẩu mới phải có ít nhất 8 ký tự');
      return;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      toast.error('Mật khẩu phải có chữ hoa, chữ thường và số');
      return;
    }

    // Dùng flow forgot-password (OTP) — admin cũng vẫn là user
    try {
      setSaving(true);
      const adminUser = getAdminUser();
      await authAPI.forgotPassword(adminUser.email);
      toast.success('Mã OTP đã gửi đến email. Vui lòng kiểm tra hộp thư');

      // Hỏi OTP qua prompt nhanh — bản full nên có dialog riêng
      const otp = window.prompt('Nhập mã OTP 6 số đã gửi đến email:');
      if (!otp || otp.length !== 6) {
        toast.error('OTP không hợp lệ');
        return;
      }
      await authAPI.resetPassword(adminUser.email, otp, passwordData.newPassword);
      toast.success('Đổi mật khẩu thành công');
      setShowChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể đổi mật khẩu');
    } finally {
      setSaving(false);
    }
  };

  const getRoleDisplay = (role) => ({
    'ADMIN': 'Quản trị viên',
    'STAFF': 'Nhân viên',
    'CUSTOMER': 'Khách hàng',
    'USER': 'Người dùng'
  }[role] || role);

  const getInitials = (name) => {
    if (!name) return 'AD';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d)) return '';
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return ''; }
  };

  // Convert ISO/various date formats to YYYY-MM-DD for input[type=date]
  const toInputDate = (dateStr) => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr.substring(0, 10);
    try {
      const d = new Date(dateStr);
      if (isNaN(d)) return '';
      return d.toISOString().substring(0, 10);
    } catch { return ''; }
  };

  if (loading) {
    return (
      <div className={styles.loadingBox}>
        <div className={styles.spinner} />
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.loadingBox}>
        <AlertCircle size={36} color="#dc2626" />
        <p>Không tìm thấy thông tin profile</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ── Hero banner ── */}
      <div className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <div className={styles.avatarBlock}>
            <div className={styles.avatarRing}>
              <div className={styles.avatar}>
                {avatarPreview || profile.avatar ? (
                  <img src={avatarPreview || profile.avatar} alt="avatar" />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {getInitials(profile.fullName)}
                  </div>
                )}
              </div>
              {editMode && (
                <label className={styles.avatarUpload} title="Đổi ảnh đại diện">
                  <Camera size={16} />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
                </label>
              )}
            </div>
            <div className={styles.heroInfo}>
              <h1 className={styles.heroName}>{profile.fullName || 'Admin'}</h1>
              <div className={styles.heroBadges}>
                <span className={styles.roleBadge}>
                  <ShieldCheck size={12} /> {getRoleDisplay(profile.role)}
                </span>
                {profile.isEmailVerified && (
                  <span className={styles.verifiedBadge}>
                    <CheckCircle size={12} /> Email đã xác thực
                  </span>
                )}
              </div>
              <div className={styles.heroEmail}>
                <Mail size={13} /> {profile.email}
              </div>
            </div>
          </div>

          <div className={styles.heroActions}>
            {!editMode ? (
              <button className={styles.btnEdit} onClick={() => setEditMode(true)}>
                <Edit2 size={15} /> Chỉnh sửa
              </button>
            ) : (
              <>
                <button className={styles.btnCancel} onClick={handleCancelEdit} disabled={saving}>
                  <X size={15} /> Hủy
                </button>
                <button className={styles.btnSave} onClick={handleSaveProfile} disabled={saving}>
                  {saving ? <><span className={styles.miniSpinner} /> Đang lưu...</> : <><Save size={15} /> Lưu</>}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className={styles.statsStrip}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}><Shield size={18} /></div>
          <div>
            <div className={styles.statLabel}>Quyền truy cập</div>
            <div className={styles.statValue}>{getRoleDisplay(profile.role)}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}><CheckCircle size={18} /></div>
          <div>
            <div className={styles.statLabel}>Trạng thái</div>
            <div className={styles.statValue}>{profile.status ? 'Hoạt động' : 'Vô hiệu'}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconAmber}`}><Coins size={18} /></div>
          <div>
            <div className={styles.statLabel}>Coin</div>
            <div className={styles.statValue}>
              {profile.coinBalance != null
                ? Number(profile.coinBalance).toLocaleString('vi-VN')
                : '0'}
            </div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconPurple}`}><Calendar size={18} /></div>
          <div>
            <div className={styles.statLabel}>Ngày sinh</div>
            <div className={styles.statValue}>{formatDate(profile.dateOfBirth) || '---'}</div>
          </div>
        </div>
      </div>

      {/* ── Profile + Security ── */}
      <div className={styles.grid}>
        {/* Profile info */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3><User size={16} /> Thông tin cá nhân</h3>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label><User size={13} /> Họ và tên</label>
                {editMode ? (
                  <input
                    type="text"
                    name="fullName"
                    value={editedProfile.fullName || ''}
                    onChange={handleInputChange}
                    placeholder="Nhập họ và tên"
                  />
                ) : (
                  <p>{profile.fullName || '---'}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label><Mail size={13} /> Email <span className={styles.lockTag}><Lock size={9} /></span></label>
                <p className={styles.readonly}>{profile.email || '---'}</p>
              </div>

              <div className={styles.formGroup}>
                <label><Phone size={13} /> Số điện thoại</label>
                {editMode ? (
                  <input
                    type="tel"
                    name="phone"
                    value={editedProfile.phone || ''}
                    onChange={handleInputChange}
                    placeholder="Nhập số điện thoại"
                  />
                ) : (
                  <p>{profile.phone || '---'}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label><Calendar size={13} /> Ngày sinh</label>
                {editMode ? (
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={toInputDate(editedProfile.dateOfBirth)}
                    onChange={handleInputChange}
                  />
                ) : (
                  <p>{formatDate(profile.dateOfBirth) || '---'}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label><MapPin size={13} /> Tỉnh/Thành</label>
                <p className={styles.readonly}>{profile.provinceName || '---'}</p>
              </div>

              <div className={styles.formGroup}>
                <label><MapPin size={13} /> Quận/Huyện</label>
                <p className={styles.readonly}>{profile.districtName || '---'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3><Lock size={16} /> Bảo mật</h3>
          </div>
          <div className={styles.cardBody}>
            {!showChangePassword ? (
              <div className={styles.securityContent}>
                <div className={styles.securityRow}>
                  <div>
                    <div className={styles.securityTitle}>Mật khẩu</div>
                    <div className={styles.securityDesc}>
                      Đổi mật khẩu định kỳ giúp bảo vệ tài khoản
                    </div>
                  </div>
                  <button className={styles.btnSecondary} onClick={() => setShowChangePassword(true)}>
                    <Lock size={13} /> Đổi mật khẩu
                  </button>
                </div>

                <div className={styles.securityNote}>
                  <ShieldCheck size={14} />
                  <span>Đổi mật khẩu sẽ yêu cầu xác thực OTP qua email <strong>{profile.email}</strong></span>
                </div>
              </div>
            ) : (
              <div className={styles.passwordForm}>
                <div className={styles.formGroup}>
                  <label>Mật khẩu mới</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Tối thiểu 8 ký tự, có hoa + thường + số"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>

                <div className={styles.securityNote}>
                  <ShieldCheck size={14} />
                  <span>Sau khi click "Đổi mật khẩu", OTP sẽ được gửi đến email để xác thực</span>
                </div>

                <div className={styles.passwordActions}>
                  <button
                    className={styles.btnCancel}
                    onClick={() => {
                      setShowChangePassword(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    disabled={saving}
                  >
                    Hủy
                  </button>
                  <button className={styles.btnSave} onClick={handleChangePassword} disabled={saving}>
                    {saving ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
