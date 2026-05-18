import React from 'react';
import { LogIn, UserPlus, User, PenTool, MessageSquare, Heart, Trophy } from 'lucide-react';
import Avatar from '../../shared/Avatar/Avatar';
import Button from '../../shared/Button/Button';
import styles from './UserStats.module.scss';

const UserStats = ({ user = null, onManagePostsClick  }) => {

  console.log('UserStats received user:', user);
  if (!user) {
    return (
      <div className={styles.userStats}>
        <div className={styles.notLoggedIn}>
          <div className={styles.welcomeIcon}>
            <LogIn size={48} strokeWidth={1.5} />
          </div>
          <h3 className={styles.welcomeTitle}>Chào mừng bạn đến với cộng đồng!</h3>
          <p className={styles.welcomeText}>
            Đăng nhập để đăng bài, bình luận và kết nối với những người yêu du lịch
          </p>
        </div>
      </div>

    );
  }

  const stats = user.statistics || {};

  return (
    <div className={styles.userStats}>
      <div className={styles.userHeader}>
        <Avatar
          src={user.avatar}
          size="xl"
          alt={user.fullName}
          shape="circle"
        />
        <div className={styles.userInfo}>
          <h3 className={styles.userName}>{user.fullName}</h3>
          <span className={styles.userRole}>
            <Trophy size={14} />
            Thành viên tích cực
          </span>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <PenTool size={24} className={styles.statIcon} />
          <div className={styles.statValue}>{stats.totalPosts || 0}</div>
          <div className={styles.statLabel}>Bài viết</div>
        </div>
        <div className={styles.statItem}>
           <UserPlus size={24} className={styles.statIcon} />
          <div className={styles.statValue}>{stats.totalFollowers || 0}</div>
          <div className={styles.statLabel}>Theo dõi</div>
        </div>
        <div className={styles.statItem}>
          <Heart size={24} className={styles.statIcon} />
          <div className={styles.statValue}>{stats.totalLikesReceived || 0}</div>
          <div className={styles.statLabel}>Lượt thích</div>
        </div>
        <div className={styles.statItem}>
          <Trophy size={24} className={styles.statIcon} />
          <div className={styles.statValue}>{stats.reputationPoints || 0}</div>
          <div className={styles.statLabel}>Điểm uy tín</div>
        </div>
      </div>

       <button
        className={styles.managePostsBtn}
        onClick={onManagePostsClick}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2"/>
          <path d="M9 12H15M9 16H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Quản lý bài viết
      </button>

    </div>
  );
};

export default UserStats;
