// LoadingSpinner.jsx — Lucide React

import React from 'react';
import styles from './LoadingSpinner.module.scss';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = () => {
    return (
        <div className={styles.loadingSpinner}>
            <div className={styles.spinnerContainer}>
                <Loader2 className={styles.spinner} size={36} />
                <p>Đang tải dữ liệu thống kê...</p>
            </div>
        </div>
    );
};

export default LoadingSpinner;