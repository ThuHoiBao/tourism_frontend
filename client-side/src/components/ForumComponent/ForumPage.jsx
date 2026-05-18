import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ForumLayout from './ForumLayout/ForumLayout';
import PostList from './PostList/PostList';
import CreatePost from './CreatePost/CreatePost';
import CategorySidebar from './CategorySidebar/CategorySidebar';
import TagCloud from './TagCloud/TagCloud';
import TrendingPosts from './TrendingPosts/TrendingPosts';
import UserStats from './UserStats/UserStats';
import styles from './ForumPage.module.scss';
import axios from '../../utils/axiosCustomize';
import { useAuth } from '../../context/AuthContext';
import UserPostsManagement from './UserPostsManagement/UserPostsManagement.jsx';

// Component con để tách riêng phần header tĩnh
const ForumHeader = React.memo(({ onSearchChange, onSortChange, filters }) => {
  return (
    <div className={styles.stickyHeaderWrapper}>
      <div className={styles.forumHeaderSlider}>
        <div className={styles.sliderTrack}>
          <img src="https://res.cloudinary.com/dnt8vx1at/image/upload/v1766476201/tourism_app_tours/avatars/bxwsqnq7o53u9z8xxrjn.webp" alt="Du lịch Việt Nam" />
          <img src="https://res.cloudinary.com/dnt8vx1at/image/upload/v1766406016/tourism_app_tours/avatars/xhrfv1pz6lsftjowg2su.webp" alt="Du lịch Việt Nam" />
          <img src="https://res.cloudinary.com/dnt8vx1at/image/upload/v1766344857/tourism_app_tours/review_images/vfiri1ypqlk2vdn71pyl.jpg" alt="Du lịch Việt Nam" />
          <img src="https://res.cloudinary.com/dnt8vx1at/image/upload/v1766333453/tourism_app_tours/SN5-002-100126VN-D/du2zr5ac6vmp01zlgdmp.webp" alt="Du lịch Việt Nam" />
          <img src="https://res.cloudinary.com/dnt8vx1at/image/upload/v1766136366/tourism_app_tours/NDSGN596/om1jrvehzbdgu2aq5fo5.webp" alt="Du lịch Việt Nam" />
          <img src="https://res.cloudinary.com/dnt8vx1at/image/upload/v1766133215/tourism_app_tours/NDCRV550/jfzv0spkzd2q9gbeu3h7.webp" alt="Du lịch Việt Nam" />
          <img src="https://res.cloudinary.com/dnt8vx1at/image/upload/v1766130120/tourism_app_tours/NDSGN1064/dpjpmhlqmuzjcostqcmj.webp" alt="Du lịch Việt Nam" />
          <img src="https://res.cloudinary.com/dnt8vx1at/image/upload/v1766130110/tourism_app_tours/NDSGN1064/ayx6akdtasl1wd64o0tb.webp" alt="Du lịch Việt Nam" />
        </div>
      </div>

      <div className={styles.forumFilters}>
        <div className={styles.filterGroup}>
          <select
            className={styles.filterSelect}
            value={
              filters.sortBy === 'createdAt' ? 'newest' :
              filters.sortBy === 'viewCount' ? 'popular' :
              filters.sortBy === 'likeCount' ? 'mostLiked' :
              filters.sortBy === 'commentCount' ? 'mostCommented' : 'newest'
            }
            onChange={onSortChange}
          >
            <option value="newest">Mới nhất</option>
            <option value="popular">Phổ biến</option>
            <option value="mostLiked">Nhiều lượt thích</option>
            <option value="mostCommented">Nhiều bình luận</option>
            <option value="mostViewed">Nhiều lượt xem</option>
          </select>

          <input
            type="text"
            className={styles.searchInput}
            placeholder="Tìm kiếm bài viết..."
            value={filters.searchQuery}
            onChange={onSearchChange}
          />
        </div>
      </div>
    </div>
  );
});

ForumHeader.displayName = 'ForumHeader';

const ForumPage = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [filters, setFilters] = useState({
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    sortDirection: 'DESC',
    categoryId: null,
    tagId: null,
    searchQuery: ''
  });

  const handleManagerPostClick = () => {
    navigate('/forum/my-posts');
  }


  useEffect(() => {
    if (authUser) {
      fetchUserStats();
    } else {
      setCurrentUser(null);
    }
  }, [authUser]);

  const fetchUserStats = async () => {
    try {
      const response = await axios.get('/forum/posts/user/stats', { params: { userId: authUser?.userId || authUser?.userID } });
      const stats = response.data.data || {};
      setCurrentUser({
        ...authUser,
        statistics: {
          totalPosts: stats.postCount || stats.totalPosts || 0,
          totalComments: stats.commentCount || stats.totalComments || 0,
          totalLikesReceived: stats.likeCount || stats.totalLikesReceived || 0,
          reputationPoints: stats.reputationPoints || 0,
          totalFollowers: stats.totalFollowers || 0
        }
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setCurrentUser(authUser);
    }
  };

  // Chỉ fetch posts khi filters thay đổi
  useEffect(() => {
    fetchPosts();
  }, [filters]);

  // Fetch data ban đầu (categories, tags, trending) - chỉ 1 lần
  useEffect(() => {
    fetchInitialStaticData();
  }, []);

  const fetchInitialStaticData = async () => {
    try {
      const [trendingRes, categoriesRes, tagsRes] = await Promise.all([
        axios.get('/forum/posts/trending', { params: { page: 0, size: 5 } }),
        axios.get('/forum/categories'),
        axios.get('/forum/tags/popular', { params: { limit: 15 } })
      ]);

      const getContent = (res) => res.data?.data?.content || res.data?.content || res.data || [];

      setTrendingPosts(getContent(trendingRes));
      setCategories(categoriesRes.data?.data || categoriesRes.data || []);
      setTags(tagsRes.data?.data || tagsRes.data || []);
    } catch (error) {
      console.error('Error fetching static data:', error);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = {
        page: filters.page,
        size: filters.size,
        sortBy: filters.sortBy,
        sortDirection: filters.sortDirection,
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...(filters.tagId && { tagId: filters.tagId }),
        ...(filters.searchQuery?.trim() && { search: filters.searchQuery.trim() })
      };

      const response = await axios.get('/forum/posts', { params });
      const getContent = (res) => res.data?.data?.content || res.data?.content || res.data || [];
      setPosts(getContent(response));
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryId) => {
    setFilters(prev => ({
      ...prev,
      categoryId: categoryId,
      tagId: null,
      page: 0
    }));
  };

  const handleTagSelect = (tagId) => {
    setFilters(prev => ({
      ...prev,
      tagId: tagId,
      categoryId: null,
      page: 0
    }));
  };

  const handleSearchChange = (e) => {
    setFilters(prev => ({
      ...prev,
      searchQuery: e.target.value,
      page: 0
    }));
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    let sortBy = 'createdAt';
    let sortDirection = 'DESC';

    switch (value) {
      case 'popular':
      case 'mostViewed':
        sortBy = 'viewCount';
        break;
      case 'mostLiked':
        sortBy = 'likeCount';
        break;
      case 'mostCommented':
        sortBy = 'commentCount';
        break;
      default:
        sortBy = 'createdAt';
    }

    setFilters(prev => ({
      ...prev,
      sortBy,
      sortDirection,
      page: 0
    }));
  };

  const handlePostClick = (post) => {
    navigate(`/forum/post/${post.postID}`);
  };

  // Memo để tránh re-render không cần thiết
  const leftSidebarContent = useMemo(() => (
    <>
      <CategorySidebar
        categories={categories}
        selectedCategory={filters.categoryId}
        onSelectCategory={handleCategorySelect}
      />
      <TagCloud
        tags={tags}
        selectedTag={filters.tagId}
        onSelectTag={handleTagSelect}
      />
    </>
  ), [categories, tags, filters.categoryId, filters.tagId]);

  const rightSidebarContent = useMemo(() => (
    <>
      <UserStats user={currentUser} onManagePostsClick={handleManagerPostClick} />
      <TrendingPosts posts={trendingPosts} onPostClick={handlePostClick} />
    </>
  ), [currentUser, trendingPosts]);

  return (
    <div className={styles.forumPage}>
      <ForumLayout
        leftSidebarContent={leftSidebarContent}
        rightSidebarContent={rightSidebarContent}
      >
        <div className={styles.forumContent}>
          {/* Header tĩnh - không re-render khi posts thay đổi */}
          <ForumHeader
            filters={filters}
            onSearchChange={handleSearchChange}
            onSortChange={handleSortChange}
          />

          {/* Chỉ phần danh sách posts re-render */}
          <div className={styles.scrollableContent}>
            {authUser && (
              <div style={{ padding: '12px 0 4px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  style={{
                    background: '#1a73e8', color: '#fff', border: 'none',
                    borderRadius: 8, padding: '10px 20px', fontWeight: 600,
                    cursor: 'pointer', fontSize: 14
                  }}
                >
                  + Tạo bài viết
                </button>
              </div>
            )}
            <PostList
              posts={posts}
              loading={loading}
              onPostClick={handlePostClick}
              emptyMessage="Chưa có bài viết nào phù hợp."
            />
          </div>
        </div>
      </ForumLayout>

      <CreatePost
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        categories={categories}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          fetchPosts();
        }}
      />
    </div>
  );
};

export default ForumPage;
