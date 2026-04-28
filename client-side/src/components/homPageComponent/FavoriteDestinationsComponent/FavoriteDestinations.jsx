// src/components/homPageComponent/FavoriteDestinationsComponent/FavoriteDestinations.jsx (CẬP NHẬT)

import React from 'react';
import styles from './FavoriteDestinations.module.scss';
// ✨ Import hook và Enum Region
import useFavoriteDestinations from '../../../hook/useFavoriteDestinations.ts'; 
import { Region } from '../../../services/location/location.ts';
import FavoriteDestinationItem from './FavoriteDestinationsComponent/FavoriteDestinationItem.jsx'; // Đã sửa đường dẫn

const regionLabels = {
    [Region.NORTH]: "Miền Bắc",
    [Region.CENTRAL]: "Miền Trung",
    [Region.SOUTH]: "Miền Nam",
};

const FavoriteDestinations = () => {
    // ✨ Lấy hook mới với activeRegion và hàm fetch
    const { destinations, loading, error, fetchDestinationsByRegion, activeRegion } = useFavoriteDestinations();

    const handleTabClick = (region) => {
        // Gọi hàm từ hook để cập nhật region và tải lại dữ liệu
        fetchDestinationsByRegion(region);
    };

    return (
        <div className={styles.favoriteDestinationsContainer}>
            <div className={styles.header}>
                <h2 className={styles.title}>ĐIỂM ĐẾN YÊU THÍCH</h2>
                <p className={styles.description}>
                    Hãy tận hưởng trải nghiệm du lịch chuyên nghiệp, mang lại cho bạn những khoảnh khắc tuyệt 
                    vời và nâng tầm cuộc sống. Chúng tôi cam kết mang đến những chuyến đi đáng nhớ, giúp bạn 
                    khám phá thế giới theo cách hoàn hảo nhất.
                </p>
                
                {/* ✨ KHU VỰC DANH MỤC MIỀN */}
                <div className={styles.regionTabs}>
                    {Object.values(Region).map((region) => (
                        <button 
                            key={region}
                            className={`${styles.regionTab} ${activeRegion === region ? styles.activeTab : ''}`}
                            onClick={() => handleTabClick(region)}
                        >
                            {regionLabels[region]}
                            {/* span này sẽ là gạch chân xanh */}
                            {activeRegion === region && <span className={styles.activeIndicator} />} 
                        </button>
                    ))}
                </div>
                {/* KẾT THÚC KHU VỰC DANH MỤC MIỀN */}
            </div>
            
            {/* 1. Thêm kiểm tra destinations trước khi truy cập .length */}
            {!loading && !error && destinations && destinations.length > 0 && (
                <div className={styles.destinationsGrid}>
                    {destinations.map((destination, index) => (
                        <FavoriteDestinationItem 
                            key={index} 
                            destination={destination}
                            index={index} 
                        />
                    ))}
                </div>
            )}
            
            {/* 2. Thêm kiểm tra tương tự cho trường hợp không tìm thấy */}
            {!loading && !error && destinations && destinations.length === 0 && (
                <p style={{textAlign: 'center', padding: '20px'}}>Không tìm thấy điểm đến yêu thích nào cho vùng {regionLabels[activeRegion]}.</p>
            )}

            {/* Trường hợp lỗi (Error handling) */}
            {!loading && error && (
                <p style={{textAlign: 'center', padding: '20px', color: 'red'}}>Lỗi: {error}</p>
            )}

            {/* Trường hợp đang tải (Loading) */}
            {loading && (
                <p style={{textAlign: 'center', padding: '20px'}}>Đang tải danh sách điểm đến...</p>
            )}
        </div>
    );
};

export default FavoriteDestinations;