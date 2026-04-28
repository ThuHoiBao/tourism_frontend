import React, { useState } from 'react';
import { X, Copy, Calendar, Clock } from 'lucide-react';
import styles from './CloneModal.module.scss';

const CloneModal = ({ isOpen, onClose, onClone, loading }) => {
  const [newDateTime, setNewDateTime] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newDateTime) {
      onClone(newDateTime);
    }
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <div className={styles.iconWrapper}>
              <Copy size={20} />
            </div>
            <h3>Sao chép Lịch Khởi Hành</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            <p className={styles.description}>
              Vui lòng chọn <strong>ngày và giờ</strong> khởi hành mới cho bản sao này. 
              Toàn bộ cấu hình giá và dịch vụ sẽ được giữ nguyên.
            </p>

            <div className={styles.formGroup}>
              <label htmlFor="newDateTime">
                Ngày & Giờ khởi hành mới <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <Clock size={18} className={styles.inputIcon} />
                <input
                  id="newDateTime"
                  type="datetime-local"
                  value={newDateTime}
                  onChange={(e) => setNewDateTime(e.target.value)}
                  required
                  className={styles.input}
                  min={getCurrentDateTime()} 
                />
              </div>
            </div>
          </div>

          <div className={styles.footer}>
            <button 
              type="button" 
              className={styles.btnCancel} 
              onClick={onClose}
              disabled={loading}
            >
              Hủy bỏ
            </button>
            <button 
              type="submit" 
              className={styles.btnSubmit}
              disabled={loading || !newDateTime}
            >
              {loading ? <span className={styles.spinner}></span> : 'Sao chép ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CloneModal;