import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, Eye, EyeOff, Search, FileText, Image as ImageIcon,
  TrendingUp, MessageCircle, Heart, LayoutGrid, Calendar, AlertTriangle,
  BookOpen, CheckCircle2, PenSquare, MapPin
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import CreatePost from '../CreatePost/CreatePost';
import axios from '../../../utils/axiosCustomize';
import styles from './UserPostsManagement.module.scss';

const UserPostsManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0, published: 0, draft: 0,
    totalViews: 0, totalLikes: 0, totalComments: 0,
  });

  useEffect(() => {
    fetchUserPosts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/forum/categories');
      setCategories(res.data?.data || []);
    } catch {}
  };

  const fetchUserPosts = async () => {
    setLoading(true);
    try {
      const userId = user?.userId || user?.userID;
      if (!userId) return;
      const res = await axios.get(`/forum/posts/user/${userId}`, { params: { page: 0, size: 100 } });
      const postsData = res.data?.data?.content || res.data?.content || [];
      setPosts(postsData);
      setStats({
        total: postsData.length,
        published: postsData.filter(p => p.status === 'PUBLISHED').length,
        draft: postsData.filter(p => p.status === 'DRAFT').length,
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
      await axios.delete(`/forum/posts/${postId}`);
      setShowDeleteModal(false);
      fetchUserPosts();
    } catch {
      alert('Không thể xóa bài viết. Vui lòng thử lại.');
    }
  };

  const handleToggleStatus = async (postId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
      await axios.patch(`/forum/posts/${postId}/status`, { status: newStatus });
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
    { value: 'all',       label: 'Tất cả',       icon: LayoutGrid   },
    { value: 'published', label: 'Đã xuất bản',  icon: Eye          },
    { value: 'draft',     label: 'Bản nháp',     icon: FileText     },
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
            <button className={styles.heroCreateBtn} onClick={() => setShowCreateModal(true)}>
              <Plus size={16} /> Viết bài mới
            </button>
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
              {!searchTerm && filterStatus === 'all' && (
                <button className={styles.emptyBtn} onClick={() => setShowCreateModal(true)}>
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
                      {post.thumbnailUrl
                        ? <img src={post.thumbnailUrl} alt={post.title} />
                        : <div className={styles.thumbnailPlaceholder}><ImageIcon size={28} /></div>
                      }
                      <span className={`${styles.statusBadge} ${post.status === 'PUBLISHED' ? styles.published : styles.draft}`}>
                        {post.status === 'PUBLISHED'
                          ? <><Eye size={10} /> Xuất bản</>
                          : <><FileText size={10} /> Nháp</>
                        }
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
