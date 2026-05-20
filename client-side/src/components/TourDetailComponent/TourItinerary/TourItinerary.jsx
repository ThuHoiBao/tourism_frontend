import React, { useState } from 'react';
import styles from './TourItinerary.module.scss';
import { FaChevronDown, FaUtensils } from 'react-icons/fa';

const TourItinerary = ({ itinerary }) => {
  // Multi-open: tất cả ngày ĐÓNG mặc định khi vào trang.
  // Người dùng bấm header để mở/đóng từng ngày độc lập.
  const [openDays, setOpenDays] = useState(new Set());

  if (!itinerary || itinerary.length === 0) {
    return <div className={styles.emptyData}>Đang cập nhật lịch trình...</div>;
  }

  const toggleAccordion = (index) => {
    setOpenDays(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className={styles.itineraryContainer}>
      <h2 className={styles.sectionTitle}>LỊCH TRÌNH</h2>
      
      <div className={styles.listWrapper}>
        {itinerary.map((item, index) => {
          const isOpen = openDays.has(index);

          return (
            <div key={index} className={`${styles.dayItem} ${isOpen ? styles.active : ''}`}>
              
              <div className={styles.dayHeader} onClick={() => toggleAccordion(index)}>
                <div className={styles.headerContent}>
                  <div className={styles.mainTitle}>
                    Ngày {item.dayNumber}: {item.title}
                  </div>
                  
                  {item.meals && (
                    <div className={styles.subInfo}>
                      <FaUtensils className={styles.icon} /> {item.meals}
                    </div>
                  )}
                </div>

                <div className={`${styles.arrowIcon} ${isOpen ? styles.rotate : ''}`}>
                  <FaChevronDown />
                </div>
              </div>

              <div className={`${styles.dayBody} ${isOpen ? styles.open : ''}`}>
                <div className={styles.bodyInner}>
                  <div className={styles.bodyContent}>
                    <div dangerouslySetInnerHTML={{ __html: item.details }} />
                  </div>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TourItinerary;