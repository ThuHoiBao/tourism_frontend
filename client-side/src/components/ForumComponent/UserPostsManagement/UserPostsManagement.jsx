import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  MessageCircle,
  Heart,
  MoreVertical,
  FileText,
  Image
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import CreatePost from '../CreatePost/CreatePost';
import axios from '../../../utils/axiosCustomize';
import styles from './UserPostsManagement.module.scss';

const UserPostsManagement = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0
  });

  useEffect(() => {
    fetchUserPosts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/forum/categories');
      setCategories(res.data?.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchUserPosts = async () => {
    setLoading(true);
    try {
      const userId = user?.userId || user?.userID;
      if (!userId) {
        console.error('User not found');
        return;
      }

      const response = await axios.get(`/forum/posts/user/${userId}`, {
        params: {
          page: 0,
          size: 100 // Lấy nhiều để hiển thị hết
        }
      });

      const postsData = response.data?.data?.content || response.data?.content || [];
      console.log('Fetched user posts:', postsData);
      setPosts(postsData);

      // Calculate stats
      const published = postsData.filter(p => p.status === 'PUBLISHED').length;
      const draft = postsData.filter(p => p.status === 'DRAFT').length;
      const totalViews = postsData.reduce((sum, p) => sum + (p.viewCount || 0), 0);
      const totalLikes = postsData.reduce((sum, p) => sum + (p.likeCount || 0), 0);
      const totalComments = postsData.reduce((sum, p) => sum + (p.commentCount || 0), 0);

      setStats({
        total: postsData.length,
        published,
        draft,
        totalViews,
        totalLikes,
        totalComments
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await axios.delete(`/forum/posts/${postId}`);
      setPosts(posts.filter(p => p.postID !== postId));
      setShowDeleteModal(false);
      alert('Xóa bài viết thành công!');

      // Refresh để cập nhật stats
      fetchUserPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Không thể xóa bài viết. Vui lòng thử lại.');
    }
  };

  const handleToggleStatus = async (postId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';

      await axios.patch(`/forum/posts/${postId}/status`, {
        status: newStatus
      });

      setPosts(posts.map(p =>
        p.postID === postId ? { ...p, status: newStatus } : p
      ));

      alert(`Đã ${newStatus === 'PUBLISHED' ? 'xuất bản' : 'ẩn'} bài viết thành công!`);
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Không thể thay đổi trạng thái. Vui lòng thử lại.');
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchUserPosts(); // Refresh danh sách
  };

  const filteredPosts = posts.filter(post => {
    const matchSearch = (post.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (post.summary || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' ||
                       (post.status || 'DRAFT').toLowerCase() === filterStatus.toLowerCase();
    return matchSearch && matchStatus;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa xuất bản';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className={styles.statCard}>
      <div className={styles.statContent}>
        <div>
          <p className={styles.label}>{label}</p>
          <p className={styles.value}>{value.toLocaleString()}</p>
        </div>
        <div className={styles.iconWrapper} style={{ backgroundColor: color }}>
          <Icon size={24} color="white" />
        </div>
      </div>
    </div>
  );

  const PostCard = ({ post }) => (
    <div className={styles.postCard}>
      <div className={styles.cardBody}>
        {/* Thumbnail */}
        <div className={styles.thumbnail}>
          {post.thumbnailUrl ? (
            <img
              src={post.thumbnailUrl}
              alt={post.title}
            />
          ) : (
            <div className={styles.placeholder}>
              <Image size={48} />
            </div>
          )}
          <span className={`${styles.statusBadge} ${post.status === 'PUBLISHED' ? styles.published : styles.draft}`}>
            {post.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Nháp'}
          </span>
        </div>

        {/* Content */}
        <div className={styles.content}>
          <div className={styles.headerRow}>
            <h3 className={styles.postTitle}>{post.title}</h3>
            <button
              className={styles.menuBtn}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical size={20} />
            </button>
          </div>

          <p className={styles.summary}>{post.summary}</p>

          <div className={styles.metaInfo}>
            <span
              className={styles.categoryBadge}
              style={{
                backgroundColor: `${post.categoryColor || '#3b82f6'}15`,
                color: post.categoryColor || '#3b82f6'
              }}
            >
              {post.categoryName}
            </span>
            <span className={styles.date}>
              <Calendar size={12} />
              {formatDate(post.publishedAt || post.createdAt)}
            </span>
          </div>

          {/* Stats */}
          <div className={styles.statsRow}>
            <span><Eye size={16} /> {post.viewCount || 0}</span>
            <span><Heart size={16} /> {post.likeCount || 0}</span>
            <span><MessageCircle size={16} /> {post.commentCount || 0}</span>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              className={styles.btnView}
              onClick={() => window.open(`/forum/post/${post.postID}`, '_blank')}
            >
              <Eye size={16} /> Xem
            </button>
            <button
              className={styles.btnEdit}
              onClick={() => window.location.href = `/posts/${post.postID}/edit`}
            >
              <Edit2 size={16} /> Sửa
            </button>
            <button
              className={styles.btnToggle}
              onClick={() => handleToggleStatus(post.postID, post.status)}
            >
              {post.status === 'PUBLISHED' ? (
                <><EyeOff size={16} /> Ẩn</>
              ) : (
                <><Eye size={16} /> Xuất bản</>
              )}
            </button>
            <button
              className={styles.btnDelete}
              onClick={() => {
                setSelectedPost(post);
                setShowDeleteModal(true);
              }}
            >
              <Trash2 size={16} /> Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <div>
                <h1>Quản lý bài viết</h1>
                <p>Quản lý và theo dõi các bài viết của bạn</p>
              </div>
              <button
                className={styles.createBtn}
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={20} />
                Tạo bài viết mới
              </button>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
              <StatCard icon={FileText} label="Tổng bài viết" value={stats.total} color="#3b82f6" />
              <StatCard icon={Eye} label="Đã xuất bản" value={stats.published} color="#10b981" />
              <StatCard icon={EyeOff} label="Bản nháp" value={stats.draft} color="#f59e0b" />
              <StatCard icon={TrendingUp} label="Lượt xem" value={stats.totalViews} color="#8b5cf6" />
              <StatCard icon={Heart} label="Lượt thích" value={stats.totalLikes} color="#ef4444" />
              <StatCard icon={MessageCircle} label="Bình luận" value={stats.totalComments} color="#6366f1" />
            </div>

            {/* Search and Filter */}
            <div className={styles.filterBar}>
              <div className={styles.searchWrapper}>
                <Search className={styles.searchIcon} size={20} />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài viết..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className={styles.filterWrapper}>
                <Filter className={styles.filterIcon} size={20} />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="published">Đã xuất bản</option>
                  <option value="draft">Bản nháp</option>
                </select>
              </div>
            </div>
          </div>

          {/* Posts List */}
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Đang tải bài viết...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className={styles.emptyState}>
              <FileText className={styles.emptyIcon} size={64} />
              <h3>Chưa có bài viết nào</h3>
              <p>
                {searchTerm || filterStatus !== 'all'
                  ? 'Không tìm thấy bài viết phù hợp với bộ lọc của bạn'
                  : 'Bắt đầu tạo bài viết đầu tiên của bạn ngay hôm nay!'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <button
                  className={styles.createBtn}
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus size={20} />
                  Tạo bài viết đầu tiên
                </button>
              )}
            </div>
          ) : (
            <div className={styles.postList}>
              {filteredPosts.map(post => (
                <PostCard key={post.postID} post={post} />
              ))}
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className={styles.modalOverlay}>
              <div className={styles.modalContent}>
                <div className={styles.modalIcon}>
                  <Trash2 size={24} />
                </div>
                <h3>Xác nhận xóa bài viết</h3>
                <p>
                  Bạn có chắc chắn muốn xóa bài viết "<strong>{selectedPost?.title}</strong>"?
                  Hành động này không thể hoàn tác.
                </p>
                <div className={styles.modalActions}>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className={styles.btnCancel}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => handleDeletePost(selectedPost.postID)}
                    className={styles.btnConfirm}
                  >
                    Xóa bài viết
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePost
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        categories={categories}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
};

export default UserPostsManagement;
