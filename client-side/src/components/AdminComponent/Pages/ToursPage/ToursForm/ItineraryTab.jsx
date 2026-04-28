import React from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';
import RichTextEditor from '../../RichTextEditor/RichTextEditor';
import styles from './TabStyles.module.scss';

const ItineraryTab = ({ itineraryDays, setItineraryDays }) => {
  const handleAddDay = () => {
    const newDay = {
      dayNumber: itineraryDays.length + 1,
      title: '',
      meals: '',
      details: ''
    };
    setItineraryDays([...itineraryDays, newDay]);
  };

  const handleDayChange = (index, field, value) => {
    const newDays = [...itineraryDays];
    newDays[index][field] = value;
    setItineraryDays(newDays);
  };

  const handleRemoveDay = (index) => {
    const newDays = itineraryDays
      .filter((_, i) => i !== index)
      .map((day, i) => ({
        ...day,
        dayNumber: i + 1
      }));
    
    setItineraryDays(newDays);
  };

  return (
    <div className={styles.tabContainer}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Lịch trình chi tiết</h3>
          <button className={styles.btnAdd} onClick={handleAddDay}>
            <Plus size={18} />
            Thêm ngày
          </button>
        </div>

        {itineraryDays.length === 0 ? (
          <div className={styles.emptyState}>
            <Calendar size={48} />
            <p>Chưa có lịch trình nào</p>
            <button className={styles.btnPrimary} onClick={handleAddDay}>
              Thêm ngày đầu tiên
            </button>
          </div>
        ) : (
          <div className={styles.itemList}>
            {itineraryDays.map((day, index) => (
              <div key={index} className={styles.dayCard}>
                <div className={styles.dayHeader}>
                  <div className={styles.dayBadge}>
                    <Calendar size={18} />
                    <span>Ngày {day.dayNumber}</span>
                  </div>
                  <button
                    className={styles.btnDelete}
                    onClick={() => handleRemoveDay(index)}
                    title="Xóa ngày này"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className={styles.dayContent}>
                  <div className={styles.formGroup}>
                    <label>
                      Tiêu đề <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      value={day.title}
                      onChange={(e) => handleDayChange(index, 'title', e.target.value)}
                      placeholder="VD: Hà Nội - Đà Nẵng - Check in khách sạn"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      Bữa ăn <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      value={day.meals}
                      onChange={(e) => handleDayChange(index, 'meals', e.target.value)}
                      placeholder="VD: Sáng, Trưa, Tối"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>
                      Chi tiết lịch trình <span className={styles.required}>*</span>
                    </label>
                    <RichTextEditor
                      value={day.details}
                      onChange={(value) => handleDayChange(index, 'details', value)}
                      placeholder="Mô tả chi tiết lịch trình trong ngày..."
                      height="300px"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItineraryTab;