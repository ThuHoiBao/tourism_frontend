import React, { useState } from 'react';
import styles from './shared.module.scss';

// actions: [{ value, label }]
const BulkActionBar = ({ selectedCount, actions, onApply, onClear }) => {
    const [action, setAction] = useState('');
    if (!selectedCount) return null;

    return (
        <div className={styles.bulkBar}>
            <span className={styles.bulkCount}>Đã chọn {selectedCount}</span>
            <select
                className={styles.bulkSelect}
                value={action}
                onChange={(e) => setAction(e.target.value)}
            >
                <option value="">-- Chọn hành động --</option>
                {actions.map(a => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                ))}
            </select>
            <button
                className={styles.btnPrimary}
                disabled={!action}
                onClick={() => action && onApply(action)}
            >Áp dụng</button>
            <button className={styles.btnLink} onClick={onClear}>Bỏ chọn</button>
        </div>
    );
};

export default BulkActionBar;
