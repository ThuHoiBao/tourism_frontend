// src/components/homPageComponent/FavoriteDestinationsComponent/FavoriteDestinationItem.jsx
import React from 'react';
import styles from '../FavoriteDestinations.module.scss';
import { useNavigate } from 'react-router-dom';

const FavoriteDestinationItem = ({ destination, index }) => {
    const navigate = useNavigate(); 

    const handleExploreClick = () => {
        console.log(`Bắt đầu tìm kiếm tour đến: ${destination.endPoint}`);
        navigate(`/tours?endLocationID=${destination.locationID}`); 
    };

    let itemClass = '';
    
    if (index === 0) {
        itemClass = styles.item0; // Quảng Ninh
    } else if (index === 4) {
        itemClass = styles.item4; // Ninh Bình
    } else if (index === 2) {
        itemClass = styles.item2; // Ninh Bình
    }
     else if (index === 3) {
        itemClass = styles.item3; // Ninh Bình
    }
    

    return (
        <div className={`${styles.destinationItem} ${itemClass}`}>
            <div 
                className={styles.backgroundImage}
                style={{ backgroundImage: `url(${destination.listImage})` }}
            >
                {/* 1. Lớp làm tối khi hover */}
                <div className={styles.dimOverlay} /> 

                {/* 2. Lớp chứa nội dung (tên và nút) - ĐÃ CĂN GIỮA DỌC VÀ NGANG */}
                <div className={styles.contentOverlay}>
                    <h3 className={styles.name}>{destination.endPoint}</h3>
                    
                    {/* CHỈ HIỂN THỊ NÚT KHÁM PHÁ Ở QUẢNG NINH (index 0) và NINH BÌNH (index 3) 
                       - Bạn có thể tùy chỉnh logic này */}
                    {(index === 0 || index === 3) ? (
                        <button 
                            className={styles.exploreButton}
                            onClick={handleExploreClick}
                        >
                            Khám phá
                        </button>
                    ) : (
                        // Nút ẩn, chỉ hiện khi hover (cho các item còn lại)
                         <button 
                            className={styles.exploreButton}
                            onClick={handleExploreClick}
                            // Để nút "Khám phá" của các item nhỏ hơn chỉ hiện khi hover
                            style={index !== 0 && index !== 3 ? {} : { display: 'none' }}
                        >
                            Khám phá
                        </button>
                    )}

                </div>
            </div>
        </div>
    );
};

export default FavoriteDestinationItem;