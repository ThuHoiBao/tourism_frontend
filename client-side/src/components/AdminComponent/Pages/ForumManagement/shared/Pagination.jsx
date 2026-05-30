import React from 'react';
import styles from './shared.module.scss';

// Builds a page range with ellipsis, e.g. [0,1,'…',5,6,7,'…',12]
const buildRange = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const pages = new Set([0, total - 1, current, current - 1, current + 1]);
    const sorted = [...pages].filter(p => p >= 0 && p < total).sort((a, b) => a - b);
    const out = [];
    let prev = null;
    for (const p of sorted) {
        if (prev !== null && p - prev > 1) out.push('…');
        out.push(p);
        prev = p;
    }
    return out;
};

// currentPage and totalPages are 0-based / count. onPageChange receives 0-based index.
// totalElements (optional): tổng số kết quả tìm thấy để hiển thị "Tìm thấy X mục".
const Pagination = ({ currentPage, totalPages, totalElements, onPageChange }) => {
    // Không có gì để phân trang và cũng không có total → ẩn hoàn toàn
    if ((!totalPages || totalPages <= 1) && totalElements == null) return null;

    const range = (totalPages && totalPages > 1) ? buildRange(currentPage, totalPages) : [];

    return (
        <div className={styles.paginationWrap}>
            {totalElements != null && (
                <div className={styles.paginationInfo}>
                    Tìm thấy <strong>{totalElements.toLocaleString('vi-VN')}</strong> mục
                    {totalPages > 1 && <> · Trang {currentPage + 1}/{totalPages}</>}
                </div>
            )}

            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        className={styles.pageBtn}
                        disabled={currentPage === 0}
                        onClick={() => onPageChange(currentPage - 1)}
                    >‹</button>

                    {range.map((p, idx) =>
                        p === '…' ? (
                            <span key={`e${idx}`} className={styles.ellipsis}>…</span>
                        ) : (
                            <button
                                key={p}
                                className={`${styles.pageBtn} ${p === currentPage ? styles.pageBtnActive : ''}`}
                                onClick={() => onPageChange(p)}
                            >{p + 1}</button>
                        )
                    )}

                    <button
                        className={styles.pageBtn}
                        disabled={currentPage >= totalPages - 1}
                        onClick={() => onPageChange(currentPage + 1)}
                    >›</button>
                </div>
            )}
        </div>
    );
};

export default Pagination;
