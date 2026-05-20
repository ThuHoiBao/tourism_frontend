import React from 'react';
import PostCard from '../PostCard/PostCard';
import { FileSearch, RefreshCw, ChevronDown } from 'lucide-react';
import styles from './PostList.module.scss';

const PostList = ({ posts = [], loading = false, hasMore = false, onLoadMore }) => {
  if (loading && posts.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.skeletonList}>
          {[1, 2, 3].map(i => (
            <div key={i} className={styles.skeleton}>
              <div className={styles.skeletonThumb} />
              <div className={styles.skeletonBody}>
                <div className={styles.skeletonHeader} />
                <div className={styles.skeletonTitle} />
                <div className={styles.skeletonText} />
                <div className={styles.skeletonFooter} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!loading && posts.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <FileSearch size={48} className={styles.emptyIcon} />
        <h3 className={styles.emptyTitle}>Chưa có bài viết nào</h3>
        <p className={styles.emptyMessage}>Hãy là người đầu tiên chia sẻ trải nghiệm du lịch!</p>
      </div>
    );
  }

  return (
    <div className={styles.postList}>
      {posts.map(post => (
        <PostCard key={post.postID} post={post} />
      ))}

      {loading && posts.length > 0 && (
        <div className={styles.loadMore}>
          <div className={styles.loadingSpinner} />
          Đang tải thêm...
        </div>
      )}

      {!loading && hasMore && (
        <button className={styles.loadMoreBtn} onClick={onLoadMore}>
          <ChevronDown size={16} />
          Xem thêm bài viết
        </button>
      )}
    </div>
  );
};

export default PostList;
