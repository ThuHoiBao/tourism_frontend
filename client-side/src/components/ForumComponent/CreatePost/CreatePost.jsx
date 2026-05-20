import React, { useState, useEffect } from 'react';
import { X, Type, Layers, Tag, PenLine, Send, Info, Hash, CheckCircle, Loader } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import axios from '../../../utils/axiosCustomize';
import styles from './CreatePost.module.scss';
import { useAuth } from '../../../context/AuthContext';

const CreatePost = ({ isOpen, onClose, categories = [], onSuccess, isEditing = false, initialPost = null }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTags, setLoadingTags] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchTags();
      if (isEditing && initialPost) populateFormWithPost(initialPost);
      else resetForm();
    }
  }, [isOpen, isEditing, initialPost]);

  const populateFormWithPost = (post) => {
    setTitle(post.title || '');
    setContent(post.content || '');
    setCategoryId(post.categoryId || '');
    setSelectedTags(post.tags?.map(t => t.tagName) || []);
    setTagInput('');
  };

  const resetForm = () => {
    setTitle(''); setContent(''); setCategoryId(''); setSelectedTags([]); setTagInput('');
  };

  const fetchTags = async () => {
    setLoadingTags(true);
    try {
      const res = await axios.get('/forum/tags/popular', { params: { limit: 50 } });
      setAvailableTags(res.data.data || []);
    } catch {
      setAvailableTags([]);
    } finally {
      setLoadingTags(false);
    }
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = tagInput.trim();
      if (value && !selectedTags.includes(value) && selectedTags.length < 10) {
        setSelectedTags([...selectedTags, value]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tag) => setSelectedTags(selectedTags.filter(t => t !== tag));

  const toggleExistingTag = (tagName) => {
    if (selectedTags.includes(tagName)) setSelectedTags(selectedTags.filter(t => t !== tagName));
    else if (selectedTags.length < 10) setSelectedTags([...selectedTags, tagName]);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !categoryId) {
      alert('Vui lòng nhập đầy đủ tiêu đề, nội dung và chọn danh mục');
      return;
    }
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    const summary = plainText.length > 200 ? plainText.substring(0, 197) + '...' : plainText;
    const payload = {
      title: title.trim(), content, summary, categoryId: Number(categoryId),
      tagIds: selectedTags.map(tag => {
        const found = availableTags.find(t => t.name === tag || t.tagName === tag);
        return found ? (found.tagId || found.tagID) : null;
      }).filter(id => id !== null),
    };
    setLoading(true);
    try {
      if (isEditing && initialPost) await axios.put(`/forum/posts/${initialPost.postID}`, payload);
      else await axios.post('/forum/posts', payload);
      onSuccess?.();
      resetForm();
      if (onClose) onClose();
    } catch {
      alert(isEditing ? 'Cập nhật thất bại. Vui lòng thử lại.' : 'Tạo bài viết thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  const isFormValid = title.trim() && content.trim() && categoryId;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.headerLeft}>
              <div className={styles.headerIcon}>
                {isEditing ? <PenLine size={20} /> : <Send size={20} />}
              </div>
              <div>
                <h2 className={styles.headerTitle}>{isEditing ? 'Sửa bài viết' : 'Tạo bài viết mới'}</h2>
                <p className={styles.headerSubtitle}>{isEditing ? 'Cập nhật nội dung bài viết' : 'Chia sẻ trải nghiệm du lịch của bạn'}</p>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.topRow}>
            <div className={styles.formGroup}>
              <label><Type size={13} /> Tiêu đề</label>
              <input
                className={styles.input}
                type="text"
                placeholder="Tiêu đề hấp dẫn..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={200}
              />
              <span className={styles.charCount}>{title.length}/200</span>
            </div>
            <div className={styles.formGroup}>
              <label><Layers size={13} /> Danh mục</label>
              <select className={styles.select} value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                <option value="">Chọn danh mục</option>
                {categories.map(cat => (
                  <option key={cat.categoryId} value={cat.categoryId}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.tagSection}>
            <label>
              <Tag size={13} />
              Thẻ tag
              <span className={styles.tagLimit}>({selectedTags.length}/10)</span>
            </label>
            <div className={styles.tagInputRow}>
              {selectedTags.map(tag => (
                <span key={tag} className={styles.tagPill}>
                  <Hash size={11} />{tag}
                  <button className={styles.tagRemoveBtn} onClick={() => removeTag(tag)}>
                    <X size={11} />
                  </button>
                </span>
              ))}
              <input
                className={styles.tagInput}
                type="text"
                placeholder={selectedTags.length >= 10 ? '' : 'Nhập tag, nhấn Enter...'}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                disabled={selectedTags.length >= 10}
              />
            </div>
            <div className={styles.tagSuggestions}>
              <p className={styles.suggestTitle}>
                {loadingTags ? <><Loader size={11} /> Đang tải tag...</> : <><Tag size={11} /> Tag phổ biến</>}
              </p>
              {!loadingTags && (
                <div className={styles.tagGrid}>
                  {availableTags.slice(0, 12).map(tag => (
                    <button
                      key={tag.tagID}
                      className={`${styles.tagSuggestion} ${selectedTags.includes(tag.tagName) ? styles.selected : ''}`}
                      onClick={() => toggleExistingTag(tag.tagName)}
                      disabled={selectedTags.length >= 10 && !selectedTags.includes(tag.tagName)}
                    >
                      {selectedTags.includes(tag.tagName) ? <CheckCircle size={11} /> : <Hash size={11} />}
                      {tag.tagName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label><PenLine size={13} /> Nội dung</label>
            <div className={styles.editorWrapper}>
              <RichTextEditor value={content} onChange={setContent} placeholder="Bắt đầu viết câu chuyện của bạn..." />
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.footerInfo}>
            <Info size={14} />
            <span>Bài viết sẽ được xem xét trước khi xuất bản</span>
          </div>
          <div className={styles.footerActions}>
            <button className={styles.cancelBtn} onClick={onClose} disabled={loading}>Hủy</button>
            <button
              className={`${styles.submitBtn} ${isFormValid ? styles.active : ''}`}
              onClick={handleSubmit}
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <><div className={styles.spinner} /> Đang lưu...</>
              ) : (
                <><Send size={15} />{isEditing ? 'Cập nhật' : 'Đăng bài'}</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
