// src/components/AdminComponent/Pages/DashboardPage/components/LoadingSpinner/LoadingSpinner.jsx

import React from 'react';
import styles from './LoadingSpinner.module.scss';
import { FaSpinner } from 'react-icons/fa';

const LoadingSpinner = () => {
    return (
        <div className={styles.loadingSpinner}>
            <div className={styles.spinnerContainer}>
                <FaSpinner className={styles.spinner} />
                <p>Đang tải dữ liệu thống kê...</p>
            </div>
        </div>
    );
};

export default LoadingSpinner;