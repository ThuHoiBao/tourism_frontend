// AddBanner.jsx
import React, { useState, useEffect } from 'react';
import styles from './AddBanner.module.scss'; // Nhớ đã sửa lỗi tên file SCSS ở câu hỏi trước

// Nhập các hình ảnh cụ thể
import banner1 from '../../assets/images/banner4.png';
import banner2 from '../../assets/images/banner5.png';
import banner3 from '../../assets/images/banner6.png';

const AdBanner = () => {
  // Khai báo state, loại bỏ kiểu <number>
  const [currentBanner, setCurrentBanner] = useState(0);

  // Khai báo mảng hình ảnh, loại bỏ kiểu string[]
  const bannerImages = [banner1, banner2, banner3];

  // Thay đổi ảnh mỗi 3 giây
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
    }, 20000);

    return () => clearInterval(interval); // Dọn dẹp interval khi component unmount
  }, []);

  // Hàm chuyển ảnh khi bấm vào chấm, loại bỏ kiểu cho tham số index
  const handleDotClick = (index) => {
    setCurrentBanner(index);
  };

  return (
    <div className={styles['ad-banner']}>
      <div className={styles['ad-banner-container']}>
        <img src={bannerImages[currentBanner]} alt={`banner-${currentBanner}`} />
      </div>

      {/* Các dấu chấm chỉ mục */}
      <div className={styles['banner-dots']}>
        {bannerImages.map((_, index) => (
          <div
            key={index}
            className={`${styles.dot} ${index === currentBanner ? styles.active : ''}`}
            onClick={() => handleDotClick(index)}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default AdBanner;