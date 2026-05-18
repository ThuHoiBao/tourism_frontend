import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Pin,
  Sparkles,
  Share2,
  UserPlus,
  UserCheck
} from 'lucide-react';
import Avatar from '../../shared/Avatar/Avatar';
import Badge from '../../shared/Badge/Badge';
import styles from './PostCard.module.scss';
import axios from '../../../utils/axiosCustomize';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-toastify';

const PostCard = ({
  post,
  onClick,
  showCategory = true,
  showTags = true,
  showStats = true,
  onFollowChange,
  onBookmarkChange
}) => {
  const { user, isAuthenticated } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // State like
  const [isLiked, setIsLiked] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(0);
  const [localBookmarkCount, setLocalBookmarkCount] = useState(0);

  const [loading, setLoading] = useState({
    follow: false,
    bookmark: false,
    like: false
  });

  const {
    postID,
    title,
    summary,
    thumbnailUrl,
    authorId,
    authorName,
    authorAvatar,
    categoryName,
    viewCount,
    likeCount,
    commentCount,
    bookmarkCount,
    createdAt,
    isPinned,
    isFeatured,
    tags = [],
  } = post;

  useEffect(() => {
    if (post.isLikedByCurrentUser !== undefined) {
      setIsLiked(post.isLikedByCurrentUser);
    }
    setLocalLikeCount(post.likeCount || 0);
    setLocalBookmarkCount(post.bookmarkCount || 0);
  }, [post.isLikedByCurrentUser, post.likeCount, post.bookmarkCount, post.postID]);

  useEffect(() => {
    if (isAuthenticated) {
      if (authorId && authorId !== user?.userID) {
        checkFollowStatus();
      }
      if (postID) {
        checkBookmarkStatus();
        checkLikeStatus();
      }
    }
  }, [isAuthenticated, authorId, postID, user?.userID]);

  const checkFollowStatus = async () => {
    try {
      const response = await axios.get(`/followers/${authorId}/check`);
      setIsFollowing(response.data.isFollowing);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const checkBookmarkStatus = async () => {
    try {
      const response = await axios.get(`/bookmarks/${postID}/check`);
      setIsBookmarked(response.data.isBookmarked);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  const checkLikeStatus = async () => {
    try {
      const response = await axios.get(`/forum/posts/${postID}/like-check`);
      const result = response.data?.data;

      if (result && result.isLiked !== undefined) {
          setIsLiked(result.isLiked);
      }
    } catch (error) {
      console.error('Error checking like status:', error);
    }
  };

  const handleFollowToggle = async (e) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để theo dõi tác giả');
      return;
    }

    if (authorId === user?.userID) {
      toast.info('Bạn không thể theo dõi chính mình');
      return;
    }

    setLoading(prev => ({ ...prev, follow: true }));

    try {
      const response = await axios.post(`/followers/${authorId}/toggle`);
      setIsFollowing(response.data.isFollowing);

      toast.success(
        response.data.isFollowing
          ? `Đã theo dõi ${authorName}`
          : `Đã bỏ theo dõi ${authorName}`
      );

      if (onFollowChange) {
        onFollowChange(authorId, response.data.isFollowing);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Có lỗi xảy ra khi theo dõi tác giả');
    } finally {
      setLoading(prev => ({ ...prev, follow: false }));
    }
  };

  const handleBookmarkToggle = async (e) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để lưu bài viết');
      return;
    }

    setLoading(prev => ({ ...prev, bookmark: true }));

    try {
      const response = await axios.post(`/bookmarks/${postID}/toggle`, {
        folderName: null,
        note: null
      });

      const newBookmarkStatus = response.data.isBookmarked;
      setIsBookmarked(newBookmarkStatus);

      setLocalBookmarkCount(prev => newBookmarkStatus ? prev + 1 : Math.max(0, prev - 1));

      toast.success(
        newBookmarkStatus
          ? 'Đã lưu bài viết'
          : 'Đã bỏ lưu bài viết'
      );

      if (onBookmarkChange) {
        onBookmarkChange(postID, newBookmarkStatus);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Có lỗi xảy ra khi lưu bài viết');
    } finally {
      setLoading(prev => ({ ...prev, bookmark: false }));
    }
  };

  const handleLikeToggle = async (e) => {
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để thích bài viết');
      return;
    }

    setLoading(prev => ({ ...prev, like: true }));

    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLocalLikeCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));

    try {
      await axios.post(`/forum/posts/${postID}/like`);
    } catch (error) {
      setIsLiked(!newLikedState);
      setLocalLikeCount(prev => newLikedState ? Math.max(0, prev - 1) : prev + 1);
      console.error('Error toggling like:', error);
      toast.error('Có lỗi xảy ra');
    } finally {
      setLoading(prev => ({ ...prev, like: false }));
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();

    const shareData = {
      title: title,
      text: summary || title,
      url: window.location.origin + `/forum/post/${postID}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Đã sao chép link bài viết');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
    }
  };

  const isCurrentUserAuthor = user?.userID === authorId;

  return (
    <article className={styles.postCard} onClick={() => onClick(post)}>
      {/* Header: Author + Badges */}
      <div className={styles.postHeader}>
        <div className={styles.postAuthor}>
          <Avatar
            src={authorAvatar}
            size="md"
            alt={authorName}
          />
          <div className={styles.authorInfo}>
            <span className={styles.authorName}>
              {authorName}
            </span>
            <span className={styles.postDate}>
              {formatDistanceToNow(new Date(createdAt), {
                addSuffix: true,
                locale: vi
              })}
            </span>
          </div>
        </div>

        <div className={styles.headerActions}>
          <div className={styles.postBadges}>
            {isPinned && <Badge icon={<Pin size={14} />} type="primary" label="Ghim" size="sm" />}
            {isFeatured && <Badge icon={<Sparkles size={14} />} type="warning" label="Nổi bật" size="sm" />}
            {showCategory && categoryName && (
              <Badge type="info" label={categoryName} size="sm" />
            )}
          </div>

          {isAuthenticated && !isCurrentUserAuthor && (
            <button
              className={`${styles.followButton} ${isFollowing ? styles.following : ''}`}
              onClick={handleFollowToggle}
              disabled={loading.follow}
            >
              {loading.follow ? (
                <span className={styles.spinner} />
              ) : isFollowing ? (
                <>
                  <UserCheck size={16} />
                  <span>Đang theo dõi</span>
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>Theo dõi</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Body: Content + Thumbnail */}
      <div className={styles.postBody}>
        <div className={styles.postContent}>
          <h3 className={styles.postTitle}>{title}</h3>

          {summary && (
            <p className={styles.postSummary}>{summary}</p>
          )}

          {showTags && tags.length > 0 && (
            <div className={styles.postTags}>
              {tags.slice(0, 4).map((tagInfo) => (
                <span key={tagInfo.tagId} className={styles.tag}>
                  #{tagInfo.tagName}
                </span>
              ))}
              {tags.length > 4 && (
                <span className={styles.moreTags}>+{tags.length - 4}</span>
              )}
            </div>
          )}
        </div>

        {thumbnailUrl && (
          <div className={styles.postThumbnail}>
            <img
              src={thumbnailUrl}
              alt={title}
              loading="lazy"
            />
          </div>
        )}
      </div>

      {/* Footer: Stats + Actions */}
      {showStats && (
        <div className={styles.postFooter}>
          <div className={styles.postStats}>
            <div className={styles.statItem}>
              <Eye size={18} className={styles.statIcon} />
              <span className={styles.statCount}>{viewCount || 0}</span>
            </div>
            <div className={styles.statItem}>
              <Heart
                size={18}
                className={`${styles.statIcon} ${isLiked ? styles.liked : ''}`}
                fill={isLiked ? '#e31b23' : 'none'}
                color={isLiked ? '#e31b23' : 'currentColor'}
              />
              <span className={styles.statCount}>{localLikeCount}</span>
            </div>
            <div className={styles.statItem}>
              <MessageCircle size={18} className={styles.statIcon} />
              <span className={styles.statCount}>{commentCount || 0}</span>
            </div>
            <div className={styles.statItem}>
              <Bookmark size={18} className={`${styles.statIcon} ${isBookmarked ? styles.bookmarked : ''}`} />
              <span className={styles.statCount}>{localBookmarkCount}</span>
            </div>
          </div>

          <div className={styles.postActions}>
            <button
              className={`${styles.actionButton} ${isLiked ? styles.active : ''}`}
              onClick={handleLikeToggle}
              disabled={loading.like}
            >
              <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
              {isLiked ? 'Đã thích' : 'Thích'}
            </button>

            <button
              className={`${styles.actionButton} ${isBookmarked ? styles.active : ''}`}
              onClick={handleBookmarkToggle}
              disabled={loading.bookmark}
            >
              <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
              {isBookmarked ? 'Đã lưu' : 'Lưu'}
            </button>

            <button
              className={styles.actionButton}
              onClick={handleShare}
            >
              <Share2 size={16} />
              Chia sẻ
            </button>
          </div>
        </div>
      )}
    </article>
  );
};

export default PostCard;
