import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Eye, Check, EyeOff, Pin, Star, Trash2, Mountain, Palmtree, Plane, Compass, Camera, Map } from 'lucide-react';
import adminForumApi from '../../../../services/forum/adminForumApi';
import { isAdmin } from '../../../../services/forum/adminRole';
import StatusBadge from './shared/StatusBadge';
import ModerationBadge from './shared/ModerationBadge';
import Pagination from './shared/Pagination';
import BulkActionBar from './shared/BulkActionBar';
import ConfirmModal from './shared/ConfirmModal';
import ForumBreadcrumb from './shared/ForumBreadcrumb';
import PostDetailModal from './PostDetailModal';
import styles from './ForumManagement.module.scss';

const STATUS_OPTIONS = ['PUBLISHED', 'PENDING_REVIEW', 'DRAFT', 'HIDDEN'];
const TYPE_OPTIONS = ['BLOG', 'GUIDE', 'EXPERIENCE', 'QA', 'TIP', 'REVIEW_SHARE', 'REVIEW', 'QUESTION'];
const LABEL_OPTIONS = ['SAFE', 'BORDERLINE', 'TOXIC'];
const PAGE_SIZE = 10;

const emptyFilters = {
    status: '', postType: '', categoryId: '', moderationLabel: '',
    search: '', dateFrom: '', dateTo: '',
};

// Placeholder trang trí cho bài viết không có ảnh (đồng bộ với PostCard ngoài forum)
const THUMB_PLACEHOLDERS = [
    { Icon: Mountain, gradient: 'linear-gradient(135deg, #0c4a6e, #0ea5e9)' },
    { Icon: Palmtree, gradient: 'linear-gradient(135deg, #059669, #10b981)' },
    { Icon: Plane,    gradient: 'linear-gradient(135deg, #0369a1, #06b6d4)' },
    { Icon: Compass,  gradient: 'linear-gradient(135deg, #0891b2, #22d3ee)' },
    { Icon: Camera,   gradient: 'linear-gradient(135deg, #7c3aed, #6366f1)' },
    { Icon: Map,      gradient: 'linear-gradient(135deg, #ea580c, #f59e0b)' },
];

const PostThumb = ({ post }) => {
    const [failed, setFailed] = useState(false);
    const ph = THUMB_PLACEHOLDERS[(post.postID || 0) % THUMB_PLACEHOLDERS.length];
    const { Icon } = ph;
    const imgSrc = post.thumbnailUrl || post.coverImageUrl || post.imageUrl || post.firstImageUrl;

    if (imgSrc && !failed) {
        return (
            <img
                className={styles.thumb}
                src={imgSrc}
                alt={post.title || ''}
                loading="lazy"
                onError={() => setFailed(true)}
            />
        );
    }
    return (
        <div className={styles.thumb} style={{ background: ph.gradient }} title={post.categoryName || 'Du lịch'}>
            <Icon size={20} strokeWidth={1.6} color="#fff" />
        </div>
    );
};

const AdminPostManagement = () => {
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState(emptyFilters);
    const [applied, setApplied] = useState(emptyFilters);
    const [selected, setSelected] = useState(new Set());
    const [confirm, setConfirm] = useState(null); // { message, onConfirm }
    const [detailPostId, setDetailPostId] = useState(null); // mở Post Detail Modal

    useEffect(() => {
        adminForumApi.getCategories().then(setCategories).catch(() => {});
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, size: PAGE_SIZE };
            Object.entries(applied).forEach(([k, v]) => {
                if (v !== '' && v != null) params[k] = v;
            });
            const data = await adminForumApi.getPosts(params);
            setPosts(data?.content || []);
            setTotalPages(data?.totalPages || 0);
            setTotalElements(data?.totalElements ?? 0);
            setSelected(new Set());
        } catch (e) {
            toast.error('Không tải được danh sách bài viết');
        } finally {
            setLoading(false);
        }
    }, [page, applied]);

    useEffect(() => { load(); }, [load]);

    const onSearch = () => { setPage(0); setApplied(filters); };
    const onReset = () => { setFilters(emptyFilters); setApplied(emptyFilters); setPage(0); };

    const toggleSelect = (id) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };
    const toggleSelectAll = () => {
        setSelected(prev => prev.size === posts.length
            ? new Set()
            : new Set(posts.map(p => p.postID)));
    };

    const runAction = async (fn, successMsg) => {
        try {
            await fn();
            toast.success(successMsg);
            load();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Thao tác thất bại');
        }
    };

    const handleStatus = (post, status, msg) =>
        runAction(() => adminForumApi.changePostStatus(post.postID, status), msg);

    const handlePin = (post) =>
        runAction(() => adminForumApi.pinPost(post.postID),
            post.isPinned ? 'Đã bỏ ghim' : 'Đã ghim bài viết');

    const handleFeature = (post) =>
        runAction(() => adminForumApi.featurePost(post.postID),
            post.isFeatured ? 'Đã bỏ nổi bật' : 'Đã đặt nổi bật');

    const askDelete = (post) => setConfirm({
        message: `Xóa bài viết "${post.title}"? Bài viết sẽ bị ẩn khỏi hệ thống.`,
        onConfirm: () => runAction(() => adminForumApi.deletePost(post.postID), 'Đã xóa bài viết'),
    });

    const applyBulk = (action) => {
        const ids = [...selected];
        const labels = { approve: 'duyệt', hide: 'ẩn', delete: 'xóa' };
        setConfirm({
            message: `Bạn chắc chắn muốn ${labels[action]} ${ids.length} bài viết đã chọn?`,
            onConfirm: () => runAction(
                () => adminForumApi.bulkPostAction(ids, action),
                `Đã ${labels[action]} ${ids.length} bài viết`),
        });
    };

    return (
        <div className={styles.page}>
            <ForumBreadcrumb items={[
                { label: 'Forum', to: '/admin/forum' },
                { label: 'Quản lý bài viết' },
            ]} />
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Quản lý bài viết</h1>
                    <p className={styles.pageSubtitle}>Duyệt, ẩn, ghim và quản lý toàn bộ bài viết diễn đàn</p>
                </div>
            </div>

            <div className={styles.filterBar}>
                <input
                    className={styles.filterInput}
                    placeholder="Tìm theo tiêu đề / nội dung…"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                />
                <select className={styles.filterSelect} value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                    <option value="">Tất cả trạng thái</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className={styles.filterSelect} value={filters.postType}
                        onChange={(e) => setFilters({ ...filters, postType: e.target.value })}>
                    <option value="">Tất cả loại</option>
                    {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select className={styles.filterSelect} value={filters.categoryId}
                        onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}>
                    <option value="">Tất cả danh mục</option>
                    {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.name}</option>)}
                </select>
                <select className={styles.filterSelect} value={filters.moderationLabel}
                        onChange={(e) => setFilters({ ...filters, moderationLabel: e.target.value })}>
                    <option value="">Mọi nhãn AI</option>
                    {LABEL_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <input type="date" className={styles.filterSelect} value={filters.dateFrom}
                       onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })} />
                <input type="date" className={styles.filterSelect} value={filters.dateTo}
                       onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })} />
                <button className={styles.searchBtn} onClick={onSearch}>Lọc</button>
                <button className={styles.resetBtn} onClick={onReset}>Đặt lại</button>
            </div>

            <BulkActionBar
                selectedCount={selected.size}
                actions={[
                    { value: 'approve', label: 'Duyệt' },
                    { value: 'hide', label: 'Ẩn' },
                    { value: 'delete', label: 'Xóa' },
                ]}
                onApply={applyBulk}
                onClear={() => setSelected(new Set())}
            />

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th><input type="checkbox" className={styles.checkbox}
                                       checked={posts.length > 0 && selected.size === posts.length}
                                       onChange={toggleSelectAll} /></th>
                            <th></th>
                            <th>Tiêu đề</th>
                            <th>Tác giả</th>
                            <th>Danh mục</th>
                            <th>Loại</th>
                            <th>Trạng thái</th>
                            <th>AI</th>
                            <th>Ngày tạo</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={10}><div className={styles.loading}>Đang tải…</div></td></tr>
                        ) : posts.length === 0 ? (
                            <tr><td colSpan={10}><div className={styles.empty}>Không có bài viết nào</div></td></tr>
                        ) : posts.map(post => (
                            <tr key={post.postID}>
                                <td><input type="checkbox" className={styles.checkbox}
                                           checked={selected.has(post.postID)}
                                           onChange={() => toggleSelect(post.postID)} /></td>
                                <td>
                                    <PostThumb post={post} />
                                </td>
                                <td className={styles.titleCell}
                                    title={post.title}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setDetailPostId(post.postID)}>
                                    {post.title}
                                </td>
                                <td>{post.authorName || <span className={styles.muted}>#{post.authorId}</span>}</td>
                                <td>{post.categoryName || <span className={styles.muted}>—</span>}</td>
                                <td>{post.postType}</td>
                                <td><StatusBadge status={post.status} /></td>
                                <td><ModerationBadge score={post.moderationScore} label={post.moderationLabel} /></td>
                                <td className={styles.muted}>{(post.createdAt || '').slice(0, 10)}</td>
                                <td>
                                    <div className={styles.rowActions}>
                                        <button className={styles.iconBtn} title="Xem chi tiết"
                                                onClick={() => setDetailPostId(post.postID)}>
                                            <Eye size={15} />
                                        </button>
                                        <button className={styles.iconBtn} title="Duyệt"
                                                onClick={() => handleStatus(post, 'PUBLISHED', 'Đã duyệt bài viết')}>
                                            <Check size={15} />
                                        </button>
                                        <button className={styles.iconBtn} title="Ẩn"
                                                onClick={() => handleStatus(post, 'HIDDEN', 'Đã ẩn bài viết')}>
                                            <EyeOff size={15} />
                                        </button>
                                        <button className={`${styles.iconBtn} ${post.isPinned ? styles.iconBtnActive : ''}`}
                                                title="Ghim" onClick={() => handlePin(post)}>
                                            <Pin size={15} />
                                        </button>
                                        <button className={`${styles.iconBtn} ${post.isFeatured ? styles.iconBtnActive : ''}`}
                                                title="Nổi bật" onClick={() => handleFeature(post)}>
                                            <Star size={15} />
                                        </button>
                                        {isAdmin() && (
                                            <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                                                    title="Xóa" onClick={() => askDelete(post)}>
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination currentPage={page} totalPages={totalPages} totalElements={totalElements} onPageChange={setPage} />

            <ConfirmModal
                isOpen={!!confirm}
                danger
                message={confirm?.message}
                onCancel={() => setConfirm(null)}
                onConfirm={() => { const fn = confirm.onConfirm; setConfirm(null); fn(); }}
            />

            {detailPostId && (
                <PostDetailModal
                    postId={detailPostId}
                    onClose={() => setDetailPostId(null)}
                    onChanged={load}
                />
            )}
        </div>
    );
};

export default AdminPostManagement;
