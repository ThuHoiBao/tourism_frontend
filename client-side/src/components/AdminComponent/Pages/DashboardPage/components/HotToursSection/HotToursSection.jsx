// src/components/AdminComponent/Pages/DashboardPage/components/HotToursSection/HotToursSection.jsx

import React from 'react';
import styles from './HotToursSection.module.scss';
import { FaFire, FaStar, FaUsers, FaChartLine } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const HotToursSection = ({ hotTours }) => {
    const navigate = useNavigate();

    // Format tiền tệ
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            notation: 'compact',
            maximumFractionDigits: 1
        }).format(amount);
    };

    // Xử lý click vào tour
    const handleTourClick = (tourId) => {
        navigate(`/admin/tours/${tourId}`);
    };

    // Lấy màu theo thứ hạng
    const getRankColor = (index) => {
        switch (index) {
            case 0: return '#ef4444'; // Red - #1
            case 1: return '#f59e0b'; // Orange - #2
            case 2: return '#3b82f6'; // Blue - #3
            default: return '#6b7280'; // Gray
        }
    };

    return (
        <div className={styles.hotToursSection}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.iconWrapper}>
                        <FaFire />
                    </div>
                    <h3>Hot Tours</h3>
                </div>
                <span className={styles.badge}>Top {hotTours.length}</span>
            </div>

            <div className={styles.toursList}>
                {hotTours.length > 0 ? (
                    hotTours.map((tour, index) => (
                        <div 
                            key={tour.tourId} 
                            className={styles.tourCard}
                            onClick={() => handleTourClick(tour.tourId)}
                        >
                            {/* Rank Badge */}
                            <div 
                                className={styles.rankBadge}
                                style={{ background: getRankColor(index) }}
                            >
                                #{index + 1}
                            </div>
                            
                            <div className={styles.tourContent}>
                                {/* Tour Header */}
                                <div className={styles.tourHeader}>
                                    <h4 className={styles.tourName}>{tour.tourName}</h4>
                                    <span className={styles.tourCode}>{tour.tourCode}</span>
                                </div>

                                {/* Tour Stats Grid */}
                                <div className={styles.statsGrid}>
                                    <div className={styles.statItem}>
                                        <div className={styles.statIcon}>
                                            <FaChartLine />
                                        </div>
                                        <div className={styles.statInfo}>
                                            <span className={styles.statLabel}>Doanh thu</span>
                                            <span className={styles.statValue}>
                                                {formatCurrency(tour.revenue)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={styles.statItem}>
                                        <div className={styles.statIcon}>
                                            <FaUsers />
                                        </div>
                                        <div className={styles.statInfo}>
                                            <span className={styles.statLabel}>Bookings</span>
                                            <span className={styles.statValue}>
                                                {tour.bookingCount}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={styles.statItem}>
                                        <div className={styles.statIcon}>
                                            <FaStar />
                                        </div>
                                        <div className={styles.statInfo}>
                                            <span className={styles.statLabel}>Đánh giá</span>
                                            <span className={styles.statValue}>
                                                {tour.averageRating.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Performance Bar */}
                                <div className={styles.performanceBar}>
                                    <div 
                                        className={styles.progressFill}
                                        style={{ 
                                            width: `${(tour.bookingCount / hotTours[0].bookingCount) * 100}%`,
                                            background: getRankColor(index)
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <FaFire />
                        </div>
                        <p>Chưa có dữ liệu hot tours</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HotToursSection;