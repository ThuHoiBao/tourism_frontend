// src/components/AdminComponent/Pages/DashboardPage/components/ChartsSection/ChartsSection.jsx

import React from 'react';
import styles from './ChartsSection.module.scss';
import RevenueChart from './RevenueChart/RevenueChart';
import UserGrowthChart from './UserGrowthChart/UserGrowthChart';
import BookingStatusChart from './BookingStatusChart/BookingStatusChart';
import TourPerformanceChart from './TourPerformanceChart/TourPerformanceChart';

const ChartsSection = ({ chartsData }) => {
    return (
        <div className={styles.chartsSection}>
            {/* Revenue Chart - Full Width */}
            <div className={styles.fullWidthChart}>
                <RevenueChart data={chartsData.revenueChart} />
            </div>

            {/* Two Column Charts */}
            <div className={styles.twoColumnCharts}>
                <div className={styles.chartCard}>
                    <UserGrowthChart data={chartsData.userGrowthChart} />
                </div>
                <div className={styles.chartCard}>
                    <BookingStatusChart data={chartsData.bookingStatusChart} />
                </div>
            </div>

            {/* Tour Performance - Full Width */}
            <div className={styles.fullWidthChart}>
                <TourPerformanceChart data={chartsData.tourPerformanceChart} />
            </div>
        </div>
    );
};

export default ChartsSection;