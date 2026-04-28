import React from 'react';
import styles from './TourInformation.module.scss';
// Import các icon phù hợp từ react-icons
import { FaMapMarkedAlt, FaUtensils, FaUserFriends, FaClock, FaCar, FaTags } from 'react-icons/fa';

const TourInformation = ({tour}) => {
  console.log('Tour data in TourInformation:', tour);
  if(!tour) return null;
  const infoItems = [
    {
      icon: <FaMapMarkedAlt />,
      label: 'Điểm tham quan',
      content: tour.attractions || 'Đang cập nhập'
    },
    {
      icon: <FaUtensils />,
      label: 'Ẩm thực',
      content: tour.meals || 'Theo chương trình'
    },
    {
      icon: <FaUserFriends />,
      label: 'Đối tượng thích hợp',
      content: tour.suitableCustomer || 'Mọi lứa tuổi'
    },
    {
      icon: <FaClock />,
      label: 'Thời gian lý tưởng',
      content: tour.idealTime || 'Quanh năm'
    },
    {
      icon: <FaCar />,
      label: 'Phương tiện',
      content: tour.tripTransportation || 'Đang cập nhập'
    },
    {
      icon: <FaTags />,
      label: 'Khuyến mãi',
      content:  tour.totalDiscountPercentage + '%' ||'Ưu đãi trực tiếp vào giá tour'
    }
  ];

  return (
    <div className={styles.infoContainer}>
      <h2 className={styles.sectionTitle}>THÔNG TIN THÊM VỀ CHUYẾN ĐI</h2>
      
      <div className={styles.infoGrid}>
        {infoItems.map((item, index) => (
          <div key={index} className={styles.infoItem}>
            <div className={styles.iconWrapper}>
              {item.icon}
            </div>
            <div className={styles.textWrapper}>
              <h3 className={styles.label}>{item.label}</h3>
              <p className={styles.content}>{item.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TourInformation;