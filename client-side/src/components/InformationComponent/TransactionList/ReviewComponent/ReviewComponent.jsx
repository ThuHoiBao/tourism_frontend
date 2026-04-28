// src/components/InformationComponent/TransactionList/ReviewComponent/ReviewComponent.jsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './ReviewComponent.module.scss';
import { FaTimes, FaStar, FaUpload } from 'react-icons/fa';
import { submitReviewApi } from '../../../../services/review/review.ts'; // Import API

const MIN_COMMENT_LENGTH = 10;
const MAX_IMAGES = 5; // Giới hạn ảnh

const ReviewComponent = ({ booking, onClose, onRefetch }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [images, setImages] = useState([]); // Lưu trữ File objects
    const [previewUrls, setPreviewUrls] = useState([]); // Lưu trữ URL tạm thời để hiển thị
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [finalModal, setFinalModal] = useState(null); // { success: boolean, points: number }
    
    // --- Helpers ---
    const getEmotionIcon = (value) => {
        switch (value) {
            case 5:
                return { emoji: '😍', label: 'Tuyệt vời', color: '#52c41a' };
            case 4:
                return { emoji: '😊', label: 'Hài lòng', color: '#87d068' };
            case 3:
                return { emoji: '😐', label: 'Bình thường', color: '#ffc107' };
            case 2:
                return { emoji: '😟', label: 'Không hài lòng', color: '#ff9800' };
            case 1:
                return { emoji: '😢', label: 'Rất tệ', color: '#ff4d4f' };
            default:
                return { emoji: null, label: '', color: '' };
        }
    };
    
    const getCoinPoints = (commentLength, imageCount) => {
        if (commentLength < MIN_COMMENT_LENGTH) return 0;
        if (imageCount === 0) return 5;
        if (imageCount === 1) return 7;
        if (imageCount > 1) return 10;
        return 0;
    };

    const currentPoints = getCoinPoints(comment.length, images.length);
    
    // --- Xử lý File Input ---
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const newImages = [...images, ...files].slice(0, MAX_IMAGES);
        
        setImages(newImages);
        
        // Tạo URL tạm thời để hiển thị ảnh
        const newPreviewUrls = newImages.map(file => URL.createObjectURL(file));
        setPreviewUrls(newPreviewUrls);
    };

    const handleRemoveImage = (index) => {
        const updatedImages = images.filter((_, i) => i !== index);
        const updatedPreviewUrls = previewUrls.filter((_, i) => i !== index);
        
        setImages(updatedImages);
        setPreviewUrls(updatedPreviewUrls);
    };

    // --- Xử lý Submit ---
    const handleSubmit = async () => {
        if (rating === 0) {
            setSubmitError("Vui lòng chọn số sao đánh giá.");
            return;
        }
        if (comment.length < MIN_COMMENT_LENGTH) {
            setSubmitError(`Bình luận phải có ít nhất ${MIN_COMMENT_LENGTH} ký tự.`);
            return;
        }
        
        setIsSubmitting(true);
        setSubmitError(null);
        
        try {
            const reviewData = {
                rating,
                comment,
                images,
                tourID: booking.tourID,
                bookingID: booking.bookingID
            };
            
            const response = await submitReviewApi(reviewData);
            
            // Sau khi thành công, hiển thị modal cuối cùng
            const awardedPoints = getCoinPoints(comment.length, images.length);
            setFinalModal({ success: true, points: awardedPoints });
            
        } catch (err) {
            console.error("Lỗi gửi đánh giá:", err);
            setFinalModal({ success: false, points: 0 });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // --- Render Final Modal (Thành công/Lỗi) ---
    if (finalModal) {
        const finalModalJSX = (
            <div className={styles.finalOverlay} onClick={finalModal.success ? onRefetch : onClose}>
                <div className={styles.finalContent} onClick={e => e.stopPropagation()}>
                    <h3 className={styles.finalTitle}>
                        {finalModal.success ? "Gửi đánh giá thành công! 🎉" : "Gửi đánh giá thất bại 😟"}
                    </h3>
                    <p className={styles.finalMessage}>
                        {finalModal.success 
                            ? `Cảm ơn quý khách đã nêu cảm nhận của mình về chuyến đi. Quý khách nhận được ${finalModal.points} điểm thưởng!`
                            : "Đã xảy ra lỗi trong quá trình gửi đánh giá. Vui lòng thử lại hoặc liên hệ hỗ trợ."
                        }
                    </p>
                    <button 
                        className={styles.btnCloseFinal} 
                        onClick={finalModal.success ? () => window.location.reload() : onClose} // Tải lại trang nếu thành công
                    >
                        Đóng
                    </button>
                </div>
            </div>
        );
        return createPortal(finalModalJSX, document.body);
    }

    const emotionData = getEmotionIcon(rating);

    // --- Render Review Component ---
    const reviewModalJSX = (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose} disabled={isSubmitting}>
                    <FaTimes />
                </button>

                {/* Header cố định */}
                <div className={styles.modalHeader}>
                    <div className={styles.headerIcon}>✍️</div>
                    <div className={styles.headerText}>
                        <h2 className={styles.modalTitle}>Viết đánh giá</h2>
                        <p className={styles.modalSubtitle}>Chia sẻ trải nghiệm của bạn cùng mọi người</p>
                    </div>
                </div>

                <div className={styles.mainContent}>
                    {/* 1. Thông tin Tour */}
                    <div className={styles.tourInfo}>
                        <img src={booking.image || 'placeholder.png'} alt={booking.tourName} className={styles.tourImage} />
                        <div className={styles.tourDetails}>
                            <h4>{booking.tourName}</h4>
                            <p>Mã Booking: {booking.bookingCode}</p>
                        </div>
                    </div>
                    
                    {/* 2. Hướng dẫn nhận điểm */}
                    <div className={styles.coinGuide}>
                        <details>
                            <summary className={styles.guideSummary}>
                                Xem Hướng dẫn đánh giá chuẩn để nhận đến 10 điểm !
                            </summary>
                            <div className={styles.guideDetail}>
                                <p>⭐ Điều kiện nhận điểm thưởng :</p>
                                <ul>
                                    <li> 5 điểm: Đánh giá trên 10 ký tự không kèm ảnh.</li>
                                    <li> 7 điểm: Đánh giá trên 10 ký tự kèm 1 ảnh.</li>
                                    <li> 10 điểm: Đánh giá trên 10 ký tự kèm nhiều hơn 1 ảnh (từ 2 ảnh trở lên).</li>
                                    <li> Nếu đánh giá dưới 10 ký tự hoặc không đạt điều kiện trên, bạn sẽ không nhận được điểm.</li>
                                </ul>
                            </div>
                        </details>
                    </div>

                    {/* 3. Rating + Emotion */}
                    <div className={styles.ratingSection}>
                        <p className={styles.ratingLabel}>Đánh giá Tour *</p>
                        <div className={styles.starContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <FaStar
                                    key={star}
                                    className={styles.star}
                                    color={star <= rating ? '#ffc107' : '#e4e5e9'}
                                    onClick={() => setRating(star)}
                                />
                            ))}
                        </div>
                        {emotionData.emoji && (
                            <div className={styles.emotionDisplay}>
                                <span className={styles.emotionEmoji} style={{ color: emotionData.color }}>
                                    {emotionData.emoji}
                                </span>
                                <span className={styles.emotionLabel} style={{ color: emotionData.color }}>
                                    {emotionData.label}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* 4. Comment */}
                    <div className={styles.commentSection}>
                        <textarea
                            placeholder="Viết cảm nhận của bạn về chuyến đi..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                        />
                        <p className={styles.charCount}>
                            {comment.length} / {MIN_COMMENT_LENGTH} ký tự (Tối thiểu cho điểm)
                        </p>
                    </div>

                    {/* 5. Image Upload */}
                    <div className={styles.imageSection}>
                        <div className={styles.imageList}>
                            {images.length < MAX_IMAGES && (
                                <label className={styles.addImageButton}>
                                    <FaUpload /> Thêm ảnh ({images.length}/{MAX_IMAGES})
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        style={{ display: 'none' }}
                                        disabled={images.length >= MAX_IMAGES || isSubmitting}
                                    />
                                </label>
                            )}
                            
                            {previewUrls.map((url, index) => (
                                <div key={index} className={styles.imagePreview}>
                                    <img src={url} alt={`Review ${index + 1}`} />
                                    <button onClick={() => handleRemoveImage(index)} className={styles.removeImage}>
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                        <p className={styles.imageHelper}>Cảm ơn bạn đã chia sẻ cảm nhận về chuyến đi! Những cảm nhận của bạn sẽ giúp chúng tôi và mọi người hiểu rõ hơn về chuyến đi !!</p>
                    </div>

                    {submitError && <p className={styles.error}>{submitError}</p>}
                </div>

                {/* Footer cố định */}
                <div className={styles.stickyFooter}>
                    <button 
                        className={styles.btnCancel} 
                        onClick={onClose} 
                        disabled={isSubmitting}
                    >
                        Hủy
                    </button>
                    <button 
                        className={styles.btnSubmit} 
                        onClick={handleSubmit} 
                        disabled={isSubmitting || rating === 0 }
                    >
                        {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(reviewModalJSX, document.body);
};

export default ReviewComponent;