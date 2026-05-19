// HotToursSection.jsx — Lucide React icons

import React from 'react';
import styles from './HotToursSection.module.scss';
import { Flame, Star, Users, Trophy, ArrowRight, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RANK_STYLES = [
    { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' },
    { bg: '#f9fafb', border: '#e5e7eb', text: '#374151' },
    { bg: '#fefce8', border: '#fde68a', text: '#92400e' },
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
                        <Trophy className={styles.icon} size={22} />
                        <div>
                            <h3>Top Tours</h3>
                            <p>Xếp hạng theo booking</p>
                        </div>
                    </div>
                </div>
                <div className={styles.emptyState}>
                    <Flame className={styles.emptyIcon} size={32} />
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
                    <Trophy className={styles.icon} size={22} />
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
                                {index + 1}
                            </div>

                            {/* Content */}
                            <div className={styles.content}>
                                <div className={styles.topLine}>
                                    <span className={styles.tourName}>{tour.tourName}</span>
                                    <ArrowRight className={styles.arrow} size={13} />
                                </div>
                                <span className={styles.tourCode}>{tour.tourCode}</span>

                                {/* Stats inline */}
                                <div className={styles.stats}>
                                    <span className={styles.stat}>
                                        <Users className={styles.statIcon} size={11} />
                                        {tour.bookingCount} bookings
                                    </span>
                                    <span className={styles.separator}>·</span>
                                    <span className={styles.stat}>
                                        <DollarSign className={styles.statIcon} size={11} />
                                        {formatCurrency(tour.revenue)}
                                    </span>
                                    {tour.averageRating > 0 && (
                                        <>
                                            <span className={styles.separator}>·</span>
                                            <span className={styles.stat}>
                                                <Star className={styles.starIcon} size={11} />
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
