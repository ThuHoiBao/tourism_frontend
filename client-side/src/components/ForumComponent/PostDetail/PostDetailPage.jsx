import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Calendar,
  ArrowLeft,
  Send,
  CornerDownRight
} from 'lucide-react';
import Avatar from '../../shared/Avatar/Avatar';
import Badge from '../../shared/Badge/Badge';
import Button from '../../shared/Button/Button';
import axios from '../../../utils/axiosCustomize';
import styles from './PostDetailPage.module.scss';

const PostDetailPage = () => {
  const { postId } = useParams();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const [commentContent, setCommentContent] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const [expandedCommentIds, setExpandedCommentIds] = useState(new Set());

  useEffect(() => {
    fetchPostDetail();
  }, [postId]);

  const fetchPostDetail = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/forum/posts/${postId}`);
      const postData = res.data.data;
      setPost(postData);

      setLiked(postData.isLikedByCurrentUser || false);
      setLikeCount(postData.likeCount || 0);
    } catch (err) {
      setError('Không thể tải bài viết');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeToggle = async () => {
    try {
      await axios.post(`/forum/posts/${postId}/like`);
      setLiked(!liked);
      setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    } catch (err) {
      alert('Lỗi khi like bài viết');
    }
  };

  const handleAddComment = async () => {
    if (!commentContent.trim()) return;
    setCommentLoading(true);
    try {
      const payload = {
        content: commentContent.trim(),
        parentCommentId: null
      };
      const res = await axios.post(`/forum/posts/${postId}/comments`, payload);
      const updatedPost = res.data.data;
      setPost(updatedPost);

      // FIX: Cập nhật lại liked status sau khi có data mới
      setLiked(updatedPost.isLikedByCurrentUser || false);
      setLikeCount(updatedPost.likeCount || 0);

      setCommentContent('');
    } catch (err) {
      alert('Không thể gửi bình luận');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleToggleExpand = (commentId) => {
    setExpandedCommentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) newSet.delete(commentId);
      else newSet.add(commentId);
      return newSet;
    });
  };

  const ensureExpanded = (commentId) => {
    setExpandedCommentIds(prev => {
      const newSet = new Set(prev);
      if (!newSet.has(commentId)) newSet.add(commentId);
      return newSet;
    });
  };

  // --- Sub-Component: CommentItem ---
  const CommentItem = ({ comment, isReply = false }) => {
    const [localLiked, setLocalLiked] = useState(comment.isLikedByCurrentUser || false);
    const [localLikeCount, setLocalLikeCount] = useState(comment.likeCount || 0);

    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);

    const isExpanded = expandedCommentIds.has(comment.commentId);

    // Flatten replies
    const allReplies = useMemo(() => {
        const list = [];
        const collect = (replies) => {
            if (!replies) return;
            replies.forEach(r => {
                list.push(r);
                if (r.replies && r.replies.length > 0) collect(r.replies);
            });
        };
        if (comment.replies) collect(comment.replies);
        return list;
    }, [comment.replies]);

    const hasReplies = allReplies.length > 0;

    const handleReplyClick = () => {
      setShowReplyForm(!showReplyForm);
      if (!showReplyForm) setReplyText('');
    };

    const handleSubmitReply = async () => {
      if (!replyText.trim()) return;
      setSubmittingReply(true);
      try {
        const payload = {
          content: replyText.trim(),
          parentCommentId: comment.commentId
        };
        const res = await axios.post(`/forum/posts/${postId}/comments`, payload);
        ensureExpanded(comment.commentId);

        const updatedPost = res.data.data;
        setPost(updatedPost);

        // FIX: Cập nhật lại liked status
        setLiked(updatedPost.isLikedByCurrentUser || false);
        setLikeCount(updatedPost.likeCount || 0);

        setReplyText('');
        setShowReplyForm(false);
      } catch (err) {
        alert('Không thể gửi trả lời');
      } finally {
        setSubmittingReply(false);
      }
    };

    const handleLikeComment = async () => {
      const prevLiked = localLiked;
      const prevCount = localLikeCount;
      try {
        setLocalLiked(!localLiked);
        setLocalLikeCount(localLiked ? localLikeCount - 1 : localLikeCount + 1);
        await axios.post(`/forum/posts/comments/${comment.commentId}/like`);
      } catch (err) {
        setLocalLiked(prevLiked);
        setLocalLikeCount(prevCount);
        alert('Lỗi like bình luận');
      }
    };

    return (
      <div className={isReply ? styles.replyItem : styles.commentItem} id={`comment-${comment.commentId}`}>

        <div className={styles.commentAvatar}>
          <Avatar
            src={comment.author?.avatarUrl}
            size={isReply ? "xs" : "sm"}
            alt={comment.author?.fullName}
          />
        </div>

        <div className={styles.commentBody}>
          <div className={styles.commentBubble}>
            <span className={styles.commentAuthor}>{comment.author?.fullName}</span>
            <p>{comment.content}</p>
          </div>

          <div className={styles.commentActions}>
            <span className={styles.commentDate}>
              {format(new Date(comment.createdAt), 'dd/MM/yyyy', { locale: vi })}
            </span>
            <button
              className={localLiked ? styles.liked : ''}
              onClick={handleLikeComment}
            >
              {localLiked ? 'Đã thích' : 'Thích'}
              {localLikeCount > 0 && ` (${localLikeCount})`}
            </button>
            <button onClick={handleReplyClick}>Phản hồi</button>
          </div>

          {showReplyForm && (
            <div className={styles.replyForm}>
              <Avatar src={comment.author?.avatarUrl} size="xs" alt="You" />
              <textarea
                placeholder={`Trả lời ${comment.author?.fullName}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows="1"
                autoFocus
              />
              <div className={styles.replyActions}>
                <button
                    onClick={handleSubmitReply}
                    disabled={!replyText.trim() || submittingReply}
                    className={styles.submitBtn}
                >
                    Gửi
                </button>
              </div>
            </div>
          )}

          {!isReply && hasReplies && (
            <button
              className={styles.fbViewRepliesBtn}
              onClick={() => handleToggleExpand(comment.commentId)}
            >
              <CornerDownRight size={16} />
              <span>
                {isExpanded ? 'Thu gọn' : `Xem ${allReplies.length} câu trả lời`}
              </span>
            </button>
          )}

          {!isReply && hasReplies && isExpanded && (
            <div className={styles.repliesContainer}>
              {allReplies.map((reply) => (
                <CommentItem key={reply.commentId} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Main Render ---
  if (loading) return <div className={styles.loading}>Đang tải...</div>;
  if (error || !post) return <div className={styles.notFound}>Bài viết không tồn tại</div>;

  const {
    title, content, thumbnailUrl, author, category, tags = [],
    viewCount, commentCount, comments = [], publishedAt
  } = post;

  return (
    <div className={styles.postDetailPage}>
      <div className={styles.breadcrumb}>
        <Link to="/forum" className={styles.backLink}>
          <ArrowLeft size={16} /> Về diễn đàn
        </Link>
      </div>

      <div className={styles.container}>
        {thumbnailUrl && (
          <div className={styles.hero}>
            <img src={thumbnailUrl} alt={title} className={styles.heroImage} />
          </div>
        )}

        <div className={styles.metaTop}>
          {category && <Badge type="primary" label={category.categoryName} size="md" />}
          {tags.length > 0 && (
            <div className={styles.tags}>
              {tags.map((tag) => (
                <Badge key={tag.tagId} type="secondary" label={tag.tagName} size="sm" />
              ))}
            </div>
          )}
        </div>

        <h1 className={styles.pageTitle}>{title}</h1>

        <div className={styles.authorSection}>
           <div className={styles.authorHeader}>
              <Avatar src={author?.avatarUrl} size="lg" alt={author?.fullName} />
              <div className={styles.authorInfo}>
                <span className={styles.authorName}>{author?.fullName}</span>
                <span className={styles.postMeta}>
                   {publishedAt && format(new Date(publishedAt), 'dd MMMM yyyy', { locale: vi })}
                </span>
              </div>
           </div>
        </div>

        <div className={styles.mainContent}>
          <article className={styles.contentBody}>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </article>

          <div className={styles.actionsBar}>
            <div className={styles.stats}>
              <div className={styles.stat}><Eye size={18} /> {viewCount || 0}</div>
              <div className={styles.stat}><Heart size={18} /> {likeCount}</div>
              <div className={styles.stat}><MessageCircle size={18} /> {commentCount || 0}</div>
            </div>
            <div>
              <Button
                variant={liked ? 'primary' : 'outline'}
                size="md"
                icon={<Heart size={18} fill={liked ? 'currentColor' : 'none'} />}
                onClick={handleLikeToggle}
              >
                {liked ? 'Đã thích' : 'Thích'}
              </Button>
            </div>
          </div>

          <div className={styles.commentsSection}>
            <h3>Bình luận ({commentCount || 0})</h3>

            <div className={styles.commentForm}>
            <Avatar src={author?.avatarUrl} size="lg" alt={author?.fullName} />
               <textarea
                placeholder="Viết bình luận..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                rows="1"
              />
              <Button
                onClick={handleAddComment}
                disabled={commentLoading || !commentContent.trim()}
                icon={<Send size={16} />}
              >
              </Button>
            </div>

            <div className={styles.commentList}>
              {comments.map((comment) => (
                <CommentItem key={comment.commentId} comment={comment} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
