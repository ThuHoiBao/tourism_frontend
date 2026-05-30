import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    Check, EyeOff, Trash2, ChevronDown, ChevronRight,
    FileText, MessageSquare, Clock, CornerDownRight, ExternalLink
} from 'lucide-react';
import adminForumApi from '../../../../services/forum/adminForumApi';
import { isAdmin } from '../../../../services/forum/adminRole';
import StatusBadge from './shared/StatusBadge';
import ModerationBadge from './shared/ModerationBadge';
import Pagination from './shared/Pagination';
import ConfirmModal from './shared/ConfirmModal';
import ForumBreadcrumb from './shared/ForumBreadcrumb';
import styles from './ForumManagement.module.scss';

const PAGE_SIZE = 15;

const AdminCommentManagement = () => {
    const [posts, setPosts] = useState([]);          // bài có comment (group view)
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);
    const [onlyPending, setOnlyPending] = useState(false);

    // expand: postId -> { loading, comments[] }
    const [expanded, setExpanded] = useState({});
    const [confirm, setConfirm] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminForumApi.getPostsWithComments({
                page, size: PAGE_SIZE, onlyPending: onlyPending || undefined,
            });
            setPosts(data?.content || []);
            setTotalPages(data?.totalPages || 0);
            setTotalElements(data?.totalElements ?? 0);
        } catch (e) {
            toast.error('Không tải được danh sách');
        } finally {
            setLoading(false);
        }
    }, [page, onlyPending]);

    useEffect(() => { load(); }, [load]);

    const toggleExpand = async (postId) => {
        setExpanded(prev => {
            if (prev[postId]) {
                const next = { ...prev };
                delete next[postId];
                return next;
            }
            return { ...prev, [postId]: { loading: true, comments: [] } };
        });

        // Nếu đang mở (chưa có data) → fetch
        if (!expanded[postId]) {
            try {
                const comments = await adminForumApi.getCommentsByPost(postId);
                setExpanded(prev => ({ ...prev, [postId]: { loading: false, comments: comments || [] } }));
            } catch {
                setExpanded(prev => ({ ...prev, [postId]: { loading: false, comments: [] } }));
                toast.error('Không tải được bình luận của bài này');
            }
        }
    };

    const refreshPostComments = async (postId) => {
        try {
            const comments = await adminForumApi.getCommentsByPost(postId);
            setExpanded(prev => ({ ...prev, [postId]: { loading: false, comments: comments || [] } }));
        } catch { /* ignore */ }
        load(); // cập nhật badge count
    };

    const commentAction = async (postId, commentId, action, msg) => {
        try {
            await adminForumApi.bulkCommentAction([commentId], action);
            toast.success(msg);
            refreshPostComments(postId);
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Thao tác thất bại');
        }
    };

    const askDelete = (postId, commentId) => setConfirm({
        message: 'Xóa bình luận này khỏi hệ thống?',
        onConfirm: async () => {
            try {
                await adminForumApi.deleteComment(commentId);
                toast.success('Đã xóa bình luận');
                refreshPostComments(postId);
            } catch (e) { toast.error('Xóa thất bại'); }
        },
    });

    // Render 1 comment (gồm cây reply)
    const renderComment = (postId, c, depth = 0) => (
        <div key={c.commentId} className={styles.cmtNode} style={{ marginLeft: depth * 24 }}>
            <div className={styles.cmtRow}>
                {depth > 0 && <CornerDownRight size={14} className={styles.cmtReplyIcon} />}
                <div className={styles.cmtMain}>
                    <div className={styles.cmtHead}>
                        <span className={styles.cmtAuthor}>
                            {c.authorName || `#${c.authorId}`}
                        </span>
                        <StatusBadge status={c.status} />
                        <ModerationBadge score={c.moderationScore} label={c.moderationLabel} reason={c.moderationReason} />
                        <span className={styles.cmtDate}>{(c.createdAt || '').slice(0, 16).replace('T', ' ')}</span>
                    </div>
                    <div className={styles.cmtContent}>{c.content}</div>
                    {c.moderationReason && (
                        <div className={styles.cmtReason}>Lý do AI: {c.moderationReason}</div>
                    )}
                </div>
                <div className={styles.cmtActions}>
                    {c.status !== 'PUBLISHED' && (
                        <button className={styles.iconBtn} title="Duyệt"
                                onClick={() => commentAction(postId, c.commentId, 'approve', 'Đã duyệt bình luận')}>
                            <Check size={14} />
                        </button>
                    )}
                    {c.status !== 'HIDDEN' && (
                        <button className={styles.iconBtn} title="Ẩn"
                                onClick={() => commentAction(postId, c.commentId, 'hide', 'Đã ẩn bình luận')}>
                            <EyeOff size={14} />
                        </button>
                    )}
                    {isAdmin() && (
                        <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} title="Xóa"
                                onClick={() => askDelete(postId, c.commentId)}>
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>
            {c.replies && c.replies.length > 0 &&
                c.replies.map(r => renderComment(postId, r, depth + 1))}
        </div>
    );

    // Gom comment phẳng thành cây (theo parentCommentId nếu BE trả phẳng)
    const buildTree = (flat) => {
        if (!flat || flat.length === 0) return [];
        // BE trả theo createdAt ASC, không lồng → tự build dựa parentCommentId nếu có
        const byId = {};
        flat.forEach(c => { byId[c.commentId] = { ...c, replies: [] }; });
        const roots = [];
        flat.forEach(c => {
            if (c.parentCommentId && byId[c.parentCommentId]) {
                byId[c.parentCommentId].replies.push(byId[c.commentId]);
            } else {
                roots.push(byId[c.commentId]);
            }
        });
        return roots;
    };

    return (
        <div className={styles.page}>
            <ForumBreadcrumb items={[
                { label: 'Forum', to: '/admin/forum' },
                { label: 'Kiểm duyệt bình luận' },
            ]} />
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Kiểm duyệt bình luận</h1>
                    <p className={styles.pageSubtitle}>Bình luận được gom theo từng bài viết — click để xem & duyệt</p>
                </div>
            </div>

            {/* Quick filter */}
            <div className={styles.filterBar}>
                <label className={styles.toggle}>
                    <input type="checkbox" className={styles.checkbox}
                           checked={onlyPending}
                           onChange={(e) => { setOnlyPending(e.target.checked); setPage(0); }} />
                    Chỉ hiện bài có bình luận chờ duyệt
                </label>
            </div>

            {/* Group list */}
            <div className={styles.groupList}>
                {loading ? (
                    <div className={styles.loading}>Đang tải…</div>
                ) : posts.length === 0 ? (
                    <div className={styles.empty}>
                        {onlyPending ? 'Không có bài nào cần duyệt bình luận' : 'Chưa có bình luận nào'}
                    </div>
                ) : posts.map(p => {
                    const isOpen = !!expanded[p.postId];
                    const exp = expanded[p.postId];
                    return (
                        <div key={p.postId} className={styles.groupCard}>
                            <div className={styles.groupHeader} onClick={() => toggleExpand(p.postId)}>
                                <div className={styles.groupHeaderLeft}>
                                    <button className={styles.groupToggle}>
                                        {isOpen ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                                    </button>
                                    <FileText size={16} className={styles.groupFileIcon} />
                                    <span className={styles.groupTitle}>{p.title || `Bài #${p.postId}`}</span>
                                </div>
                                <div className={styles.groupHeaderRight}>
                                    {p.pendingComments > 0 && (
                                        <span className={styles.pendingBadge} title="Bình luận chờ duyệt">
                                            <Clock size={11} /> {p.pendingComments} chờ duyệt
                                        </span>
                                    )}
                                    <span className={styles.totalBadge}>
                                        <MessageSquare size={11} /> {p.totalComments} bình luận
                                    </span>
                                    <Link to={`/forum/post/${p.postId}`} target="_blank"
                                          className={styles.groupViewLink}
                                          onClick={(e) => e.stopPropagation()} title="Mở bài viết">
                                        <ExternalLink size={13} />
                                    </Link>
                                </div>
                            </div>

                            {isOpen && (
                                <div className={styles.groupBody}>
                                    {exp?.loading ? (
                                        <div className={styles.loadingSmall}>Đang tải bình luận…</div>
                                    ) : (exp?.comments?.length ?? 0) === 0 ? (
                                        <div className={styles.emptySmall}>Không có bình luận</div>
                                    ) : (
                                        buildTree(exp.comments).map(c => renderComment(p.postId, c))
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <Pagination currentPage={page} totalPages={totalPages} totalElements={totalElements} onPageChange={setPage} />

            <ConfirmModal
                isOpen={!!confirm}
                danger
                message={confirm?.message}
                onCancel={() => setConfirm(null)}
                onConfirm={() => { const fn = confirm.onConfirm; setConfirm(null); fn(); }}
            />
        </div>
    );
};

export default AdminCommentManagement;
