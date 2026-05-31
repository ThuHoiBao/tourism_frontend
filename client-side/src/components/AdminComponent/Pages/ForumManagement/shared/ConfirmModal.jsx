import React from 'react';
import styles from './shared.module.scss';

const ConfirmModal = ({
    isOpen,
    title = 'Xác nhận',
    message,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    danger = false,
    loading = false,
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;
    return (
        <div className={styles.modalOverlay} onClick={onCancel}>
            <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
                <h3 className={styles.modalTitle}>{title}</h3>
                <div className={styles.modalBody}>{message}</div>
                <div className={styles.modalActions}>
                    <button className={styles.btnSecondary} onClick={onCancel} disabled={loading}>
                        {cancelText}
                    </button>
                    <button
                        className={danger ? styles.btnDanger : styles.btnPrimary}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Đang xử lý…' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
