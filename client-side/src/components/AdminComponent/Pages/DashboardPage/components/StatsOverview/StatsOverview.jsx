// src/components/AdminComponent/Pages/DashboardPage/components/StatsOverview/StatsOverview.jsx

import React from 'react';
import styles from './StatsOverview.module.scss';
import { 
    FaUsers, FaMoneyBillWave, FaCalendarCheck, 
    FaMapMarkedAlt, FaArrowUp, FaArrowDown 
} from 'react-icons/fa';

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
    // Lý do: Đơn chờ xác nhận có khả năng cao thành công nên tính vào tiềm năng doanh thu
    const totalRevenueDisplay = (stats.revenueStats.totalRevenue || 0) ;

    // 2. Cấu trúc dữ liệu cho các Cards
    const cards = [
        {
            title: 'Tổng Người Dùng',
            value: stats.userStats.totalUsers.toLocaleString(),
            subtitle: `${stats.userStats.activeUsers} đang hoạt động`,
            growth: stats.userStats.userGrowthRate,
            icon: FaUsers,
            color: '#4299e1',
            bgColor: '#ebf8ff',
            details: null // Không có chi tiết hover
        },
        {
            title: 'Tổng Doanh Thu',
            value: formatCurrency(totalRevenueDisplay),
            subtitle: `Tháng này: ${formatCurrency(stats.revenueStats.thisMonthRevenue)}`,
            growth: stats.revenueStats.revenueGrowthRate,
            icon: FaMoneyBillWave,
            color: '#48bb78',
            bgColor: '#f0fff4',
            // ✨ CHI TIẾT DOANH THU (Hover để xem)
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
            icon: FaCalendarCheck,
            color: '#ed8936',
            bgColor: '#fffaf0',
            // ✨ CHI TIẾT BOOKING (Hover để xem)
            details: [
                { label: 'Đã thanh toán', value: stats.bookingStats.paidBookings },
                { label: 'Chờ xác nhận', value: stats.bookingStats.pendingConfirmation },
                { label: 'Chờ hoàn tiền', value: stats.bookingStats.pendingRefund, isWarning: true },
                { label: 'Đã hủy', value: stats.bookingStats.cancelledBookings, isGray: true }
            ]
        },
        {
        title: 'TỔNG TOUR ĐANG HOẠT ĐỘNG',
            value: stats.tourStats.activeTours.toLocaleString(),
            subtitle: `${stats.tourStats.upcomingDepartures} chuyến sắp khởi hành`,
            growth: stats.tourStats.averageRating * 20, // Quy đổi rating 5 sao ra %
            icon: FaMapMarkedAlt,
            color: '#9f7aea',
            bgColor: '#faf5ff',
            details: null
        }
    ];

    return (
        <div className={styles.statsOverview}>
            {cards.map((card, index) => (
                <div 
                    key={index} 
                    className={styles.statCard}
                    style={{ borderTopColor: card.color }}
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
                            <card.icon />
                        </div>
                        {/* Badge tăng trưởng */}
                        <div className={styles.growthBadge}>
                            {card.growth >= 0 ? (
                                <FaArrowUp className={styles.positive} />
                            ) : (
                                <FaArrowDown className={styles.negative} />
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
                        <div className={styles.hoverDetails}>
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