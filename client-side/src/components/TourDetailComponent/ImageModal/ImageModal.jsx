import React, { useState, useEffect } from 'react';
import styles from './ImageModal.module.scss';
import { FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const ImageModal = ({ isOpen, onClose, images, startIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  // Cập nhật index khi mở modal hoặc khi startIndex thay đổi
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(startIndex);
    }
  }, [isOpen, startIndex]);

  // Chặn cuộn chuột trang chính khi modal mở
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        
        {/* Nút đóng */}
        <button className={styles.closeBtn} onClick={onClose}>
          <FaTimes />
        </button>

        {/* Ảnh chính */}
        <div className={styles.mainImageContainer}>
          <img src={images[currentIndex]} alt={`Slide ${currentIndex}`} className={styles.mainImage} />
          
          {/* Nút điều hướng */}
          <button className={`${styles.navBtn} ${styles.prevBtn}`} onClick={handlePrev}>
            <FaChevronLeft />
          </button>
          <button className={`${styles.navBtn} ${styles.nextBtn}`} onClick={handleNext}>
            <FaChevronRight />
          </button>
        </div>

        {/* Phần Thumbnails bên dưới */}
        <div className={styles.footer}>
          <div className={styles.title}>Tất cả ảnh ({images.length})</div>
          <div className={styles.thumbnailsList}>
            {images.map((img, index) => (
              <div 
                key={index} 
                className={`${styles.thumbItem} ${index === currentIndex ? styles.active : ''}`}
                onClick={() => setCurrentIndex(index)}
              >
                <img src={img} alt={`thumb-${index}`} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ImageModal;