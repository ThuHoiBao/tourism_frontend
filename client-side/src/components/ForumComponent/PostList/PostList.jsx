import React from 'react';
import PostCard from '../PostCard/PostCard';
import { useNavigate } from 'react-router-dom';
import Loader from '../../shared/Loader/Loader';
import styles from './PostList.module.scss';

const PostList = ({
  posts = [],
  loading = false,
  error = null,
  onPostClick,
  emptyMessage = "Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!"
}) => {
  const navigate = useNavigate();
  const handlePostClick = (post) => {
    if (onPostClick) {
      onPostClick(post);
    } else {
      navigate(`/forum/post/${post.postID}`);
    }
  };
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader size="lg" />
        <p className={styles.loadingText}>Đang tải bài viết...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h3 className={styles.errorTitle}>Đã có lỗi xảy ra</h3>
        <p className={styles.errorMessage}>{error}</p>
        <button
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyIcon}>📝</div>
        <h3 className={styles.emptyTitle}>Không có bài viết</h3>
        <p className={styles.emptyMessage}>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={styles.postList}>
      {posts.map((post) => (
        <PostCard
          key={post.postID}
          post={post}
          onClick={handlePostClick}
        />
      ))}
    </div>
  );
};

export default PostList;
