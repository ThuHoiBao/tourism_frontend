// src/components/AdminComponent/Pages/DashboardPage/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
import styles from './DashboardPage.module.scss';
import { useDashboard } from '../../../../hook/useDashboard.ts';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay/ErrorDisplay';
import StatsOverview from './components/StatsOverview/StatsOverview';
import ChartsSection from './components/ChartsSection/ChartsSection';
import AIAnalysisSection from './components/AIAnalysisSection/AIAnalysisSection';
import RecentActivities from './components/RecentActivities/RecentActivities';
import HotToursSection from './components/HotToursSection/HotToursSection';
import AttentionSection from './components/AttentionSection/AttentionSection';
import DashboardHeader from './components/DashboardHeader/DashboardHeader';

const DashboardPage = () => {
    const { stats, loading, error, dateRange, setDateRange, refetch } = useDashboard();
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('dashboard-dark-mode') === 'true';
    });

    useEffect(() => {
        localStorage.setItem('dashboard-dark-mode', darkMode);
    }, [darkMode]);

    return (
        <div className={`${styles.dashboardPage} ${darkMode ? styles.dark : ''}`}>
            <DashboardHeader
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                onRefresh={refetch}
                darkMode={darkMode}
                onToggleDarkMode={() => setDarkMode(d => !d)}
                loading={loading}
            />

            {loading ? (
                <LoadingSpinner />
            ) : error ? (
                <ErrorDisplay message={error} onRetry={refetch} />
            ) : !stats ? (
                <div className={styles.noData}>Không có dữ liệu</div>
            ) : (
                <>
                    <StatsOverview stats={stats} />

                    <AIAnalysisSection
                        analysis={stats.aiAnalysis}
                        dateRange={dateRange}
                    />

                    <ChartsSection
                        chartsData={stats.chartsData}
                        hotTours={stats.tourStats?.hotTours}
                        dateRange={dateRange}
                    />

                    <div className={styles.twoColumnGrid}>
                        <HotToursSection hotTours={stats.tourStats.hotTours} />
                        <RecentActivities activities={stats.recentActivities} />
                    </div>

                    <AttentionSection
                        tours={stats.tourStats.toursNeedingAttention}
                        pendingRefund={stats.bookingStats.pendingRefund}
                        pendingConfirmation={stats.bookingStats.pendingConfirmation}
                    />
                </>
            )}
        </div>
    );
};

export default DashboardPage;
