import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
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
  CornerDownRight,
  Shield,
  Info,
  ShieldAlert,
  Clock,
  AlertCircle,
  Flag,
  X
} from 'lucide-react';
import Avatar from '../../shared/Avatar/Avatar';
import Badge from '../../shared/Badge/Badge';
import Button from '../../shared/Button/Button';
import axios from '../../../utils/axiosCustomize';
import { useAuth } from '../../../context/AuthContext';
import styles from './PostDetailPage.module.scss';

const PostDetailPage = () => {
  const { postId } = useParams();
  const { hash } = useLocation();
  const { user } = useAuth();
  const userId = user?.userId || user?.userID;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const [commentContent, setCommentContent] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);

  const [expandedCommentIds, setExpandedCommentIds] = useState(new Set());

  // Modal kết quả kiểm duyệt comment (TOXIC / BORDERLINE) + policy
  const [commentModResult, setCommentModResult] = useState(null); // { label, reason, score }
  const [showCommentPolicy, setShowCommentPolicy] = useState(false);

  // Modal thông báo chung (thay alert): { type: 'info'|'error'|'warning', title, message }
  const [notice, setNotice] = useState(null);
  const showNotice = (type, title, message) => setNotice({ type, title, message });

  // Modal báo cáo nội dung: { targetType: 'POST'|'COMMENT', targetId }
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState('SPAM');
  const [reportDetail, setReportDetail] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const openReport = (targetType, targetId) => {
    if (!userId) {
      showNotice('info', 'Cần đăng nhập', 'Vui lòng đăng nhập để báo cáo nội dung.');
      return;
    }
    setReportReason('SPAM');
    setReportDetail('');
    setReportTarget({ targetType, targetId });
  };

  const submitReport = async () => {
    if (!reportTarget) return;
    setReportSubmitting(true);
    try {
      await axios.post('/forum/posts/report', {
        targetType: reportTarget.targetType,
        targetId: reportTarget.targetId,
        reason: reportReason,
        detail: reportDetail.trim() || null,
      }, { params: { reporterId: userId } });
      setReportTarget(null);
      showNotice('info', 'Đã gửi báo cáo', 'Cảm ơn bạn. Quản trị viên sẽ xem xét nội dung này.');
    } catch (err) {
      const msg = err.response?.data?.message;
      showNotice('error', 'Không thể gửi báo cáo', msg || 'Vui lòng thử lại sau.');
    } finally {
      setReportSubmitting(false);
    }
  };

  // Quota comment còn lại trong ngày
  const [quota, setQuota] = useState(null); // { remainingComments, maxCommentsPerDay, ... }
  const fetchQuota = async () => {
    if (!userId) return;
    try {
      const res = await axios.get('/forum/posts/quota', { params: { userId } });
      setQuota(res.data?.data || null);
    } catch { /* im lặng, không chặn UX */ }
  };
  useEffect(() => { fetchQuota(); /* eslint-disable-next-line */ }, [userId]);

  // Scroll đến comment được chỉ định qua URL hash (e.g. #comment-42)
  // Chạy sau khi post load xong + expand comment cha nếu cần
  useEffect(() => {
    if (!hash || loading || !post) return;
    const commentId = hash.replace('#comment-', '');
    if (!commentId) return;

    // Expand comment cha để reply hiện ra (nếu có)
    setExpandedCommentIds(prev => {
      const newSet = new Set(prev);
      newSet.add(Number(commentId));
      return newSet;
    });

    // Delay nhỏ để DOM render xong sau khi expand
    const timer = setTimeout(() => {
      const el = document.getElementById(`comment-${commentId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('highlight-comment');
        setTimeout(() => el.classList.remove('highlight-comment'), 2000);
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash, loading, post]);

  // Guard so a view is recorded at most once per mounted post
  // (avoids React StrictMode double-mount + re-render double counting)
  const viewedPostRef = useRef(null);

  useEffect(() => {
    fetchPostDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, userId]);

  // Record a view ONCE when the post is opened.
  // Backend dedupes per viewer (Redis, 30-min window) so refresh /
  // re-visiting in a short period won't inflate the count.
  useEffect(() => {
    if (!postId || viewedPostRef.current === postId) return;
    viewedPostRef.current = postId;
    axios
      .post(`/forum/posts/${postId}/view`, null, {
        params: userId ? { userId } : {},
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const fetchPostDetail = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(`/forum/posts/${postId}`, {
        params: userId ? { userId } : {},
      });
      const postData = res.data.data;
      setPost(postData);

      setLiked(postData.isLikedByCurrentUser || false);
      setLikeCount(postData.likeCount || 0);
    } catch (err) {
      if (!silent) setError('Không thể tải bài viết');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleLikeToggle = async () => {
    if (!userId) {
      showNotice('info', 'Cần đăng nhập', 'Vui lòng đăng nhập để thích bài viết.');
      return;
    }
    try {
      await axios.post(`/forum/posts/${postId}/like`, null, { params: { userId } });
      setLiked(!liked);
      setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    } catch (err) {
      showNotice('error', 'Lỗi', 'Không thể thực hiện thao tác. Vui lòng thử lại.');
    }
  };

  const handleAddComment = async () => {
    if (!commentContent.trim()) return;
    if (!userId) {
      showNotice('info', 'Cần đăng nhập', 'Vui lòng đăng nhập để bình luận.');
      return;
    }
    setCommentLoading(true);
    try {
      const payload = {
        content: commentContent.trim(),
        parentCommentId: null,
        userId
      };
      const res = await axios.post(`/forum/posts/${postId}/comments`, payload);
      const updatedPost = res.data.data;
      setPost(updatedPost);

      // FIX: Cập nhật lại liked status sau khi có data mới
      setLiked(updatedPost.isLikedByCurrentUser || false);
      setLikeCount(updatedPost.likeCount || 0);

      setCommentContent('');
      fetchQuota(); // cập nhật số lượt còn lại

      // Kiểm tra kết quả AI moderation của comment vừa gửi
      const label = updatedPost.commentModerationLabel;
      if (label === 'TOXIC' || label === 'BORDERLINE') {
        setCommentModResult({
          label,
          reason: updatedPost.commentModerationReason || '',
          score: updatedPost.commentModerationScore || 0,
        });
      }
    } catch (err) {
      // Phân biệt lỗi rate-limit (429) với lỗi khác
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 429) {
        showNotice('warning', 'Thao tác quá nhanh', msg || 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.');
      } else if (msg) {
        showNotice('error', 'Không thể gửi bình luận', msg);
      } else {
        showNotice('error', 'Lỗi', 'Không thể gửi bình luận. Vui lòng thử lại.');
      }
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

  // --- Sub-Component: CommentItem (cây lồng tối đa 3 cấp giống Facebook) ---
  // depth: 0 = gốc, 1 = cấp 2, 2 = cấp 3 (cấp sâu nhất hiển thị).
  const MAX_DEPTH = 2; // 3 cấp: 0,1,2
  const CommentItem = ({ comment, depth = 0 }) => {
    const [localLiked, setLocalLiked] = useState(comment.isLikedByCurrentUser || false);
    const [localLikeCount, setLocalLikeCount] = useState(comment.likeCount || 0);

    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [submittingReply, setSubmittingReply] = useState(false);

    const atMaxDepth = depth >= MAX_DEPTH;
    // Các reply đã bị gộp phẳng vào cấp 3 (depth > MAX_DEPTH) là "lá":
    // không hiển thị khối reply con riêng để tránh render lặp.
    const isLeaf = depth > MAX_DEPTH;

    // Reply hiển thị dưới comment này.
    // - Chưa tới cấp sâu nhất: chỉ lấy reply trực tiếp.
    // - Tại cấp 3 (sâu nhất): gộp PHẲNG mọi reply con-cháu vào đây
    //   (không tạo cấp 4), giống Facebook.
    const childReplies = useMemo(() => {
      const collectFlat = (list, acc) => {
        (list || []).forEach(r => {
          acc.push(r);
          if (r.replies && r.replies.length) collectFlat(r.replies, acc);
        });
        return acc;
      };
      const list = atMaxDepth
        ? collectFlat(comment.replies, [])
        : (comment.replies || []).slice();
      return list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }, [comment.replies, atMaxDepth]);

    const hasReplies = childReplies.length > 0;
    const isExpanded = expandedCommentIds.has(comment.commentId);

    const indentDepth = Math.min(depth, MAX_DEPTH);

    const handleReplyClick = () => {
      setShowReplyForm(!showReplyForm);
      if (!showReplyForm) setReplyText('');
    };

    const handleSubmitReply = async () => {
      if (!replyText.trim()) return;
      if (!userId) {
        showNotice('info', 'Cần đăng nhập', 'Vui lòng đăng nhập để trả lời.');
        return;
      }
      setSubmittingReply(true);
      try {
        // Khi đang ở cấp sâu nhất (cấp 3) thì reply KHÔNG tạo cấp 4:
        // gắn vào chính comment cấp 3 này để nó nằm ngang hàng ở cấp 3.
        // Reply cho một reply (depth >= 1) luôn kèm "@Tên" để biết
        // đang trả lời ai — và "@Tên" sẽ in đậm màu xanh khi hiển thị.
        // Định dạng: "@Tên: nội dung" — dấu ":" làm mốc tách chắc chắn
        // để khi hiển thị bôi đậm đúng phần "@Tên".
        const mention = depth >= 1 && comment.authorName
          ? `@${comment.authorName}: `
          : '';
        const payload = {
          content: mention + replyText.trim(),
          parentCommentId: comment.commentId,
          userId
        };
        const res = await axios.post(`/forum/posts/${postId}/comments`, payload);
        ensureExpanded(comment.commentId);

        const updatedPost = res.data.data;
        setPost(updatedPost);

        setLiked(updatedPost.isLikedByCurrentUser || false);
        setLikeCount(updatedPost.likeCount || 0);

        setReplyText('');
        setShowReplyForm(false);
        fetchQuota();

        // Hiện modal nếu reply bị AI ẩn / chờ duyệt
        const label = updatedPost.commentModerationLabel;
        if (label === 'TOXIC' || label === 'BORDERLINE') {
          setCommentModResult({
            label,
            reason: updatedPost.commentModerationReason || '',
            score: updatedPost.commentModerationScore || 0,
          });
        }
      } catch (err) {
        const status = err.response?.status;
        const msg = err.response?.data?.message;
        if (status === 429) {
          showNotice('warning', 'Thao tác quá nhanh', msg || 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.');
        } else if (msg) {
          showNotice('error', 'Không thể gửi trả lời', msg);
        } else {
          showNotice('error', 'Lỗi', 'Không thể gửi trả lời. Vui lòng thử lại.');
        }
      } finally {
        setSubmittingReply(false);
      }
    };

    const handleLikeComment = async () => {
      if (!userId) {
        showNotice('info', 'Cần đăng nhập', 'Vui lòng đăng nhập để thích bình luận.');
        return;
      }
      const prevLiked = localLiked;
      const prevCount = localLikeCount;
      try {
        setLocalLiked(!localLiked);
        setLocalLikeCount(localLiked ? localLikeCount - 1 : localLikeCount + 1);
        await axios.post(`/forum/posts/comments/${comment.commentId}/like`, null, { params: { userId } });
        // KHÔNG re-sort/refetch ở đây: chỉ cập nhật tại chỗ (số like + màu đỏ).
        // Thứ tự bình luận chỉ sắp xếp lại khi tải lại trang — tránh việc
        // bình luận đột ngột nhảy vị trí gây khó chịu cho người dùng.
      } catch (err) {
        setLocalLiked(prevLiked);
        setLocalLikeCount(prevCount);
        showNotice('error', 'Lỗi', 'Không thể thích bình luận. Vui lòng thử lại.');
      }
    };

    // Nếu nội dung mở đầu bằng "@Tên: ..." thì in đậm phần "@Tên"
    // màu xanh, phần còn lại là chữ thường — giống Facebook.
    const renderContent = (text) => {
      const m = /^(@[^\n:]{1,60}):\s?([\s\S]*)$/.exec(text || '');
      if (m) {
        return (
          <>
            <span className={styles.mention}>{m[1]}</span>
            {m[2] ? ' ' + m[2] : ''}
          </>
        );
      }
      return text;
    };

    return (
      <div
        className={depth > 0 ? styles.replyItem : styles.commentItem}
        id={`comment-${comment.commentId}`}
      >
        <div className={styles.commentAvatar}>
          <Avatar
            src={comment.authorAvatar}
            size={depth > 0 ? "xs" : "sm"}
            alt={comment.authorName || 'Ẩn danh'}
          />
        </div>

        <div className={styles.commentBody}>
          <div className={styles.commentBubble}>
            <span className={styles.commentAuthor}>{comment.authorName || 'Ẩn danh'}</span>
            <p>{renderContent(comment.content)}</p>
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
            <button onClick={() => openReport('COMMENT', comment.commentId)}>Báo cáo</button>
          </div>

          {showReplyForm && (
            <div className={styles.replyForm}>
              <Avatar src={user?.avatar} size="xs" alt={user?.fullName || 'You'} />
              <textarea
                placeholder={`Trả lời ${comment.authorName || 'bình luận'}...`}
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

          {/* Leaf ở cấp sâu nhất: KHÔNG render thêm khối reply con
              (đã được gộp phẳng vào comment cấp 3 cha) để tránh lặp. */}
          {!isLeaf && hasReplies && (
            <button
              className={styles.fbViewRepliesBtn}
              onClick={() => handleToggleExpand(comment.commentId)}
            >
              <CornerDownRight size={16} />
              <span>
                {isExpanded
                  ? 'Thu gọn'
                  : `Xem ${childReplies.length} câu trả lời`}
              </span>
            </button>
          )}

          {!isLeaf && hasReplies && isExpanded && (
            <div className={styles.repliesContainer} data-depth={indentDepth}>
              {childReplies.map((reply) => (
                <CommentItem
                  key={reply.commentId}
                  comment={reply}
                  depth={depth + 1}
                />
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
    title, content, thumbnailUrl, authorName, authorAvatar,
    categoryName, tags = [],
    viewCount, commentCount, comments = [], publishedAt, createdAt
  } = post;
  const postDate = publishedAt || createdAt;

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
          {categoryName && <Badge type="primary" label={categoryName} size="md" />}
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
              <Avatar src={authorAvatar} size="lg" alt={authorName || 'Ẩn danh'} />
              <div className={styles.authorInfo}>
                <span className={styles.authorName}>{authorName || 'Ẩn danh'}</span>
                <span className={styles.postMeta}>
                   {postDate && format(new Date(postDate), 'dd MMMM yyyy', { locale: vi })}
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
              <div className={`${styles.stat} ${liked ? styles.statLiked : ''}`}>
                <Heart size={18} fill={liked ? '#e41e3f' : 'none'} /> {likeCount}
              </div>
              <div className={styles.stat}><MessageCircle size={18} /> {commentCount || 0}</div>
            </div>
            <div>
              <Button
                variant="secondary"
                size="md"
                onClick={handleLikeToggle}
                className={`${styles.likeBtn} ${liked ? styles.likedBtn : ''}`}
              >
                <Heart size={18} fill={liked ? '#e41e3f' : 'none'} />
                {liked ? 'Đã thích' : 'Thích'}
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={() => openReport('POST', Number(postId))}
                className={styles.reportBtn}
                title="Báo cáo bài viết"
              >
                <Flag size={16} /> Báo cáo
              </Button>
            </div>
          </div>

          <div className={styles.commentsSection}>
            <h3>Bình luận ({commentCount || 0})</h3>

            {/* Policy notice cho comment */}
            <div className={styles.commentPolicyBar}>
              <div className={styles.commentPolicyLeft}>
                <Shield size={14} />
                <span>Bình luận sẽ được AI kiểm duyệt. Tránh ngôn từ tiêu cực để không bị ẩn.</span>
              </div>
              <div className={styles.commentPolicyRight}>
                {quota && (
                  <span
                    className={`${styles.quotaBadge} ${quota.remainingComments <= 10 ? styles.quotaBadgeLow : ''}`}
                    title={`Bạn còn ${quota.remainingComments} lượt bình luận hôm nay`}
                  >
                    <MessageCircle size={12} />
                    Còn {quota.remainingComments}/{quota.maxCommentsPerDay} lượt hôm nay
                  </span>
                )}
                <button
                  type="button"
                  className={styles.commentPolicyBtn}
                  onClick={() => setShowCommentPolicy(true)}
                >
                  <Info size={12} /> Xem quy định
                </button>
              </div>
            </div>

            <div className={styles.commentForm}>
              <Avatar src={user?.avatar} size="lg" alt={user?.fullName || 'Bạn'} />
              <textarea
                placeholder="Viết bình luận..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                rows="1"
              />
              <Button
                onClick={handleAddComment}
                disabled={commentLoading || !commentContent.trim()}
                className={styles.commentSubmitBtn}
              >
                <Send size={16} />
                <span>Gửi</span>
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

      {/* ── Modal: Quy định bình luận ── */}
      {showCommentPolicy && (
        <div className={styles.modOverlay} onClick={() => setShowCommentPolicy(false)}>
          <div className={styles.modCard} onClick={(e) => e.stopPropagation()}>
            <div className={`${styles.modHeader} ${styles.modHeaderPolicy}`}>
              <div className={styles.modIconWrap}><Shield size={26} /></div>
              <div className={styles.modHeaderText}>
                <h3 className={styles.modTitle}>Quy định bình luận</h3>
                <p className={styles.modSubtitle}>AI tự động kiểm duyệt để giữ môi trường lành mạnh</p>
              </div>
              <button className={styles.modCloseBtn} onClick={() => setShowCommentPolicy(false)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modBody}>
              <div className={styles.policyItem}>
                <span className={`${styles.policyDot} ${styles.dotRed}`} />
                <div>
                  <strong>Cấm tuyệt đối</strong>
                  <p>Ngôn từ thô tục, xúc phạm, kỳ thị, bạo lực, khiêu dâm</p>
                </div>
              </div>
              <div className={styles.policyItem}>
                <span className={`${styles.policyDot} ${styles.dotAmber}`} />
                <div>
                  <strong>Cần xem xét</strong>
                  <p>Spam, quảng cáo, nội dung gây tranh cãi → chờ admin duyệt</p>
                </div>
              </div>
              <div className={styles.policyItem}>
                <span className={`${styles.policyDot} ${styles.dotGreen}`} />
                <div>
                  <strong>Khuyến khích</strong>
                  <p>Góp ý xây dựng, chia sẻ kinh nghiệm, hỏi đáp lịch sự</p>
                </div>
              </div>
              <div className={styles.policyFlow}>
                AI chấm điểm 0–1: <strong>&lt; 0.3</strong> hiện ngay,
                <strong> 0.3–0.7</strong> chờ duyệt, <strong> ≥ 0.7</strong> bị ẩn.
              </div>
            </div>
            <div className={styles.modFooter}>
              <button className={styles.modBtn} onClick={() => setShowCommentPolicy(false)}>Đã hiểu</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Kết quả kiểm duyệt comment vừa gửi ── */}
      {commentModResult && (
        <div className={styles.modOverlay} onClick={() => setCommentModResult(null)}>
          <div className={styles.modCard} onClick={(e) => e.stopPropagation()}>
            <div className={`${styles.modHeader} ${commentModResult.label === 'TOXIC' ? styles.modHeaderToxic : styles.modHeaderBorderline}`}>
              <div className={styles.modIconWrap}>
                {commentModResult.label === 'TOXIC' ? <ShieldAlert size={26} /> : <Clock size={26} />}
              </div>
              <div className={styles.modHeaderText}>
                <h3 className={styles.modTitle}>
                  {commentModResult.label === 'TOXIC'
                    ? 'Bình luận đã bị ẩn'
                    : 'Bình luận đang chờ duyệt'}
                </h3>
                <p className={styles.modSubtitle}>
                  {commentModResult.label === 'TOXIC'
                    ? 'AI phát hiện nội dung vi phạm tiêu chuẩn cộng đồng'
                    : 'AI chưa thể xác định rõ — quản trị viên sẽ xem xét'}
                </p>
              </div>
              <button className={styles.modCloseBtn} onClick={() => setCommentModResult(null)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modBody}>
              <div className={styles.modReasonBox}>
                <div className={styles.modReasonLabel}><AlertCircle size={13} /> Lý do từ AI</div>
                <div className={styles.modReasonText}>
                  {commentModResult.reason || 'Không có lý do chi tiết'}
                </div>
                <div className={styles.modScoreRow}>
                  <span className={styles.modScoreLabel}>Điểm vi phạm:</span>
                  <div className={styles.modScoreBar}>
                    <div
                      className={`${styles.modScoreFill} ${commentModResult.label === 'TOXIC' ? styles.fillRed : styles.fillAmber}`}
                      style={{ width: `${Math.min(100, (commentModResult.score || 0) * 100)}%` }}
                    />
                  </div>
                  <span className={styles.modScoreValue}>
                    {((commentModResult.score || 0) * 100).toFixed(0)}/100
                  </span>
                </div>
              </div>
              <div className={styles.modTipBox}>
                <Info size={13} />
                <span>
                  {commentModResult.label === 'TOXIC'
                    ? 'Vui lòng chỉnh sửa nội dung văn minh hơn và thử lại.'
                    : 'Bình luận sẽ hiển thị sau khi được quản trị viên phê duyệt.'}
                </span>
              </div>
            </div>
            <div className={styles.modFooter}>
              <button className={styles.modBtn} onClick={() => setCommentModResult(null)}>Đã hiểu</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal thông báo chung (thay alert) ── */}
      {reportTarget && (
        <div className={styles.modOverlay} onClick={() => !reportSubmitting && setReportTarget(null)}>
          <div className={styles.noticeCard} onClick={(e) => e.stopPropagation()}>
            <div className={`${styles.noticeIcon} ${styles.noticeIconWarning}`}>
              <Flag size={26} />
            </div>
            <h3 className={styles.noticeTitle}>
              Báo cáo {reportTarget.targetType === 'POST' ? 'bài viết' : 'bình luận'}
            </h3>
            <p className={styles.noticeMessage}>Vui lòng chọn lý do báo cáo nội dung này.</p>

            <select
              className={styles.reportSelect}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              disabled={reportSubmitting}
            >
              <option value="SPAM">Spam / quảng cáo</option>
              <option value="INAPPROPRIATE">Nội dung không phù hợp</option>
              <option value="HARASSMENT">Quấy rối / xúc phạm</option>
              <option value="MISINFORMATION">Thông tin sai lệch</option>
              <option value="OTHER">Khác</option>
            </select>

            <textarea
              className={styles.reportDetail}
              placeholder="Mô tả thêm (không bắt buộc)..."
              value={reportDetail}
              onChange={(e) => setReportDetail(e.target.value)}
              rows="3"
              disabled={reportSubmitting}
            />

            <div className={styles.reportActions}>
              <button
                className={styles.reportCancelBtn}
                onClick={() => setReportTarget(null)}
                disabled={reportSubmitting}
              >
                Hủy
              </button>
              <button
                className={styles.modBtn}
                onClick={submitReport}
                disabled={reportSubmitting}
              >
                {reportSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className={styles.modOverlay} onClick={() => setNotice(null)}>
          <div className={styles.noticeCard} onClick={(e) => e.stopPropagation()}>
            <div className={`${styles.noticeIcon} ${
              notice.type === 'error' ? styles.noticeIconError
                : notice.type === 'warning' ? styles.noticeIconWarning
                : styles.noticeIconInfo
            }`}>
              {notice.type === 'error' ? <AlertCircle size={26} />
                : notice.type === 'warning' ? <Clock size={26} />
                : <Info size={26} />}
            </div>
            <h3 className={styles.noticeTitle}>{notice.title}</h3>
            <p className={styles.noticeMessage}>{notice.message}</p>
            <button className={styles.modBtn} onClick={() => setNotice(null)}>Đã hiểu</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetailPage;
