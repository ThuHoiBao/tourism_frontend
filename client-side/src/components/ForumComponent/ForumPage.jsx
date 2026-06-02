import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquarePlus, Search, TrendingUp, Clock, Flame, BookOpen, Compass, Bookmark, Users, FileEdit } from 'lucide-react';
import PostList from './PostList/PostList';
import CategorySidebar from './CategorySidebar/CategorySidebar';
import TagCloud from './TagCloud/TagCloud';
import TrendingPosts from './TrendingPosts/TrendingPosts';
import UserStats from './UserStats/UserStats';
import CreatePost from './CreatePost/CreatePost';
import axios from '../../utils/axiosCustomize';
import { useAuth } from '../../context/AuthContext';
import styles from './ForumPage.module.scss';

const BASE_TABS = [
  { key: 'newest', label: 'Mới nhất', icon: Clock },
  { key: 'trending', label: 'Xu hướng', icon: TrendingUp },
  { key: 'popular', label: 'Nổi bật', icon: Flame },
];

// Sprint A + C: 2 tab thêm chỉ hiện khi user logged-in
const AUTH_TABS = [
  { key: 'following', label: 'Đang theo dõi', icon: Users },
  { key: 'bookmarks', label: 'Đã lưu', icon: Bookmark },
];

const ForumPage = () => {
  const { user } = useAuth();
  const userId = user?.userId || user?.userID;
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setPage(0);
    setPosts([]);
    fetchPosts(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedTag, searchTerm, sortBy, userId]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/forum/categories');
      setCategories(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchPosts = useCallback(async (pageNum = 0, reset = false) => {
    setLoading(true);
    try {
      // Sprint A + C: tab bookmarks/following dùng endpoint riêng, không hỗ trợ search/filter category
      if (sortBy === 'bookmarks' || sortBy === 'following') {
        if (!userId) {
          setPosts([]); setHasMore(false); return;
        }
        const url = sortBy === 'bookmarks' ? '/forum/posts/bookmarks' : '/forum/posts/feed';
        const res = await axios.get(url, { params: { userId, page: pageNum, size: 10 } });
        const data = res.data?.data;
        const content = data?.content || [];
        setPosts(prev => reset ? content : [...prev, ...content]);
        setHasMore(!data?.last);
        return;
      }
      const sortMap = { newest: 'createdAt', trending: 'viewCount', popular: 'likeCount' };
      const res = await axios.get('/forum/posts', {
        params: {
          page: pageNum,
          size: 10,
          sortBy: sortMap[sortBy] || 'createdAt',
          sortDirection: 'DESC',
          categoryId: selectedCategory || undefined,
          tagId: selectedTag || undefined,
          search: searchTerm || undefined,
          userId: userId || undefined,
        },
      });
      const data = res.data?.data;
      const content = data?.content || [];
      setPosts(prev => reset ? content : [...prev, ...content]);
      setHasMore(!data?.last);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedTag, searchTerm, sortBy, userId]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPosts(next);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    setPage(0);
    setPosts([]);
    fetchPosts(0, true);
  };

  const leftSidebar = (
    <>
      <CategorySidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      <TagCloud selectedTag={selectedTag} onSelectTag={setSelectedTag} />
    </>
  );

  const rightSidebar = (
    <>
      <UserStats />
      <TrendingPosts />
    </>
  );

  return (
    <div className={styles.forumPage}>
      <div className={styles.heroSection}>
        {/* Left: text */}
        <div className={styles.heroContent}>
          <div className={styles.heroIcon}>
            <Compass size={26} />
          </div>
          <h1 className={styles.heroTitle}>Cộng đồng Du lịch</h1>
          <p className={styles.heroSubtitle}>Chia sẻ trải nghiệm, khám phá điểm đến mới cùng hàng nghìn người yêu du lịch</p>
          <div className={styles.heroActions}>
            <button className={styles.createBtn} onClick={() => setShowCreateModal(true)}>
              <MessageSquarePlus size={18} />
              Viết bài mới
            </button>
            <button className={styles.searchBtn} onClick={() => setShowSearch(s => !s)}>
              <Search size={18} />
              Tìm kiếm
            </button>
          </div>
        </div>

        {/* Right: sliding images */}
        <div className={styles.heroSlider}>
          <div className={styles.sliderTrack}>
            {[
              'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=320&h=200&fit=crop',
              'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=320&h=200&fit=crop',
              'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=320&h=200&fit=crop',
              'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=320&h=200&fit=crop',
              'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=320&h=200&fit=crop',
              'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=320&h=200&fit=crop',
              'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=320&h=200&fit=crop',
              'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=320&h=200&fit=crop',
              // duplicate for seamless loop
              'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=320&h=200&fit=crop',
              'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=320&h=200&fit=crop',
              'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=320&h=200&fit=crop',
              'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=320&h=200&fit=crop',
            ].map((src, i) => (
              <div key={i} className={styles.slideCard}>
                <img src={src} alt={`travel-${i}`} loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.mainContainer}>
        <div className={styles.leftSidebar}>{leftSidebar}</div>

        <div className={styles.mainContent}>
          <div className={styles.filterBar}>
            {showSearch && (
              <div className={styles.searchWrapper}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Tìm kiếm bài viết..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            )}
            <div className={styles.filterTabs}>
              {[...BASE_TABS, ...(userId ? AUTH_TABS : [])].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  className={`${styles.filterTab} ${sortBy === key ? styles.active : ''}`}
                  onClick={() => setSortBy(key)}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
              {userId && (
                <Link to="/forum/my-posts" className={styles.filterTab}>
                  <FileEdit size={14} />
                  Bài của tôi
                </Link>
              )}
            </div>
          </div>

          <PostList
            posts={posts}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
          />
        </div>

        <div className={styles.rightSidebar}>{rightSidebar}</div>
      </div>

      <CreatePost
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        categories={categories}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default ForumPage;
