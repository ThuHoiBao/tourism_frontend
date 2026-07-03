import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
    TreePine, Sprout, Coins, Landmark, RefreshCw, Plus,
    Pencil, Trash2, Search, Clock,
} from 'lucide-react';
import adminGreenFundApi from '../../../../services/greenFund/adminGreenFundApi';
import Pagination from '../ForumManagement/shared/Pagination';
import sharedStyles from '../ForumManagement/shared/shared.module.scss';
import forumStyles from '../ForumManagement/ForumManagement.module.scss';
import styles from './AdminGreenFund.module.scss';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtVnd = (n) => `${Number(n || 0).toLocaleString('vi-VN')}đ`;
const fmtNum = (n) => Number(n || 0).toLocaleString('vi-VN');
const fmtDateTime = (s) => (s || '').slice(0, 16).replace('T', ' ');
const fmtDate = (s) => {
    if (!s) return '—';
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? s : d.toLocaleDateString('vi-VN');
};

const SOURCE_META = {
    BOOKING: { label: 'Booking', bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
    DONATION: { label: 'Quyên góp', bg: '#ecfdf5', border: '#a7f3d0', color: '#059669' },
};

const SourceBadge = ({ source }) => {
    const c = SOURCE_META[source] || { label: source || '—', bg: '#f1f5f9', border: '#e2e8f0', color: '#475569' };
    return (
        <span className={forumStyles.coinBadge}
              style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
            {c.label}
        </span>
    );
};

// ── Modal thêm / sửa đợt trồng ───────────────────────────────────────────────
const BatchModal = ({ initial, onClose, onDone }) => {
    const isEdit = initial?.id != null;
    const [location, setLocation] = useState(initial?.location || '');
    const [plantedDate, setPlantedDate] = useState((initial?.plantedDate || '').slice(0, 10));
    const [treeCount, setTreeCount] = useState(initial?.treeCount ?? '');
    const [imageUrl, setImageUrl] = useState(initial?.imageUrl || '');
    const [note, setNote] = useState(initial?.note || '');
    const [saving, setSaving] = useState(false);

    const submit = async () => {
        if (!location.trim()) { toast.warning('Vui lòng nhập địa điểm trồng'); return; }
        if (!plantedDate) { toast.warning('Vui lòng chọn ngày trồng'); return; }
        const count = Number(treeCount);
        if (!count || !Number.isInteger(count) || count <= 0) {
            toast.warning('Số cây phải là số nguyên dương');
            return;
        }
        setSaving(true);
        const body = {
            location: location.trim(),
            plantedDate,
            treeCount: count,
            imageUrl: imageUrl.trim() || null,
            note: note.trim() || null,
        };
        try {
            if (isEdit) {
                await adminGreenFundApi.updateBatch(initial.id, body);
                toast.success('Đã cập nhật đợt trồng cây');
            } else {
                await adminGreenFundApi.createBatch(body);
                toast.success('Đã thêm đợt trồng cây mới 🌳');
            }
            onDone();
        } catch (e) {
            toast.error(e?.response?.data?.message || (isEdit ? 'Cập nhật thất bại' : 'Thêm đợt trồng thất bại'));
        } finally { setSaving(false); }
    };

    return (
        <div className={sharedStyles.modalOverlay} onClick={onClose}>
            <div className={sharedStyles.modalBox} onClick={(e) => e.stopPropagation()}>
                <h3 className={sharedStyles.modalTitle}>
                    {isEdit ? 'Sửa đợt trồng cây' : 'Thêm đợt trồng cây'}
                </h3>
                <div className={sharedStyles.modalBody}>
                    <label className={forumStyles.fieldLabel}>Địa điểm *</label>
                    <input className={forumStyles.fieldInput} value={location}
                           onChange={(e) => setLocation(e.target.value)}
                           placeholder="VD: Rừng phòng hộ Cần Giờ, TP.HCM" />

                    <label className={forumStyles.fieldLabel}>Ngày trồng *</label>
                    <input type="date" className={forumStyles.fieldInput} value={plantedDate}
                           onChange={(e) => setPlantedDate(e.target.value)} />

                    <label className={forumStyles.fieldLabel}>Số cây *</label>
                    <input type="number" min="1" step="1" className={forumStyles.fieldInput}
                           value={treeCount} onChange={(e) => setTreeCount(e.target.value)}
                           placeholder="VD: 500" />

                    <label className={forumStyles.fieldLabel}>Ảnh (URL)</label>
                    <input className={forumStyles.fieldInput} value={imageUrl}
                           onChange={(e) => setImageUrl(e.target.value)}
                           placeholder="https://..." />

                    <label className={forumStyles.fieldLabel}>Ghi chú</label>
                    <textarea className={forumStyles.fieldTextarea} value={note}
                              onChange={(e) => setNote(e.target.value)}
                              placeholder="VD: Phối hợp cùng đoàn thanh niên địa phương" />
                </div>
                <div className={sharedStyles.modalActions}>
                    <button className={sharedStyles.btnSecondary} onClick={onClose} disabled={saving}>Hủy</button>
                    <button className={sharedStyles.btnPrimary} onClick={submit} disabled={saving}>
                        {saving ? 'Đang lưu…' : (isEdit ? 'Lưu thay đổi' : 'Thêm đợt trồng')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Tab Đợt trồng cây ────────────────────────────────────────────────────────
const BatchesTab = () => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null); // null | {} | batch

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminGreenFundApi.getBatches();
            setBatches(Array.isArray(data) ? data : (data?.items || []));
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Không tải được danh sách đợt trồng');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (batch) => {
        if (!window.confirm(`Xóa đợt trồng "${batch.location}" (${fmtNum(batch.treeCount)} cây)?`)) return;
        try {
            await adminGreenFundApi.deleteBatch(batch.id);
            toast.success('Đã xóa đợt trồng cây');
            load();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Xóa thất bại');
        }
    };

    const totalTrees = batches.reduce((sum, b) => sum + Number(b.treeCount || 0), 0);

    return (
        <>
            <div className={styles.tabToolbar}>
                <span className={forumStyles.muted}>
                    {batches.length} đợt trồng · tổng {fmtNum(totalTrees)} cây 🌳
                </span>
                <button className={forumStyles.searchBtn} onClick={() => setModal({})}>
                    <Plus size={14} /> Thêm đợt trồng
                </button>
            </div>

            <div className={forumStyles.tableWrap}>
                <table className={forumStyles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Địa điểm</th>
                            <th>Ngày trồng</th>
                            <th>Số cây</th>
                            <th>Ảnh</th>
                            <th>Ghi chú</th>
                            <th>Tạo lúc</th>
                            <th style={{ textAlign: 'right' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} className={styles.centerCell}>Đang tải…</td></tr>
                        ) : batches.length === 0 ? (
                            <tr><td colSpan={8} className={styles.centerCell}>Chưa có đợt trồng nào — bấm "Thêm đợt trồng" 🌱</td></tr>
                        ) : batches.map((b) => (
                            <tr key={b.id}>
                                <td className={forumStyles.muted}>#{b.id}</td>
                                <td className={styles.locationCell}>{b.location}</td>
                                <td>{fmtDate(b.plantedDate)}</td>
                                <td className={styles.treeCell}>🌱 {fmtNum(b.treeCount)}</td>
                                <td>
                                    {b.imageUrl ? (
                                        <a href={b.imageUrl} target="_blank" rel="noreferrer">
                                            <img className={styles.batchThumb} src={b.imageUrl} alt="" />
                                        </a>
                                    ) : <span className={forumStyles.muted}>—</span>}
                                </td>
                                <td className={styles.noteCell} title={b.note || ''}>{b.note || '—'}</td>
                                <td className={forumStyles.muted}>{fmtDateTime(b.createdAt)}</td>
                                <td className={styles.actionsCell}>
                                    <button className={styles.iconBtn} title="Sửa" onClick={() => setModal(b)}>
                                        <Pencil size={15} />
                                    </button>
                                    <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} title="Xóa"
                                            onClick={() => handleDelete(b)}>
                                        <Trash2 size={15} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modal && (
                <BatchModal
                    initial={modal.id != null ? modal : null}
                    onClose={() => setModal(null)}
                    onDone={() => { setModal(null); load(); }}
                />
            )}
        </>
    );
};

// ── Tab Đóng góp ─────────────────────────────────────────────────────────────
const ContributionsTab = () => {
    const [source, setSource] = useState('');
    const [userId, setUserId] = useState('');
    const [page, setPage] = useState(0);
    const [data, setData] = useState({ items: [], totalPages: 0, totalElements: 0 });
    const [loading, setLoading] = useState(true);

    const load = useCallback(async (pageIdx = 0) => {
        setLoading(true);
        try {
            const params = { page: pageIdx, size: 20 };
            if (source) params.source = source;
            if (userId.trim()) params.userId = userId.trim();
            const res = await adminGreenFundApi.getContributions(params);
            setData({
                items: res?.items || [],
                totalPages: res?.totalPages || 0,
                totalElements: res?.totalElements ?? (res?.items?.length || 0),
            });
            setPage(res?.page ?? pageIdx);
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Không tải được danh sách đóng góp');
        } finally { setLoading(false); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [source, userId]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { load(0); }, [source]); // đổi nguồn → tải lại trang đầu

    return (
        <>
            <div className={styles.tabToolbar}>
                <select className={forumStyles.fieldSelect} style={{ maxWidth: 180 }}
                        value={source} onChange={(e) => setSource(e.target.value)}>
                    <option value="">Tất cả nguồn</option>
                    <option value="BOOKING">Booking</option>
                    <option value="DONATION">Quyên góp</option>
                </select>
                <input className={forumStyles.fieldInput} style={{ maxWidth: 180 }}
                       value={userId} placeholder="ID người dùng"
                       onChange={(e) => setUserId(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && load(0)} />
                <button className={forumStyles.searchBtn} onClick={() => load(0)}>
                    <Search size={14} /> Lọc
                </button>
            </div>

            <div className={forumStyles.tableWrap}>
                <table className={forumStyles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nguồn</th>
                            <th>User</th>
                            <th>Booking</th>
                            <th>Coin</th>
                            <th>VND</th>
                            <th>Ẩn danh</th>
                            <th>Thời gian</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} className={styles.centerCell}>Đang tải…</td></tr>
                        ) : data.items.length === 0 ? (
                            <tr><td colSpan={8} className={styles.centerCell}>Không có đóng góp nào khớp bộ lọc</td></tr>
                        ) : data.items.map((c) => (
                            <tr key={c.id}>
                                <td className={forumStyles.muted}>#{c.id}</td>
                                <td><SourceBadge source={c.source} /></td>
                                <td>{c.userId != null ? `#${c.userId}` : '—'}</td>
                                <td>{c.bookingCode || '—'}</td>
                                <td>{c.coinAmount != null ? fmtNum(c.coinAmount) : '—'}</td>
                                <td className={styles.vndCell}>{fmtVnd(c.amountVnd)}</td>
                                <td className={styles.centerCell}>{c.anonymous ? '✓' : ''}</td>
                                <td className={forumStyles.muted}>{fmtDateTime(c.createdAt)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination
                currentPage={page}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                onPageChange={(p) => load(p)}
            />
        </>
    );
};

// ── Tab Sổ quỹ ───────────────────────────────────────────────────────────────
const LedgerTab = () => {
    const [ledger, setLedger] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminGreenFundApi.getLedger();
            setLedger(data);
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Không tải được sổ quỹ');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading) return <p className={forumStyles.muted}>Đang tải sổ quỹ…</p>;
    if (!ledger) return <p className={forumStyles.muted}>Không có dữ liệu sổ quỹ.</p>;

    const raised = Number(ledger.totalFundRaised || 0);
    const converted = Number(ledger.convertedFund || 0);
    const pending = raised - converted;

    const cards = [
        { icon: Coins, label: 'Tổng quỹ đã gom', value: fmtVnd(raised), color: '#16a34a', bg: '#ecfdf5' },
        { icon: TreePine, label: 'Đã quy đổi trồng cây', value: fmtVnd(converted), color: '#1d4ed8', bg: '#eff6ff' },
        { icon: Landmark, label: 'Quỹ chờ quy đổi', value: fmtVnd(pending), color: '#b45309', bg: '#fef3c7' },
        { icon: Sprout, label: 'Cây đã trồng', value: `${fmtNum(ledger.treesPlanted)} cây`, color: '#059669', bg: '#ecfdf5' },
    ];

    return (
        <>
            <div className={styles.ledgerGrid}>
                {cards.map((c) => (
                    <div key={c.label} className={forumStyles.statCard} style={{ '--accent': c.color }}>
                        <div className={forumStyles.statHead}>
                            <span className={forumStyles.statIconBox} style={{ background: c.bg, color: c.color }}>
                                <c.icon size={19} />
                            </span>
                            <span className={forumStyles.statLabel}>{c.label}</span>
                        </div>
                        <div className={forumStyles.statValue} style={{ color: c.color }}>{c.value}</div>
                    </div>
                ))}
            </div>

            <p className={styles.ledgerUpdated}>
                <Clock size={13} /> Cập nhật lúc: {fmtDateTime(ledger.updatedAt) || '—'}
                <button className={styles.iconBtn} title="Tải lại" onClick={load} style={{ marginLeft: 8 }}>
                    <RefreshCw size={14} />
                </button>
            </p>

            <p className={forumStyles.configNote}>
                Đối soát: <strong>Quỹ chờ quy đổi = Tổng quỹ đã gom − Đã quy đổi trồng cây</strong>.
                Scheduler quy đổi sẽ chuyển quỹ chờ thành cây trồng theo chi phí mỗi cây; nếu số liệu lệch so với
                tổng các đóng góp ở tab "Đóng góp", kiểm tra lại các bản ghi operationKey trùng hoặc sự kiện kẹt.
            </p>
        </>
    );
};

// ── Trang chính ──────────────────────────────────────────────────────────────
const TABS = [
    { key: 'batches', label: 'Đợt trồng cây' },
    { key: 'contributions', label: 'Đóng góp' },
    { key: 'ledger', label: 'Sổ quỹ' },
];

const AdminGreenFund = () => {
    const [tab, setTab] = useState('batches');

    return (
        <div className={forumStyles.page}>
            <div className={forumStyles.pageHeader}>
                <div>
                    <h1 className={forumStyles.pageTitle}>Quỹ Trồng Cây Xanh</h1>
                    <p className={forumStyles.pageSubtitle}>
                        Quản lý đợt trồng cây, audit đóng góp và đối soát sổ quỹ
                    </p>
                </div>
            </div>

            <div className={forumStyles.tabBar}>
                {TABS.map((t) => (
                    <button key={t.key}
                            className={`${forumStyles.quickTab} ${tab === t.key ? forumStyles.quickTabActive : ''}`}
                            onClick={() => setTab(t.key)}>
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'batches' && <BatchesTab />}
            {tab === 'contributions' && <ContributionsTab />}
            {tab === 'ledger' && <LedgerTab />}
        </div>
    );
};

export default AdminGreenFund;
