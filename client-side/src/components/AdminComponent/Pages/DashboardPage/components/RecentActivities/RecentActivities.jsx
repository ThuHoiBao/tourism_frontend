// src/components/AdminComponent/Pages/DashboardPage/components/RecentActivities/RecentActivities.jsx

import React from 'react';
import styles from './RecentActivities.module.scss';
import { 
    FaCalendarCheck, 
    FaUser, 
    FaStar, 
    FaUndo, 
    FaClock,
    FaInbox
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const RecentActivities = ({ activities }) => {
    const navigate = useNavigate();

    // Lấy icon tương ứng với loại hoạt động
    const getActivityIcon = (type) => {
        switch (type) {
            case 'BOOKING': return <FaCalendarCheck />;
            case 'USER': return <FaUser />;
            case 'REVIEW': return <FaStar />;
            case 'REFUND': return <FaUndo />;
            default: return <FaClock />;
        }
    };

    // Lấy class CSS theo mức độ nghiêm trọng
    const getSeverityClass = (severity) => {
        switch (severity) {
            case 'URGENT': return styles.urgent;
            case 'WARNING': return styles.warning;
            default: return styles.info;
        }
    };

    // Lấy label hiển thị cho severity
    const getSeverityLabel = (severity) => {
        switch (severity) {
            case 'URGENT': return 'Khẩn cấp';
            case 'WARNING': return 'Cảnh báo';
            default: return 'Thông tin';
        }
    };

    // Xử lý khi click vào activity
    const handleActivityClick = (activity) => {
        if (activity.type === 'BOOKING' || activity.type === 'REFUND') {
            // Điều hướng sang trang Bookings và tìm kiếm theo Booking Code
            navigate(`/admin/bookings?search=${activity.relatedCode}`);
        } else if (activity.type === 'USER') {
            // Điều hướng sang trang Users và tìm kiếm theo Email
            navigate(`/admin/users?search=${activity.relatedCode}`);
        }
    };

    // Format thời gian tương đối
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút`;
        if (diffHours < 24) return `${diffHours} giờ`;
        if (diffDays === 1) return 'Hôm qua';
        return `${diffDays} ngày`;
    };

    return (
        <div className={styles.recentActivities}>
            <div className={styles.header}>
                <h3>Hoạt động gần đây</h3>
                <span className={styles.badge}>{activities.length}</span>
            </div>

            <div className={styles.activitiesList}>
                {activities.length > 0 ? (
                    activities.map((activity, index) => (
                        <div 
                            key={index} 
                            className={`${styles.activityItem} ${getSeverityClass(activity.severity)}`}
                            onClick={() => handleActivityClick(activity)}
                        >
                            <div className={styles.statusIndicator}></div>
                            
                            <div className={styles.activityIcon}>
                                {getActivityIcon(activity.type)}
                            </div>

                            <div className={styles.activityContent}>
                                <div className={styles.topRow}>
                                    <p className={styles.description}>
                                        {activity.description}
                                    </p>
                                    <span className={styles.severityBadge}>
                                        {getSeverityLabel(activity.severity)}
                                    </span>
                                </div>

                                <div className={styles.bottomRow}>
                                    <span className={styles.timestamp}>
                                        <FaClock />
                                        {formatDate(activity.timestamp)}
                                    </span>
                                    {activity.relatedCode && (
                                        <span className={styles.relatedCode}>
                                            {activity.relatedCode}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <FaInbox />
                        </div>
                        <p>Chưa có hoạt động nào</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecentActivities;