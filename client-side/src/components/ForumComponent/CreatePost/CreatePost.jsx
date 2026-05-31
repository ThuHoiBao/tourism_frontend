import React, { useState, useEffect } from 'react';
import {
  X, Type, Layers, Tag, PenLine, Send, Info, Hash, CheckCircle, Loader,
  ShieldAlert, AlertTriangle, Clock, Shield, Ban, MessageSquareWarning,
  Megaphone, Eye, Heart, FileText
} from 'lucide-react';
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
  const [moderationResult, setModerationResult] = useState(null); // { label, reason, score }
  const [showPolicy, setShowPolicy] = useState(false);
  const [quota, setQuota] = useState(null); // { remainingPosts, maxPostsPerDay }

  useEffect(() => {
    if (isOpen) {
      fetchTags();
      if (!isEditing) fetchQuota();
      if (isEditing && initialPost) populateFormWithPost(initialPost);
      else resetForm();
    }
  }, [isOpen, isEditing, initialPost]);

  const fetchQuota = async () => {
    const uid = user?.userId || user?.userID || user?.id;
    if (!uid) return;
    try {
      const res = await axios.get('/forum/posts/quota', { params: { userId: uid } });
      setQuota(res.data?.data || null);
    } catch { /* im lặng */ }
  };

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
      userId: user?.userId || user?.userID || user?.id,
      title: title.trim(),
      content,
      summary,
      categoryId: Number(categoryId),
      tagNames: selectedTags,
    };
    setLoading(true);
    try {
      const res = isEditing && initialPost
        ? await axios.put(`/forum/posts/${initialPost.postID}`, payload)
        : await axios.post('/forum/posts', payload);

      const created = res.data?.data || res.data;
      const label = created?.moderationLabel;

      // AI moderation phát hiện vi phạm → hiện modal kết quả thay vì đóng form
      if (label === 'TOXIC' || label === 'BORDERLINE') {
        setModerationResult({
          label,
          reason: created?.moderationReason || '',
          score: created?.moderationScore || 0,
        });
        onSuccess?.();
        return;
      }

      // SAFE hoặc edit không qua moderation → đóng form như cũ
      onSuccess?.();
      resetForm();
      if (onClose) onClose();
    } catch {
      alert(isEditing ? 'Cập nhật thất bại. Vui lòng thử lại.' : 'Tạo bài viết thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const closeModerationResult = () => {
    setModerationResult(null);
    resetForm();
    if (onClose) onClose();
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

        {/* ── AI Policy bar — luôn hiển thị, không scroll ── */}
        <div className={styles.policyBar}>
          <div className={styles.policyBarLeft}>
            <div className={styles.policyShieldIcon}><Shield size={14} /></div>
            <div>
              <div className={styles.policyBarTitle}>Bài viết sẽ được AI kiểm duyệt tự động</div>
              <div className={styles.policyBarSub}>Tránh ngôn từ tiêu cực để không bị ẩn</div>
            </div>
          </div>
          <div className={styles.policyBarRight}>
            {!isEditing && quota && (
              <span
                className={`${styles.quotaBadge} ${quota.remainingPosts <= 2 ? styles.quotaBadgeLow : ''}`}
                title={`Bạn còn ${quota.remainingPosts} lượt đăng bài hôm nay`}
              >
                <FileText size={12} />
                Còn {quota.remainingPosts}/{quota.maxPostsPerDay} bài hôm nay
              </span>
            )}
            <button
              type="button"
              className={styles.policyBarBtn}
              onClick={() => setShowPolicy(true)}
            >
              <Info size={13} /> Xem chính sách
            </button>
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
            <Shield size={14} />
            <span>Bài viết sẽ được AI kiểm duyệt trước khi xuất bản</span>
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

      {/* ── Policy Modal ── */}
      {showPolicy && (
        <div className={styles.modOverlay} onClick={() => setShowPolicy(false)}>
          <div className={styles.modCard} onClick={e => e.stopPropagation()}>
            <div className={`${styles.modHeader} ${styles.modHeaderPolicy}`}>
              <div className={styles.modIconWrap}><Shield size={28} /></div>
              <div className={styles.modHeaderText}>
                <h3 className={styles.modTitle}>Chính sách đăng bài forum</h3>
                <p className={styles.modSubtitle}>
                  Hệ thống AI tự động kiểm tra để đảm bảo môi trường lành mạnh
                </p>
              </div>
              <button className={styles.modCloseBtn} onClick={() => setShowPolicy(false)}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.modBody}>
              <div className={styles.policyGrid}>
                <div className={styles.policyCard}>
                  <div className={`${styles.policyCardIcon} ${styles.policyIconRed}`}>
                    <Ban size={14} />
                  </div>
                  <div className={styles.policyCardTitle}>Cấm tuyệt đối</div>
                  <ul className={styles.policyList}>
                    <li>Ngôn từ thô tục, xúc phạm cá nhân</li>
                    <li>Kỳ thị vùng miền, giới tính, tôn giáo</li>
                    <li>Bạo lực, đe dọa, khiêu dâm</li>
                  </ul>
                </div>

                <div className={styles.policyCard}>
                  <div className={`${styles.policyCardIcon} ${styles.policyIconAmber}`}>
                    <MessageSquareWarning size={14} />
                  </div>
                  <div className={styles.policyCardTitle}>Cần xem xét</div>
                  <ul className={styles.policyList}>
                    <li>Quảng cáo không liên quan du lịch</li>
                    <li>Spam, đăng bài lặp lại</li>
                    <li>Thông tin sai lệch về điểm đến</li>
                  </ul>
                </div>

                <div className={styles.policyCard}>
                  <div className={`${styles.policyCardIcon} ${styles.policyIconGreen}`}>
                    <Heart size={14} />
                  </div>
                  <div className={styles.policyCardTitle}>Khuyến khích</div>
                  <ul className={styles.policyList}>
                    <li>Chia sẻ trải nghiệm thực tế</li>
                    <li>Đánh giá khách quan, có dẫn chứng</li>
                    <li>Hỏi đáp, tư vấn cộng đồng</li>
                  </ul>
                </div>
              </div>

              <div className={styles.policyFlow}>
                <Megaphone size={12} />
                <span>
                  AI chấm điểm vi phạm 0–1:
                  <strong> &lt; 0.3</strong> tự đăng,
                  <strong> 0.3–0.7</strong> chờ admin duyệt,
                  <strong> ≥ 0.7</strong> bị từ chối.
                </span>
              </div>
            </div>

            <div className={styles.modFooter}>
              <button className={styles.modBtnSecondary} onClick={() => setShowPolicy(false)}>
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Moderation Result Modal ── */}
      {moderationResult && (
        <div className={styles.modOverlay} onClick={closeModerationResult}>
          <div className={styles.modCard} onClick={e => e.stopPropagation()}>
            <div className={`${styles.modHeader} ${moderationResult.label === 'TOXIC' ? styles.modHeaderToxic : styles.modHeaderBorderline}`}>
              <div className={styles.modIconWrap}>
                {moderationResult.label === 'TOXIC'
                  ? <ShieldAlert size={28} />
                  : <Clock size={28} />}
              </div>
              <div className={styles.modHeaderText}>
                <h3 className={styles.modTitle}>
                  {moderationResult.label === 'TOXIC'
                    ? 'Bài viết vi phạm tiêu chuẩn cộng đồng'
                    : 'Bài viết đang chờ kiểm duyệt'}
                </h3>
                <p className={styles.modSubtitle}>
                  {moderationResult.label === 'TOXIC'
                    ? 'AI đã phát hiện nội dung vi phạm — bài bị ẩn khỏi forum'
                    : 'AI chưa thể xác định rõ — quản trị viên sẽ xem xét sớm'}
                </p>
              </div>
              <button className={styles.modCloseBtn} onClick={closeModerationResult}>
                <X size={18} />
              </button>
            </div>

            <div className={styles.modBody}>
              <div className={styles.modReasonBox}>
                <div className={styles.modReasonLabel}>
                  <AlertTriangle size={13} />
                  Lý do từ hệ thống AI
                </div>
                <div className={styles.modReasonText}>
                  {moderationResult.reason || 'Không có lý do chi tiết'}
                </div>
                <div className={styles.modScoreRow}>
                  <span className={styles.modScoreLabel}>Điểm vi phạm:</span>
                  <div className={styles.modScoreBar}>
                    <div
                      className={`${styles.modScoreFill} ${
                        moderationResult.label === 'TOXIC'
                          ? styles.modScoreFillRed
                          : styles.modScoreFillAmber
                      }`}
                      style={{ width: `${Math.min(100, moderationResult.score * 100)}%` }}
                    />
                  </div>
                  <span className={styles.modScoreValue}>
                    {(moderationResult.score * 100).toFixed(0)}/100
                  </span>
                </div>
              </div>

              <div className={styles.modTipBox}>
                <div className={styles.modTipTitle}>
                  <Info size={13} /> Bạn có thể làm gì tiếp theo?
                </div>
                <ul className={styles.modTipList}>
                  {moderationResult.label === 'TOXIC' ? (
                    <>
                      <li>Chỉnh sửa lại nội dung, loại bỏ ngôn từ tiêu cực</li>
                      <li>Viết lại với giọng văn khách quan, mang tính chia sẻ</li>
                      <li>Vào <strong>Quản lý bài viết</strong> để xem chi tiết và sửa</li>
                    </>
                  ) : (
                    <>
                      <li>Đợi quản trị viên xem xét (thường trong 24h)</li>
                      <li>Bạn sẽ nhận thông báo khi có kết quả</li>
                      <li>Có thể chỉnh sửa hoặc xóa bài trong <strong>Quản lý bài viết</strong></li>
                    </>
                  )}
                </ul>
              </div>
            </div>

            <div className={styles.modFooter}>
              <button className={styles.modBtnSecondary} onClick={closeModerationResult}>
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePost;
