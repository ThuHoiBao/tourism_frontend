import React, { useState, useEffect } from 'react';
import { X, Building2, Phone, Mail, MapPin, Award } from 'lucide-react';
import axios from '../../../../../utils/axiosCustomize';
import { toast } from 'react-toastify';
import styles from './BranchModal.module.scss';

const BranchModal = ({ isOpen, onClose, onSuccess, editingBranch }) => {
  const [formData, setFormData] = useState({
    branchName: '',
    phone: '',
    email: '',
    address: '',
    isHeadOffice: false
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingBranch) {
      setFormData({
        branchName: editingBranch.branchName || '',
        phone: editingBranch.phone || '',
        email: editingBranch.email || '',
        address: editingBranch.address || '',
        isHeadOffice: editingBranch.isHeadOffice || false
      });
    } else {
      setFormData({
        branchName: '',
        phone: '',
        email: '',
        address: '',
        isHeadOffice: false
      });
    }
    setErrors({});
  }, [editingBranch, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.branchName.trim()) {
      newErrors.branchName = 'Tên chi nhánh không được để trống';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Số điện thoại không được để trống';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Địa chỉ không được để trống';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin!');
      return;
    }

    setLoading(true);
    try {
      if (editingBranch) {
        await axios.put(`/admin/branches/${editingBranch.contactID}`, formData);
        toast.success('Cập nhật chi nhánh thành công!');
      } else {
        await axios.post('/admin/branches', formData);
        toast.success('Tạo chi nhánh thành công!');
      }
      onSuccess();
      onClose();
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 400:
            if (data.message) {
              toast.error(data.message);
            } else if (data.errors) {
              const errorMessages = Object.values(data.errors);
              if (errorMessages.length > 0) {
                toast.error(errorMessages[0]); 
              } else {
                toast.error('Dữ liệu không hợp lệ!');
              }
            } else {
              toast.error('Dữ liệu không hợp lệ!');
            }
            break;
            
          case 409:
            toast.error(data.message || 'Chi nhánh đã tồn tại!');
            break;
            
          case 404:
            toast.error('Không tìm thấy chi nhánh!');
            break;
            
          case 403:
            toast.error('Bạn không có quyền thực hiện thao tác này!');
            break;
            
          case 401:
            toast.error('Phiên đăng nhập đã hết hạn!');
            break;
            
          case 500:
            toast.error('Lỗi server! Vui lòng thử lại sau.');
            break;
            
          default:
            toast.error(data.message || 'Có lỗi xảy ra, vui lòng thử lại!');
        }
      } else if (error.request) {
        toast.error('Không thể kết nối đến server!');
      } else {
        toast.error('Có lỗi xảy ra, vui lòng thử lại!');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2>
              <Building2 size={24} />
              {editingBranch ? 'Chỉnh sửa chi nhánh' : 'Thêm chi nhánh mới'}
            </h2>
            <p>Nhập thông tin liên hệ của chi nhánh</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} type="button">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          <div className={styles.formGroup}>
            <label>
              Tên chi nhánh <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputGroup}>
              <Building2 size={18} />
              <input
                type="text"
                placeholder="VD: Chi nhánh Hà Nội"
                value={formData.branchName}
                onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                className={errors.branchName ? styles.error : ''}
              />
            </div>
            {errors.branchName && (
              <span className={styles.errorText}>{errors.branchName}</span>
            )}
          </div>

          <div className={styles.row2}>
            <div className={styles.formGroup}>
              <label>
                Số điện thoại <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputGroup}>
                <Phone size={18} />
                <input
                  type="tel"
                  placeholder="0123456789"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={errors.phone ? styles.error : ''}
                />
              </div>
              {errors.phone && (
                <span className={styles.errorText}>{errors.phone}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>
                Email <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputGroup}>
                <Mail size={18} />
                <input
                  type="email"
                  placeholder="branch@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={errors.email ? styles.error : ''}
                />
              </div>
              {errors.email && (
                <span className={styles.errorText}>{errors.email}</span>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>
              Địa chỉ <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputGroup}>
              <MapPin size={18} />
              <textarea
                rows="3"
                placeholder="Nhập địa chỉ đầy đủ..."
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={errors.address ? styles.error : ''}
              />
            </div>
            {errors.address && (
              <span className={styles.errorText}>{errors.address}</span>
            )}
          </div>

          <div className={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                checked={formData.isHeadOffice}
                onChange={(e) => setFormData({ ...formData, isHeadOffice: e.target.checked })}
              />
              <div className={styles.checkboxLabel}>
                <Award size={18} />
                <div>
                  <strong>Đây là trụ sở chính</strong>
                  <span>Đánh dấu nếu đây là văn phòng trung tâm của công ty</span>
                </div>
              </div>
            </label>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={styles.btnSubmit}
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : (editingBranch ? 'Cập nhật' : 'Tạo chi nhánh')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default BranchModal;