import React, { useState, useEffect } from 'react';
import { FaStar, FaRegStar, FaChevronLeft, FaChevronRight, FaImage } from 'react-icons/fa';
import axios from '../../../utils/axiosCustomize';
import styles from './TourReviews.module.scss';

const TourReviews = ({ tourCode }) => {
  const [reviews, setReviews] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (tourCode) {
      fetchReviews();
      fetchStatistics();
    }
  }, [tourCode, page]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/reviews/tour/${tourCode}?page=${page}&size=5`); 
      setReviews(response.data.content);
      setTotalPages(response.data.totalPages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`/reviews/tour/${tourCode}/statistics`);
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= rating ? 
          <FaStar key={i} /> : 
          <FaRegStar key={i} style={{ color: '#dfe6e9' }} />
      );
    }
    return stars;
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return `${Math.floor(diffDays / 365)} năm trước`;
  };

  if (loading && !statistics) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.reviewsContainer}>
      {/* 1. Header Section */}
      <h2 className={styles.sectionTitle}>Đánh giá từ khách du lịch</h2>

      {/* 2. Statistics Section (Clean Layout) */}
      {statistics && (
        <div className={styles.statisticsWrapper}>
          {/* Cột trái: Điểm số tổng quan */}
          <div className={styles.ratingOverview}>
            <div className={styles.bigScore}>
              {statistics.averageRating.toFixed(1)}
            </div>
            <div className={styles.bigStars}>
              {renderStars(Math.round(statistics.averageRating))}
            </div>
            <p className={styles.totalCount}>
              Dựa trên <strong>{statistics.totalReviews}</strong> lượt đánh giá
            </p>
          </div>

          {/* Cột phải: Các thanh tiến trình (Progress bars) */}
          <div className={styles.ratingBars}>
            {[5, 4, 3, 2, 1].map((star) => {
              const starKey = ['oneStar', 'twoStars', 'threeStars', 'fourStars', 'fiveStars'][star - 1];
              const percentKey = ['oneStarPercent', 'twoStarsPercent', 'threeStarsPercent', 'fourStarsPercent', 'fiveStarsPercent'][star - 1];
              const percentage = statistics[percentKey] || 0; // Fallback 0 nếu undefined

              return (
                <div key={star} className={styles.barRow}>
                  <div className={styles.starLabel}>
                    <span>{star}</span> <FaStar />
                  </div>
                  <div className={styles.progressTrack}>
                    <div 
                      className={styles.progressFill}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className={styles.percentLabel}>{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Reviews List */}
      <div className={styles.reviewsList}>
        {reviews.length === 0 ? (
          <div className={styles.noReviews}>
            <p>Chưa có đánh giá nào cho tour này.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.reviewId} className={styles.reviewItem}>
              {/* Header của từng review (Avatar, Tên, Sao) */}
              <div className={styles.reviewHeader}>
                {review.user.avatar ? (
                  <img 
                    src={review.user.avatar} 
                    alt={review.user.fullName}
                    className={styles.userAvatar}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {review.user.fullName?.charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div className={styles.userInfo}>
                  <h4 className={styles.userName}>{review.user.fullName}</h4>
                  <span className={styles.timeAgo}>{getTimeAgo(review.createdAt)}</span>
                </div>

                {/* Sao nhỏ nằm gọn bên phải hoặc thẳng hàng tên */}
                <div className={styles.miniStars}>
                  {renderStars(review.rating)}
                </div>
              </div>

              {/* Nội dung review (Comment + Ảnh) - Thụt vào trong */}
              <div className={styles.reviewBody}>
                <p className={styles.comment}>{review.comment}</p>

                {review.images && review.images.length > 0 && (
                  <div className={styles.reviewImages}>
                    {review.images.map((img, idx) => (
                      <div 
                        key={idx}
                        className={styles.imageWrapper}
                        onClick={() => setSelectedImage(img)}
                      >
                        <img 
                          src={img} 
                          alt={`Review ${idx}`}
                          className={styles.reviewImage}
                        />
                        {/* Overlay icon ảnh (tùy chọn, CSS xử lý hover) */}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 4. Pagination (Pill Shape) */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            onClick={() => setPage(page - 1)} 
            disabled={page === 0}
            className={styles.paginationBtn}
          >
            <FaChevronLeft />
          </button>
          
          {[...Array(totalPages)].map((_, idx) => (
            <button
              key={idx}
              onClick={() => setPage(idx)}
              className={`${styles.pageNumber} ${page === idx ? styles.active : ''}`}
            >
              {idx + 1}
            </button>
          ))}
          
          <button 
            onClick={() => setPage(page + 1)} 
            disabled={page >= totalPages - 1}
            className={styles.paginationBtn}
          >
            <FaChevronRight />
          </button>
        </div>
      )}

      {/* 5. Image Modal (Lightroom style) */}
      {selectedImage && (
        <div 
          className={styles.imageModal}
          onClick={() => setSelectedImage(null)}
        >
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <img 
              src={selectedImage} 
              alt="Review Fullsize"
              className={styles.modalImage}
            />
            <button 
              onClick={() => setSelectedImage(null)}
              className={styles.closeButton}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourReviews;