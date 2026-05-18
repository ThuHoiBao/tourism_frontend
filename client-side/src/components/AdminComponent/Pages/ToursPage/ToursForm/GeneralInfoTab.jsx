import React, { useState } from 'react';
import { MapPin, Clock, Plane } from 'lucide-react';
import axios from '../../../../../utils/axiosCustomize';
import styles from './TabStyles.module.scss';

const GeneralInfoTab = ({ formData, setFormData, locations, errors, setErrors }) => {
  const [checking, setChecking] = useState(false);

  const handleChange = (field, value) => {
    setFormData(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: null }));
  };

  const checkTourCode = async (code) => {
    if (!code || code.length < 3) return;
    setChecking(true);
    try {
      const res = await axios.get('/admin/tours/check-code', { params: { tourCode: code } });
      if (res.data.exists) {
        setErrors(p => ({ ...p, tourCode: 'Mã tour đã tồn tại' }));
      } else {
        setErrors(p => ({ ...p, tourCode: null }));
      }
    } catch {
      // silent
    } finally {
      setChecking(false);
    }
  };

  const handleTourCodeChange = (value) => {
    const upper = value.toUpperCase();
    handleChange('tourCode', upper);
    clearTimeout(window._tourCodeTimer);
    window._tourCodeTimer = setTimeout(() => checkTourCode(upper), 500);
  };

  return (
    <div className={styles.tabContainer}>
      <div className={styles.section}>
        <h3>Thông tin cơ bản</h3>
        <div className={styles.row2}>
          <div className={styles.formGroup}>
            <label>Tên Tour <span className={styles.required}>*</span></label>
            <input type="text" value={formData.tourName}
              onChange={e => handleChange('tourName', e.target.value)}
              className={errors.tourName ? styles.error : ''}
              placeholder="VD: Tour Hà Nội - Đà Nẵng 3 ngày 2 đêm" />
            {errors.tourName && <span className={styles.errorText}>{errors.tourName}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Mã Tour <span className={styles.required}>*</span></label>
            <input type="text" value={formData.tourCode}
              onChange={e => handleTourCodeChange(e.target.value)}
              className={errors.tourCode ? styles.error : ''}
              placeholder="VD: HN-DN-001" />
            {checking && <span className={styles.infoText}>Đang kiểm tra...</span>}
            {errors.tourCode && <span className={styles.errorText}>{errors.tourCode}</span>}
          </div>
        </div>

        <div className={styles.row2}>
          <div className={styles.formGroup}>
            <label>Thời gian <span className={styles.required}>*</span></label>
            <div className={styles.inputGroup}>
              <Clock size={16} />
              <input type="text" value={formData.duration}
                onChange={e => handleChange('duration', e.target.value)}
                className={errors.duration ? styles.error : ''}
                placeholder="VD: 3 ngày 2 đêm" />
            </div>
            {errors.duration && <span className={styles.errorText}>{errors.duration}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Phương tiện <span className={styles.required}>*</span></label>
            <div className={styles.inputGroup}>
              <Plane size={16} />
              <input type="text" value={formData.transportation}
                onChange={e => handleChange('transportation', e.target.value)}
                placeholder="VD: Máy bay, Xe du lịch" />
            </div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h3>Thông tin địa điểm</h3>
        <div className={styles.row2}>
          <div className={styles.formGroup}>
            <label>Điểm khởi hành <span className={styles.required}>*</span></label>
            <div className={styles.inputGroup}>
              <MapPin size={16} />
              <select value={formData.startLocationId}
                onChange={e => handleChange('startLocationId', e.target.value)}
                className={errors.startLocationId ? styles.error : ''}>
                <option value="">-- Chọn điểm khởi hành --</option>
                {locations.map(loc => (
                  <option key={loc.locationID} value={String(loc.locationID)}>{loc.name}</option>
                ))}
              </select>
            </div>
            {errors.startLocationId && <span className={styles.errorText}>{errors.startLocationId}</span>}
          </div>

          <div className={styles.formGroup}>
            <label>Điểm đến <span className={styles.required}>*</span></label>
            <div className={styles.inputGroup}>
              <MapPin size={16} />
              <select value={formData.endLocationId}
                onChange={e => handleChange('endLocationId', e.target.value)}
                className={errors.endLocationId ? styles.error : ''}>
                <option value="">-- Chọn điểm đến --</option>
                {locations.map(loc => (
                  <option key={loc.locationID} value={String(loc.locationID)}>{loc.name}</option>
                ))}
              </select>
            </div>
            {errors.endLocationId && <span className={styles.errorText}>{errors.endLocationId}</span>}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Điểm tham quan <span className={styles.required}>*</span></label>
          <textarea rows={4} value={formData.attractions}
            onChange={e => handleChange('attractions', e.target.value)}
            placeholder="Mô tả các điểm tham quan..." />
          {errors.attractions && <span className={styles.errorText}>{errors.attractions}</span>}
        </div>
      </div>

      <div className={styles.section}>
        <h3>Thông tin bổ sung</h3>
        <div className={styles.row2}>
          <div className={styles.formGroup}>
            <label>Bữa ăn</label>
            <input type="text" value={formData.meals}
              onChange={e => handleChange('meals', e.target.value)}
              placeholder="VD: Ăn sáng buffet, trưa, tối" />
          </div>
          <div className={styles.formGroup}>
            <label>Thời điểm lý tưởng</label>
            <input type="text" value={formData.idealTime}
              onChange={e => handleChange('idealTime', e.target.value)}
              placeholder="VD: Quanh năm, mùa hè" />
          </div>
        </div>
        <div className={styles.row2}>
          <div className={styles.formGroup}>
            <label>Phương tiện di chuyển</label>
            <input type="text" value={formData.tripTransportation}
              onChange={e => handleChange('tripTransportation', e.target.value)}
              placeholder="VD: Xe du lịch điều hòa" />
          </div>
          <div className={styles.formGroup}>
            <label>Khách hàng phù hợp</label>
            <input type="text" value={formData.suitableCustomer}
              onChange={e => handleChange('suitableCustomer', e.target.value)}
              placeholder="VD: Gia đình, cặp đôi" />
          </div>
        </div>
        <div className={styles.formGroup}>
          <label>Khách sạn</label>
          <input type="text" value={formData.hotel}
            onChange={e => handleChange('hotel', e.target.value)}
            placeholder="VD: Khách sạn 4 sao tiêu chuẩn quốc tế" />
        </div>
        <div className={styles.checkboxGroup}>
          <label>
            <input type="checkbox" checked={formData.status}
              onChange={e => handleChange('status', e.target.checked)} />
            <span>Kích hoạt tour (hiển thị trên website)</span>
          </label>
        </div>
      </div>
    </div>
  );
};

export default GeneralInfoTab;
