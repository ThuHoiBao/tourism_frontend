// src/components/AdminComponent/Pages/DashboardPage/components/ChartsSection/UserGrowthChart/UserGrowthChart.jsx

import React from 'react';
import styles from './UserGrowthChart.module.scss';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FaUsers } from 'react-icons/fa';

const UserGrowthChart = ({ data }) => {
    // Hàm format ngày tháng
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getDate()}/${date.getMonth() + 1}`;
    };

    // Chuyển đổi dữ liệu
    const chartData = data.map(item => ({
        date: formatDate(item.date),
        newUsers: item.newUsers,
        totalUsers: item.totalUsers
    }));

    // Tính tổng user mới
    const totalNewUsers = data.reduce((sum, item) => sum + item.newUsers, 0);

    return (
        <div className={styles.userGrowthChart}>
            <div className={styles.chartHeader}>
                <FaUsers className={styles.icon} />
                <div>
                    <h3>Tăng trưởng người dùng</h3>
                    <p>{totalNewUsers} Người dùng mới trong 30 ngày qua</p>
                </div>
            </div>

            <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                            dataKey="date" 
                            tick={{ fill: '#718096', fontSize: 11 }}
                            stroke="#cbd5e0"
                        />
                        <YAxis 
                            tick={{ fill: '#718096', fontSize: 11 }}
                            stroke="#cbd5e0"
                        />
                        <Tooltip 
                            contentStyle={{
                                backgroundColor: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px'
                            }}
                        />
                        <Legend iconType="circle" />
                        <Line 
                            type="monotone" 
                            dataKey="newUsers" 
                            stroke="#4299e1" 
                            strokeWidth={2}
                            name="User Mới"
                            dot={{ r: 2 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default UserGrowthChart;