import React, { useState, useMemo, useEffect } from 'react';
import styles from './PersonalProfile.module.scss';
import { updateUserApi } from '../../../services/user/user.ts';
import { useAuth } from '../../../context/AuthContext.jsx';
import { FaUser, FaPhone, FaBirthdayCake, FaEnvelope, FaCoins } from 'react-icons/fa';
import { toast } from 'react-toastify';

const PersonalProfile = ({ isSidebarVersion = false }) => {
    const { user, updateUser } = useAuth();
    
    const userData = user?.data || user;
    
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        day: '',
        month: '',
        year: ''
    });
    const [loading, setLoading] = useState(false);
    
    const [phoneError, setPhoneError] = useState('');
    
    const email = userData?.email || '';
    const userID = userData?.userId || userData?.id;
    
    // Calculate points (use coinBalance from user data)
    const loyaltyPoints = useMemo(() => {
        return userData?.coinBalance || 0;
    }, [userData?.coinBalance]);

    // Format number with thousand separators
    const formatNumber = (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };
    
    const parsedDate = useMemo(() => {
        const dateOfBirth = userData?.dateOfBirth || '';
        if (!dateOfBirth) {
            return { day: '', month: '', year: '' };
        }
        
        try {
            const date = new Date(dateOfBirth);
            if (isNaN(date.getTime())) {
                return { day: '', month: '', year: '' };
            }
            
            return {
                day: date.getDate().toString(),
                month: (date.getMonth() + 1).toString(), 
                year: date.getFullYear().toString()
            };
        } catch (error) {
            console.error('Error parsing date:', error);
            return { day: '', month: '', year: '' };
        }
    }, [userData?.dateOfBirth]); 
    
    useEffect(() => {
        if (userData) {
            console.log('PersonalProfile userData:', userData);
            console.log('Phone value:', userData.phone, userData.phoneNumber, userData.phone_number);
            setFormData({
                fullName: userData.fullName || userData.fullname || '',
                phone: userData.phone || userData.phoneNumber || userData.phone_number || '',
                day: parsedDate.day,
                month: parsedDate.month,
                year: parsedDate.year
            });
        }
    }, [userData, parsedDate]); 
    
    const handleInputChange = (field, value) => {
        if (field === 'phone') {
            const numericValue = value.replace(/\D/g, '');
            
            if (numericValue.length > 10) {
                setPhoneError('Số điện thoại chỉ được nhập tối đa 10 chữ số');
                return;
            }
            
            if (numericValue.length > 0 && numericValue.length < 10) {
                setPhoneError('Số điện thoại phải có đúng 10 chữ số');
            } else if (numericValue.length === 10) {
                setPhoneError(''); 
            } else {
                setPhoneError(''); 
            }
            
            setFormData(prev => ({
                ...prev,
                [field]: numericValue
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };
    
    const handleSave = async () => {
        try {
            setLoading(true);

            if (formData.phone && formData.phone.length !== 10) {
                setPhoneError('Số điện thoại phải có đúng 10 chữ số');
                setLoading(false);
                return;
            }

            const formDataPayload = new FormData();
            
            if (formData.fullName) {
                formDataPayload.append('fullName', formData.fullName);
            }
            
            if (formData.phone) {
                formDataPayload.append('phone', formData.phone);
            }

            if (formData.day && formData.month && formData.year) {
                const year = formData.year;
                const month = formData.month.padStart(2, '0');
                const day = formData.day.padStart(2, '0');
                const dateOfBirth = `${year}-${month}-${day}`;
                formDataPayload.append('dateOfBirth', dateOfBirth);
            }

            await updateUserApi(userID, formDataPayload);

            updateUser({
                fullName: formData.fullName,
                phone: formData.phone,
                dateOfBirth: formData.day && formData.month && formData.year 
                    ? `${formData.year}-${formData.month.padStart(2, '0')}-${formData.day.padStart(2, '0')}`
                    : userData?.dateOfBirth
            });
            toast.success('Cập nhật thông tin thành công!');

        } catch (error) {
            console.error('Error updating user:', error);
            
            const errorMessage = error.response?.data?.message 
                || error.response?.data?.error
                || 'Có lỗi xảy ra khi cập nhật thông tin.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    
    if (!userData) {
        return (
            <div className={styles.personalProfile}>
                <div className={styles.loading}>Đang tải thông tin...</div>
            </div>
        );
    }

    return (
        <div className={styles.personalProfile}>
            {!isSidebarVersion && (
                <>
                    {/* Profile Header - chỉ hiển thị khi không phải sidebar */}
                    <div className={styles.profileHeader}>
                        <div className={styles.cover}>
                            <div className={styles.coverDecor} />
                        </div>
                        <div className={styles.headerContent}>
                            <div className={styles.avatarWrap}>
                                <img
                                    src={userData?.avatar || 'https://images.unsplash.com/photo-1544723795-3fb6469f0f34?q=80&w=200&h=200&fit=crop&auto=format&dpr=2'}
                                    alt={userData?.fullName || 'User avatar'}
                                    className={styles.avatar}
                                />
                            </div>
                            <div className={styles.identity}>
                                <h1 className={styles.displayName}>{userData?.fullName || 'Người dùng'}</h1>
                                <p className={styles.subtitle}>Khách hàng • Future Travel</p>
                            </div>
                            <div className={styles.headerActions}>
                                <button className={styles.editBtn} onClick={() => {}}>
                                    Chỉnh sửa hồ sơ
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Success/Error Messages replaced by toast notifications */}
                </>
            )}

            {/* Personal Stats Section - Thống kê cá nhân */}

            {/* Sidebar message replaced by toast notifications */}
            
            {/* Thông tin cá nhân */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <FaUser /> Thông tin cá nhân
                </h2>
                <div className={styles.loyaltyPoints}>
                    <FaCoins /> {formatNumber(loyaltyPoints)} điểm
                </div>
                
                <div className={styles.formGroup}>
                    <label className={styles.label}>
                        <FaUser /> Họ và tên
                    </label>
                    <input
                        type="text"
                        className={styles.input}
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        placeholder="Nhập họ và tên"
                    />

                </div>
                
                <div className={styles.formGroup}>
                    <label className={styles.label}>
                        <FaPhone /> Số điện thoại
                    </label>
                    <input
                        type="text"
                        className={`${styles.input} ${phoneError ? styles.inputError : ''}`}
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="Nhập 10 chữ số"
                        maxLength={10}
                    />
                    {phoneError && (
                        <p className={styles.errorText}>{phoneError}</p>
                    )}
                </div>
                
                <div className={styles.formGroup}>
                    <label className={styles.label}>
                        <FaBirthdayCake /> Ngày sinh
                    </label>
                    <div className={styles.dateInputs}>
                        <select 
                            className={styles.dateSelect} 
                            value={formData.day}
                            onChange={(e) => handleInputChange('day', e.target.value)}
                        >
                            <option value="">Ngày</option>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                                <option key={d} value={d.toString()}>{d}</option>
                            ))}
                        </select>
                        <select 
                            className={styles.dateSelect} 
                            value={formData.month}
                            onChange={(e) => handleInputChange('month', e.target.value)}
                        >
                            <option value="">Tháng</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m.toString()}>{m}</option>
                            ))}
                        </select>
                        <select 
                            className={styles.dateSelect} 
                            value={formData.year}
                            onChange={(e) => handleInputChange('year', e.target.value)}
                        >
                            <option value="">Năm</option>
                            {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                <option key={y} value={y.toString()}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className={styles.formGroup}>
                        <label className={styles.label}>
                            <FaEnvelope /> Email
                        </label>
                        <input
                            type="email"
                            className={`${styles.input} ${styles.inputReadOnly}`}
                            value={email}
                            readOnly
                        />
                        <p className={styles.helperText}>
                            Email không thể thay đổi
                        </p>
                    </div>
            </div>
        
            {/* Action Buttons */}
            <div className={styles.buttonGroup}>
                <button 
                    className={styles.buttonPrimary}
                    onClick={handleSave}
                    disabled={loading}
                >
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
            </div>
        </div>
    );
};

export default PersonalProfile;