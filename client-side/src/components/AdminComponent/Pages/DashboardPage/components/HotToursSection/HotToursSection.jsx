// HotToursSection.jsx — clean redesign

import React from 'react';
import styles from './HotToursSection.module.scss';
import { FaFire, FaStar, FaUsers, FaTrophy, FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const RANK_STYLES = [
    { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c', label: '🥇' },
    { bg: '#fafafa', border: '#e5e7eb', text: '#374151', label: '🥈' },
    { bg: '#fefce8', border: '#fde68a', text: '#92400e', label: '🥉' },
];

const formatCurrency = (amount) => {
    if (!amount) return '0đ';
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)} Tr đ`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K đ`;
    return `${amount}đ`;
};

const HotToursSection = ({ hotTours }) => {
    const navigate = useNavigate();

    if (!hotTours || hotTours.length === 0) {
        return (
            <div className={styles.hotToursSection}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <FaTrophy className={styles.icon} />
                        <div>
                            <h3>Top Tours</h3>
                            <p>Xếp hạng theo booking</p>
                        </div>
                    </div>
                </div>
                <div className={styles.emptyState}>
                    <FaFire className={styles.emptyIcon} />
                    <p>Chưa có dữ liệu hot tours</p>
                </div>
            </div>
        );
    }

    const maxBookings = hotTours[0]?.bookingCount || 1;

    return (
        <div className={styles.hotToursSection}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <FaTrophy className={styles.icon} />
                    <div>
                        <h3>Top Tours</h3>
                        <p>Xếp hạng theo lượng booking</p>
                    </div>
                </div>
                <span className={styles.badge}>Top {hotTours.length}</span>
            </div>

            <div className={styles.list}>
                {hotTours.map((tour, index) => {
                    const rankStyle = RANK_STYLES[index] || RANK_STYLES[2];
                    const barWidth = maxBookings > 0
                        ? Math.round((tour.bookingCount / maxBookings) * 100)
                        : 0;

                    return (
                        <div
                            key={tour.tourId}
                            className={styles.row}
                            onClick={() => navigate(`/admin/tours/${tour.tourId}`)}
                        >
                            {/* Rank */}
                            <div
                                className={styles.rank}
                                style={{ background: rankStyle.bg, border: `1.5px solid ${rankStyle.border}`, color: rankStyle.text }}
                            >
                                {index < 3 ? rankStyle.label : `#${index + 1}`}
                            </div>

                            {/* Content */}
                            <div className={styles.content}>
                                <div className={styles.topLine}>
                                    <span className={styles.tourName}>{tour.tourName}</span>
                                    <FaArrowRight className={styles.arrow} />
                                </div>
                                <span className={styles.tourCode}>{tour.tourCode}</span>

                                {/* Stats inline */}
                                <div className={styles.stats}>
                                    <span className={styles.stat}>
                                        <FaUsers className={styles.statIcon} />
                                        {tour.bookingCount} bookings
                                    </span>
                                    <span className={styles.separator}>·</span>
                                    <span className={styles.stat}>
                                        💰 {formatCurrency(tour.revenue)}
                                    </span>
                                    {tour.averageRating > 0 && (
                                        <>
                                            <span className={styles.separator}>·</span>
                                            <span className={styles.stat}>
                                                <FaStar className={styles.starIcon} />
                                                {tour.averageRating.toFixed(1)}
                                            </span>
                                        </>
                                    )}
                                </div>

                                {/* Progress bar */}
                                <div className={styles.bar}>
                                    <div
                                        className={styles.fill}
                                        style={{
                                            width: `${barWidth}%`,
                                            background: index === 0 ? '#f97316'
                                                : index === 1 ? '#eab308'
                                                : index === 2 ? '#3b82f6'
                                                : '#9ca3af'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HotToursSection;
