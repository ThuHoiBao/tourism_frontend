// src/components/AdminComponent/Pages/DashboardPage/components/ErrorDisplay/ErrorDisplay.jsx

import React from 'react';
import styles from './ErrorDisplay.module.scss';
import { FaExclamationTriangle, FaSync } from 'react-icons/fa';

const ErrorDisplay = ({ message, onRetry }) => {
    return (
        <div className={styles.errorDisplay}>
            <div className={styles.errorContainer}>
                <FaExclamationTriangle className={styles.errorIcon} />
                <h3>Oops! Có lỗi xảy ra</h3>
                <p>{message}</p>
                <button onClick={onRetry} className={styles.retryBtn}>
                    <FaSync /> Thử lại
                </button>
            </div>
        </div>
    );
};

export default ErrorDisplay;