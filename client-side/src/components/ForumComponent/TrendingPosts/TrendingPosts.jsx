import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Flame, Eye, Heart, MessageCircle } from 'lucide-react';
import Avatar from '../../shared/Avatar/Avatar';
import Badge from '../../shared/Badge/Badge';
import styles from './TrendingPosts.module.scss';

const TrendingPosts = ({ posts = [], onPostClick }) => {
  if (posts.length === 0) {
    return (
      <div className={styles.trendingContainer}>
        <h3 className={styles.title}>
          <Flame size={24} className={styles.titleIcon} />
          Bài viết phổ biến
        </h3>
        <div className={styles.noPosts}>
          <Flame size={48} className={styles.noPostsIcon} />
          <p>Chưa có bài viết trending</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.trendingContainer}>
      <h3 className={styles.title}>
        <Flame size={24} className={styles.titleIcon} />
        Bài viết phổ biến
      </h3>

      <div className={styles.trendingList}>
        {posts.map((post, index) => (
          <div
            key={post.postID}
            className={styles.trendingItem}
            onClick={() => onPostClick?.(post)}
          >
            {/* Số thứ hạng ở trên đầu với # */}
            <div className={styles.rankHeader}>
              <span className={`${styles.rankTag} ${styles[`rank${index + 1}`]}`}>
                #{index + 1}
              </span>
            </div>

            {/* Nội dung bên trái: avatar + info */}
            <div className={styles.mainContent}>
              <div className={styles.authorRow}>
                <Avatar src={post.authorAvatar} size="sm" alt={post.authorName} />
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>{post.authorName}</span>
                  <span className={styles.postDate}>
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: vi })}
                  </span>
                </div>
              </div>

              <h4 className={styles.postTitle}>{post.title}</h4>

              <div className={styles.stats}>
                <div className={styles.stat}>
                  <Eye size={16} />
                  <span>{post.viewCount}</span>
                </div>
                <div className={styles.stat}>
                  <Heart size={16} />
                  <span>{post.likeCount}</span>
                </div>
                <div className={styles.stat}>
                  <MessageCircle size={16} />
                  <span>{post.commentCount}</span>
                </div>
              </div>

              {/* Category badge bên phải nếu có */}
              {post.category && (
                <div className={styles.categoryBadge}>
                  <Badge label={post.categoryName} type="secondary" size="sm" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingPosts;
