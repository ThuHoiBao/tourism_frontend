import React, { useState, useMemo } from 'react';
import {
  MapPin, Clock, Plane, Tag, FileText, Compass, Utensils, Sun,
  Bus, Users, Hotel, Globe2, CheckCircle2, AlertCircle, Loader2,
  Eye, EyeOff
} from 'lucide-react';
import axios from '../../../../../utils/axiosCustomize';
import styles from './TabStyles.module.scss';

const MAX_NAME = 200;
const MAX_ATTRACTIONS = 1000;

const GeneralInfoTab = ({ formData, setFormData, locations, errors, setErrors }) => {
  const [checking, setChecking]   = useState(false);
  const [codeStatus, setCodeStatus] = useState('idle'); // idle | checking | valid | exists

  const handleChange = (field, value) => {
    setFormData(p => ({ ...p, [field]: value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: null }));
  };

  const checkTourCode = async (code) => {
    if (!code || code.length < 3) { setCodeStatus('idle'); return; }
    setChecking(true);
    setCodeStatus('checking');
    try {
      const res = await axios.get('/admin/tours/check-code', { params: { tourCode: code } });
      if (res.data.exists) {
        setErrors(p => ({ ...p, tourCode: 'Mã tour đã tồn tại' }));
        setCodeStatus('exists');
      } else {
        setErrors(p => ({ ...p, tourCode: null }));
        setCodeStatus('valid');
      }
    } catch {
      setCodeStatus('idle');
    } finally {
      setChecking(false);
    }
  };

  const handleTourCodeChange = (value) => {
    const upper = value.toUpperCase().replace(/\s+/g, '');
    handleChange('tourCode', upper);
    setCodeStatus('idle');
    clearTimeout(window._tourCodeTimer);
    window._tourCodeTimer = setTimeout(() => checkTourCode(upper), 500);
  };

  // Completion progress (4 trường bắt buộc của tab này)
  const requiredFields = ['tourName', 'tourCode', 'duration', 'transportation',
                          'startLocationId', 'endLocationId', 'attractions'];
  const progress = useMemo(() => {
    const filled = requiredFields.filter(k => {
      const v = formData[k];
      return v !== '' && v !== null && v !== undefined && String(v).trim() !== '';
    }).length;
    return { filled, total: requiredFields.length, percent: Math.round(filled / requiredFields.length * 100) };
    // eslint-disable-next-line
  }, [formData]);

  // Helper: render input wrapper với icon prefix bên trong + validity hint
  const TextInput = ({ icon: Icon, name, placeholder, maxLength, helper }) => {
    const hasError = !!errors[name];
    const val = formData[name] || '';
    return (
      <>
        <div className={`${styles.inputWithIcon} ${hasError ? styles.inputErrorWrap : ''}`}>
          {Icon && <Icon size={15} className={styles.inputIconPrefix} />}
          <input
            type="text"
            value={val}
            maxLength={maxLength}
            onChange={e => handleChange(name, e.target.value)}
            placeholder={placeholder}
          />
          {!hasError && val && <CheckCircle2 size={14} className={styles.inputCheckSuffix} />}
        </div>
        {(helper || maxLength) && (
          <div className={styles.inputMeta}>
            {helper && <span className={styles.inputHelper}>{helper}</span>}
            {maxLength && (
              <span className={`${styles.inputCount} ${
                val.length > maxLength * 0.85 ? styles.inputCountWarn : ''
              }`}>
                {val.length}/{maxLength}
              </span>
            )}
          </div>
        )}
        {hasError && (
          <span className={styles.errorText}>
            <AlertCircle size={11} /> {errors[name]}
          </span>
        )}
      </>
    );
  };

  return (
    <div className={styles.tabContainer}>

      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressInfo}>
          <span>
            <strong>{progress.filled}/{progress.total}</strong> trường bắt buộc đã điền
          </span>
          <span className={styles.progressPercent}>{progress.percent}%</span>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill}
               style={{ width: `${progress.percent}%` }} />
        </div>
      </div>

      {/* ── SECTION 1: Thông tin cơ bản ─────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionTitleRich}>
          <div className={styles.sectionIcon}><Tag size={16} /></div>
          <div>
            <h3>Thông tin cơ bản</h3>
            <p>Mã tour, tên tour và phương tiện chính</p>
          </div>
        </div>

        <div className={styles.row2}>
          <div className={styles.formGroup}>
            <label>Tên Tour <span className={styles.required}>*</span></label>
            <TextInput
              icon={FileText}
              name="tourName"
              maxLength={MAX_NAME}
              placeholder="VD: Tour Hà Nội – Đà Nẵng 3 ngày 2 đêm"
              helper="Tên hiển thị trên website cho khách hàng xem"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Mã Tour <span className={styles.required}>*</span></label>
            <div className={`${styles.inputWithIcon}
              ${errors.tourCode ? styles.inputErrorWrap : ''}
              ${codeStatus === 'valid' ? styles.inputOkWrap : ''}`}>
              <Tag size={15} className={styles.inputIconPrefix} />
              <input
                type="text"
                value={formData.tourCode}
                onChange={e => handleTourCodeChange(e.target.value)}
                placeholder="VD: HN-DN-001"
                style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
              />
              {checking && <Loader2 size={14} className={`${styles.inputCheckSuffix} ${styles.spinning}`} />}
              {!checking && codeStatus === 'valid'  && <CheckCircle2 size={14} className={styles.inputCheckSuffix} />}
              {!checking && codeStatus === 'exists' && <AlertCircle  size={14} className={`${styles.inputCheckSuffix} ${styles.inputCheckErr}`} />}
            </div>
            <div className={styles.inputMeta}>
              <span className={styles.inputHelper}>
                Mã không trùng, tự viết hoa (vd: <code>HN-DN-001</code>)
              </span>
            </div>
            {errors.tourCode && (
              <span className={styles.errorText}>
                <AlertCircle size={11} /> {errors.tourCode}
              </span>
            )}
          </div>
        </div>

        <div className={styles.row2}>
          <div className={styles.formGroup}>
            <label>Thời gian <span className={styles.required}>*</span></label>
            <TextInput icon={Clock} name="duration"
              placeholder="VD: 3 ngày 2 đêm"
              helper="Định dạng tự do, hiển thị trên thẻ tour" />
          </div>

          <div className={styles.formGroup}>
            <label>Phương tiện <span className={styles.required}>*</span></label>
            <TextInput icon={Plane} name="transportation"
              placeholder="VD: Máy bay, Xe du lịch"
              helper="Phương tiện chính (ngắn gọn 1-2 từ)" />
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Địa điểm ─────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionTitleRich}>
          <div className={styles.sectionIcon}><Compass size={16} /></div>
          <div>
            <h3>Hành trình & Điểm đến</h3>
            <p>Điểm khởi hành, điểm đến và các điểm tham quan trong tour</p>
          </div>
        </div>

        <div className={styles.row2}>
          <div className={styles.formGroup}>
            <label>Điểm khởi hành <span className={styles.required}>*</span></label>
            <div className={`${styles.inputWithIcon}
              ${errors.startLocationId ? styles.inputErrorWrap : ''}`}>
              <MapPin size={15} className={styles.inputIconPrefix} />
              <select value={formData.startLocationId}
                onChange={e => handleChange('startLocationId', e.target.value)}>
                <option value="">— Chọn điểm khởi hành —</option>
                {locations.map(loc => (
                  <option key={loc.locationID} value={String(loc.locationID)}>{loc.name}</option>
                ))}
              </select>
            </div>
            {errors.startLocationId && (
              <span className={styles.errorText}>
                <AlertCircle size={11} /> {errors.startLocationId}
              </span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Điểm đến <span className={styles.required}>*</span></label>
            <div className={`${styles.inputWithIcon}
              ${errors.endLocationId ? styles.inputErrorWrap : ''}`}>
              <MapPin size={15} className={styles.inputIconPrefix} />
              <select value={formData.endLocationId}
                onChange={e => handleChange('endLocationId', e.target.value)}>
                <option value="">— Chọn điểm đến —</option>
                {locations.map(loc => (
                  <option key={loc.locationID} value={String(loc.locationID)}>{loc.name}</option>
                ))}
              </select>
            </div>
            {errors.endLocationId && (
              <span className={styles.errorText}>
                <AlertCircle size={11} /> {errors.endLocationId}
              </span>
            )}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Điểm tham quan <span className={styles.required}>*</span></label>
          <textarea
            rows={4}
            value={formData.attractions}
            maxLength={MAX_ATTRACTIONS}
            onChange={e => handleChange('attractions', e.target.value)}
            placeholder="Mô tả các điểm tham quan trong tour, mỗi địa điểm cách nhau bằng dấu phẩy..."
            className={errors.attractions ? styles.error : ''}
          />
          <div className={styles.inputMeta}>
            <span className={styles.inputHelper}>
              Liệt kê các điểm nổi bật để khách dễ hình dung tour
            </span>
            <span className={`${styles.inputCount} ${
              (formData.attractions || '').length > MAX_ATTRACTIONS * 0.85 ? styles.inputCountWarn : ''
            }`}>
              {(formData.attractions || '').length}/{MAX_ATTRACTIONS}
            </span>
          </div>
          {errors.attractions && (
            <span className={styles.errorText}>
              <AlertCircle size={11} /> {errors.attractions}
            </span>
          )}
        </div>
      </div>

      {/* ── SECTION 3: Thông tin bổ sung ────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionTitleRich}>
          <div className={styles.sectionIcon}><Globe2 size={16} /></div>
          <div>
            <h3>Thông tin bổ sung</h3>
            <p>Các thông tin marketing và mô tả thêm để tour hấp dẫn hơn</p>
          </div>
        </div>

        <div className={styles.row2}>
          <div className={styles.formGroup}>
            <label>Bữa ăn</label>
            <TextInput icon={Utensils} name="meals"
              placeholder="VD: Ăn sáng buffet, trưa, tối" />
          </div>
          <div className={styles.formGroup}>
            <label>Thời điểm lý tưởng</label>
            <TextInput icon={Sun} name="idealTime"
              placeholder="VD: Quanh năm, mùa hè" />
          </div>
        </div>

        <div className={styles.row2}>
          <div className={styles.formGroup}>
            <label>Phương tiện di chuyển trong tour</label>
            <TextInput icon={Bus} name="tripTransportation"
              placeholder="VD: Xe du lịch điều hòa 45 chỗ" />
          </div>
          <div className={styles.formGroup}>
            <label>Khách hàng phù hợp</label>
            <TextInput icon={Users} name="suitableCustomer"
              placeholder="VD: Gia đình, cặp đôi, nhóm bạn" />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Khách sạn</label>
          <TextInput icon={Hotel} name="hotel"
            placeholder="VD: Khách sạn 4 sao tiêu chuẩn quốc tế" />
        </div>

        {/* Status toggle switch — thay cho checkbox lệch lạc */}
        <div className={styles.statusToggleRow}>
          <div className={styles.statusToggleInfo}>
            <span className={styles.statusToggleLabel}>
              {formData.status ? <Eye size={14} /> : <EyeOff size={14} />}
              Trạng thái hiển thị
            </span>
            <span className={styles.statusToggleHint}>
              {formData.status
                ? 'Tour đang hoạt động — khách hàng có thể xem trên website'
                : 'Tour tạm dừng — không hiển thị trên website'}
            </span>
          </div>
          <label className={styles.switch}>
            <input type="checkbox"
              checked={!!formData.status}
              onChange={e => handleChange('status', e.target.checked)} />
            <span className={styles.slider} />
          </label>
        </div>
      </div>
    </div>
  );
};

export default GeneralInfoTab;
