// src/components/AdminComponent/Pages/DashboardPage/components/ChartsSection/TourPerformanceChart/TourPerformanceChart.jsx

import React from 'react';
import styles from './TourPerformanceChart.module.scss';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FaMapMarkedAlt } from 'react-icons/fa';

const TourPerformanceChart = ({ data }) => {
    // Format tiền tệ
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            notation: 'compact',
            maximumFractionDigits: 1
        }).format(value);
    };

    // Cắt ngắn tên tour nếu quá dài
    const chartData = data.map(item => ({
        name: item.tourName.length > 20 
            ? item.tourName.substring(0, 20) + '...' 
            : item.tourName,
        bookings: item.bookings,
        revenue: item.revenue,
        rating: item.rating
    }));

    return (
        <div className={styles.tourPerformanceChart}>
            <div className={styles.chartHeader}>
                <FaMapMarkedAlt className={styles.icon} />
                <div>
                    <h3>Hiệu suất tour hàng đầu</h3>
                    <p>Bookings và doanh thu theo tour</p>
                </div>
            </div>

            <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                            dataKey="name" 
                            tick={{ fill: '#718096', fontSize: 11 }}
                            angle={-45}
                            textAnchor="end"
                            height={100}
                        />
                        <YAxis 
                            yAxisId="left"
                            tick={{ fill: '#718096', fontSize: 11 }}
                        />
                        <YAxis 
                            yAxisId="right"
                            orientation="right"
                            tickFormatter={formatCurrency}
                            tick={{ fill: '#718096', fontSize: 11 }}
                        />
                        <Tooltip 
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px'
                            }}
                            formatter={(value, name) => {
                                if (name === 'revenue') {
                                    return [formatCurrency(value), 'Doanh thu'];
                                }
                                return [value, name];
                            }}
                        />
                        <Legend />
                        <Bar 
                            yAxisId="left"
                            dataKey="bookings" 
                            fill="#4299e1" 
                            name="Bookings"
                            radius={[8, 8, 0, 0]}
                        />
                        <Bar 
                            yAxisId="right"
                            dataKey="revenue" 
                            fill="#48bb78" 
                            name="Doanh thu"
                            radius={[8, 8, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TourPerformanceChart;