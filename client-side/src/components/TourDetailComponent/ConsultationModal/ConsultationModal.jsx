import React, { useState, useEffect } from 'react';
import { FaCheck, FaMapMarkerAlt, FaPhoneAlt, FaUser, FaEnvelope, FaComment, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from '../../../utils/axiosCustomize';
import { useAuth } from '../../../context/AuthContext';
import styles from './ConsultationModal.module.scss';

/**
 * Modal "Gửi thông tin tư vấn" — mở khi user click nút phone trên TourDetail.
 * Cho phép cả guest (chưa đăng nhập) gửi yêu cầu.
 */
const ConsultationModal = ({ tourId, tourCode, tourName, isOpen, onClose }) => {
    const { user } = useAuth();
    const [form, setForm] = useState({
        fullName: '', phone: '', email: '', consultationInfo: '',
    });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(null);

    // Prefill khi user đăng nhập
    useEffect(() => {
        if (!isOpen) return;
        setForm({
            fullName: user?.fullName || '',
            phone: user?.phoneNumber || '',
            email: user?.email || '',
            consultationInfo: '',
        });
        setErrors({});
        setSubmitted(null);
    }, [isOpen, user]);

    // Lock body scroll khi modal mở
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = ''; };
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const validate = () => {
        const e = {};
        if (!form.fullName.trim()) e.fullName = 'Vui lòng nhập họ tên';
        if (!form.phone.trim()) {
            e.phone = 'Vui lòng nhập số điện thoại';
        } else if (!/^(0|\+84)\d{9,10}$/.test(form.phone.trim())) {
            e.phone = 'Số điện thoại không hợp lệ (VD: 0901234567)';
        }
        if (!form.email.trim()) {
            e.email = 'Vui lòng nhập email';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            e.email = 'Email không hợp lệ';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        try {
            const res = await axios.post('/consultations', {
                fullName: form.fullName.trim(),
                phone: form.phone.trim(),
                email: form.email.trim(),
                tourId, tourCode, tourName,
                consultationInfo: form.consultationInfo.trim() || null,
            });
            setSubmitted({ requestCode: res.data?.data?.requestCode || '' });
        } catch (err) {
            const msg = err.response?.data?.message;
            if (err.response?.status === 429) {
                toast.warn(msg || 'Bạn đã gửi quá nhiều yêu cầu. Thử lại sau.');
            } else {
                toast.error(msg || 'Gửi yêu cầu thất bại. Vui lòng thử lại.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
                    <FaTimes />
                </button>

                {submitted ? (
                    <div className={styles.successView}>
                        <div className={styles.successIcon}><FaCheck /></div>
                        <h3>Cảm ơn quý khách!</h3>
                        <p className={styles.successText}>
                            Mã yêu cầu của bạn: <strong>{submitted.requestCode}</strong>
                        </p>
                        <p className={styles.successText}>
                            Chúng tôi sẽ liên hệ lại trong vòng 30 phút.
                        </p>
                        <button className={styles.submitBtn} onClick={onClose}>Đóng</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <h2 className={styles.title}>Gửi thông tin tư vấn</h2>
                        <p className={styles.subtitle}>
                            Quý khách vui lòng nhập thông tin bên dưới, chúng tôi sẽ liên hệ lại sau ít phút
                        </p>

                        {tourName && (
                            <div className={styles.tourHint}>
                                <FaMapMarkerAlt /> Tour: <strong>{tourName}</strong>
                            </div>
                        )}

                        <div className={styles.field}>
                            <label>Họ tên <span className={styles.required}>(*)</span></label>
                            <div className={styles.inputWrap}>
                                <FaUser className={styles.inputIcon} />
                                <input
                                    type="text" name="fullName" placeholder="Ví dụ: Nguyễn Văn A"
                                    value={form.fullName} onChange={handleChange}
                                    className={errors.fullName ? styles.inputError : ''}
                                />
                            </div>
                            {errors.fullName && <span className={styles.errorText}>{errors.fullName}</span>}
                        </div>

                        <div className={styles.field}>
                            <label>Điện thoại <span className={styles.required}>(*)</span></label>
                            <div className={styles.inputWrap}>
                                <FaPhoneAlt className={styles.inputIcon} />
                                <input
                                    type="tel" name="phone" placeholder="Ví dụ: 0901234567 / +84901234567"
                                    value={form.phone} onChange={handleChange}
                                    className={errors.phone ? styles.inputError : ''}
                                />
                            </div>
                            {errors.phone && <span className={styles.errorText}>{errors.phone}</span>}
                        </div>

                        <div className={styles.field}>
                            <label>Email <span className={styles.required}>(*)</span></label>
                            <div className={styles.inputWrap}>
                                <FaEnvelope className={styles.inputIcon} />
                                <input
                                    type="email" name="email" placeholder="Ví dụ: email@example.com"
                                    value={form.email} onChange={handleChange}
                                    className={errors.email ? styles.inputError : ''}
                                />
                            </div>
                            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
                        </div>

                        <div className={styles.field}>
                            <label>Thông tin cần tư vấn</label>
                            <div className={styles.inputWrap}>
                                <FaComment className={styles.inputIcon} style={{ top: 14 }} />
                                <textarea
                                    name="consultationInfo" rows="3"
                                    placeholder="Quý khách cần tư vấn về vấn đề gì?"
                                    value={form.consultationInfo} onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <button type="submit" disabled={submitting} className={styles.submitBtn}>
                                {submitting ? 'Đang gửi...' : 'Gửi ngay'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ConsultationModal;
