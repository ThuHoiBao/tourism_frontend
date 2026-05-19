// src/components/InformationComponent/TransactionList/ViewReviewModal/ViewReviewModal.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ViewReviewModal.module.scss';
import { FaTimes, FaStar, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { getReviewByBookingIdApi } from '../../../../services/review/review.ts';

// --- HÀM CHUYỂN ĐỔI RATING SANG ICON CẢM XÚC MESSENGER STYLE ---
const getEmotionIcon = (rating, styles) => {
    switch (rating) {
        case 5:
            return {
                icon: <div className={styles.emotionIcon} style={{ color: '#e74c3c' }}>🥰</div>,
                label: "Tuyệt vời"
            };
        case 4:
            return {
                icon: <div className={styles.emotionIcon} style={{ color: '#e91e63' }}>😍</div>,
                label: "Hài lòng"
            };
        case 3:
            return {
                icon: <div className={styles.emotionIcon} style={{ color: '#f39c12' }}>😆</div>,
                label: "Bình thường"
            };
        case 2:
            return {
                icon: <div className={styles.emotionIcon} style={{ color: '#95a5a6' }}>😢</div>,
                label: "Không hài lòng"
            };
        case 1:
            return {
                icon: <div className={styles.emotionIcon} style={{ color: '#e67e22' }}>😠</div>,
                label: "Tệ"
            };
        default:
            return { icon: null, label: "N/A" };
    }
};
// --- END HÀM CHUYỂN ĐỔI ---

const ViewReviewModal = ({ booking, onClose, formatPrice, formatDate }) => {
    const [reviewData, setReviewData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lightboxImage, setLightboxImage] = useState(null); 
    const [currentImageIndex, setCurrentImageIndex] = useState(0); 

    useEffect(() => {
        const fetchReview = async () => {
            document.body.style.overflow = 'hidden';
            try {
                const data = await getReviewByBookingIdApi(booking.bookingID);
                setReviewData(data);
            } catch (err) {
                setError("Không thể tải chi tiết đánh giá.");
                console.error("Fetch Review Error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReview();
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [booking.bookingID]);

    const renderStars = (rating) => {
        return Array.from({ length: 5 }, (_, index) => (
            <FaStar key={index} color={index < rating ? "#ffc107" : "#e4e5e9"} />
        ));
    };
    
    const openLightbox = (url, index) => {
        setLightboxImage(url);
        setCurrentImageIndex(index);
    };

    const navigateLightbox = (direction) => {
        if (!reviewData || !reviewData.imageUrls) return;
        const total = reviewData.imageUrls.length;
        let newIndex = currentImageIndex + direction;
        
        if (newIndex < 0) {
            newIndex = total - 1;
        } else if (newIndex >= total) {
            newIndex = 0;
        }

        setCurrentImageIndex(newIndex);
        setLightboxImage(reviewData.imageUrls[newIndex]);
    };


    if (loading) {
        return createPortal(<div className={styles.modalOverlay}><div className={styles.loading}>Đang tải...</div></div>, document.body);
    }

    if (error) {
        return createPortal(<div className={styles.modalOverlay}><div className={styles.error}>{error}</div></div>, document.body);
    }
    
    const emotion = reviewData ? getEmotionIcon(reviewData.rating, styles) : { icon: null, label: "N/A" };

    const closeLightbox = () => setLightboxImage(null);

    const lightboxJSX = lightboxImage && reviewData.imageUrls.length > 0 && (
        <div className={styles.lightboxOverlay} onClick={closeLightbox}>
            <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
                
                {/* 💡 Nút Đóng TOP (X) */}
                <button className={styles.closeLightboxTop} onClick={closeLightbox} type="button">
                     <FaTimes />
                </button> 
                
                <img src={lightboxImage} alt="Ảnh đánh giá lớn" />
                
                {/* Controls (Nút chuyển ảnh) */}
                {reviewData.imageUrls.length > 1 && (
                    <div className={styles.lightboxControls}>
                        <button className={styles.navButton} onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }} type="button">
                            <FaChevronLeft />
                        </button>
                        <button className={styles.navButton} onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }} type="button">
                            <FaChevronRight />
                        </button>
                    </div>
                )}
                
                {/* 💡 Nút Đóng BOTTOM (Đóng modal) */}
                <button className={styles.closeLightboxBottom} onClick={closeLightbox} type="button">
                    <FaTimes /> Đóng
                </button>
                
            </div>
        </div>
    );

    const modalJSX = (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}> 
                
                {/* FIXED HEADER */}
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Xem Đánh Giá</h2>
                    <button className={styles.closeButton} onClick={onClose} type="button"><FaTimes /></button>
                </div>

                {/* SCROLLABLE BODY */}
                <div className={styles.modalBody}>
                    {/* 1. Thông tin chuyến đi */}
                    <div className={styles.tourSummary}>
                        <img src={booking.image || 'placeholder.png'} alt={booking.tourName} className={styles.tourImage} />
                        <div className={styles.tourDetails}>
                            <h4>{booking.tourName}</h4>
                            <p>Mã Booking: {booking.bookingCode}</p>
                            <p>Mã chuyến: {booking.tourCode}</p>
                        </div>
                    </div>
                    
                    {/* 2. Review Section (Tích hợp Gallery) */}
                    {reviewData && (
                        <div className={styles.reviewSection}>
                            
                            {/* 💡 TIÊU ĐỀ PHẦN ĐÁNH GIÁ */}
                            <h3 className={styles.reviewHeader}>
                                Cảm nhận về chuyến đi
                            </h3>
                            
                            {/* 💡 COMMENT (Nằm trên) */}
                            <p className={styles.comment}>{reviewData.comment || 'Không có bình luận.'}</p>
                            
                            {/* 💡 IMAGE GALLERY (Tích hợp vào đây) */}
                            {reviewData.imageUrls && reviewData.imageUrls.length > 0 && (
                                <div className={styles.gallerySection}>
                                    <h3>Ảnh đã đính kèm ({reviewData.imageUrls.length})</h3>
                                    <div className={styles.imageGrid}>
                                        {reviewData.imageUrls.map((url, index) => (
                                            <img
                                                key={index}
                                                src={url}
                                                alt={`Ảnh ${index + 1}`}
                                                onClick={() => openLightbox(url, index)} 
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* 💡 RATING & EMOTION (Nằm dưới) */}
                            <div className={styles.ratingFooter}>
                                
                                {/* SAO VÀ ĐIỂM SỐ GỐC */}
                                <div className={styles.smallRating}>
                                    <div className={styles.stars}>{renderStars(reviewData.rating)}</div>
                                    <span className={styles.ratingValue}>
                                        {reviewData.rating}<span>/5</span>
                                    </span>
                                </div>

                                {/* ICON CẢM XÚC LỚN + LABEL */}
                                <div className={styles.emotionContainer}>
                                    {emotion.icon}
                                    <span className={styles.emotionLabel}>{emotion.label}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* FIXED FOOTER
                <div className={styles.modalFooter}>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <FaTimes /> Đóng
                    </button>
                </div> */}

                {lightboxJSX}
            </div>
        </div>
    );

    return createPortal(modalJSX, document.body);
};

export default ViewReviewModal;
