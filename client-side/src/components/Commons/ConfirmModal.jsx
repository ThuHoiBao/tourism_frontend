// src/components/Commons/ConfirmModal/ConfirmModal.jsx

import React from 'react';
import styles from './ConfirmModal.module.scss';
import { FaExclamationTriangle } from 'react-icons/fa'; // Icon cảnh báo

const ConfirmModal = ({ title, message, onConfirm, onCancel, confirmText = 'Xác nhận', cancelText = 'Hủy' }) => {
    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <FaExclamationTriangle className={styles.warningIcon} />
                    <h3 className={styles.modalTitle}>{title}</h3>
                </div>
                <div className={styles.modalBody}>
                    <p>{message}</p>
                </div>
                <div className={styles.modalFooter}>
                    <button className={styles.cancelButton} onClick={onCancel}>{cancelText}</button>
                    <button className={styles.confirmButton} onClick={onConfirm}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;