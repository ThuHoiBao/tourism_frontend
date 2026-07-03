import React from 'react';
import dashboardStyles from '../DashboardPage/DashboardPage.module.scss';
import VectorSyncSection from '../DashboardPage/components/VectorSyncSection/VectorSyncSection';

const ChatbotSyncPage = () => {
    return (
        <div className={dashboardStyles.dashboardPage}>
            <VectorSyncSection allHistory />
        </div>
    );
};

export default ChatbotSyncPage;
