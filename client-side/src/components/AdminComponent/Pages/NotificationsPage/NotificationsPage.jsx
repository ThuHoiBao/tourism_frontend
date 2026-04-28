import React from 'react';
import styles from './NotificationsPage.module.scss';
import { FaBell } from 'react-icons/fa';

const NotificationsPage = () => {
    return (
        <div className={styles.pageContainer}>
            <h1 className={styles.pageTitle}>
                <FaBell className={styles.icon} /> Quản lý Thông báo
            </h1>
            <div className={styles.pageContent}>
                <p className={styles.infoText}>
                    Gửi thông báo đến người dùng (qua email, hệ thống) về các sự kiện quan trọng.
                </p>
                <div className={styles.placeholderBox}>
                    Nội dung: Công cụ soạn thảo thông báo, lịch sử gửi.
                </div>
            </div>
        </div>
    );
};
export default NotificationsPage;