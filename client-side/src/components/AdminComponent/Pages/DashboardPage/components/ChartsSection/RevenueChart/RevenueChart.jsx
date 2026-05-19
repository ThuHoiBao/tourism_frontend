// src/components/AdminComponent/Pages/DashboardPage/components/ChartsSection/RevenueChart/RevenueChart.jsx

import React, { useState } from 'react';
import styles from './RevenueChart.module.scss';
import {
    AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, 
    CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { DollarSign } from 'lucide-react';

const CHART_TYPES = [
    { key: 'area', label: 'Area' },
    { key: 'line', label: 'Line' },
    { key: 'bar', label: 'Bar' },
];

// ─── Smart aggregation ────────────────────────────────────────────────────────
const aggregateRevenue = (rawData) => {
    if (!rawData || rawData.length === 0) return [];
    // Daily ≤ 62 pts
    if (rawData.length <= 62) {
        return rawData.map(item => ({
            label: fmtDate(item.date),
            revenue: Number(item.revenue) || 0,
            bookings: item.bookingCount || 0,
        }));
    }
    // Weekly ≤ 210 pts
    if (rawData.length <= 210) {
        const weeks = {};
        rawData.forEach(item => {
            const d = new Date(item.date);
            const day = d.getDay() || 7;
            const mon = new Date(d); mon.setDate(d.getDate() - day + 1);
            const key = mon.toISOString().slice(0, 10);
            if (!weeks[key]) weeks[key] = { label: fmtDate(key), revenue: 0, bookings: 0 };
            weeks[key].revenue += Number(item.revenue) || 0;
            weeks[key].bookings += item.bookingCount || 0;
        });
        return Object.values(weeks);
    }
    // Monthly
    const months = {};
    rawData.forEach(item => {
        const key = item.date.slice(0, 7);
        if (!months[key]) {
            const [y, m] = key.split('-');
            months[key] = { label: `${m}/${y}`, revenue: 0, bookings: 0 };
        }
        months[key].revenue += Number(item.revenue) || 0;
        months[key].bookings += item.bookingCount || 0;
    });
    return Object.values(months);
};

const fmtDate = (dateStr) => {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
};

const formatCurrency = (value) => {
    if (!value && value !== 0) return '0đ';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}Tr đ`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K đ`;
    return `${value}đ`;
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#1a202c' }}>{label}</p>
                {payload.map((p, i) => (
                    <p key={i} style={{ margin: '0 0 4px', color: p.color, fontSize: 13 }}>
                        {p.name === 'revenue' ? 'Doanh thu' : 'Bookings'}: <strong>{p.name === 'revenue' ? formatCurrency(p.value) : p.value}</strong>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const RevenueChart = ({ data, dateRange }) => {
    const [chartType, setChartType] = useState('area');

    const chartData = aggregateRevenue(data);
    const totalRevenue = data ? data.reduce((s, i) => s + (Number(i.revenue) || 0), 0) : 0;
    const totalBookings = data ? data.reduce((s, i) => s + (i.bookingCount || 0), 0) : 0;

    return (
        <div className={styles.revenueChart}>
            {/* Header của biểu đồ */}
            <div className={styles.chartHeader}>
                <div className={styles.headerLeft}>
                    <DollarSign className={styles.icon} size={22} />
                    <div>
                        <h3>Xu hướng doanh thu</h3>
                        <p>Doanh thu và hiệu suất booking theo ngày</p>
                    </div>
                </div>
                <div className={styles.headerRight}>
                    <div className={styles.chartTypeToggle}>
                        {CHART_TYPES.map(t => (
                            <button
                                key={t.key}
                                className={`${styles.toggleBtn} ${chartType === t.key ? styles.activeToggle : ''}`}
                                onClick={() => setChartType(t.key)}
                            >
                                {t.label}
                            </button>
                        ))}
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
            </div>

            {/* Container chứa biểu đồ */}
            <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height={350}>
                    {chartType === 'area' ? (
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.5}/>
                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                            <YAxis tickFormatter={formatCurrency} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '16px' }} iconType="circle" formatter={(v) => v === 'revenue' ? 'Doanh thu' : 'Bookings'} />
                            <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="url(#colorRevenue)" strokeWidth={2} dot={false} activeDot={{ r: 5 }} />
                            <Area type="monotone" dataKey="bookings" stroke="#06b6d4" fill="url(#colorBookings)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        </AreaChart>
                    ) : chartType === 'line' ? (
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                            <YAxis tickFormatter={formatCurrency} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" formatter={(v) => v === 'revenue' ? 'Doanh thu' : 'Bookings'} />
                            <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                            <Line type="monotone" dataKey="bookings" stroke="#06b6d4" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        </LineChart>
                    ) : (
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                            <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                            <YAxis tickFormatter={formatCurrency} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend iconType="circle" formatter={(v) => v === 'revenue' ? 'Doanh thu' : 'Bookings'} />
                            <Bar dataKey="revenue" fill="#2563eb" radius={[4,4,0,0]} maxBarSize={32} />
                            <Bar dataKey="bookings" fill="#06b6d4" radius={[4,4,0,0]} maxBarSize={32} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default RevenueChart;