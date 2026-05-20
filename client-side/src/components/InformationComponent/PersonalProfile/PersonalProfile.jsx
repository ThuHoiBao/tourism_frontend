import React, { useState, useMemo, useEffect } from 'react';
import { Mail, Phone, Save, UserRound, Cake, Coins } from 'lucide-react';
import { toast } from 'react-toastify';
import { updateUserApi } from '../../../services/user/user.ts';
import { useAuth } from '../../../context/AuthContext.jsx';
import styles from './PersonalProfile.module.scss';

const DEFAULT_AVATAR =
    'https://th.bing.com/th/id/OIP.KMh7jiRqiGInQryreHc-UwHaHa?w=180&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3';

const PersonalProfile = ({ isSidebarVersion = false }) => {
    const { user, updateUser } = useAuth();
    const userData = user?.data || user;

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        day: '',
        month: '',
        year: '',
    });
    const [loading, setLoading] = useState(false);
    const [phoneError, setPhoneError] = useState('');

    const email = userData?.email || '';
    const userID = userData?.userId || userData?.userID || userData?.id;

    const loyaltyPoints = useMemo(() => {
        return userData?.coinBalance || 0;
    }, [userData?.coinBalance]);

    const formatNumber = (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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
                year: date.getFullYear().toString(),
            };
        } catch (error) {
            console.error('Error parsing date:', error);
            return { day: '', month: '', year: '' };
        }
    }, [userData?.dateOfBirth]);

    useEffect(() => {
        if (userData) {
            setFormData({
                fullName: userData.fullName || userData.fullname || '',
                phone: userData.phone || userData.phoneNumber || userData.phone_number || '',
                day: parsedDate.day,
                month: parsedDate.month,
                year: parsedDate.year,
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
            } else {
                setPhoneError('');
            }

            setFormData(prev => ({
                ...prev,
                [field]: numericValue,
            }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
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
                    : userData?.dateOfBirth,
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
        <aside className={`${styles.personalProfile} ${!isSidebarVersion ? styles.fullWidth : ''}`}>
            <div className={styles.sectionHeader}>
                <div className={styles.accountAvatarFrame}>
                    <img
                        src={userData?.avatar || DEFAULT_AVATAR}
                        alt={formData.fullName || 'Ảnh đại diện'}
                        className={styles.accountAvatar}
                    />
                </div>
                <div>
                    <p className={styles.eyebrow}>Tài khoản</p>
                    <h2 className={styles.sectionTitle}>Thông tin cá nhân</h2>
                </div>
            </div>

            <div className={styles.loyaltyPoints}>
                <div className={styles.loyaltyIcon}>
                    <Coins size={20} />
                </div>
                <div>
                    <strong>{formatNumber(loyaltyPoints)} điểm</strong>
                    <span>Điểm cá nhân khả dụng</span>
                </div>
            </div>

            <div className={styles.formBody}>
                <div className={styles.formGroup}>
                    <label className={styles.label}>
                        <UserRound size={16} /> Họ và tên
                    </label>
                    <input
                        type="text"
                        className={styles.input}
                        value={formData.fullName}
                        onChange={(event) => handleInputChange('fullName', event.target.value)}
                        placeholder="Nhập họ và tên"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>
                        <Phone size={16} /> Số điện thoại
                    </label>
                    <input
                        type="text"
                        className={`${styles.input} ${phoneError ? styles.inputError : ''}`}
                        value={formData.phone}
                        onChange={(event) => handleInputChange('phone', event.target.value)}
                        placeholder="Nhập 10 chữ số"
                        maxLength={10}
                    />
                    {phoneError && (
                        <p className={styles.errorText}>{phoneError}</p>
                    )}
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>
                        <Cake size={16} /> Ngày sinh
                    </label>
                    <div className={styles.dateInputs}>
                        <select
                            className={styles.dateSelect}
                            value={formData.day}
                            onChange={(event) => handleInputChange('day', event.target.value)}
                        >
                            <option value="">Ngày</option>
                            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                <option key={day} value={day.toString()}>{day}</option>
                            ))}
                        </select>
                        <select
                            className={styles.dateSelect}
                            value={formData.month}
                            onChange={(event) => handleInputChange('month', event.target.value)}
                        >
                            <option value="">Tháng</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                                <option key={month} value={month.toString()}>{month}</option>
                            ))}
                        </select>
                        <select
                            className={styles.dateSelect}
                            value={formData.year}
                            onChange={(event) => handleInputChange('year', event.target.value)}
                        >
                            <option value="">Năm</option>
                            {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                <option key={year} value={year.toString()}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.formGroup}>
                    <label className={styles.label}>
                        <Mail size={16} /> Email
                    </label>
                    <input
                        type="email"
                        className={`${styles.input} ${styles.inputReadOnly}`}
                        value={email}
                        readOnly
                    />
                    <p className={styles.helperText}>Email không thể thay đổi.</p>
                </div>
            </div>

            <div className={styles.buttonGroup}>
                <button
                    className={styles.buttonPrimary}
                    onClick={handleSave}
                    disabled={loading}
                    type="button"
                >
                    <Save size={17} /> {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
            </div>
        </aside>
    );
};

export default PersonalProfile;
