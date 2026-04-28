// src/components/AdminComponent/Pages/DashboardPage/DashboardPage.jsx

import React from 'react';
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
import { FaSync } from 'react-icons/fa';

const DashboardPage = () => {
    const { stats, loading, error, refetch } = useDashboard();

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <ErrorDisplay message={error} onRetry={refetch} />;
    }

    if (!stats) {
        return <div>No data available</div>;
    }

    return (
        <div className={styles.dashboardPage}>
            {/* Header */}
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Dashboard Analytics</h1>
                    <p className={styles.pageSubtitle}>
                        Thống kê tổng quan về hiệu suất kinh doanh và hoạt động gần đây
                    </p>
                </div>
                {/* <button 
                    className={styles.refreshBtn}
                    onClick={refetch}
                    title="Refresh data"
                >
                    <FaSync /> Refresh
                </button> */}
            </div>

            {/* Stats Overview Cards */}
            <StatsOverview stats={stats} />

            {/* AI Analysis Section */}
            <AIAnalysisSection analysis={stats.aiAnalysis} />

            {/* Charts Grid */}
            <ChartsSection chartsData={stats.chartsData} />

            {/* Two Column Layout */}
            <div className={styles.twoColumnGrid}>
                {/* Hot Tours */}
                <HotToursSection hotTours={stats.tourStats.hotTours} />

                {/* Recent Activities */}
                <RecentActivities activities={stats.recentActivities} />
            </div>

            {/* Tours Needing Attention */}
            <AttentionSection 
                tours={stats.tourStats.toursNeedingAttention}
                pendingRefund={stats.bookingStats.pendingRefund}
                pendingConfirmation={stats.bookingStats.pendingConfirmation}
            />
        </div>
    );
};

export default DashboardPage;