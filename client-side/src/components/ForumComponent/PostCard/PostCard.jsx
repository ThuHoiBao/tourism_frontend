import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Eye, Bookmark, Pin, Sparkles, Clock, Hash, Mountain, Plane, Palmtree, Compass, Camera, Map, Share2, Copy, Facebook, UserPlus, Check } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import axios from '../../../utils/axiosCustomize';
import styles from './PostCard.module.scss';

const PostCard = ({ post, onRefresh }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.isLikedByCurrentUser || false);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarkedByCurrentUser || false);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [bookmarkCount, setBookmarkCount] = useState(post.bookmarkCount || 0);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [bookmarkAnimating, setBookmarkAnimating] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const userId = user?.userId || user?.userID;
  const authorId = post.authorId ?? post.userId;
  const canFollow = !!userId && !!authorId && Number(userId) !== Number(authorId);

  // Fetch follow state khi mount (chỉ nếu có thể follow)
  useEffect(() => {
    if (!canFollow) return;
    axios.get(`/forum/posts/follow/${authorId}/check`, { params: { followerId: userId } })
      .then(r => setIsFollowing(!!r.data?.data?.isFollowing))
      .catch(() => {});
  }, [canFollow, authorId, userId]);

  // Đóng share menu khi click bên ngoài
  useEffect(() => {
    if (!shareOpen) return;
    const close = () => setShareOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [shareOpen]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!userId) return;
    const prev = isLiked;
    setIsLiked(!prev);
    setLikeCount(c => prev ? c - 1 : c + 1);
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 350);
    try {
      await axios.post(`/forum/posts/${post.postID}/like`, null, { params: { userId } });
    } catch {
      setIsLiked(prev);
      setLikeCount(c => prev ? c + 1 : c - 1);
    }
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    if (!userId) return;
    const prev = isBookmarked;
    setIsBookmarked(!prev);
    setBookmarkCount(c => prev ? c - 1 : c + 1);
    setBookmarkAnimating(true);
    setTimeout(() => setBookmarkAnimating(false), 300);
    try {
      await axios.post(`/forum/posts/${post.postID}/bookmark`, null, { params: { userId } });
    } catch {
      setIsBookmarked(prev);
      setBookmarkCount(c => prev ? c + 1 : c - 1);
    }
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    setShareOpen(o => !o);
  };

  const handleShare = async (e, channel) => {
    e.stopPropagation();
    setShareOpen(false);
    const url = `${window.location.origin}/forum/post/${post.postID}`;
    const title = post.title || 'Bài viết từ Tourism';
    try {
      if (channel === 'copy') {
        await navigator.clipboard.writeText(url);
      } else if (channel === 'facebook') {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title)}`,
          '_blank', 'width=620,height=520'
        );
      } else if (channel === 'twitter') {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
          '_blank', 'width=620,height=520'
        );
      } else if (channel === 'telegram') {
        window.open(
          `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
          '_blank', 'width=620,height=520'
        );
      }
      axios.post(`/forum/posts/${post.postID}/share`, null, { params: { channel } }).catch(() => {});
    } catch {}
  };

  const handleFollowToggle = async (e) => {
    e.stopPropagation();
    if (!canFollow) return;
    const prev = isFollowing;
    setIsFollowing(!prev);
    try {
      const res = await axios.post(`/forum/posts/follow/${authorId}`, null, { params: { followerId: userId } });
      setIsFollowing(!!res.data?.data?.isFollowing);
    } catch {
      setIsFollowing(prev);
    }
  };

  const initials = (name) =>
    name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';

  // Deterministic decorative placeholder for posts with no thumbnail
  const PLACEHOLDERS = [
    { icon: Mountain, gradient: 'linear-gradient(135deg, #0c4a6e, #0ea5e9)' },
    { icon: Palmtree, gradient: 'linear-gradient(135deg, #059669, #10b981)' },
    { icon: Plane,    gradient: 'linear-gradient(135deg, #0369a1, #06b6d4)' },
    { icon: Compass,  gradient: 'linear-gradient(135deg, #0891b2, #22d3ee)' },
    { icon: Camera,   gradient: 'linear-gradient(135deg, #7c3aed, #6366f1)' },
    { icon: Map,      gradient: 'linear-gradient(135deg, #ea580c, #f59e0b)' },
  ];
  const ph = PLACEHOLDERS[(post.postID || 0) % PLACEHOLDERS.length];
  const PlaceholderIcon = ph.icon;

  return (
    <div className={styles.card} onClick={() => navigate(`/forum/post/${post.postID}`)}>
      <div className={styles.cardInner}>
        <div className={styles.thumbnail}>
          {post.thumbnailUrl ? (
            <img
              src={post.thumbnailUrl}
              alt={post.title}
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className={styles.thumbnailPlaceholder}
            style={{ background: ph.gradient, display: post.thumbnailUrl ? 'none' : 'flex' }}
          >
            <PlaceholderIcon size={36} strokeWidth={1.5} />
            <span className={styles.placeholderLabel}>
              {post.categoryName || 'Du lịch'}
            </span>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.header}>
            <div className={styles.authorInfo}>
              <div className={styles.avatarWrap}>
                {post.authorAvatar ? (
                  <img src={post.authorAvatar} alt={post.authorName} className={styles.avatar} />
                ) : (
                  <div className={styles.avatarFallback}>{initials(post.authorName)}</div>
                )}
                {canFollow && (
                  <button
                    type="button"
                    className={`${styles.followDot} ${isFollowing ? styles.followDotActive : ''}`}
                    onClick={handleFollowToggle}
                    title={isFollowing ? 'Đang theo dõi' : 'Theo dõi tác giả'}
                  >
                    {isFollowing ? <Check size={11} strokeWidth={3} /> : <UserPlus size={11} strokeWidth={2.5} />}
                  </button>
                )}
              </div>
              <div className={styles.authorMeta}>
                <div className={styles.authorName}>{post.authorName || 'Ẩn danh'}</div>
                <div className={styles.postDate}>
                  <Clock size={11} />
                  {formatDate(post.createdAt)}
                </div>
              </div>
            </div>
            <div className={styles.badges}>
              {post.isPinned && (
                <span className={`${styles.badge} ${styles.pinnedBadge}`}>
                  <Pin size={10} /> Ghim
                </span>
              )}
              {post.isFeatured && (
                <span className={`${styles.badge} ${styles.featuredBadge}`}>
                  <Sparkles size={10} /> Nổi bật
                </span>
              )}
            </div>
          </div>

          <h3 className={styles.title}>{post.title}</h3>
          {post.summary && <p className={styles.summary}>{post.summary}</p>}

          <div className={styles.footer}>
            <div className={styles.tags}>
              {post.tags?.slice(0, 3).map(tag => (
                <span key={tag.tagId} className={styles.tag}>
                  <Hash size={11} />
                  {tag.tagName}
                </span>
              ))}
            </div>

            <div className={styles.stats}>
              <span className={styles.stat}>
                <Eye size={15} />
                {post.viewCount || 0}
              </span>
              <button
                className={`${styles.stat} ${isLiked ? styles.liked : ''} ${likeAnimating ? styles.animating : ''}`}
                onClick={handleLike}
              >
                <Heart size={15} />
                {likeCount}
              </button>
              <span className={styles.stat}>
                <MessageCircle size={15} />
                {post.commentCount || 0}
              </span>
              <button
                className={`${styles.stat} ${isBookmarked ? styles.bookmarked : ''} ${bookmarkAnimating ? styles.animating : ''}`}
                onClick={handleBookmark}
              >
                <Bookmark size={15} />
                {bookmarkCount}
              </button>
              <div className={styles.shareWrap}>
                <button
                  className={styles.stat}
                  onClick={handleShareClick}
                  title="Chia sẻ"
                >
                  <Share2 size={15} />
                  {post.shareCount > 0 ? post.shareCount : ''}
                </button>
                {shareOpen && (
                  <div className={styles.shareMenu} onClick={(e) => e.stopPropagation()}>
                    <button onClick={(e) => handleShare(e, 'copy')}><Copy size={13} /> Copy link</button>
                    <button onClick={(e) => handleShare(e, 'facebook')}><Facebook size={13} /> Facebook</button>
                    <button onClick={(e) => handleShare(e, 'twitter')}><Share2 size={13} /> Twitter</button>
                    <button onClick={(e) => handleShare(e, 'telegram')}><Share2 size={13} /> Telegram</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
