import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, History } from 'lucide-react';
import { getCoinHistoryApi } from '../../../services/forumReward';
import styles from './CoinRewardWidget.module.scss';

const PAGE_SIZE = 10;

// Format số bỏ phần thập phân thừa
const fmt = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return '0';
  return parseFloat(num.toFixed(2)).toString();
};

// 2026-06-05T10:30:00 -> 05/06 10:30
const fmtTime = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const pad = (x) => String(x).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
};

const statusLabel = {
  CREDITED: null, // bình thường, không cần nhãn
  PENDING: 'Đang xử lý',
  CANCELLED: 'Đã hủy',
};

const CoinHistoryModal = ({ isOpen, onClose, userId }) => {
  const popoverRef = useRef(null);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadPage = useCallback((pageToLoad, append) => {
    if (!userId) return;
    setLoading(true);
    getCoinHistoryApi(userId, pageToLoad, PAGE_SIZE)
      .then((data) => {
        if (!data) return;
        setItems((prev) => (append ? [...prev, ...(data.items || [])] : (data.items || [])));
        setPage(data.page ?? pageToLoad);
        setHasNext(Boolean(data.hasNext));
        setTotal(data.totalElements ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  // Mở popover → tải trang đầu
  useEffect(() => {
    if (isOpen) loadPage(0, false);
  }, [isOpen, loadPage]);

  // Đóng khi click ra ngoài hoặc nhấn Escape
  useEffect(() => {
    if (!isOpen) return;
    const onClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) onClose();
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const timer = setTimeout(() => {
      document.addEventListener('click', onClickOutside);
      document.addEventListener('keydown', onEsc);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.popover} ref={popoverRef}>
      <span className={styles.popoverArrow} />
      <div className={styles.modalHeader}>
        <h3 className={styles.modalTitle}>
          <History size={15} />
          Lịch sử thưởng coin
          {total > 0 && <span className={styles.historyCount}>({total})</span>}
        </h3>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
          <X size={13} />
        </button>
      </div>

      <div className={styles.modalBody}>
        {items.length === 0 && !loading ? (
          <p className={styles.historyEmpty}>Chưa có lượt thưởng nào. Hãy tương tác với diễn đàn nhé!</p>
        ) : (
          <ul className={styles.historyList}>
            {items.map((r, i) => (
              <li key={i} className={styles.historyItem}>
                <div className={styles.historyTop}>
                  <span className={`${styles.historyAmount} ${r.status === 'CANCELLED' ? styles.cancelled : r.status === 'PENDING' ? styles.pending : ''}`}>
                    +{fmt(r.amount)} coin
                  </span>
                  <span className={styles.historyTime}>{fmtTime(r.createdAt)}</span>
                </div>
                <div className={styles.historyReason}>{r.reason}</div>
                {statusLabel[r.status] && (
                  <span className={`${styles.historyStatus} ${r.status === 'CANCELLED' ? styles.cancelled : styles.pending}`}>
                    {statusLabel[r.status]}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        {hasNext && (
          <button
            className={styles.loadMoreBtn}
            onClick={() => loadPage(page + 1, true)}
            disabled={loading}
          >
            {loading ? 'Đang tải...' : 'Tải thêm ↓'}
          </button>
        )}
        {loading && items.length === 0 && (
          <p className={styles.historyEmpty}>Đang tải...</p>
        )}
      </div>
    </div>
  );
};

export default CoinHistoryModal;
