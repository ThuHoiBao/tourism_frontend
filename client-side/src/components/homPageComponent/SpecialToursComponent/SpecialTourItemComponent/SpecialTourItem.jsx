import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../SpecialTours.module.scss';
import { FaMapMarkerAlt, FaCalendarAlt, FaClock } from 'react-icons/fa';
// Thêm import format từ date-fns nếu bạn muốn format ngày
import { format } from 'date-fns'; 

import seatsIcon from '../../../../assets/images/chair.png';
const formatPrice = (price) => {
    // Nếu giá là null, undefined, hoặc 0, trả về chuỗi mặc định
    if (price == null) return '—';
    // Đảm bảo giá trị là số trước khi gọi toLocaleString
    return Number(price).toLocaleString('vi-VN');
};

const SpecialTourItem = ({ tour }) => {
    const navigate = useNavigate();
    const getFormattedDate = (dateString) => {
        if (!dateString) return 'Chưa xác định';
        
        try {
            return format(new Date(dateString), 'dd/MM/yyyy');
        } catch (e) {
            return dateString; // Trả về nguyên gốc nếu không thể format
        }
    };

      const handleDepartureClick = (e, departureID) => {
        e.stopPropagation(); 
        console.log(`Clicked Departure ID: ${departureID}`);
        navigate(`/tour/${tour.tourCode}?departureId=${departureID}`);
    };


    const imageUrl = tour.image || 'default-placeholder.jpg'; 
    
    // Giả lập Thời gian còn lại
    const mockRemainingTime = "18:45:51"; 
    const mockHoursLeft = "2 Ngày 14:46:02"; 

    return (
        <div className={styles.tourCard}>
            <div 
                className={styles.imageWrapper} 
                // *** THAY THẾ IMAGEURL ***
                style={{ backgroundImage: `url(${imageUrl})` }}
            >
                {/* HIỂN THỊ GIÁ TRỊ GIẢM GIÁ TUYỆT ĐỐI */}
                {tour.discountPercentage > 0 && (
                     <div className={styles.saleRibbon}>
                         Tiết kiệm {formatPrice(tour.salePrice)} đ
                     </div>
                )}
            </div>

            <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{tour.tourName}</h3>
                
                <p className={styles.tourCode}>{tour.tourCode}</p> 

                <div className={styles.detailRow}>
                    <FaMapMarkerAlt className={styles.detailIcon} />
                    <span>Khởi hành: </span>
                    {/* *** SỬ DỤNG TRƯỜNG MỚI startLocationName *** */}
                    <strong className={styles.detailValue}>{tour.startLocationName || "Chưa xác định"}</strong>
                </div>

                <div className={styles.detailRow}>
                    <FaCalendarAlt className={styles.detailIcon} />
                    <span>Ngày khởi hành: </span>
                    {/* *** SỬ DỤNG TRƯỜNG MỚI departureDate *** */}
                    <strong className={styles.detailValue}>{getFormattedDate(tour.departureDate)}</strong>
                </div>

                <div className={styles.detailRow}>
                    <FaClock className={styles.detailIcon} />
                    <strong className={styles.detailValue}>{tour.duration}</strong>
                    
                    <img src={seatsIcon} alt="Seats" className={styles.seatsIcon} />
                    <span>Số chỗ còn: </span>
                    {/* *** SỬ DỤNG TRƯỜNG MỚI availableSlots *** */}
                    <strong className={styles.seatsLeft} style={{ color: tour.availableSlots <= 5 ? 'red' : '#1a67ba' }}>
                        {tour.availableSlots}
                    </strong>
                </div>

                <div className={styles.priceSection}>
                    {/* *** SỬ DỤNG TRƯỜNG originalPrice VÀ salePrice MỚI *** */}
                    {tour.discountPercentage > 0 && (
                        <div className={styles.originalPrice}>
                             {formatPrice(tour.originalPrice)} đ
                        </div>
                    )}
                    
                    <div className={styles.promotionalPrice}>
                         {formatPrice(tour.originalPrice-tour.salePrice)} đ
                    </div>
                    {/* {tour.departureID} */}
                    <button className={styles.bookingButton}  onClick={(e) => handleDepartureClick(e, tour.departureID)}>
                        Đặt ngay 
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SpecialTourItem;