import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Search, FileText, Image as ImageIcon,
  TrendingUp, MessageCircle, Heart, LayoutGrid, Calendar, AlertTriangle,
  BookOpen, CheckCircle2, PenSquare, MapPin, ArrowLeft, Clock, ShieldOff,
  ShieldAlert, Info, X, Ban
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../../context/AuthContext';
import CreatePost from '../CreatePost/CreatePost';
import axios from '../../../utils/axiosCustomize';
import styles from './UserPostsManagement.module.scss';

// Ảnh dự phòng bên ngoài (ổn định) khi bài viết chưa có ảnh riêng
const fallbackImage = (post) =>
  `https://picsum.photos/seed/forum${post?.postID || (post?.title?.length ?? 1)}/400/300`;

// Chọn ảnh hiển thị cho thẻ: ưu tiên thumbnail → ảnh trong nội dung → ảnh dự phòng
const getPostImage = (post) => {
  if (post?.thumbnailUrl) return post.thumbnailUrl;
  if (post?.coverImage) return post.coverImage;
  if (post?.content) {
    const m = post.content.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (m && m[1]) return m[1];
  }
  return fallbackImage(post);
};

const UserPostsManagement = () => {
  const { user } = useAuth();
  const userId = user?.userId || user?.userID;
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [moderationPost, setModerationPost] = useState(null);
  const [restriction, setRestriction] = useState(null); // {restricted, permanent, bannedUntil, reason}
  const [stats, setStats] = useState({
    total: 0, published: 0, draft: 0,
    totalViews: 0, totalLikes: 0, totalComments: 0,
  });

  const isRestricted = restriction?.restricted === true;

  useEffect(() => {
    fetchUserPosts();
    fetchCategories();
  }, []);

  // Kiểm tra trạng thái hạn chế forum để disable nút tạo bài + hiện banner
  useEffect(() => {
    if (!userId) { setRestriction(null); return; }
    let alive = true;
    axios.get('/forum/posts/my-restriction', { params: { userId } })
      .then(res => { if (alive) setRestriction(res.data?.data || null); })
      .catch(() => {});
    return () => { alive = false; };
  }, [userId]);

  const openCreate = () => {
    if (isRestricted) {
      toast.error('Bạn đang bị hạn chế hoạt động trên diễn đàn, không thể đăng bài.');
      return;
    }
    setShowCreateModal(true);
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/forum/categories');
      setCategories(res.data?.data || []);
    } catch {}
  };

  const fetchUserPosts = async () => {
    setLoading(true);
    try {
      if (!userId) return;
      const res = await axios.get(`/forum/posts/user/${userId}/manage`, { params: { page: 0, size: 100 } });
      const postsData = res.data?.data?.content || res.data?.content || [];
      setPosts(postsData);
      setStats({
        total: postsData.length,
        published: postsData.filter(p => p.status === 'PUBLISHED').length,
        draft: postsData.filter(p => p.status === 'DRAFT').length,
        hidden: postsData.filter(p => p.status === 'HIDDEN').length,
        pending: postsData.filter(p => p.status === 'PENDING_REVIEW').length,
        totalViews: postsData.reduce((s, p) => s + (p.viewCount || 0), 0),
        totalLikes: postsData.reduce((s, p) => s + (p.likeCount || 0), 0),
        totalComments: postsData.reduce((s, p) => s + (p.commentCount || 0), 0),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await axios.delete(`/forum/posts/${postId}`, { params: { userId } });
      setShowDeleteModal(false);
      fetchUserPosts();
    } catch {
      alert('Không thể xóa bài viết. Vui lòng thử lại.');
    }
  };

  const handleToggleStatus = async (postId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      await axios.patch(`/forum/posts/${postId}/status`, { status: newStatus }, { params: { userId } });
      setPosts(posts.map(p => p.postID === postId ? { ...p, status: newStatus } : p));
    } catch {
      alert('Không thể thay đổi trạng thái.');
    }
  };

  const formatDate = (str) => {
    if (!str) return '';
    return new Date(str).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const STAT_ITEMS = [
    { label: 'Tổng bài viết', value: stats.total,         icon: LayoutGrid,    color: '#0369a1', bg: '#e0f2fe' },
    { label: 'Đã xuất bản',   value: stats.published,     icon: CheckCircle2,  color: '#059669', bg: '#dcfce7' },
    { label: 'Bản nháp',      value: stats.draft,          icon: PenSquare,     color: '#d97706', bg: '#fef9c3' },
    { label: 'Lượt xem',      value: stats.totalViews,     icon: TrendingUp,    color: '#0891b2', bg: '#cffafe' },
    { label: 'Lượt thích',    value: stats.totalLikes,     icon: Heart,         color: '#ef4444', bg: '#fee2e2' },
    { label: 'Bình luận',     value: stats.totalComments,  icon: MessageCircle, color: '#7c3aed', bg: '#ede9fe' },
  ];

  const FILTER_TABS = [
    { value: 'all',            label: 'Tất cả',       icon: LayoutGrid   },
    { value: 'published',      label: 'Đã xuất bản',  icon: Eye          },
    { value: 'draft',          label: 'Bản nháp',     icon: FileText     },
    { value: 'pending_review', label: 'Chờ duyệt',    icon: Clock        },
    { value: 'hidden',         label: 'Vi phạm',      icon: ShieldOff    },
  ];

  const filteredPosts = posts.filter(p => {
    const matchSearch = (p.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || (p.status || '').toLowerCase() === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <div className={styles.page}>

        {/* ── Hero banner ── */}
        <div className={styles.hero}>
          {/* decorative blobs */}
          <div className={styles.heroBlob1} />
          <div className={styles.heroBlob2} />

          {/* left content */}
          <div className={styles.heroContent}>
            <div className={styles.heroIconWrap}>
              <div className={styles.heroIconRing} />
              <div className={styles.heroIcon}><BookOpen size={24} /></div>
            </div>
            <h1 className={styles.heroTitle}>Quản lý bài viết</h1>
            <p className={styles.heroSubtitle}>Theo dõi và quản lý tất cả bài viết của bạn</p>
            <div className={styles.heroBtnGroup}>
              <button
                className={`${styles.heroCreateBtn} ${isRestricted ? styles.heroCreateBtnDisabled : ''}`}
                disabled={isRestricted}
                title={isRestricted ? 'Bạn đang bị hạn chế, không thể đăng bài' : 'Viết bài mới'}
                onClick={openCreate}
              >
                {isRestricted ? <Ban size={16} /> : <Plus size={16} />}
                {isRestricted ? 'Bị hạn chế đăng bài' : 'Viết bài mới'}
              </button>
              <button className={styles.heroBackBtn} onClick={() => navigate('/forum')}>
                <ArrowLeft size={16} /> Về Forum
              </button>
            </div>
          </div>

          {/* right side: slider + floating cards */}
          <div className={styles.heroRight}>
            {/* mosaic photo collage */}
            <div className={styles.mosaic}>
              <div className={`${styles.mosaicCell} ${styles.mosaicBig}`}>
                <img src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop" alt="" loading="lazy" />
                <div className={styles.mosaicOverlay}><MapPin size={13} /> Hạ Long, VN</div>
              </div>
              <div className={styles.mosaicCol}>
                <div className={`${styles.mosaicCell} ${styles.mosaicSm}`}>
                  <img src="https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=240&h=130&fit=crop" alt="" loading="lazy" />
                  <div className={styles.mosaicOverlay}><MapPin size={12} /> Santorini</div>
                </div>
                <div className={`${styles.mosaicCell} ${styles.mosaicSm}`}>
                  <img src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=240&h=130&fit=crop" alt="" loading="lazy" />
                  <div className={styles.mosaicOverlay}><MapPin size={12} /> Alps, CH</div>
                </div>
              </div>
              <div className={styles.mosaicCol}>
                <div className={`${styles.mosaicCell} ${styles.mosaicSm}`}>
                  <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=240&h=130&fit=crop" alt="" loading="lazy" />
                  <div className={styles.mosaicOverlay}><MapPin size={12} /> Maldives</div>
                </div>
                <div className={`${styles.mosaicCell} ${styles.mosaicSm}`}>
                  <img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=240&h=130&fit=crop" alt="" loading="lazy" />
                  <div className={styles.mosaicOverlay}><MapPin size={12} /> Road trip</div>
                </div>
              </div>
              <div className={`${styles.mosaicCell} ${styles.mosaicBig}`}>
                <img src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop" alt="" loading="lazy" />
                <div className={styles.mosaicOverlay}><MapPin size={13} /> Kyoto, JP</div>
              </div>
            </div>

            {/* floating stat badges */}
            <div className={styles.floatCards}>
              <div className={`${styles.floatCard} ${styles.floatCard1}`}>
                <div className={styles.floatIcon} style={{ background: 'rgba(16,185,129,0.3)' }}>
                  <CheckCircle2 size={15} color="#6ee7b7" />
                </div>
                <div>
                  <span>{stats.published} bài xuất bản<small>Đã công khai</small></span>
                </div>
              </div>
              <div className={`${styles.floatCard} ${styles.floatCard2}`}>
                <div className={styles.floatIcon} style={{ background: 'rgba(249,115,22,0.3)' }}>
                  <TrendingUp size={15} color="#fdba74" />
                </div>
                <div>
                  <span>{stats.totalViews.toLocaleString()} lượt xem<small>Tổng lượt đọc</small></span>
                </div>
              </div>
              <div className={`${styles.floatCard} ${styles.floatCard3}`}>
                <div className={styles.floatIcon} style={{ background: 'rgba(239,68,68,0.25)' }}>
                  <Heart size={15} color="#fca5a5" />
                </div>
                <div>
                  <span>{stats.totalLikes} lượt thích<small>Từ cộng đồng</small></span>
                </div>
              </div>
            </div>
          </div>

          {/* wave bottom */}
          <div className={styles.heroWave}>
            <svg viewBox="0 0 1440 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,20 C360,40 1080,0 1440,20 L1440,40 L0,40 Z" fill="#e0f2fe" />
            </svg>
          </div>
        </div>

        {/* ── Banner hạn chế ── */}
        {isRestricted && (
          <div className={styles.banBanner}>
            <Ban size={22} className={styles.banBannerIcon} />
            <div className={styles.banBannerText}>
              <strong>
                Tài khoản của bạn đang bị hạn chế hoạt động trên diễn đàn
                {restriction.permanent
                  ? ' (vĩnh viễn)'
                  : restriction.bannedUntil
                    ? ` đến ${new Date(restriction.bannedUntil).toLocaleString('vi-VN')}`
                    : ''}.
              </strong>
              <span>
                Trong thời gian này bạn không thể đăng bài, bình luận hay tương tác.
                {restriction.reason ? ` Lý do: ${restriction.reason}` : ''}
              </span>
            </div>
          </div>
        )}

        {/* ── Stats strip ── */}
        <div className={styles.statsStrip}>
          {STAT_ITEMS.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={styles.statCard}>
              <div className={styles.statIconBox} style={{ background: bg }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div className={styles.statValue}>{value.toLocaleString()}</div>
              <div className={styles.statLabel}>{label}</div>
            </div>
          ))}
        </div>

        {/* ── Content area ── */}
        <div className={styles.container}>

          {/* Filter bar */}
          <div className={styles.filterBar}>
            <div className={styles.searchWrapper}>
              <Search size={15} />
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className={styles.filterTabs}>
              {FILTER_TABS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  className={`${styles.filterTab} ${filterStatus === value ? styles.active : ''}`}
                  onClick={() => setFilterStatus(value)}
                >
                  <Icon size={13} />{label}
                </button>
              ))}
            </div>
          </div>

          {/* Posts */}
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              Đang tải bài viết...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className={styles.emptyState}>
              <FileText size={56} className={styles.emptyIcon} />
              <h3>Chưa có bài viết nào</h3>
              <p>{searchTerm || filterStatus !== 'all' ? 'Không tìm thấy bài viết phù hợp' : 'Hãy tạo bài viết đầu tiên!'}</p>
              {!searchTerm && filterStatus === 'all' && !isRestricted && (
                <button className={styles.emptyBtn} onClick={openCreate}>
                  <Plus size={16} /> Tạo bài viết đầu tiên
                </button>
              )}
            </div>
          ) : (
            <div className={styles.postList}>
              {filteredPosts.map(post => (
                <div key={post.postID} className={styles.postCard}>
                  <div className={styles.postCardInner}>
                    <div className={styles.postThumbnail}>
                      <img
                        src={getPostImage(post)}
                        alt={post.title}
                        loading="lazy"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = fallbackImage(post); }}
                      />
                      <span className={`${styles.statusBadge} ${styles['status_' + (post.status || 'DRAFT')]}`}>
                        {post.status === 'PUBLISHED'    && <><Eye size={10} /> Xuất bản</>}
                        {post.status === 'DRAFT'        && <><FileText size={10} /> Nháp</>}
                        {post.status === 'HIDDEN'       && <><ShieldOff size={10} /> Vi phạm</>}
                        {post.status === 'PENDING_REVIEW' && <><Clock size={10} /> Chờ duyệt</>}
                        {!['PUBLISHED','DRAFT','HIDDEN','PENDING_REVIEW'].includes(post.status) && <><FileText size={10} /> {post.status}</>}
                      </span>
                    </div>

                    <div className={styles.postBody}>
                      <h3 className={styles.postTitle}>{post.title}</h3>
                      {post.summary && <p className={styles.postSummary}>{post.summary}</p>}

                      <div className={styles.postMeta}>
                        <span className={styles.metaItem}><Calendar size={12} />{formatDate(post.createdAt)}</span>
                        <span className={styles.metaItem}><Eye size={12} />{post.viewCount || 0}</span>
                        <span className={styles.metaItem}><Heart size={12} />{post.likeCount || 0}</span>
                        <span className={styles.metaItem}><MessageCircle size={12} />{post.commentCount || 0}</span>
                        {post.categoryName && (
                          <span
                            className={styles.categoryChip}
                            style={{ background: `${post.categoryColor || '#0ea5e9'}18`, color: post.categoryColor || '#0369a1' }}
                          >
                            {post.categoryName}
                          </span>
                        )}
                      </div>

                      <div className={styles.postActions}>
                        {(post.status === 'HIDDEN' || post.status === 'PENDING_REVIEW') && (
                          <button
                            className={`${styles.actionBtn} ${styles.btnReason}`}
                            onClick={() => setModerationPost(post)}
                          >
                            <ShieldAlert size={12} /> Lý do
                          </button>
                        )}
                        <button className={`${styles.actionBtn} ${styles.btnView}`}
                          onClick={() => window.open(`/forum/post/${post.postID}`, '_blank')}>
                          <Eye size={12} /> Xem
                        </button>
                        <button className={`${styles.actionBtn} ${styles.btnEdit}`}
                          onClick={() => navigate(`/forum/post/${post.postID}/edit`)}>
                          <Edit2 size={12} /> Sửa
                        </button>
                        <button
                          className={`${styles.actionBtn} ${post.status === 'PUBLISHED' ? styles.btnToggleHide : styles.btnToggle}`}
                          onClick={() => handleToggleStatus(post.postID, post.status)}
                        >
                          {post.status === 'PUBLISHED'
                            ? <><EyeOff size={12} /> Ẩn</>
                            : <><Eye size={12} /> Xuất bản</>
                          }
                        </button>
                        <button className={`${styles.actionBtn} ${styles.btnDelete}`}
                          onClick={() => { setSelectedPost(post); setShowDeleteModal(true); }}>
                          <Trash2 size={12} /> Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Moderation reason modal ── */}
      {moderationPost && (
        <div className={styles.modalOverlay} onClick={() => setModerationPost(null)}>
          <div className={styles.modReasonModal} onClick={e => e.stopPropagation()}>
            <div className={`${styles.modReasonHeader} ${moderationPost.status === 'HIDDEN' ? styles.modReasonRed : styles.modReasonPurple}`}>
              <div className={styles.modReasonIconBig}>
                {moderationPost.status === 'HIDDEN'
                  ? <ShieldAlert size={28} />
                  : <Clock size={28} />}
              </div>
              <div className={styles.modReasonHeaderText}>
                <h3 className={styles.modReasonTitle}>
                  {moderationPost.status === 'HIDDEN'
                    ? 'Bài viết vi phạm tiêu chuẩn'
                    : 'Bài viết đang chờ duyệt'}
                </h3>
                <p className={styles.modReasonSub}>
                  {moderationPost.status === 'HIDDEN'
                    ? 'Đã bị AI ẩn khỏi forum'
                    : 'Quản trị viên đang xem xét'}
                </p>
              </div>
              <button className={styles.modReasonClose} onClick={() => setModerationPost(null)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.modReasonBody}>
              <div className={styles.modReasonPostTitle}>
                <FileText size={13} /> {moderationPost.title}
              </div>

              <div className={styles.modReasonBox}>
                <div className={styles.modReasonBoxLabel}>
                  <AlertTriangle size={12} /> Lý do từ AI
                </div>
                <div className={styles.modReasonBoxText}>
                  {moderationPost.moderationReason || 'Không có lý do chi tiết'}
                </div>
                {typeof moderationPost.moderationScore === 'number' && (
                  <div className={styles.modReasonScoreRow}>
                    <span className={styles.modReasonScoreLabel}>Điểm vi phạm:</span>
                    <div className={styles.modReasonScoreBar}>
                      <div
                        className={`${styles.modReasonScoreFill} ${
                          moderationPost.status === 'HIDDEN'
                            ? styles.modReasonScoreRed
                            : styles.modReasonScorePurple
                        }`}
                        style={{ width: `${Math.min(100, (moderationPost.moderationScore || 0) * 100)}%` }}
                      />
                    </div>
                    <span className={styles.modReasonScoreValue}>
                      {((moderationPost.moderationScore || 0) * 100).toFixed(0)}/100
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.modReasonTip}>
                <Info size={13} />
                <div>
                  {moderationPost.status === 'HIDDEN' ? (
                    <>Bạn có thể <strong>Sửa</strong> bài và đăng lại — hệ thống sẽ kiểm tra lại tự động.</>
                  ) : (
                    <>Bài sẽ tự xuất bản nếu admin duyệt, hoặc bị từ chối nếu không đạt tiêu chuẩn.</>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.modReasonFooter}>
              {moderationPost.status === 'HIDDEN' && (
                <button
                  className={styles.modReasonBtnEdit}
                  onClick={() => {
                    setModerationPost(null);
                    navigate(`/forum/post/${moderationPost.postID}/edit`);
                  }}
                >
                  <Edit2 size={13} /> Sửa bài
                </button>
              )}
              <button className={styles.modReasonBtnClose} onClick={() => setModerationPost(null)}>
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ── */}
      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}><AlertTriangle size={26} /></div>
            <h3 className={styles.modalTitle}>Xóa bài viết?</h3>
            <p className={styles.modalDesc}>
              Bạn chắc chắn muốn xóa "<strong>{selectedPost?.title}</strong>"?<br />
              Hành động này không thể hoàn tác.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.btnCancel} onClick={() => setShowDeleteModal(false)}>Hủy</button>
              <button className={styles.btnConfirmDelete} onClick={() => handleDeletePost(selectedPost.postID)}>
                Xóa bài viết
              </button>
            </div>
          </div>
        </div>
      )}

      <CreatePost
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        categories={categories}
        onSuccess={() => { setShowCreateModal(false); fetchUserPosts(); }}
      />
    </>
  );
};

export default UserPostsManagement;
