import React, { useState } from 'react';
import styles from './TourItinerary.module.scss';
import { FaChevronDown, FaUtensils } from 'react-icons/fa';

const TourItinerary = ({ itinerary }) => {
  console.log('Itinerary data in TourItinerary:', itinerary);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!itinerary || itinerary.length === 0) {
    return <div className={styles.emptyData}>Đang cập nhật lịch trình...</div>; 
  }

  const toggleAccordion = (index) => {
    if (activeIndex === index) {
      setActiveIndex(null);
    } else {
      setActiveIndex(index); 
    }
  };

  return (
    <div className={styles.itineraryContainer}>
      <h2 className={styles.sectionTitle}>LỊCH TRÌNH</h2>
      
      <div className={styles.listWrapper}>
        {itinerary.map((item, index) => {
          const isOpen = activeIndex === index;

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