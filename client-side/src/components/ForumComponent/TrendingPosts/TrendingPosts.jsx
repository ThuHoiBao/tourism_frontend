import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Eye, Heart, MessageCircle } from 'lucide-react';
import axios from '../../../utils/axiosCustomize';
import styles from './TrendingPosts.module.scss';

const TrendingPosts = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    axios.get('/forum/posts/trending', { params: { page: 0, size: 5 } })
      .then(res => setPosts(res.data?.data?.content || res.data?.data || []))
      .catch(() => {});
  }, []);

  const rankClass = (i) => {
    if (i === 0) return styles.rank1;
    if (i === 1) return styles.rank2;
    if (i === 2) return styles.rank3;
    return styles.rankOther;
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <TrendingUp size={16} className={styles.headerIcon} />
        <span className={styles.title}>Bài viết nổi bật</span>
      </div>
      <div className={styles.list}>
        {posts.length === 0 ? (
          <div className={styles.empty}>
            <TrendingUp size={24} />
            Chưa có bài nổi bật
          </div>
        ) : posts.map((post, i) => (
          <div key={post.postID} className={styles.item} onClick={() => navigate(`/forum/post/${post.postID}`)}>
            <span className={`${styles.rank} ${rankClass(i)}`}>{i + 1}</span>
            <div className={styles.itemContent}>
              <p className={styles.itemTitle}>{post.title}</p>
              <div className={styles.itemMeta}>
                <span className={styles.metaStat}><Eye size={12} />{post.viewCount || 0}</span>
                <span className={styles.metaStat}><Heart size={12} />{post.likeCount || 0}</span>
                <span className={styles.metaStat}><MessageCircle size={12} />{post.commentCount || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingPosts;
