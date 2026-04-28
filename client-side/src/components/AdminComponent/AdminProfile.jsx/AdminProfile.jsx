import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, MapPin, Shield, Camera, Save, X, Lock } from 'lucide-react';
import styles from './AdminProfile.module.scss';
import axios from '../../..//utils/axiosCustomize';
import { toast } from 'react-toastify';

const AdminProfile = () => {
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    role: '',
    avatar: '',
    provinceCode: '',
    provinceName: '',
    districtCode: '',
    districtName: ''
  });

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

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/auth/profile');
      
      if (response.data.success || response.data) {
        const userData = response.data.data || response.data;
        setProfile(userData);
        setEditedProfile(userData);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Không thể tải thông tin cá nhân');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 5MB');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);

      // Upload avatar if changed
      let avatarUrl = editedProfile.avatar;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);

        // Assuming you have an upload endpoint
        const uploadResponse = await axios.post('/admin/upload/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        avatarUrl = uploadResponse.data.url;
      }

      // Update profile
      const updateData = {
        fullName: editedProfile.fullName,
        phone: editedProfile.phone,
        dateOfBirth: editedProfile.dateOfBirth,
        provinceCode: editedProfile.provinceCode,
        provinceName: editedProfile.provinceName,
        districtCode: editedProfile.districtCode,
        districtName: editedProfile.districtName,
        avatar: avatarUrl
      };

      const response = await axios.put('/admin/profile/update', updateData);

      if (response.data.success) {
        setProfile({ ...profile, ...updateData });
        
        // Update localStorage
        const adminUser = JSON.parse(localStorage.getItem('adminUser'));
        localStorage.setItem('adminUser', JSON.stringify({
          ...adminUser,
          fullName: updateData.fullName,
          avatar: avatarUrl
        }));

        toast.success('Cập nhật thông tin thành công');
        setEditMode(false);
        setAvatarFile(null);
        setAvatarPreview(null);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật thông tin');
    } finally {
      setLoading(false);
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
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.put('/admin/profile/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.data.success) {
        toast.success('Đổi mật khẩu thành công');
        setShowChangePassword(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error(error.response?.data?.message || 'Không thể đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplay = (role) => {
    const roleMap = {
      'ADMIN': 'Quản trị viên',
      'STAFF': 'Nhân viên',
      'USER': 'Người dùng'
    };
    return roleMap[role] || role;
  };

  const getInitials = (name) => {
    if (!name) return 'AD';
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading && !profile.email) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Đang tải thông tin...</p>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <div className={styles.header}>
        <h1>Thông tin cá nhân</h1>
        <div className={styles.headerActions}>
          {!editMode ? (
            <button 
              className={styles.btnEdit}
              onClick={() => setEditMode(true)}
            >
              <User size={18} />
              Chỉnh sửa
            </button>
          ) : (
            <>
              <button 
                className={styles.btnCancel}
                onClick={handleCancelEdit}
                disabled={loading}
              >
                <X size={18} />
                Hủy
              </button>
              <button 
                className={styles.btnSave}
                onClick={handleSaveProfile}
                disabled={loading}
              >
                <Save size={18} />
                {loading ? 'Đang lưu...' : 'Lưu'}
              </button>
            </>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {/* Avatar Section */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatar}>
              {avatarPreview || profile.avatar ? (
                <img src={avatarPreview || profile.avatar} alt="Avatar" />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {getInitials(profile.fullName)}
                </div>
              )}
            </div>
            {editMode && (
              <label className={styles.avatarUpload}>
                <Camera size={20} />
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleAvatarChange}
                  hidden
                />
              </label>
            )}
          </div>
          <div className={styles.avatarInfo}>
            <h2>{profile.fullName || 'Admin'}</h2>
            <div className={styles.roleBadge}>
              <Shield size={14} />
              {getRoleDisplay(profile.role)}
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className={styles.infoSection}>
          <h3>Thông tin cơ bản</h3>
          
          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label>
                <User size={16} />
                Họ và tên
              </label>
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
              <label>
                <Mail size={16} />
                Email
              </label>
              <p className={styles.readonly}>{profile.email || '---'}</p>
            </div>

            <div className={styles.formGroup}>
              <label>
                <Phone size={16} />
                Số điện thoại
              </label>
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
              <label>
                <Calendar size={16} />
                Ngày sinh
              </label>
              {editMode ? (
                <input
                  type="date"
                  name="dateOfBirth"
                  value={editedProfile.dateOfBirth || ''}
                  onChange={handleInputChange}
                />
              ) : (
                <p>{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('vi-VN') : '---'}</p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>
                <MapPin size={16} />
                Tỉnh/Thành phố
              </label>
              {editMode ? (
                <input
                  type="text"
                  name="provinceName"
                  value={editedProfile.provinceName || ''}
                  onChange={handleInputChange}
                  placeholder="Nhập tỉnh/thành phố"
                />
              ) : (
                <p>{profile.provinceName || '---'}</p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>
                <MapPin size={16} />
                Quận/Huyện
              </label>
              {editMode ? (
                <input
                  type="text"
                  name="districtName"
                  value={editedProfile.districtName || ''}
                  onChange={handleInputChange}
                  placeholder="Nhập quận/huyện"
                />
              ) : (
                <p>{profile.districtName || '---'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className={styles.securitySection}>
          <h3>Bảo mật</h3>
          
          {!showChangePassword ? (
            <button 
              className={styles.btnChangePassword}
              onClick={() => setShowChangePassword(true)}
            >
              <Lock size={18} />
              Đổi mật khẩu
            </button>
          ) : (
            <div className={styles.changePasswordForm}>
              <div className={styles.formGroup}>
                <label>Mật khẩu hiện tại</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Mật khẩu mới</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>

              <div className={styles.passwordActions}>
                <button 
                  className={styles.btnCancel}
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  disabled={loading}
                >
                  Hủy
                </button>
                <button 
                  className={styles.btnSave}
                  onClick={handleChangePassword}
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;