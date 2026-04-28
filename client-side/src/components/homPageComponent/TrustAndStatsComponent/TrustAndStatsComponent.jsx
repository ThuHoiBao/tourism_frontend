import React from 'react';
import styles from './TrustAndStats.module.scss';

// --- BƯỚC 1: IMPORT CÁC TỆP ẢNH VÀO COMPONENT ---

// 1. Ảnh chính
import mainTouristImage from '../../../assets/images/premium_photo.avif'; // Điều chỉnh đường dẫn tương đối này theo cấu trúc thư mục của bạn

// 2. Các Icon
import mapIcon from '../../../assets/images/travel.png';
import planeIcon from '../../../assets/images/globe.png';
import compassIcon from '../../../assets/images/compass.png';
import cameraIcon from '../../../assets/images/camera.png';
import ticketIcon from '../../../assets/images/ticket.png';


const TrustAndStatsComponent = () => {
    // Array chứa các icon sử dụng đường dẫn LOCAL đã import
    const decorativeIcons = [
        { name: 'map', iconUrl: mapIcon, style: styles.icon1 }, 
        { name: 'plane', iconUrl: planeIcon, style: styles.icon2 }, 
        { name: 'compass', iconUrl: compassIcon, style: styles.icon3 }, 
        { name: 'camera', iconUrl: cameraIcon, style: styles.icon4 }, 
        { name: 'ticket', iconUrl: ticketIcon, style: styles.icon5 }, 
    ];

    return (
        <div className={styles.trustAndStatsContainer}>
            <div className={styles.content}>
                {/* Phần nội dung chữ bên trái */}
                <div className={styles.textColumn}>
                    <h2 className={styles.title}>
                        Du Lịch Với Sự Tự Tin Lý<br />
                        Do Hàng Đầu Để Chọn<br />
                        Công Ty Chúng Tôi
                    </h2>
                    <p className={styles.description}>
                        Chúng tôi sẽ nỗ lực hết mình để biến giấc mơ du lịch của bạn 
                        thành hiện thực, những chuyến đi ngoạn mục và những điểm tham quan 
                        không thể bỏ qua.
                    </p>

                    <div className={styles.experiencePill}>
                        Chúng tôi có <span>5+ Năm</span> kinh nghiệm
                    </div>

                    <div className={styles.statsRow}>
                        <div className={styles.statItem}>
                            <div className={styles.statNumber}>1k+</div>
                            <div className={styles.statLabel}>Điểm đến phổ biến</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statNumber}>8m+</div>
                            <div className={styles.statLabel}>Khách hàng hài lòng</div>
                        </div>
                    </div>

                    <button className={styles.exploreButton}>
                        Khám Phá Điểm Đến <span className={styles.arrow}>→</span>
                    </button>
                </div>
                
                {/* Phần hình ảnh bên phải */}
                <div className={styles.imageColumn}>
                    {/* Ảnh chính: Sử dụng biến đã import */}
                    <div 
                        className={styles.mainImage}
                        style={{backgroundImage: `url(${mainTouristImage})`}} 
                    />
                    
                    {/* Container cho các chi tiết trang trí và vòng tròn xoay */}
                    <div className={styles.decorativeElements}>
                        {decorativeIcons.map((icon, index) => (
                            <div 
                                key={index} 
                                className={`${styles.decorativeIcon} ${icon.style}`}
                                // Sử dụng icon.iconUrl là biến đã import
                                style={{backgroundImage: `url(${icon.iconUrl})`}}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrustAndStatsComponent;