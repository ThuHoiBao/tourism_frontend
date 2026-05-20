// src/components/AdminComponent/Pages/DashboardPage/components/StatsOverview/StatsOverview.jsx

import React from 'react';
import styles from './StatsOverview.module.scss';
import {
    Users, DollarSign, ShoppingBag, Map,
    TrendingUp, TrendingDown
} from 'lucide-react';

const StatsOverview = ({ stats }) => {

    // Hàm định dạng tiền tệ VND
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    // 1. Tính toán tổng doanh thu hiển thị (PAID + PENDING_CONFIRMATION)
    const totalRevenueDisplay = (stats.revenueStats.totalRevenue || 0);

    // 2. Cấu trúc dữ liệu cho các Cards
    const cards = [
        {
            title: 'Tổng Người Dùng',
            value: stats.userStats.totalUsers.toLocaleString(),
            subtitle: `${stats.userStats.activeUsers} đang hoạt động`,
            growth: stats.userStats.userGrowthRate,
            icon: Users,
            color: '#1f6fb2',
            bgColor: '#e0f2fe',
            borderColor: '#1f6fb2',
            details: null
        },
        {
            title: 'Tổng Doanh Thu',
            value: formatCurrency(totalRevenueDisplay),
            subtitle: `Tháng này: ${formatCurrency(stats.revenueStats.thisMonthRevenue)}`,
            growth: stats.revenueStats.revenueGrowthRate,
            icon: DollarSign,
            color: '#0f9f7a',
            bgColor: '#dcfce7',
            borderColor: '#10b981',
            details: [
                { label: 'Đã thanh toán (PAID)', value: formatCurrency(stats.revenueStats.totalRevenue) },
                { label: 'Chờ xác nhận', value: formatCurrency(stats.revenueStats.pendingConfirmation) },
                { label: 'Chờ hoàn tiền', value: formatCurrency(stats.revenueStats.pendingRefund || 0), isWarning: true },
                { label: 'Đã hủy (Mất)', value: formatCurrency(stats.revenueStats.cancelledRevenue || 0), isGray: true }
            ]
        },
        {
            title: 'Tổng Đơn Hàng',
            value: stats.bookingStats.totalBookings.toLocaleString(),
            subtitle: `${stats.bookingStats.paidBookings} đơn thành công`,
            growth: stats.bookingStats.conversionRate,
            icon: ShoppingBag,
            color: '#f59e0b',
            bgColor: '#fff7ed',
            borderColor: '#f59e0b',
            details: [
                { label: 'Đã thanh toán', value: stats.bookingStats.paidBookings },
                { label: 'Chờ xác nhận', value: stats.bookingStats.pendingConfirmation },
                { label: 'Chờ hoàn tiền', value: stats.bookingStats.pendingRefund, isWarning: true },
                { label: 'Đã hủy', value: stats.bookingStats.cancelledBookings, isGray: true }
            ]
        },
        {
            title: 'Tour Đang Hoạt Động',
            value: stats.tourStats.activeTours.toLocaleString(),
            subtitle: `${stats.tourStats.upcomingDepartures} chuyến sắp khởi hành`,
            growth: stats.tourStats.averageRating * 20,
            icon: Map,
            color: '#0891b2',
            bgColor: '#cffafe',
            borderColor: '#06b6d4',
            details: null
        }
    ];

    return (
        <div className={styles.statsOverview}>
            {cards.map((card, index) => (
                <div
                    key={index}
                    className={styles.statCard}
                    style={{ borderLeftColor: card.borderColor, color: card.color }}
                >
                    {/* --- HEADER CỦA CARD --- */}
                    <div className={styles.cardHeader}>
                        <div
                            className={styles.iconWrapper}
                            style={{
                                backgroundColor: card.bgColor,
                                color: card.color
                            }}
                        >
                            <card.icon size={22} />
                        </div>
                        {/* Badge tăng trưởng */}
                        <div className={`${styles.growthBadge} ${card.growth < 0 ? styles.negBadge : ''}`}>
                            {card.growth >= 0 ? (
                                <TrendingUp className={styles.positive} size={13} />
                            ) : (
                                <TrendingDown className={styles.negative} size={13} />
                            )}
                            <span className={card.growth >= 0 ? styles.positive : styles.negative}>
                                {Math.abs(card.growth || 0).toFixed(1)}%
                            </span>
                        </div>
                    </div>

                    {/* --- NỘI DUNG CHÍNH --- */}
                    <div className={styles.cardBody}>
                        <h3 className={styles.cardTitle}>{card.title}</h3>
                        <p className={styles.cardValue}>{card.value}</p>
                        <p className={styles.cardSubtitle}>{card.subtitle}</p>
                    </div>

                    {/* --- CHI TIẾT KHI HOVER --- */}
                    {card.details && (
                        <div
                            className={styles.hoverDetails}
                            style={{ borderLeftColor: card.borderColor }}
                        >
                            {card.details.map((detail, idx) => (
                                <div key={idx} className={styles.detailRow}>
                                    <span className={styles.detailLabel}>{detail.label}:</span>
                                    <span className={`
                                        ${styles.detailValue}
                                        ${detail.isWarning ? styles.warningText : ''}
                                        ${detail.isGray ? styles.grayText : ''}
                                    `}>
                                        {detail.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default StatsOverview;
