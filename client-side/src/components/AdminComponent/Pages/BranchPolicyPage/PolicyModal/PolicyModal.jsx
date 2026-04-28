import React, { useState, useEffect } from 'react';
import { X, FileText, Building2, AlertTriangle } from 'lucide-react';
import axios from '../../../../../utils/axiosCustomize';
import { toast } from 'react-toastify';
import RichTextEditor from '../../RichTextEditor/RichTextEditor';
import styles from './PolicyModal.module.scss';

const PolicyModal = ({ isOpen, onClose, onSuccess, editingPolicy, branches }) => {
const [formData, setFormData] = useState(() => {
    if (editingPolicy) {
      return {
        templateName: editingPolicy.templateName || '',
        contactId: editingPolicy.branchInfo?.contactID || '',
        tourPriceIncludes: editingPolicy.tourPriceIncludes || '',
        tourPriceExcludes: editingPolicy.tourPriceExcludes || '',
        childPricingNotes: editingPolicy.childPricingNotes || '',
        paymentConditions: editingPolicy.paymentConditions || '',
        registrationConditions: editingPolicy.registrationConditions || '',
        regularDayCancellationRules: editingPolicy.regularDayCancellationRules || '',
        holidayCancellationRules: editingPolicy.holidayCancellationRules || '',
        forceMajeureRules: editingPolicy.forceMajeureRules || '',
        packingList: editingPolicy.packingList || ''
      };
    }
    return {
      templateName: '',
      contactId: '',
      tourPriceIncludes: '',
      tourPriceExcludes: '',
      childPricingNotes: '',
      paymentConditions: '',
      registrationConditions: '',
      regularDayCancellationRules: '',
      holidayCancellationRules: '',
      forceMajeureRules: '',
      packingList: ''
    };
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [allBranches, setAllBranches] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchBranches();
    }
  }, [isOpen]);

useEffect(() => {
    if (editingPolicy) {
      setFormData({
        templateName: editingPolicy.templateName || '',
        contactId: editingPolicy.branchInfo?.contactID || '', 
        tourPriceIncludes: editingPolicy.tourPriceIncludes || '',
        tourPriceExcludes: editingPolicy.tourPriceExcludes || '',
        childPricingNotes: editingPolicy.childPricingNotes || '',
        paymentConditions: editingPolicy.paymentConditions || '',
        registrationConditions: editingPolicy.registrationConditions || '',
        regularDayCancellationRules: editingPolicy.regularDayCancellationRules || '',
        holidayCancellationRules: editingPolicy.holidayCancellationRules || '',
        forceMajeureRules: editingPolicy.forceMajeureRules || '',
        packingList: editingPolicy.packingList || ''
      });
    } else {
      setFormData({
        templateName: '',
        contactId: '',
        tourPriceIncludes: '',
        tourPriceExcludes: '',
        childPricingNotes: '',
        paymentConditions: '',
        registrationConditions: '',
        regularDayCancellationRules: '',
        holidayCancellationRules: '',
        forceMajeureRules: '',
        packingList: ''
      });
    }
    setErrors({});
  }, [editingPolicy]); 

  const fetchBranches = async () => {
    try {
      const res = await axios.get('/admin/branches/simple');
      setAllBranches(res.data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('Không thể tải danh sách chi nhánh');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.templateName.trim()) {
      newErrors.templateName = 'Tên template không được để trống';
    }

    if (!formData.contactId) {
      newErrors.contactId = 'Vui lòng chọn chi nhánh';
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
      const submitData = {
        ...formData,
        contactId: Number(formData.contactId)
      };

      if (editingPolicy) {
        await axios.put(`/admin/policy-templates/${editingPolicy.policyTemplateID}`, submitData);
        toast.success('Cập nhật policy template thành công!');
      } else {
        await axios.post('/admin/policy-templates', submitData);
        toast.success('Tạo policy template thành công!');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving policy:', error);
      const msg = error.response?.data?.message || 'Có lỗi xảy ra';
      toast.error(msg);
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
              <FileText size={24} />
              {editingPolicy ? 'Chỉnh sửa Policy Template' : 'Thêm Policy Template mới'}
            </h2>
            <p>Tạo mẫu chính sách để sử dụng cho các tour</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalBody}>
          {/* Basic Info */}
          <div className={styles.section}>
            <h3>Thông tin cơ bản</h3>
            
            <div className={styles.formGroup}>
              <label>
                Tên Template <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                placeholder="VD: Chính sách tour tiêu chuẩn 2024"
                value={formData.templateName}
                onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                className={errors.templateName ? styles.error : ''}
              />
              {errors.templateName && (
                <span className={styles.errorText}>{errors.templateName}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>
                Chi nhánh <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputGroup}>
                <Building2 size={18} />
                <select
                  value={formData.contactId}
                  onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                  className={errors.contactId ? styles.error : ''}
                >
                  <option value="">-- Chọn chi nhánh --</option>
                  {allBranches.map(branch => (
                    <option key={branch.contactID} value={branch.contactID}>
                      {branch.branchName} {branch.isHeadOffice ? '(Trụ sở chính)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              {errors.contactId && (
                <span className={styles.errorText}>{errors.contactId}</span>
              )}
            </div>
          </div>

          {/* Tour Pricing */}
          <div className={styles.section}>
            <h3>Giá tour</h3>
            
            <div className={styles.formGroup}>
              <label>Giá tour bao gồm</label>
              <RichTextEditor
                value={formData.tourPriceIncludes}
                onChange={(value) => setFormData({ ...formData, tourPriceIncludes: value })}
                placeholder="Nhập các dịch vụ đã bao gồm trong giá tour..."
                height="200px"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Giá tour không bao gồm</label>
              <RichTextEditor
                value={formData.tourPriceExcludes}
                onChange={(value) => setFormData({ ...formData, tourPriceExcludes: value })}
                placeholder="Nhập các dịch vụ không bao gồm trong giá tour..."
                height="200px"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Giá trẻ em</label>
              <RichTextEditor
                value={formData.childPricingNotes}
                onChange={(value) => setFormData({ ...formData, childPricingNotes: value })}
                placeholder="Quy định về giá vé cho trẻ em..."
                height="150px"
              />
            </div>
          </div>

          {/* Payment & Registration */}
          <div className={styles.section}>
            <h3>Thanh toán & Đăng ký</h3>
            
            <div className={styles.formGroup}>
              <label>Điều kiện thanh toán</label>
              <RichTextEditor
                value={formData.paymentConditions}
                onChange={(value) => setFormData({ ...formData, paymentConditions: value })}
                placeholder="Quy định về thanh toán..."
                height="200px"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Điều kiện đăng ký</label>
              <RichTextEditor
                value={formData.registrationConditions}
                onChange={(value) => setFormData({ ...formData, registrationConditions: value })}
                placeholder="Quy định về đăng ký tour..."
                height="200px"
              />
            </div>
          </div>

          {/* Cancellation Rules */}
          <div className={styles.section}>
            <h3>Chính sách hủy tour</h3>
            
            <div className={styles.formGroup}>
              <label>Quy định hủy tour - Ngày thường</label>
              <RichTextEditor
                value={formData.regularDayCancellationRules}
                onChange={(value) => setFormData({ ...formData, regularDayCancellationRules: value })}
                placeholder="Quy định hủy tour trong ngày thường..."
                height="200px"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Quy định hủy tour - Ngày lễ/Tết</label>
              <RichTextEditor
                value={formData.holidayCancellationRules}
                onChange={(value) => setFormData({ ...formData, holidayCancellationRules: value })}
                placeholder="Quy định hủy tour trong ngày lễ, Tết..."
                height="200px"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Quy định về bất khả kháng</label>
              <RichTextEditor
                value={formData.forceMajeureRules}
                onChange={(value) => setFormData({ ...formData, forceMajeureRules: value })}
                placeholder="Quy định khi có sự cố bất khả kháng..."
                height="200px"
              />
            </div>
          </div>

          {/* Packing List */}
          <div className={styles.section}>
            <h3>Hành lý</h3>
            
            <div className={styles.formGroup}>
              <label>Danh sách đồ cần mang theo</label>
              <RichTextEditor
                value={formData.packingList}
                onChange={(value) => setFormData({ ...formData, packingList: value })}
                placeholder="Liệt kê các vật dụng cần thiết cho tour..."
                height="250px"
              />
            </div>
          </div>

          {/* Warning */}
          <div className={styles.warningBox}>
            <AlertTriangle size={20} />
            <div>
              <strong>Lưu ý:</strong>
              <p>Policy template này sẽ được sử dụng cho các tour. Hãy kiểm tra kỹ trước khi lưu.</p>
            </div>
          </div>

          {/* Actions */}
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
              {loading ? 'Đang xử lý...' : (editingPolicy ? 'Cập nhật' : 'Tạo template')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PolicyModal;