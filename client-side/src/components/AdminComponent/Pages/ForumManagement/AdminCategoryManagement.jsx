import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Pencil, Trash2, GripVertical, Plus } from 'lucide-react';
import adminForumApi from '../../../../services/forum/adminForumApi';
import { isAdmin } from '../../../../services/forum/adminRole';
import ConfirmModal from './shared/ConfirmModal';
import ForumBreadcrumb from './shared/ForumBreadcrumb';
import styles from './ForumManagement.module.scss';
import shared from './shared/shared.module.scss';

const emptyForm = {
    name: '', slug: '', description: '', iconUrl: '', icon: '',
    color: '#1a73e8', isActive: true,
};

const AdminCategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dirty, setDirty] = useState(false);
    const [modal, setModal] = useState(null);   // { editing, form }
    const [confirm, setConfirm] = useState(null);
    const dragId = useRef(null);

    const load = async () => {
        setLoading(true);
        try {
            const data = await adminForumApi.getCategories();
            setCategories(data || []);
            setDirty(false);
        } catch (e) {
            toast.error('Không tải được danh mục');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    // ── Drag to reorder ──────────────────────────────────────────────────────
    const onDragStart = (id) => { dragId.current = id; };
    const onDrop = (targetId) => {
        const from = categories.findIndex(c => c.categoryId === dragId.current);
        const to = categories.findIndex(c => c.categoryId === targetId);
        if (from === -1 || to === -1 || from === to) return;
        const next = [...categories];
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);
        setCategories(next);
        setDirty(true);
    };

    const saveOrder = async () => {
        try {
            const items = categories.map((c, idx) => ({ categoryId: c.categoryId, displayOrder: idx }));
            await adminForumApi.reorderCategories(items);
            toast.success('Đã lưu thứ tự');
            setDirty(false);
        } catch (e) {
            toast.error('Lưu thứ tự thất bại');
        }
    };

    // ── CRUD ─────────────────────────────────────────────────────────────────
    const openCreate = () => setModal({ editing: null, form: { ...emptyForm } });
    const openEdit = (c) => setModal({
        editing: c.categoryId,
        form: {
            name: c.name || '', slug: c.slug || '', description: c.description || '',
            iconUrl: c.iconUrl || '', icon: c.icon || '',
            color: c.color || '#1a73e8', isActive: c.isActive !== false,
        },
    });

    const submitModal = async () => {
        const { editing, form } = modal;
        if (!form.name.trim()) { toast.warn('Tên danh mục là bắt buộc'); return; }
        try {
            if (editing) await adminForumApi.updateCategory(editing, form);
            else await adminForumApi.createCategory(form);
            toast.success(editing ? 'Đã cập nhật danh mục' : 'Đã tạo danh mục');
            setModal(null);
            load();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Lưu thất bại');
        }
    };

    const askDelete = (c) => setConfirm({
        c,
        message: c.postCount > 0
            ? `Danh mục "${c.name}" đang có ${c.postCount} bài viết và không thể xóa. Hãy chuyển bài viết sang danh mục khác trước.`
            : `Xóa danh mục "${c.name}"?`,
        blocked: c.postCount > 0,
    });

    const doDelete = async () => {
        try {
            await adminForumApi.deleteCategory(confirm.c.categoryId);
            toast.success('Đã xóa danh mục');
            setConfirm(null);
            load();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Xóa thất bại');
            setConfirm(null);
        }
    };

    const setField = (k, v) => setModal(m => ({ ...m, form: { ...m.form, [k]: v } }));

    return (
        <div className={styles.page}>
            <ForumBreadcrumb items={[
                { label: 'Forum', to: '/admin/forum' },
                { label: 'Quản lý danh mục' },
            ]} />
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Quản lý danh mục</h1>
                    <p className={styles.pageSubtitle}>Kéo thả để sắp xếp, thêm/sửa/xóa danh mục</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    {isAdmin() && dirty && <button className={shared.btnPrimary} onClick={saveOrder}>Lưu thứ tự</button>}
                    {isAdmin() && (
                        <button className={styles.searchBtn} onClick={openCreate}>
                            <Plus size={15} style={{ verticalAlign: '-2px', marginRight: 4 }} />Thêm danh mục
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th></th><th>Tên</th><th>Slug</th><th>Màu</th>
                            <th>Số bài</th><th>Hiển thị</th><th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7}><div className={styles.loading}>Đang tải…</div></td></tr>
                        ) : categories.length === 0 ? (
                            <tr><td colSpan={7}><div className={styles.empty}>Chưa có danh mục</div></td></tr>
                        ) : categories.map(c => (
                            <tr key={c.categoryId}
                                draggable
                                onDragStart={() => onDragStart(c.categoryId)}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => onDrop(c.categoryId)}>
                                <td style={{ cursor: 'grab', color: '#94a3b8' }}><GripVertical size={16} /></td>
                                <td className={styles.titleCell}>{c.name}</td>
                                <td className={styles.muted}>{c.slug || '—'}</td>
                                <td><span className={styles.colorDot} style={{ background: c.color || '#e2e8f0' }} /></td>
                                <td>{c.postCount ?? 0}</td>
                                <td>{c.isActive !== false ? 'Bật' : 'Tắt'}</td>
                                <td>
                                    {isAdmin() ? (
                                        <div className={styles.rowActions}>
                                            <button className={styles.iconBtn} title="Sửa" onClick={() => openEdit(c)}>
                                                <Pencil size={15} />
                                            </button>
                                            <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} title="Xóa"
                                                    onClick={() => askDelete(c)}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className={styles.muted}>—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modal && (
                <div className={shared.modalOverlay} onClick={() => setModal(null)}>
                    <div className={shared.modalBox} onClick={(e) => e.stopPropagation()}>
                        <h3 className={shared.modalTitle}>{modal.editing ? 'Sửa danh mục' : 'Thêm danh mục'}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                            <input className={styles.filterInput} placeholder="Tên danh mục *"
                                   value={modal.form.name} onChange={(e) => setField('name', e.target.value)} />
                            <input className={styles.filterInput} placeholder="Slug"
                                   value={modal.form.slug} onChange={(e) => setField('slug', e.target.value)} />
                            <textarea className={styles.filterInput} placeholder="Mô tả" rows={3}
                                      value={modal.form.description} onChange={(e) => setField('description', e.target.value)} />
                            <input className={styles.filterInput} placeholder="Icon URL"
                                   value={modal.form.iconUrl} onChange={(e) => setField('iconUrl', e.target.value)} />
                            <input className={styles.filterInput} placeholder="Icon (tên/emoji)"
                                   value={modal.form.icon} onChange={(e) => setField('icon', e.target.value)} />
                            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                                Màu
                                <input type="color" value={modal.form.color}
                                       onChange={(e) => setField('color', e.target.value)} />
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                                <input type="checkbox" checked={modal.form.isActive}
                                       onChange={(e) => setField('isActive', e.target.checked)} />
                                Đang hoạt động
                            </label>
                        </div>
                        <div className={shared.modalActions}>
                            <button className={shared.btnSecondary} onClick={() => setModal(null)}>Hủy</button>
                            <button className={shared.btnPrimary} onClick={submitModal}>Lưu</button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={!!confirm}
                danger
                title={confirm?.blocked ? 'Không thể xóa' : 'Xác nhận xóa'}
                message={confirm?.message}
                confirmText={confirm?.blocked ? 'Đã hiểu' : 'Xóa'}
                onCancel={() => setConfirm(null)}
                onConfirm={() => confirm?.blocked ? setConfirm(null) : doDelete()}
            />
        </div>
    );
};

export default AdminCategoryManagement;
