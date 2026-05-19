// TourPerformanceChart — shows REVENUE per tour (different from HotTours booking rank)

import React from 'react';
import styles from './TourPerformanceChart.module.scss';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { BarChart3 } from 'lucide-react';

const COLORS = ['#2563eb', '#0891b2', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#0f766e', '#c2410c', '#4338ca'];

const formatRevenue = (value) => {
    if (!value && value !== 0) return '0đ';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}Tr`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return `${value}`;
};

const formatRevenueFull = (value) => {
    if (!value && value !== 0) return '0đ';
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} Triệu đồng`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K đ`;
    return `${value}đ`;
};

const shortenName = (name, max = 20) =>
    name && name.length > max ? name.slice(0, max) + '…' : (name || '');

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const d = payload[0]?.payload;
        return (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '12px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', maxWidth: 240 }}>
                <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#1a202c', fontSize: 13, lineHeight: 1.4 }}>{d?.fullName || label}</p>
                <p style={{ margin: '0 0 4px', color: '#16a34a', fontSize: 13 }}>
                    Doanh thu: <strong>{formatRevenueFull(d?.revenue ?? 0)}</strong>
                </p>
                <p style={{ margin: 0, color: '#2563eb', fontSize: 13 }}>
                    Bookings: <strong>{d?.bookingCount ?? 0}</strong>
                </p>
            </div>
        );
    }
    return null;
};

const TourPerformanceChart = ({ hotTours }) => {
    const data = (hotTours || [])
        .filter(t => t.tourName)
        .slice(0, 10)
        .sort((a, b) => (parseFloat(b.revenue) || 0) - (parseFloat(a.revenue) || 0))
        .map((t, i) => ({
            name: shortenName(t.tourName),
            fullName: t.tourName,
            bookingCount: t.bookingCount || 0,
            revenue: parseFloat(t.revenue) || 0,
            color: COLORS[i % COLORS.length],
        }));

    const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
    const isEmpty = data.length === 0 || data.every(d => d.revenue === 0);

    return (
        <div className={styles.tourPerformanceChart}>
            <div className={styles.chartHeader}>
                <div className={styles.titleRow}>
                    <BarChart3 className={styles.icon} size={22} />
                    <div>
                        <h3>Doanh thu theo tour</h3>
                        <p>Top {data.length} tour theo doanh thu kỳ này</p>
                    </div>
                </div>
                <div className={styles.totalBadge}>{formatRevenue(totalRevenue)} đ tổng</div>
            </div>

            {isEmpty ? (
                <div className={styles.emptyState}>
                    <BarChart3 size={40} color="#94a3b8" />
                    <p>Không có dữ liệu doanh thu trong kỳ này</p>
                    <span className={styles.emptyHint}>Thử chọn khoảng thời gian rộng hơn</span>
                </div>
            ) : (
                <div className={styles.chartContainer}>
                    <ResponsiveContainer width="100%" height={Math.max(280, data.length * 44)}>
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 4, right: 100, left: 8, bottom: 4 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" horizontal={false} />
                            <XAxis
                                type="number"
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={formatRevenue}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={160}
                                tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="revenue" radius={[0, 6, 6, 0]} maxBarSize={28}>
                                {data.map((entry, index) => (
                                    <Cell key={index} fill={entry.color} />
                                ))}
                                <LabelList
                                    dataKey="revenue"
                                    position="right"
                                    formatter={formatRevenue}
                                    style={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                                />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default TourPerformanceChart;
