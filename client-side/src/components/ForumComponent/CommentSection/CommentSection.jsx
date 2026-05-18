import React, { useState } from 'react';
import CommentItem from '../CommentItem/CommentItem';
import Avatar from '../../shared/Avatar/Avatar';
import Button from '../../shared/Button/Button';
import Loader from '../../shared/Loader/Loader';
import styles from './CommentSection.module.scss';

const CommentSection = ({
  comments = [],
  postId,
  currentUser,
  onAddComment,
  onReply,
  onLikeComment,
  loading = false,
  totalComments = 0
}) => {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyToUser, setReplyToUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment({
        postId,
        content: newComment.trim(),
        parentCommentId: replyingTo
      });
      setNewComment('');
      setReplyingTo(null);
      setReplyToUser(null);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartReply = (commentId, userName) => {
    setReplyingTo(commentId);
    setReplyToUser(userName);
    setTimeout(() => {
      document.querySelector(`.${styles.commentInput}`)?.focus();
    }, 100);
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyToUser(null);
  };

  const topLevelComments = comments.filter(comment => !comment.parentComment);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader size="md" />
        <p>Đang tải bình luận...</p>
      </div>
    );
  }

  return (
    <div className={styles.commentSection}>
      <div className={styles.commentHeader}>
        <h3 className={styles.commentTitle}>
          Bình luận
          {totalComments > 0 && (
            <span className={styles.commentCount}> ({totalComments})</span>
          )}
        </h3>
      </div>

      {/* Comment Input Form */}
      <div className={styles.commentForm}>
        <div className={styles.commentFormHeader}>
          <Avatar
            src={currentUser?.avatarUrl}
            size="sm"
            alt={currentUser?.fullName || currentUser?.username}
          />
          <div className={styles.commentFormInfo}>
            <span className={styles.commentFormUser}>
              {currentUser?.fullName || currentUser?.username}
            </span>
            {replyingTo && (
              <div className={styles.replyingTo}>
                Đang trả lời <strong>{replyToUser}</strong>
                <button
                  className={styles.cancelReplyBtn}
                  onClick={cancelReply}
                  type="button"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            className={styles.commentInput}
            placeholder={
              replyingTo
                ? `Viết phản hồi cho ${replyToUser}...`
                : "Tham gia thảo luận..."
            }
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows="3"
            disabled={isSubmitting}
          />

          <div className={styles.commentFormActions}>
            <Button
              type="submit"
              variant="primary"
              disabled={!newComment.trim() || isSubmitting}
              loading={isSubmitting}
              size="sm"
            >
              {replyingTo ? 'Phản hồi' : 'Bình luận'}
            </Button>

            {replyingTo && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={cancelReply}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className={styles.commentsList}>
        {topLevelComments.length === 0 ? (
          <div className={styles.noComments}>
            <div className={styles.noCommentsIcon}>💬</div>
            <p className={styles.noCommentsText}>
              Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
            </p>
          </div>
        ) : (
          topLevelComments.map((comment) => (
            <CommentItem
              key={comment.commentID}
              comment={comment}
              currentUser={currentUser}
              onReply={(commentId, userName) =>
                handleStartReply(commentId, userName)
              }
              onLike={onLikeComment}
              depth={0}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
