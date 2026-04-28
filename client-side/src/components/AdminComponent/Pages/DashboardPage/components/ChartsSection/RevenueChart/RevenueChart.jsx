// src/components/AdminComponent/Pages/DashboardPage/components/ChartsSection/RevenueChart/RevenueChart.jsx

import React from 'react';
import styles from './RevenueChart.module.scss';
import {
    AreaChart, Area, LineChart, Line, XAxis, YAxis, 
    CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FaMoneyBillWave } from 'react-icons/fa';

const RevenueChart = ({ data }) => {
    // Hàm format tiền tệ VND
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            notation: 'compact',
            maximumFractionDigits: 1
        }).format(value);
    };

    // Hàm format ngày tháng
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getDate()}/${date.getMonth() + 1}`;
    };

    // Chuyển đổi dữ liệu cho biểu đồ
    const chartData = data.map(item => ({
        date: formatDate(item.date),
        revenue: item.revenue,
        bookings: item.bookingCount
    }));

    // Tính tổng doanh thu và booking
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const totalBookings = data.reduce((sum, item) => sum + item.bookingCount, 0);

    return (
        <div className={styles.revenueChart}>
            {/* Header của biểu đồ */}
            <div className={styles.chartHeader}>
                <div className={styles.headerLeft}>
                    <FaMoneyBillWave className={styles.icon} />
                    <div>
                        <h3>Xu hướng doanh thu (30 ngày gần nhất)</h3>
                        <p>Doanh thu và hiệu suất booking hàng ngày</p>
                    </div>
                </div>
                <div className={styles.headerStats}>
                    <div className={styles.stat}>
                        <span className={styles.label}>Tổng Doanh thu</span>
                        <span className={styles.value}>{formatCurrency(totalRevenue)}</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.label}>Tổng Bookings</span>
                        <span className={styles.value}>{totalBookings}</span>
                    </div>
                </div>
            </div>

            {/* Container chứa biểu đồ */}
            <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={chartData}>
                        {/* Gradient cho Area chart */}
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#48bb78" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#48bb78" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                            dataKey="date" 
                            tick={{ fill: '#718096', fontSize: 12 }}
                            stroke="#cbd5e0"
                        />
                        <YAxis 
                            tickFormatter={formatCurrency}
                            tick={{ fill: '#718096', fontSize: 12 }}
                            stroke="#cbd5e0"
                        />
                        <Tooltip 
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                            formatter={(value, name) => {
                                if (name === 'revenue') {
                                    return [formatCurrency(value), 'Doanh thu'];
                                }
                                return [value, 'Bookings'];
                            }}
                        />
                        <Legend 
                            wrapperStyle={{ paddingTop: '20px' }}
                            iconType="circle"
                        />
                        <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke="#48bb78" 
                            fillOpacity={1} 
                            fill="url(#colorRevenue)"
                            strokeWidth={2}
                        />
                        <Line 
                            type="monotone" 
                            dataKey="bookings" 
                            stroke="#4299e1" 
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RevenueChart;