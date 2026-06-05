import React, { useState, useEffect, useCallback } from 'react';
import { Coins, HelpCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { getCoinSummaryApi } from '../../../services/forumReward';
import CoinPolicyModal from './CoinPolicyModal';
import CoinHistoryModal from './CoinHistoryModal';
import styles from './CoinRewardWidget.module.scss';

// Format số bỏ phần thập phân thừa: 1.50 -> 1.5, 2.00 -> 2
const fmt = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num)) return '0';
  return parseFloat(num.toFixed(2)).toString();
};

const CoinRewardWidget = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [showPolicy, setShowPolicy] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const userId = user?.id || user?.userId || user?.userID;

  const fetchSummary = useCallback(() => {
    if (!userId) return;
    getCoinSummaryApi(userId)
      .then((data) => setSummary(data))
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Tự refresh khi nhận thông báo COIN_REWARD real-time (Header phát event này)
  useEffect(() => {
    const onCoinReward = () => fetchSummary();
    window.addEventListener('forum-coin-reward', onCoinReward);
    return () => window.removeEventListener('forum-coin-reward', onCoinReward);
  }, [fetchSummary]);

  if (!userId || !summary || summary.enabled === false) return null;

  const dailyCap = summary.dailyCap || 0;
  const todayEarned = summary.todayEarned || 0;
  const percent = dailyCap > 0 ? Math.min(100, (todayEarned / dailyCap) * 100) : 0;
  const recent = (summary.recentRewards || []).slice(0, 5);

  // ── Streak: tiến trình tới bonus chuỗi (vd 7 ngày → +2 coin) ──
  const streak = summary.streak || 0;
  const streakTodayDone = Boolean(summary.streakTodayDone);
  const streakLength = summary.policy?.streakLength || 7;
  const streakBonus = summary.policy?.streakBonus || 2;
  // Vị trí trong chu kỳ hiện tại: 1..streakLength (0 nếu chưa có chuỗi)
  const streakPos = streak === 0 ? 0 : ((streak - 1) % streakLength) + 1;
  const streakRemaining = streakLength - streakPos;

  return (
    <div className={styles.wrapper}>
      <div className={styles.widget}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>
          <Coins size={16} className={styles.headerIcon} />
          Coin diễn đàn
        </span>
        <button className={styles.helpBtn} onClick={() => { setShowHistory(false); setShowPolicy((v) => !v); }}>
          <HelpCircle size={13} />
          Cách kiếm coin?
        </button>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressLabel}>
          <span>Hôm nay: <strong>{fmt(todayEarned)} / {fmt(dailyCap)}</strong> coin</span>
          <span className={styles.progressPercent}>{Math.round(percent)}%</span>
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${percent}%` }} />
        </div>
        <div className={styles.totalRow}>
          <TrendingUp size={13} />
          Tổng đã nhận: <strong>{fmt(summary.totalFromForum)} coin</strong>
        </div>
      </div>

      <div className={styles.streakSection}>
        <div className={styles.streakLabel}>
          <span>🔥 Chuỗi hoạt động: <strong>{streak} ngày</strong></span>
          <span className={styles.streakTarget}>
            {streakPos === streakLength
              ? `Đã nhận +${fmt(streakBonus)} coin 🎉`
              : `Còn ${streakRemaining} ngày → +${fmt(streakBonus)} coin`}
          </span>
        </div>
        <div className={styles.streakTrack}>
          {Array.from({ length: streakLength }, (_, i) => (
            <div
              key={i}
              className={`${styles.streakDot} ${i < streakPos ? styles.streakDotActive : ''}`}
            />
          ))}
        </div>
        {!streakTodayDone && (
          <div className={styles.streakHint}>
            {streak > 0
              ? 'Tương tác hôm nay để giữ chuỗi nhé!'
              : 'Tương tác hôm nay để bắt đầu chuỗi (+0.5 coin/ngày)'}
          </div>
        )}
      </div>

      {recent.length > 0 && (
        <div className={styles.recentList}>
          <div className={styles.recentTitle}>Thưởng gần đây</div>
          {recent.map((r, i) => (
            <div key={i} className={styles.recentItem}>
              <span className={styles.recentReason} title={r.reason}>{r.reason}</span>
              <span className={`${styles.recentAmount} ${r.status === 'CANCELLED' ? styles.cancelled : r.status === 'PENDING' ? styles.pending : ''}`}>
                +{fmt(r.amount)}
              </span>
            </div>
          ))}
          <button
            className={styles.viewAllBtn}
            onClick={() => { setShowPolicy(false); setShowHistory((v) => !v); }}
          >
            Xem lịch sử thưởng →
          </button>
        </div>
      )}

      </div>

      <CoinPolicyModal
        isOpen={showPolicy}
        onClose={() => setShowPolicy(false)}
        policy={summary.policy}
        dailyCap={dailyCap}
      />

      <CoinHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        userId={userId}
      />
    </div>
  );
};

export default CoinRewardWidget;
