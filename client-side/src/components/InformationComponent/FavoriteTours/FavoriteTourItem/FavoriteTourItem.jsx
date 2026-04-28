// src/components/InformationComponent/FavoriteTours/FavoriteTourItem/FavoriteTourItem.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './FavoriteTourItem.module.scss';

// Chức năng format tiền tệ (VND)
const formatCurrency = (amount) => {
    
    if (amount === undefined || amount === null) return 'Liên hệ';
    return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }).replace('₫', 'đ');
};

const FavoriteTourItem = ({ tour, onRemove }) => {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);

    if (!tour) return null;

    const allDepartureDates = tour.departureDates || [];

    // Mở modal xác nhận
    const handleRemoveClick = () => {
        setShowModal(true);
    };

    // Xác nhận và gọi hàm xóa từ component cha
    const handleConfirmRemove = () => {
        onRemove(tour.tourID);
        setShowModal(false);
    };

    const handleDateClick = (e, departureID) => {
        e.stopPropagation(); 
        console.log(`Clicked Departure ID: ${departureID}`);
        navigate(`/tour/${tour.tourCode}?departureId=${departureID}`);
    };

     const handleViewDetail = (e) => {
        e.stopPropagation();
        if(allDepartureDates && allDepartureDates.length > 0){
            const firstDepature = allDepartureDates[0];
             navigate(`/tour/${tour.tourCode}?departureId=${firstDepature.departureID}`);
        } else {
            navigate(`/tour/${tour.tourCode}`);
        }
    }

    return (
        <>
            <div className={styles.tourItem}>
                <div className={styles.imageContainer}>
                    {/* KHÔNG CÓ ICON TRÁI TIM */}
                    <img src={tour.image} alt={tour.tourName} className={styles.tourImage} />
                    <div className={styles.saleBadge}>
                        <p>Tiết kiệm</p>
                    </div>
                </div>
                
                <div className={styles.detailsContainer}>
                    <h3 className={styles.tourName}>{tour.tourName}</h3>
                    
                    {/* KHỐI THÔNG TIN DẠNG GRID (2 cột) */}
                    <div className={styles.infoGrid}>
                        <div className={styles.iconInfo}>
                            <i className="fas fa-qrcode"></i> Mã tour: <span className={styles.infoValue}>{tour.tourCode}</span>
                        </div>
                        <div className={styles.iconInfo}>
                            <i className="fas fa-plane-departure"></i> Khởi hành: <span className={`${styles.infoValue} ${styles.highlightValue}`}>{tour.startPointName}</span>
                        </div>
                        <div className={styles.iconInfo}>
                            <i className="fas fa-clock"></i> Thời gian: <span className={styles.infoValue}>{tour.duration}</span>
                        </div>
                        <div className={styles.iconInfo}>
                            <i className="fas fa-bus"></i> Phương tiện: <span className={styles.infoValue}>{tour.transportation}</span>
                        </div>
                    </div>

                    {/* Ngày Khởi hành */}
                    <div className={styles.dateRow}>
                        <span className={styles.dateLabel}>
                            <i className="fas fa-calendar-alt"></i> Ngày khởi hành:
                        </span>
                        <div className={styles.dateBadges}>
                            {/* Nút Lùi/Tiến (có thể bỏ nếu không có logic cuộn) */}
                            <div className={styles.dateNavButton}>&larr;</div>
                            {allDepartureDates.slice(0, 3).map((date, index) => ( // Chỉ hiện 3 ngày gần nhất
                                <span 
                                    key={index} 
                                    className={styles.dateBadge}
                                    title={`Ngày: ${date.fullDate}`}
                                    onClick={(e) => handleDateClick(e, date.departureID)}
                                >
                                    {date.departureDate}
                                </span>
                            ))}
                            <div className={styles.dateNavButton}>&rarr;</div>
                        </div>
                    </div>

                    {/* Giá và Hành động */}
                    <div className={styles.priceActionRow}>
                        <div className={styles.priceBlock}>
                            Giá từ:
                            <p className={styles.priceValue}>{formatCurrency(tour.money)}</p>
                        </div>
                        <div className={styles.buttonGroup}>
                            <button className={styles.detailButton} onClick={handleViewDetail}>Xem chi tiết</button>
                            <button className={styles.removeButton} onClick={handleRemoveClick}>
                                Bỏ yêu thích
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ✨ MODAL XÁC NHẬN ✨ */}
            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3>Xác nhận</h3>
                        <p>Bạn có chắc chắn muốn bỏ yêu thích tour "{tour.tourName}" này không?</p>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelButton} onClick={() => setShowModal(false)}>
                                Hủy
                            </button>
                            <button className={styles.confirmButton} onClick={handleConfirmRemove}>
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FavoriteTourItem;