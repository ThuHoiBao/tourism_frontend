// src/components/AdminComponent/Pages/DashboardPage/components/ChartsSection/BookingStatusChart/BookingStatusChart.jsx

import React from 'react';
import styles from './BookingStatusChart.module.scss';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FaCalendarCheck } from 'react-icons/fa';

const BookingStatusChart = ({ data }) => {
    // Màu sắc cho từng trạng thái
    const STATUS_COLORS = {
        'PAID': '#48bb78',
        'PENDING_CONFIRMATION': '#ed8936',
        'PENDING_PAYMENT': '#4299e1',
        'PENDING_REFUND': '#f56565',
        'CANCELLED': '#a0aec0',
        'REVIEWED': '#9f7aea',
        'OVERDUE_PAYMENT': '#f00505ff'
    };

    // Nhãn tiếng Việt cho trạng thái
    const STATUS_LABELS = {
        'PAID': 'Đã thanh toán',
        'PENDING_CONFIRMATION': 'Chờ xác nhận',
        'PENDING_PAYMENT': 'Chờ thanh toán',
        'PENDING_REFUND': 'Chờ hoàn tiền',
        'CANCELLED': 'Đã hủy',
        'REVIEWED': 'Đã đánh giá',
        'OVERDUE_PAYMENT': 'Quá hạn thanh toán'
    };

    // Chuyển đổi dữ liệu
    const chartData = data.map(item => ({
        name: STATUS_LABELS[item.status] || item.status,
        value: item.count,
        color: STATUS_COLORS[item.status] || '#cbd5e0'
    }));

    // Tính tổng bookings
    const totalBookings = data.reduce((sum, item) => sum + item.count, 0);

    return (
        <div className={styles.bookingStatusChart}>
            <div className={styles.chartHeader}>
                <FaCalendarCheck className={styles.icon} />
                <div>
                    <h3>Trạng thái booking</h3>
                    <p>{totalBookings} tổng bookings</p>
                </div>
            </div>

            <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => 
                                `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>

                {/* Custom Legend */}
                <div className={styles.legendCustom}>
                    {chartData.map((item, index) => (
                        <div key={index} className={styles.legendItem}>
                            <div 
                                className={styles.legendColor}
                                style={{ backgroundColor: item.color }}
                            />
                            <span className={styles.legendName}>{item.name}</span>
                            <span className={styles.legendValue}>{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BookingStatusChart;