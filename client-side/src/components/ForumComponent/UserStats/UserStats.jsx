import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, FileText, Users, Heart, Trophy, Sparkles, Settings, UserCheck } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import axios from '../../../utils/axiosCustomize';
import styles from './UserStats.module.scss';

const UserStats = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalPosts: 0, totalFollowers: 0, totalLikesReceived: 0, reputationPoints: 0 });

  const userId = user?.userId || user?.userID;

  useEffect(() => {
    if (!userId) return;
    axios.get('/forum/posts/user/stats', { params: { userId } })
      .then(res => {
        const d = res.data?.data || {};
        setStats({
          totalPosts: d.totalPosts || 0,
          totalFollowers: d.followers || 0,
          totalLikesReceived: d.totalLikes || 0,
          reputationPoints: d.reputation || 0,
        });
      })
      .catch(() => {});
  }, [userId]);

  const initials = (name) =>
    name ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : '?';

  if (!user) {
    return (
      <div className={styles.sidebar}>
        <div className={styles.guestBox}>
          <div className={styles.guestIcon}><LogIn size={24} /></div>
          <p className={styles.guestTitle}>Tham gia cộng đồng</p>
          <p className={styles.guestSubtitle}>Đăng nhập để chia sẻ và kết nối</p>
          <button className={styles.loginBtn} onClick={() => navigate('/login')}>
            <LogIn size={16} />
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.profile}>
        <div className={styles.avatarWrapper}>
          {user.avatar ? (
            <img src={user.avatar} alt={user.fullName} className={styles.avatar} />
          ) : (
            <div className={styles.avatarFallback}>
              {initials(user.fullName || user.username)}
            </div>
          )}
          <div className={styles.onlineDot} />
        </div>
        <h3 className={styles.userName}>{user.fullName || user.username}</h3>
        <span className={styles.userRole}><Sparkles size={11} /> Thành viên tích cực</span>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <FileText size={18} className={styles.statIcon} />
          <span className={styles.statValue}>{stats.totalPosts}</span>
          <span className={styles.statLabel}>Bài viết</span>
        </div>
        <div className={styles.statItem}>
          <Users size={18} className={styles.statIcon} />
          <span className={styles.statValue}>{stats.totalFollowers}</span>
          <span className={styles.statLabel}>Theo dõi</span>
        </div>
        <div className={styles.statItem}>
          <Heart size={18} className={styles.statIcon} />
          <span className={styles.statValue}>{stats.totalLikesReceived}</span>
          <span className={styles.statLabel}>Lượt thích</span>
        </div>
        <div className={styles.statItem}>
          <Trophy size={18} className={styles.statIcon} />
          <span className={styles.statValue}>{stats.reputationPoints}</span>
          <span className={styles.statLabel}>Điểm uy tín</span>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.manageBtn} onClick={() => navigate('/forum/my-posts')}>
          <Settings size={16} />
          Quản lý bài viết
        </button>
      </div>
    </div>
  );
};

export default UserStats;
