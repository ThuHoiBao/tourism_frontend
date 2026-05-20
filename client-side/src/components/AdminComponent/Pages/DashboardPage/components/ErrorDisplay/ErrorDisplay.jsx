// ErrorDisplay.jsx — Lucide React icons

import React from 'react';
import styles from './ErrorDisplay.module.scss';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const ErrorDisplay = ({ message, onRetry }) => {
    return (
        <div className={styles.errorDisplay}>
            <div className={styles.errorContainer}>
                <AlertTriangle className={styles.errorIcon} size={40} />
                <h3>Oops! Có lỗi xảy ra</h3>
                <p>{message}</p>
                <button onClick={onRetry} className={styles.retryBtn}>
                    <RefreshCw size={14} /> Thử lại
                </button>
            </div>
        </div>
    );
};

export default ErrorDisplay;