// src/components/homPageComponent/SpecialToursComponent/SpecialTours.jsx
import React, { useState } from 'react';
import styles from './SpecialTours.module.scss';
import SpecialTourItem from './SpecialTourItemComponent/SpecialTourItem'; 
import useSpecialTours from '../../../hook/useSpecialTours.ts'; 
import rightArrow from '../../../assets/images/right-arrow-blue.png'; 
import leftArrow from '../../../assets/images/left-arrow-blue.png'; 

const SpecialTours = () => {
    // Gọi hook để lấy dữ liệu 7 tour
    const { specialTours, loading, error } = useSpecialTours(); 
    
    // --- LOGIC SLIDER ---
    const [currentIndex, setCurrentIndex] = useState(0); 
    const slidesPerView = 4; // Hiển thị 4 tour cùng lúc (theo ảnh mẫu)
    const totalItems = specialTours.length;
    
    // Số lần trượt tối đa: 7 items - 4 items hiển thị = 3 lần trượt
    const maxIndex = totalItems > slidesPerView ? totalItems - slidesPerView : 0; 

    const handleNext = () => {
        setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, maxIndex));
    };

    const handlePrev = () => {
        setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    };

    // Tính toán độ dịch chuyển (dựa trên 1/4 chiều rộng và 10px gap - Giả định gap 10px)
    const gap = 10; 
    // Công thức: -(currentIndex * (100% / slidesPerView)) - (currentIndex * gap)
    const translateValue = `calc(-${currentIndex} * (100% / ${slidesPerView}) - ${currentIndex} * ${gap}px)`;


    return (
        <div className={styles.specialToursContainer}>
            <div className={styles.header}>
                <h2 className={styles.title}>TOUR ƯU ĐÃI ĐẶC BIỆT</h2>
                <p className={styles.description}>
                    Hãy tận hưởng trải nghiệm du lịch chuyên nghiệp, mang lại cho bạn những khoảnh khắc tuyệt 
                    vời và nâng tầm cuộc sống. Chúng tôi cam kết mang đến những chuyến đi đáng nhớ, giúp bạn 
                    khám phá thế giới theo cách hoàn hảo nhất.
                </p>
                <div className={styles.navigation}>
                    {/* Nút Previous */}
                    <img 
                        src={leftArrow} 
                        alt="Previous" 
                        className={styles.navArrow} 
                        onClick={handlePrev}
                        style={{ opacity: currentIndex === 0 ? 0.5 : 1, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer' }}
                    />
                    {/* Nút Next */}
                    <img 
                        src={rightArrow} 
                        alt="Next" 
                        className={styles.navArrow} 
                        onClick={handleNext} 
                        style={{ opacity: currentIndex === maxIndex ? 0.5 : 1, cursor: currentIndex === maxIndex ? 'not-allowed' : 'pointer' }}
                    />
                </div>
            </div>
            
            {loading && (
                <p style={{textAlign: 'center', padding: '40px', fontSize: '18px'}}>Đang tải các tour ưu đãi...</p>
            )}
            
            {error && (
                <p style={{textAlign: 'center', padding: '40px', fontSize: '18px', color: 'red'}}>Lỗi: {error}</p>
            )}

            {!loading && !error && specialTours.length > 0 && (
                <div className={styles.toursWrapper}>
                    <div 
                        className={styles.toursGrid}
                        // Áp dụng transform để trượt
                        style={{ transform: `translateX(${translateValue})` }}
                    >
                        {specialTours.map((tour) => (
                            <SpecialTourItem 
                                key={tour.id} 
                                tour={tour} 
                            />
                        ))}
                    </div>
                </div>
            )}
            
            {!loading && !error && specialTours.length === 0 && (
                <p style={{textAlign: 'center', padding: '40px', fontSize: '18px'}}>Không tìm thấy tour ưu đãi nào.</p>
            )}

            {/* <div style={{textAlign: 'center', marginTop: '5px'}}>
                <button className={styles.viewAllButton}>
                    Xem tất cả
                </button>
            </div> */}
        </div>
    );
};

export default SpecialTours;