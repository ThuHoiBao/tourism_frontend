import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../../utils/axiosCustomize';
import CreatePost from '../CreatePost/CreatePost';
import { toast } from 'react-toastify';
import styles from './EditPost.module.scss';

const EditPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchPost();
    fetchCategories();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await axios.get(`/forum/posts/${postId}`);
      const postData = response.data?.data;

      if (!postData) {
        toast.error('Bài viết không tồn tại');
        navigate('/forum/my-posts');
        return;
      }

      setPost(postData);
    } catch (error) {
      console.error('Error loading post:', error);
      toast.error('Không thể tải bài viết');
      navigate('/forum/my-posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/forum/categories');
      setCategories(res.data?.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleUpdateSuccess = () => {
    toast.success('Cập nhật bài viết thành công!');
    navigate('/forum/my-posts');
  };

  if (loading) {
    return <div className={styles.loading}>Đang tải bài viết...</div>;
  }

  if (!post) {
    return <div className={styles.error}>Bài viết không tồn tại</div>;
  }

  return (
    <div className={styles.editPostContainer}>
      <CreatePost
        isOpen={true}
        isEditing={true}
        initialPost={post}
        categories={categories}
        onSuccess={handleUpdateSuccess}
        onClose={() => navigate('/forum/my-posts')}
      />
    </div>
  );
};

export default EditPost;
