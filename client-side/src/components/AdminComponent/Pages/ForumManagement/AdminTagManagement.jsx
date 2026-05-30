import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Pencil, Trash2, Plus } from 'lucide-react';
import adminForumApi from '../../../../services/forum/adminForumApi';
import { isAdmin } from '../../../../services/forum/adminRole';
import Pagination from './shared/Pagination';
import BulkActionBar from './shared/BulkActionBar';
import ConfirmModal from './shared/ConfirmModal';
import ForumBreadcrumb from './shared/ForumBreadcrumb';
import styles from './ForumManagement.module.scss';
import shared from './shared/shared.module.scss';

const emptyForm = { name: '', slug: '', color: '#1a73e8', description: '', isActive: true };
const PAGE_SIZE = 15;

const AdminTagManagement = () => {
    const [tags, setTags] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [applied, setApplied] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [modal, setModal] = useState(null);
    const [confirm, setConfirm] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, size: PAGE_SIZE };
            if (applied) params.search = applied;
            const data = await adminForumApi.getTags(params);
            setTags(data?.content || []);
            setTotalPages(data?.totalPages || 0);
            setSelected(new Set());
        } catch (e) {
            toast.error('Không tải được thẻ');
        } finally {
            setLoading(false);
        }
    }, [page, applied]);

    useEffect(() => { load(); }, [load]);

    const onSearch = () => { setPage(0); setApplied(search); };

    const toggleSelect = (id) => setSelected(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });
    const toggleSelectAll = () => setSelected(prev =>
        prev.size === tags.length ? new Set() : new Set(tags.map(t => t.tagId)));

    const openCreate = () => setModal({ editing: null, form: { ...emptyForm } });
    const openEdit = (t) => setModal({
        editing: t.tagId,
        form: {
            name: t.name || '', slug: t.slug || '', color: t.color || '#1a73e8',
            description: t.description || '', isActive: t.isActive !== false,
        },
    });
    const setField = (k, v) => setModal(m => ({ ...m, form: { ...m.form, [k]: v } }));

    const submitModal = async () => {
        const { editing, form } = modal;
        if (!form.name.trim()) { toast.warn('Tên thẻ là bắt buộc'); return; }
        try {
            if (editing) await adminForumApi.updateTag(editing, form);
            else await adminForumApi.createTag(form);
            toast.success(editing ? 'Đã cập nhật thẻ' : 'Đã tạo thẻ');
            setModal(null);
            load();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Lưu thất bại');
        }
    };

    const askDelete = (t) => setConfirm({
        message: `Xóa thẻ "${t.name}"?`,
        onConfirm: async () => {
            try { await adminForumApi.deleteTag(t.tagId); toast.success('Đã xóa thẻ'); load(); }
            catch (e) { toast.error('Xóa thất bại'); }
        },
    });

    const bulkDeactivate = () => {
        const ids = [...selected];
        setConfirm({
            message: `Tắt hoạt động ${ids.length} thẻ đã chọn?`,
            onConfirm: async () => {
                try {
                    await Promise.all(ids.map(id => adminForumApi.updateTag(id, { isActive: false })));
                    toast.success(`Đã tắt ${ids.length} thẻ`);
                    load();
                } catch (e) {
                    toast.error('Thao tác thất bại');
                }
            },
        });
    };

    return (
        <div className={styles.page}>
            <ForumBreadcrumb items={[
                { label: 'Forum', to: '/admin/forum' },
                { label: 'Quản lý thẻ' },
            ]} />
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Quản lý thẻ</h1>
                    <p className={styles.pageSubtitle}>Thêm, sửa, xóa và tắt hoạt động các thẻ</p>
                </div>
                {isAdmin() && (
                    <button className={styles.searchBtn} onClick={openCreate}>
                        <Plus size={15} style={{ verticalAlign: '-2px', marginRight: 4 }} />Thêm thẻ
                    </button>
                )}
            </div>

            <div className={styles.filterBar}>
                <input className={styles.filterInput} placeholder="Tìm theo tên thẻ…"
                       value={search} onChange={(e) => setSearch(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && onSearch()} />
                <button className={styles.searchBtn} onClick={onSearch}>Tìm</button>
            </div>

            <BulkActionBar
                selectedCount={selected.size}
                actions={[{ value: 'deactivate', label: 'Tắt hoạt động' }]}
                onApply={bulkDeactivate}
                onClear={() => setSelected(new Set())}
            />

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th><input type="checkbox" className={styles.checkbox}
                                       checked={tags.length > 0 && selected.size === tags.length}
                                       onChange={toggleSelectAll} /></th>
                            <th>Tên</th><th>Màu</th><th>Lượt dùng</th><th>Hoạt động</th><th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6}><div className={styles.loading}>Đang tải…</div></td></tr>
                        ) : tags.length === 0 ? (
                            <tr><td colSpan={6}><div className={styles.empty}>Chưa có thẻ</div></td></tr>
                        ) : tags.map(t => (
                            <tr key={t.tagId}>
                                <td><input type="checkbox" className={styles.checkbox}
                                           checked={selected.has(t.tagId)}
                                           onChange={() => toggleSelect(t.tagId)} /></td>
                                <td className={styles.titleCell}>{t.name}</td>
                                <td><span className={styles.colorDot} style={{ background: t.color || '#e2e8f0' }} /></td>
                                <td>{t.usageCount ?? 0}</td>
                                <td>{t.isActive !== false ? 'Bật' : 'Tắt'}</td>
                                <td>
                                    {isAdmin() ? (
                                        <div className={styles.rowActions}>
                                            <button className={styles.iconBtn} title="Sửa" onClick={() => openEdit(t)}>
                                                <Pencil size={15} />
                                            </button>
                                            <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} title="Xóa"
                                                    onClick={() => askDelete(t)}>
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

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

            {modal && (
                <div className={shared.modalOverlay} onClick={() => setModal(null)}>
                    <div className={shared.modalBox} onClick={(e) => e.stopPropagation()}>
                        <h3 className={shared.modalTitle}>{modal.editing ? 'Sửa thẻ' : 'Thêm thẻ'}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                            <input className={styles.filterInput} placeholder="Tên thẻ *"
                                   value={modal.form.name} onChange={(e) => setField('name', e.target.value)} />
                            <input className={styles.filterInput} placeholder="Slug"
                                   value={modal.form.slug} onChange={(e) => setField('slug', e.target.value)} />
                            <textarea className={styles.filterInput} placeholder="Mô tả" rows={2}
                                      value={modal.form.description} onChange={(e) => setField('description', e.target.value)} />
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
                message={confirm?.message}
                onCancel={() => setConfirm(null)}
                onConfirm={() => { const fn = confirm.onConfirm; setConfirm(null); fn(); }}
            />
        </div>
    );
};

export default AdminTagManagement;
