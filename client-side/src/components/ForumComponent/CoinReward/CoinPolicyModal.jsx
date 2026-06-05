import React, { useEffect, useRef } from 'react';
import { X, Coins, FileText, Heart, MessageCircle, ThumbsUp, UserPlus, CalendarCheck } from 'lucide-react';
import styles from './CoinRewardWidget.module.scss';

// Format số bỏ phần thập phân thừa
const fmt = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return '0';
  return parseFloat(num.toFixed(2)).toString();
};

const joinMilestones = (arr) => (Array.isArray(arr) ? arr.join(' / ') : '');

const CoinPolicyModal = ({ isOpen, onClose, policy, dailyCap }) => {
  const popoverRef = useRef(null);

  // Đóng khi click ra ngoài hoặc nhấn Escape
  useEffect(() => {
    if (!isOpen) return;
    const onClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) onClose();
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    // Dùng 'click' (không phải 'mousedown') để không nuốt cú click mở popover
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

  if (!isOpen || !policy) return null;

  const items = [
    {
      icon: <FileText size={16} />,
      text: (
        <>
          Đăng bài được duyệt: <strong>+{fmt(policy.postAmount)} coin</strong>{' '}
          (thưởng sau {policy.postDelayHours}h, tối đa {policy.maxRewardedPostsPerDay} bài/ngày)
        </>
      ),
    },
    {
      icon: <Heart size={16} />,
      text: (
        <>
          Bài viết đạt mốc <strong>{joinMilestones(policy.postLikeMilestones)} like</strong>:{' '}
          <strong>+{fmt(policy.postLikeMilestoneAmount)} coin</strong>/mốc
        </>
      ),
    },
    {
      icon: <MessageCircle size={16} />,
      text: (
        <>
          Bình luận chất lượng (≥{policy.minCommentLength} ký tự):{' '}
          <strong>+{fmt(policy.commentAmount)} coin</strong>, tối đa {policy.maxRewardedCommentsPerDay}/ngày
        </>
      ),
    },
    {
      icon: <ThumbsUp size={16} />,
      text: (
        <>
          Bình luận đạt mốc <strong>{joinMilestones(policy.commentLikeMilestones)} like</strong>:{' '}
          <strong>+{fmt(policy.commentLikeMilestoneAmount)} coin</strong>/mốc
        </>
      ),
    },
    {
      icon: <UserPlus size={16} />,
      text: (
        <>
          Có người theo dõi mới: <strong>+{fmt(policy.followAmount)} coin</strong>
        </>
      ),
    },
    {
      icon: <CalendarCheck size={16} />,
      text: (
        <>
          Hoạt động hằng ngày: <strong>+{fmt(policy.dailyAmount)} coin</strong>, duy trì chuỗi{' '}
          {policy.streakLength} ngày liên tiếp nhận thêm <strong>+{fmt(policy.streakBonus)} coin</strong>
        </>
      ),
    },
  ];

  return (
    <div className={styles.popover} ref={popoverRef}>
      <span className={styles.popoverArrow} />
      <div className={styles.modalHeader}>
        <h3 className={styles.modalTitle}>
          <Coins size={15} />
          Cách kiếm coin
        </h3>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
          <X size={13} />
        </button>
      </div>

      <div className={styles.modalBody}>
        <ul className={styles.policyList}>
          {items.map((item, i) => (
            <li key={i} className={styles.policyItem}>
              <span className={styles.policyIcon}>{item.icon}</span>
              <span className={styles.policyText}>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.modalFooter}>
        <p className={styles.footerNote}>
          Tối đa <strong>{fmt(dailyCap)} coin/ngày</strong>. 1 coin = 1.000đ.
          Coin thưởng có thể bị thu hồi nếu phát hiện gian lận.
        </p>
      </div>
    </div>
  );
};

export default CoinPolicyModal;
