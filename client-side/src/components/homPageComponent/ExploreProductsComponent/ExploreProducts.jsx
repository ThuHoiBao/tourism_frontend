// src/components/homPageComponent/ExploreProductsComponent/ExploreProducts.jsx

import React, { useState } from 'react';
import styles from './ExploreProducts.module.scss';
import ExploreProductItem from './ExploreProductItemComponent/ExploreProductItem'; 
import useFeaturedTours from '../../../hook/useFeaturedTours.ts'; // Đã sửa đường dẫn nếu cần thiết
import rightArrow from '../../../assets/images/right-arrow-blue.png'; 
import leftArrow from '../../../assets/images/left-arrow-blue.png'; 

const ExploreProducts = () => {
    const { featuredTours, loading, error } = useFeaturedTours(); 
    
    // Chỉ hiển thị tối đa 5 tour
    const displayTours = featuredTours.slice(0, 5); 

    // --- LOGIC SLIDER ---
    const [currentIndex, setCurrentIndex] = useState(0); 
    const slidesPerView = 3;
    const totalItems = displayTours.length;
    // Số lần trượt tối đa: 5 items - 3 items hiển thị = 2 lần trượt
    const maxIndex = totalItems > slidesPerView ? totalItems - slidesPerView : 0; 

    const handleNext = () => {
        setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, maxIndex));
    };

    const handlePrev = () => {
        setCurrentIndex((prevIndex) => Math.max(prevIndex - 1, 0));
    };

    // Tính toán độ dịch chuyển (dựa trên 1/3 chiều rộng và 20px gap)
    const gap = 20; 
    const translateValue = `calc(-${currentIndex} * (100% / 3) - ${currentIndex} * ${gap}px)`;


    return (
        <div className={styles.exploreProductsContainer}>
            <div className={styles.header}>
                <h2 className={styles.title}>KHÁM PHÁ SẢN PHẨM FUTURE TRAVEL</h2>
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
                <p style={{textAlign: 'center', padding: '40px', fontSize: '18px'}}>Đang tải các tour nổi bật...</p>
            )}
            
            {error && (
                <p style={{textAlign: 'center', padding: '40px', fontSize: '18px', color: 'red'}}>Lỗi: {error}</p>
            )}

            {!loading && !error && displayTours.length > 0 && (
                <div className={styles.productsWrapper}>
                    <div 
                        className={styles.productsGrid}
                        // Áp dụng transform để trượt
                        style={{ transform: `translateX(${translateValue})` }}
                    >
                        {displayTours.map((tour) => (
                            <ExploreProductItem 
                                key={tour.id} 
                                // tour là instance của ToursResponseDTO
                                tour={tour} 
                            />
                        ))}
                    </div>
                </div>
            )}
            
            {!loading && !error && displayTours.length === 0 && (
                <p style={{textAlign: 'center', padding: '40px', fontSize: '18px'}}>Không tìm thấy tour nổi bật nào.</p>
            )}

            {/* <div style={{textAlign: 'center', marginTop: '5px'}}>
                <button className={styles.viewAllButton}>
                    Xem tất cả
                </button>
            </div> */}
        </div>
    );
};

export default ExploreProducts;