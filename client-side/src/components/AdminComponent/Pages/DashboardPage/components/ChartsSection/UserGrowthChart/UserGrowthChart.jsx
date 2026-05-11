// src/components/AdminComponent/Pages/DashboardPage/components/ChartsSection/UserGrowthChart/UserGrowthChart.jsx

import React from 'react';
import styles from './UserGrowthChart.module.scss';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { FaUsers } from 'react-icons/fa';

// ─── Smart data aggregation ──────────────────────────────────────────────────
const aggregateData = (rawData) => {
    if (!rawData || rawData.length === 0) return [];

    // Daily: ≤ 62 points
    if (rawData.length <= 62) {
        return rawData.map(item => ({
            label: formatDateShort(item.date),
            newUsers: item.newUsers || 0,
        }));
    }
    // Weekly: ≤ 210 points
    if (rawData.length <= 210) {
        const weeks = {};
        rawData.forEach(item => {
            const d = new Date(item.date);
            // ISO week start (Monday)
            const day = d.getDay() || 7;
            const monday = new Date(d);
            monday.setDate(d.getDate() - day + 1);
            const key = monday.toISOString().slice(0, 10);
            if (!weeks[key]) weeks[key] = { label: formatDateShort(key), newUsers: 0 };
            weeks[key].newUsers += (item.newUsers || 0);
        });
        return Object.values(weeks);
    }
    // Monthly
    const months = {};
    rawData.forEach(item => {
        const key = item.date.slice(0, 7); // "yyyy-MM"
        if (!months[key]) {
            const [y, m] = key.split('-');
            months[key] = { label: `${m}/${y}`, newUsers: 0 };
        }
        months[key].newUsers += (item.newUsers || 0);
    });
    return Object.values(months);
};

const formatDateShort = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <p style={{ margin: 0, fontWeight: 600, color: '#1a202c', marginBottom: 4 }}>{label}</p>
                <p style={{ margin: 0, color: '#2563eb', fontSize: 13 }}>
                    User mới: <strong>{payload[0].value}</strong>
                </p>
            </div>
        );
    }
    return null;
};

const UserGrowthChart = ({ data }) => {
    const chartData = aggregateData(data);
    const totalNewUsers = data ? data.reduce((s, i) => s + (i.newUsers || 0), 0) : 0;
    const maxVal = Math.max(...chartData.map(d => d.newUsers), 1);

    return (
        <div className={styles.userGrowthChart}>
            <div className={styles.chartHeader}>
                <FaUsers className={styles.icon} />
                <div>
                    <h3>Tăng trưởng người dùng</h3>
                    <p>{totalNewUsers} người dùng mới trong kỳ này</p>
                </div>
                <div className={styles.totalBadge}>{totalNewUsers}</div>
            </div>

            <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                        <XAxis
                            dataKey="label"
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            axisLine={false}
                            tickLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="newUsers" radius={[6, 6, 0, 0]} maxBarSize={40}>
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={index}
                                    fill={entry.newUsers === maxVal ? '#2563eb' : '#bfdbfe'}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default UserGrowthChart;
