import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
    X, Check, EyeOff, Edit2, Save, Mail, User, Eye, Heart, MessageSquare,
    ShieldAlert, Tag as TagIcon, UserX
} from 'lucide-react';
import adminForumApi from '../../../../services/forum/adminForumApi';
import { isAdmin } from '../../../../services/forum/adminRole';
import StatusBadge from './shared/StatusBadge';
import ModerationBadge from './shared/ModerationBadge';
import styles from './PostDetailModal.module.scss';

/**
 * Modal xem/sửa chi tiết bài viết cho admin.
 * @param {number} postId
 * @param {Function} onClose
 * @param {Function} onChanged — gọi khi có thay đổi (duyệt/ẩn/sửa) để refresh list
 */
const PostDetailModal = ({ postId, onClose, onChanged }) => {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [edited, setEdited] = useState({ title: '', content: '', summary: '' });

    // Reject reason flow
    const [showReject, setShowReject] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    // Ban tác giả (chỉ trong forum) flow
    const [showBan, setShowBan] = useState(false);
    const [banReason, setBanReason] = useState('');
    const [banDays, setBanDays] = useState('7');   // '0' = vĩnh viễn
    const [banning, setBanning] = useState(false);

    const REJECT_TEMPLATES = [
        'Ngôn từ thô tục, xúc phạm',
        'Spam / quảng cáo',
        'Nội dung sai sự thật',
        'Vi phạm bản quyền',
    ];

    useEffect(() => {
        let alive = true;
        setLoading(true);
        adminForumApi.getPostDetail(postId)
            .then(d => { if (alive) { setDetail(d); setEdited({ title: d.title, content: d.content, summary: d.summary || '' }); } })
            .catch(() => toast.error('Không tải được chi tiết bài viết'))
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, [postId]);

    const approve = async () => {
        try {
            await adminForumApi.changePostStatus(postId, 'PUBLISHED');
            toast.success('Đã duyệt bài viết');
            setDetail(prev => ({ ...prev, status: 'PUBLISHED', adminRejectionReason: null }));
            onChanged?.();
        } catch { toast.error('Thao tác thất bại'); }
    };

    const confirmHide = async () => {
        try {
            await adminForumApi.changePostStatus(postId, 'HIDDEN', rejectReason || null);
            toast.success('Đã ẩn bài viết');
            setDetail(prev => ({ ...prev, status: 'HIDDEN', adminRejectionReason: rejectReason }));
            setShowReject(false); setRejectReason('');
            onChanged?.();
        } catch { toast.error('Thao tác thất bại'); }
    };

    const saveEdit = async () => {
        if (!edited.title?.trim() || !edited.content?.trim()) {
            toast.error('Tiêu đề và nội dung không được trống');
            return;
        }
        setSaving(true);
        try {
            await adminForumApi.updatePostContent(postId, {
                title: edited.title,
                content: edited.content,
                summary: edited.summary,
                categoryId: detail.categoryId,
            });
            toast.success('Đã cập nhật nội dung');
            setDetail(prev => ({ ...prev, ...edited }));
            setEditMode(false);
            onChanged?.();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Cập nhật thất bại');
        } finally { setSaving(false); }
    };

    const confirmBan = async () => {
        if (!detail?.authorId) { toast.error('Không xác định được tác giả'); return; }
        setBanning(true);
        try {
            await adminForumApi.banUser(detail.authorId, {
                reason: banReason.trim() || null,
                durationDays: banDays === '0' ? null : Number(banDays),
            });
            toast.success('Đã hạn chế tác giả trên diễn đàn');
            setShowBan(false); setBanReason(''); setBanDays('7');
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Hạn chế thất bại');
        } finally { setBanning(false); }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3 className={styles.headerTitle}>Chi tiết bài viết</h3>
                    <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
                </div>

                {loading ? (
                    <div className={styles.loading}>Đang tải…</div>
                ) : !detail ? (
                    <div className={styles.loading}>Không có dữ liệu</div>
                ) : (
                    <>
                        <div className={styles.body}>
                            {/* Meta row: status + AI + author */}
                            <div className={styles.metaRow}>
                                <StatusBadge status={detail.status} />
                                <ModerationBadge score={detail.moderationScore} label={detail.moderationLabel}
                                                 reason={detail.moderationReason} />
                                <span className={styles.authorChip}>
                                    <User size={12} /> {detail.authorName || `#${detail.authorId}`}
                                </span>
                                {detail.authorEmail && (
                                    <span className={styles.authorChip}><Mail size={12} /> {detail.authorEmail}</span>
                                )}
                            </div>

                            {/* Stats */}
                            <div className={styles.statsRow}>
                                <span><Eye size={13} /> {detail.viewCount ?? 0}</span>
                                <span><Heart size={13} /> {detail.likeCount ?? 0}</span>
                                <span><MessageSquare size={13} /> {detail.commentCount ?? 0}</span>
                                {detail.categoryName && <span className={styles.catChip}>{detail.categoryName}</span>}
                            </div>

                            {/* AI moderation reason */}
                            {detail.moderationReason && (
                                <div className={styles.aiBox}>
                                    <ShieldAlert size={14} />
                                    <span><strong>AI đánh giá:</strong> {detail.moderationReason}</span>
                                </div>
                            )}
                            {detail.adminRejectionReason && (
                                <div className={styles.rejectBox}>
                                    <strong>Lý do admin ẩn:</strong> {detail.adminRejectionReason}
                                </div>
                            )}

                            {/* Title + content (view/edit) */}
                            {editMode ? (
                                <>
                                    <label className={styles.editLabel}>Tiêu đề</label>
                                    <input className={styles.editInput} value={edited.title}
                                           onChange={(e) => setEdited({ ...edited, title: e.target.value })} />
                                    <label className={styles.editLabel}>Nội dung (HTML)</label>
                                    <textarea className={styles.editTextarea} rows={12} value={edited.content}
                                              onChange={(e) => setEdited({ ...edited, content: e.target.value })} />
                                </>
                            ) : (
                                <>
                                    <h2 className={styles.postTitle}>{detail.title}</h2>
                                    {detail.thumbnailUrl && (
                                        <img className={styles.thumbLarge} src={detail.thumbnailUrl} alt="" />
                                    )}
                                    <div className={styles.postContent}
                                         dangerouslySetInnerHTML={{ __html: detail.content }} />
                                    {detail.imageUrls?.length > 0 && (
                                        <div className={styles.imageGrid}>
                                            {detail.imageUrls.map((url, i) => (
                                                <img key={i} src={url} alt={`img-${i}`} />
                                            ))}
                                        </div>
                                    )}
                                    {detail.tags?.length > 0 && (
                                        <div className={styles.tagRow}>
                                            {detail.tags.map(t => (
                                                <span key={t.tagId} className={styles.tagChip}>
                                                    <TagIcon size={11} /> {t.tagName}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer actions */}
                        <div className={styles.footer}>
                            {showBan ? (
                                <div className={styles.rejectForm}>
                                    <div className={styles.rejectTemplates}>
                                        {['1','7','30','0'].map(d => (
                                            <button key={d}
                                                    className={`${styles.rejectTpl} ${banDays === d ? styles.btnDanger : ''}`}
                                                    onClick={() => setBanDays(d)}>
                                                {d === '0' ? 'Vĩnh viễn' : `${d} ngày`}
                                            </button>
                                        ))}
                                    </div>
                                    <input className={styles.editInput} placeholder="Lý do hạn chế (tùy chọn)…"
                                           value={banReason} onChange={(e) => setBanReason(e.target.value)} />
                                    <div className={styles.footerBtns}>
                                        <button className={styles.btnGhost} onClick={() => { setShowBan(false); setBanReason(''); }}>Hủy</button>
                                        <button className={styles.btnDanger} onClick={confirmBan} disabled={banning}>
                                            <UserX size={14} /> {banning ? 'Đang xử lý…' : 'Xác nhận hạn chế'}
                                        </button>
                                    </div>
                                </div>
                            ) : showReject ? (
                                <div className={styles.rejectForm}>
                                    <div className={styles.rejectTemplates}>
                                        {REJECT_TEMPLATES.map(t => (
                                            <button key={t} className={styles.rejectTpl}
                                                    onClick={() => setRejectReason(t)}>{t}</button>
                                        ))}
                                    </div>
                                    <input className={styles.editInput} placeholder="Lý do ẩn bài (tùy chọn)…"
                                           value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                                    <div className={styles.footerBtns}>
                                        <button className={styles.btnGhost} onClick={() => { setShowReject(false); setRejectReason(''); }}>Hủy</button>
                                        <button className={styles.btnDanger} onClick={confirmHide}>
                                            <EyeOff size={14} /> Xác nhận ẩn
                                        </button>
                                    </div>
                                </div>
                            ) : editMode ? (
                                <div className={styles.footerBtns}>
                                    <button className={styles.btnGhost} onClick={() => { setEditMode(false); setEdited({ title: detail.title, content: detail.content, summary: detail.summary || '' }); }}>Hủy</button>
                                    <button className={styles.btnPrimary} onClick={saveEdit} disabled={saving}>
                                        <Save size={14} /> {saving ? 'Đang lưu…' : 'Lưu nội dung'}
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.footerBtns}>
                                    <button className={styles.btnGhost} onClick={() => setEditMode(true)}>
                                        <Edit2 size={14} /> Sửa nội dung
                                    </button>
                                    {detail.status !== 'PUBLISHED' && (
                                        <button className={styles.btnSuccess} onClick={approve}>
                                            <Check size={14} /> Duyệt
                                        </button>
                                    )}
                                    {detail.status !== 'HIDDEN' && (
                                        <button className={styles.btnDanger} onClick={() => setShowReject(true)}>
                                            <EyeOff size={14} /> Ẩn bài
                                        </button>
                                    )}
                                    {isAdmin() && (
                                        <button className={styles.btnGhost} onClick={() => setShowBan(true)}
                                                title="Chỉ hạn chế hoạt động trong diễn đàn">
                                            <UserX size={14} /> Cấm tác giả
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PostDetailModal;
