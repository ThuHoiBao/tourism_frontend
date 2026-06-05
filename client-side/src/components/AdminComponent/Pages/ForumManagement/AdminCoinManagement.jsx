import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
    Coins, CalendarDays, CalendarRange, Users, Clock, Ban,
    Lock, Unlock, RotateCcw, Undo2, RefreshCw, Scale, AlertTriangle,
    CheckCircle2, XCircle, Infinity as InfinityIcon,
    Radar, Power, Save, ShieldAlert,
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import adminForumApi from '../../../../services/forum/adminForumApi';
import { isAdmin } from '../../../../services/forum/adminRole';
import ForumBreadcrumb from './shared/ForumBreadcrumb';
import Pagination from './shared/Pagination';
import sharedStyles from './shared/shared.module.scss';
import styles from './ForumManagement.module.scss';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtNum = (n) => {
    if (n == null || Number.isNaN(Number(n))) return '—';
    return parseFloat(Number(n).toFixed(2)).toString();
};
const fmtDateTime = (s) => (s || '').slice(0, 16).replace('T', ' ');

const ACTION_LABELS = {
    POST: 'Bài viết',
    COMMENT: 'Bình luận',
    LIKE_MILESTONE: 'Mốc like bài',
    COMMENT_LIKE_MILESTONE: 'Mốc like bình luận',
    FOLLOW: 'Theo dõi',
    DAILY: 'Hằng ngày',
};
const ACTION_COLORS = {
    POST: { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
    COMMENT: { bg: '#ecfdf5', border: '#a7f3d0', color: '#059669' },
    LIKE_MILESTONE: { bg: '#fef3c7', border: '#fde68a', color: '#b45309' },
    COMMENT_LIKE_MILESTONE: { bg: '#fff7ed', border: '#fed7aa', color: '#c2410c' },
    FOLLOW: { bg: '#f5f3ff', border: '#ddd6fe', color: '#7c3aed' },
    DAILY: { bg: '#ecfeff', border: '#a5f3fc', color: '#0e7490' },
};
const STATUS_LABELS = {
    CREDITED: 'Đã cộng',
    PENDING: 'Đang chờ',
    CANCELLED: 'Đã hủy',
};
const STATUS_COLORS = {
    CREDITED: { bg: '#ecfdf5', border: '#a7f3d0', color: '#059669' },
    PENDING: { bg: '#fef3c7', border: '#fde68a', color: '#b45309' },
    CANCELLED: { bg: '#f1f5f9', border: '#e2e8f0', color: '#64748b' },
};

const ActionBadge = ({ action }) => {
    const c = ACTION_COLORS[action] || { bg: '#f1f5f9', border: '#e2e8f0', color: '#475569' };
    return (
        <span className={styles.coinBadge}
              style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
            {ACTION_LABELS[action] || action || '—'}
        </span>
    );
};

const CoinStatusBadge = ({ log }) => {
    const c = STATUS_COLORS[log.status] || { bg: '#f1f5f9', border: '#e2e8f0', color: '#475569' };
    const tooltip = log.revokedAt
        ? `Thu hồi lúc ${fmtDateTime(log.revokedAt)}${log.revokeReason ? ` — Lý do: ${log.revokeReason}` : ''}`
        : undefined;
    return (
        <span className={styles.coinBadge} title={tooltip}
              style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
            {STATUS_LABELS[log.status] || log.status || '—'}
            {log.revokedAt && ' ↩'}
        </span>
    );
};

const UserCell = ({ userId, userName, userAvatar }) => (
    <span className={styles.userCell}>
        {userAvatar
            ? <img className={styles.coinAvatar} src={userAvatar} alt="" />
            : <span className={styles.coinAvatar} />}
        <span>
            {userName || `#${userId}`}
            <div className={styles.muted} style={{ fontWeight: 400, fontSize: 11.5 }}>#{userId}</div>
        </span>
    </span>
);

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
    <div className={styles.statCard} style={{ '--accent': color }}>
        <div className={styles.statHead}>
            <span className={styles.statIconBox} style={{ background: bg, color }}>
                <Icon size={19} />
            </span>
            <span className={styles.statLabel}>{label}</span>
        </div>
        <div className={styles.statValue} style={{ color }}>{value ?? '—'}</div>
    </div>
);

// ── Modal khóa thưởng ────────────────────────────────────────────────────────
const RestrictModal = ({ initial, onClose, onDone }) => {
    const [userId, setUserId] = useState(initial?.userId ?? '');
    const [reason, setReason] = useState('');
    const [durationDays, setDurationDays] = useState('7');
    const [saving, setSaving] = useState(false);

    const submit = async () => {
        if (!userId) { toast.warning('Vui lòng nhập ID người dùng'); return; }
        if (!reason.trim()) { toast.warning('Vui lòng nhập lý do khóa thưởng'); return; }
        setSaving(true);
        try {
            await adminForumApi.restrictCoinUser({
                userId: Number(userId),
                reason: reason.trim(),
                durationDays: durationDays === '' ? null : Number(durationDays),
            });
            toast.success('Đã khóa thưởng coin của người dùng');
            onDone();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Khóa thưởng thất bại');
        } finally { setSaving(false); }
    };

    return (
        <div className={sharedStyles.modalOverlay} onClick={onClose}>
            <div className={sharedStyles.modalBox} onClick={(e) => e.stopPropagation()}>
                <h3 className={sharedStyles.modalTitle}>Khóa thưởng coin</h3>
                <div className={sharedStyles.modalBody}>
                    <label className={styles.fieldLabel}>ID người dùng</label>
                    <input type="number" className={styles.fieldInput} value={userId}
                           disabled={initial?.userId != null}
                           onChange={(e) => setUserId(e.target.value)} placeholder="VD: 123" />
                    <label className={styles.fieldLabel}>Lý do</label>
                    <textarea className={styles.fieldTextarea} value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              placeholder="VD: Spam bài viết để cày coin" />
                    <label className={styles.fieldLabel}>Thời hạn</label>
                    <select className={styles.fieldSelect} value={durationDays}
                            onChange={(e) => setDurationDays(e.target.value)}>
                        <option value="7">7 ngày</option>
                        <option value="30">30 ngày</option>
                        <option value="">Vĩnh viễn</option>
                    </select>
                </div>
                <div className={sharedStyles.modalActions}>
                    <button className={sharedStyles.btnSecondary} onClick={onClose} disabled={saving}>Hủy</button>
                    <button className={sharedStyles.btnDanger} onClick={submit} disabled={saving}>
                        {saving ? 'Đang xử lý…' : 'Khóa thưởng'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Modal thu hồi 1 log ──────────────────────────────────────────────────────
const RevokeModal = ({ log, onClose, onDone }) => {
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);

    const submit = async () => {
        if (!reason.trim()) { toast.warning('Vui lòng nhập lý do thu hồi'); return; }
        setSaving(true);
        try {
            const data = await adminForumApi.revokeCoinLog(log.id, reason.trim());
            const amount = data?.revokedAmount;
            toast.success(
                `Đã thu hồi ${amount != null ? fmtNum(amount) + ' coin' : 'coin'}` +
                (data?.note ? ` — ${data.note}` : '')
            );
            onDone();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Thu hồi thất bại');
        } finally { setSaving(false); }
    };

    return (
        <div className={sharedStyles.modalOverlay} onClick={onClose}>
            <div className={sharedStyles.modalBox} onClick={(e) => e.stopPropagation()}>
                <h3 className={sharedStyles.modalTitle}>Thu hồi coin</h3>
                <div className={sharedStyles.modalBody}>
                    <p style={{ margin: '0 0 10px' }}>
                        Thu hồi <strong>+{fmtNum(log.amount)} coin</strong> của{' '}
                        <strong>{log.userName || `#${log.userId}`}</strong>{' '}
                        ({ACTION_LABELS[log.action] || log.action})?
                    </p>
                    <label className={styles.fieldLabel}>Lý do thu hồi</label>
                    <textarea className={styles.fieldTextarea} value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              placeholder="VD: Bài viết vi phạm đã bị xóa" />
                </div>
                <div className={sharedStyles.modalActions}>
                    <button className={sharedStyles.btnSecondary} onClick={onClose} disabled={saving}>Hủy</button>
                    <button className={sharedStyles.btnDanger} onClick={submit} disabled={saving}>
                        {saving ? 'Đang xử lý…' : 'Thu hồi'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Modal thu hồi hàng loạt ──────────────────────────────────────────────────
const BulkRevokeModal = ({ onClose, onDone }) => {
    const [userId, setUserId] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);

    const submit = async () => {
        if (!userId) { toast.warning('Vui lòng nhập ID người dùng'); return; }
        if (!reason.trim()) { toast.warning('Vui lòng nhập lý do thu hồi'); return; }
        setSaving(true);
        try {
            const data = await adminForumApi.revokeCoinBulk({
                userId: Number(userId),
                from: from || null,
                to: to || null,
                reason: reason.trim(),
            });
            toast.success(
                `Đã thu hồi ${data?.revokedCount ?? 0} khoản thưởng` +
                ` (tổng ${fmtNum(data?.totalRevoked ?? 0)} coin` +
                (data?.failedCount ? `, ${data.failedCount} thất bại` : '') + ')'
            );
            onDone();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Thu hồi hàng loạt thất bại');
        } finally { setSaving(false); }
    };

    return (
        <div className={sharedStyles.modalOverlay} onClick={onClose}>
            <div className={sharedStyles.modalBox} onClick={(e) => e.stopPropagation()}>
                <h3 className={sharedStyles.modalTitle}>Thu hồi coin hàng loạt</h3>
                <div className={sharedStyles.modalBody}>
                    <label className={styles.fieldLabel}>ID người dùng</label>
                    <input type="number" className={styles.fieldInput} value={userId}
                           onChange={(e) => setUserId(e.target.value)} placeholder="VD: 123" />
                    <label className={styles.fieldLabel}>Từ ngày</label>
                    <input type="date" className={styles.fieldInput} value={from}
                           onChange={(e) => setFrom(e.target.value)} />
                    <label className={styles.fieldLabel}>Đến ngày</label>
                    <input type="date" className={styles.fieldInput} value={to}
                           onChange={(e) => setTo(e.target.value)} />
                    <label className={styles.fieldLabel}>Lý do</label>
                    <textarea className={styles.fieldTextarea} value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              placeholder="VD: Phát hiện gian lận cày coin" />
                </div>
                <div className={sharedStyles.modalActions}>
                    <button className={sharedStyles.btnSecondary} onClick={onClose} disabled={saving}>Hủy</button>
                    <button className={sharedStyles.btnDanger} onClick={submit} disabled={saving}>
                        {saving ? 'Đang xử lý…' : 'Thu hồi hàng loạt'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Tab 1: Tổng quan ─────────────────────────────────────────────────────────
const OverviewTab = ({ admin, onRestrict }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        adminForumApi.getCoinStats(30)
            .then(setStats)
            .catch(() => toast.error('Không tải được thống kê coin'))
            .finally(() => setLoading(false));
    }, []);

    if (loading && !stats) return <div className={styles.loading}>Đang tải…</div>;

    const byDay = (stats?.byDay || []).map(d => ({
        label: (d.day || '').slice(5),
        total: Number(d.total) || 0,
        count: d.count || 0,
    }));
    const byAction = (stats?.byAction || []).map(a => ({
        label: ACTION_LABELS[a.action] || a.action,
        total: Number(a.total) || 0,
        count: a.count || 0,
    }));
    const topUsers = stats?.topUsers || [];

    return (
        <>
            <div className={styles.statGrid}>
                <StatCard icon={Coins} label="Coin hôm nay" value={fmtNum(stats?.totalToday)} color="#d97706" bg="#fef3c7" />
                <StatCard icon={CalendarDays} label="Coin 7 ngày" value={fmtNum(stats?.total7Days)} color="#1a73e8" bg="#eff6ff" />
                <StatCard icon={CalendarRange} label="Coin 30 ngày" value={fmtNum(stats?.totalNDays)} color="#0e7490" bg="#ecfeff" />
                <StatCard icon={Users} label="User được thưởng hôm nay" value={stats?.usersRewardedToday} color="#059669" bg="#ecfdf5" />
                <StatCard icon={Clock} label="Đang chờ (PENDING)" value={stats?.pendingCount} color="#7c3aed" bg="#f5f3ff" />
                <StatCard icon={Ban} label="Đã hủy / thu hồi" value={stats?.cancelledCount} color="#dc2626" bg="#fef2f2" />
            </div>

            <div className={styles.analyticsGrid} style={{ marginTop: 0 }}>
                <div className={styles.analyticsBlock}>
                    <h2 className={styles.sectionTitle}>Coin phát theo ngày (30 ngày)</h2>
                    <div className={styles.panel}>
                        {byDay.length === 0 ? (
                            <div className={styles.empty}>Không có dữ liệu</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <LineChart data={byDay} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(v, name) =>
                                        [name === 'total' ? `${fmtNum(v)} coin` : v,
                                         name === 'total' ? 'Tổng coin' : 'Số lượt']} />
                                    <Line type="monotone" dataKey="total" stroke="#1a73e8" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
                <div className={styles.analyticsBlock}>
                    <h2 className={styles.sectionTitle}>Coin theo loại hành động</h2>
                    <div className={styles.panel}>
                        {byAction.length === 0 ? (
                            <div className={styles.empty}>Không có dữ liệu</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={byAction} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-12} textAnchor="end" height={48} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(v, name) =>
                                        [name === 'total' ? `${fmtNum(v)} coin` : v,
                                         name === 'total' ? 'Tổng coin' : 'Số lượt']} />
                                    <Bar dataKey="total" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            <h2 className={styles.sectionTitle} style={{ marginTop: 28 }}>Top 10 user nhận coin (30 ngày)</h2>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Người dùng</th>
                            <th>Tổng coin</th>
                            <th>Số lượt</th>
                            {admin && <th>Hành động</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {topUsers.length === 0 ? (
                            <tr><td colSpan={admin ? 5 : 4}><div className={styles.empty}>Không có dữ liệu</div></td></tr>
                        ) : topUsers.map((u, idx) => (
                            <tr key={u.userId}>
                                <td className={styles.muted}>{idx + 1}</td>
                                <td><UserCell userId={u.userId} userName={u.userName} userAvatar={u.userAvatar} /></td>
                                <td><span className={styles.coinAmount}>{fmtNum(u.total)}</span></td>
                                <td>{u.count}</td>
                                {admin && (
                                    <td>
                                        <button className={styles.btnGhost}
                                                onClick={() => onRestrict({ userId: u.userId })}>
                                            <Lock size={13} /> Khóa thưởng
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

// ── Tab 2: Lịch sử thưởng ────────────────────────────────────────────────────
const ACTION_OPTIONS = Object.keys(ACTION_LABELS);
const STATUS_OPTIONS = Object.keys(STATUS_LABELS);
const PAGE_SIZE = 20;
const emptyFilters = { userId: '', action: '', status: '', from: '', to: '' };

const LogsTab = ({ admin, onRestrict }) => {
    const [logs, setLogs] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState(emptyFilters);
    const [applied, setApplied] = useState(emptyFilters);
    const [revokeLog, setRevokeLog] = useState(null);
    const [bulkOpen, setBulkOpen] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, size: PAGE_SIZE };
            Object.entries(applied).forEach(([k, v]) => {
                if (v !== '' && v != null) params[k] = v;
            });
            const data = await adminForumApi.getCoinLogs(params);
            setLogs(data?.items || []);
            setTotalPages(data?.totalPages || 0);
            setTotalElements(data?.totalElements ?? 0);
        } catch {
            toast.error('Không tải được lịch sử thưởng coin');
        } finally {
            setLoading(false);
        }
    }, [page, applied]);

    useEffect(() => { load(); }, [load]);

    const onSearch = () => { setPage(0); setApplied(filters); };
    const onReset = () => { setFilters(emptyFilters); setApplied(emptyFilters); setPage(0); };

    return (
        <>
            <div className={styles.filterBar}>
                <input type="number" className={styles.filterSelect} style={{ width: 130 }}
                       placeholder="ID người dùng"
                       value={filters.userId}
                       onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                       onKeyDown={(e) => e.key === 'Enter' && onSearch()} />
                <select className={styles.filterSelect} value={filters.action}
                        onChange={(e) => setFilters({ ...filters, action: e.target.value })}>
                    <option value="">Tất cả hành động</option>
                    {ACTION_OPTIONS.map(a => <option key={a} value={a}>{ACTION_LABELS[a]}</option>)}
                </select>
                <select className={styles.filterSelect} value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                    <option value="">Tất cả trạng thái</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
                <input type="date" className={styles.filterSelect} value={filters.from}
                       onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
                <input type="date" className={styles.filterSelect} value={filters.to}
                       onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
                <button className={styles.searchBtn} onClick={onSearch}>Lọc</button>
                <button className={styles.resetBtn} onClick={onReset}>Đặt lại</button>
                {admin && (
                    <button className={styles.resetBtn} style={{ marginLeft: 'auto', color: '#dc2626' }}
                            onClick={() => setBulkOpen(true)}>
                        <Undo2 size={14} /> Thu hồi hàng loạt
                    </button>
                )}
            </div>

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Người dùng</th>
                            <th>Hành động</th>
                            <th>Coin</th>
                            <th>Lý do</th>
                            <th>Trạng thái</th>
                            <th>Thời gian</th>
                            {admin && <th>Thao tác</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={admin ? 7 : 6}><div className={styles.loading}>Đang tải…</div></td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={admin ? 7 : 6}><div className={styles.empty}>Không có bản ghi nào</div></td></tr>
                        ) : logs.map(log => (
                            <tr key={log.id}>
                                <td><UserCell userId={log.userId} userName={log.userName} userAvatar={log.userAvatar} /></td>
                                <td><ActionBadge action={log.action} /></td>
                                <td><span className={styles.coinAmount}>+{fmtNum(log.amount)}</span></td>
                                <td><div className={styles.reasonCell} title={log.reason || ''}>{log.reason || <span className={styles.muted}>—</span>}</div></td>
                                <td><CoinStatusBadge log={log} /></td>
                                <td className={styles.muted}>{fmtDateTime(log.createdAt)}</td>
                                {admin && (
                                    <td>
                                        <div className={styles.rowActions}>
                                            {log.status === 'CREDITED' && (
                                                <button className={styles.btnGhost} title="Thu hồi coin"
                                                        style={{ color: '#dc2626' }}
                                                        onClick={() => setRevokeLog(log)}>
                                                    <Undo2 size={13} /> Thu hồi
                                                </button>
                                            )}
                                            <button className={styles.btnGhost} title="Khóa thưởng user này"
                                                    onClick={() => onRestrict({ userId: log.userId })}>
                                                <Lock size={13} /> Khóa thưởng
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination currentPage={page} totalPages={totalPages} totalElements={totalElements} onPageChange={setPage} />

            {revokeLog && (
                <RevokeModal log={revokeLog}
                             onClose={() => setRevokeLog(null)}
                             onDone={() => { setRevokeLog(null); load(); }} />
            )}
            {bulkOpen && (
                <BulkRevokeModal onClose={() => setBulkOpen(false)}
                                 onDone={() => { setBulkOpen(false); load(); }} />
            )}
        </>
    );
};

// ── Tab 3: Khóa thưởng ───────────────────────────────────────────────────────
const RestrictionsTab = ({ admin, onRestrict, reloadKey }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminForumApi.getCoinRestrictions();
            setItems(data || []);
        } catch {
            toast.error('Không tải được danh sách khóa thưởng');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load, reloadKey]);

    const unrestrict = async (userId) => {
        try {
            await adminForumApi.unrestrictCoinUser(userId);
            toast.success('Đã gỡ khóa thưởng');
            load();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Gỡ khóa thất bại');
        }
    };

    return (
        <>
            {admin && (
                <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'flex-end' }}>
                    <button className={styles.searchBtn} onClick={() => onRestrict({})}>
                        <Lock size={14} /> + Khóa thưởng user
                    </button>
                </div>
            )}
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Người dùng</th>
                            <th>Lý do</th>
                            <th>Hết hạn</th>
                            <th>Khóa bởi</th>
                            <th>Ngày tạo</th>
                            {admin && <th>Hành động</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={admin ? 6 : 5}><div className={styles.loading}>Đang tải…</div></td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={admin ? 6 : 5}><div className={styles.empty}>Không có user nào bị khóa thưởng</div></td></tr>
                        ) : items.map(r => (
                            <tr key={r.id}>
                                <td><UserCell userId={r.userId} userName={r.userName} userAvatar={r.userAvatar} /></td>
                                <td><div className={styles.reasonCell} title={r.reason || ''}>{r.reason || <span className={styles.muted}>—</span>}</div></td>
                                <td>
                                    {r.bannedUntil ? (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                            <Clock size={12} /> {fmtDateTime(r.bannedUntil)}
                                        </span>
                                    ) : (
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#dc2626' }}>
                                            <InfinityIcon size={12} /> Vĩnh viễn
                                        </span>
                                    )}
                                </td>
                                <td className={styles.muted}>{r.bannedBy ? `#${r.bannedBy}` : '—'}</td>
                                <td className={styles.muted}>{fmtDateTime(r.createdAt)}</td>
                                {admin && (
                                    <td>
                                        <button className={styles.btnRestore} onClick={() => unrestrict(r.userId)}>
                                            <Unlock size={13} /> Gỡ khóa
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

// ── Tab 4: Vận hành ──────────────────────────────────────────────────────────
const OpsTab = ({ admin }) => {
    const [reconcile, setReconcile] = useState(null);
    const [reconLoading, setReconLoading] = useState(false);
    const [stuck, setStuck] = useState([]);
    const [stuckLoading, setStuckLoading] = useState(false);
    const [republishing, setRepublishing] = useState(false);

    const loadReconcile = useCallback(async () => {
        setReconLoading(true);
        try {
            setReconcile(await adminForumApi.getCoinReconcile());
        } catch {
            toast.error('Không tải được dữ liệu đối soát');
        } finally {
            setReconLoading(false);
        }
    }, []);

    const loadStuck = useCallback(async () => {
        setStuckLoading(true);
        try {
            setStuck((await adminForumApi.getStuckCoinRewards()) || []);
        } catch {
            toast.error('Không tải được danh sách hàng kẹt');
        } finally {
            setStuckLoading(false);
        }
    }, []);

    useEffect(() => { loadReconcile(); loadStuck(); }, [loadReconcile, loadStuck]);

    const republish = async () => {
        setRepublishing(true);
        try {
            await adminForumApi.republishStuckCoinRewards();
            toast.success('Đã gửi lại các khoản thưởng bị kẹt');
            loadStuck();
            loadReconcile();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Gửi lại thất bại');
        } finally {
            setRepublishing(false);
        }
    };

    return (
        <>
            <h2 className={styles.sectionTitle}><Scale size={16} style={{ verticalAlign: '-2px' }} /> Đối soát forum ↔ ví coin</h2>
            <div className={styles.panel} style={{ marginBottom: 28 }}>
                {reconLoading && !reconcile ? (
                    <div className={styles.loading}>Đang tải…</div>
                ) : reconcile ? (
                    <>
                        <div className={styles.reconcileGrid}>
                            <div className={styles.reconcileItem}>
                                <div className={styles.reconcileLabel}>Forum đã cộng</div>
                                <div className={styles.reconcileValue}>{fmtNum(reconcile.forumCredited)}</div>
                            </div>
                            <div className={styles.reconcileItem}>
                                <div className={styles.reconcileLabel}>Forum đã thu hồi</div>
                                <div className={styles.reconcileValue}>{fmtNum(reconcile.forumRevoked)}</div>
                            </div>
                            <div className={styles.reconcileItem}>
                                <div className={styles.reconcileLabel}>Ví (IAM) đã cộng</div>
                                <div className={styles.reconcileValue}>{fmtNum(reconcile.iamCredited)}</div>
                            </div>
                            <div className={styles.reconcileItem}>
                                <div className={styles.reconcileLabel}>Ví (IAM) đã thu hồi</div>
                                <div className={styles.reconcileValue}>{fmtNum(reconcile.iamRevoked)}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                            {reconcile.balanced ? (
                                <span className={`${styles.balancedBadge} ${styles.balancedOk}`}>
                                    <CheckCircle2 size={15} /> Khớp ✓
                                </span>
                            ) : (
                                <span className={`${styles.balancedBadge} ${styles.balancedBad}`}>
                                    <XCircle size={15} /> Lệch — chênh cộng: {fmtNum(reconcile.creditDiff)}, chênh thu hồi: {fmtNum(reconcile.revokeDiff)}
                                </span>
                            )}
                            {reconcile.iamError && (
                                <span className={styles.muted} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#b45309' }}>
                                    <AlertTriangle size={14} /> {reconcile.iamError}
                                </span>
                            )}
                            <button className={styles.resetBtn} style={{ marginLeft: 'auto' }}
                                    onClick={loadReconcile} disabled={reconLoading}>
                                <RefreshCw size={14} /> {reconLoading ? 'Đang đối soát…' : 'Đối soát lại'}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className={styles.empty}>Không có dữ liệu đối soát</div>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                <h2 className={styles.sectionTitle} style={{ margin: 0 }}>
                    <Clock size={16} style={{ verticalAlign: '-2px' }} /> Hàng kẹt (PENDING &gt; 30 phút)
                </h2>
                {admin && stuck.length > 0 && (
                    <button className={styles.searchBtn} onClick={republish} disabled={republishing}>
                        <RotateCcw size={14} /> {republishing ? 'Đang gửi lại…' : 'Gửi lại tất cả'}
                    </button>
                )}
            </div>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Người dùng</th>
                            <th>Hành động</th>
                            <th>Coin</th>
                            <th>Lý do</th>
                            <th>Thời gian</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stuckLoading ? (
                            <tr><td colSpan={5}><div className={styles.loading}>Đang tải…</div></td></tr>
                        ) : stuck.length === 0 ? (
                            <tr><td colSpan={5}><div className={styles.empty}>Không có khoản thưởng nào bị kẹt 🎉</div></td></tr>
                        ) : stuck.map(log => (
                            <tr key={log.id}>
                                <td><UserCell userId={log.userId} userName={log.userName} userAvatar={log.userAvatar} /></td>
                                <td><ActionBadge action={log.action} /></td>
                                <td><span className={styles.coinAmount}>+{fmtNum(log.amount)}</span></td>
                                <td><div className={styles.reasonCell} title={log.reason || ''}>{log.reason || <span className={styles.muted}>—</span>}</div></td>
                                <td className={styles.muted}>{fmtDateTime(log.createdAt)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

// ── Tab 5: Nghi vấn ──────────────────────────────────────────────────────────
const RULE_LABELS = {
    CAP_STREAK: 'Chạm trần nhiều ngày',
    CROSS_LIKE: 'Like chéo',
    FOLLOW_BURST: 'Follow ảo',
    SHORT_COMMENT: 'Comment đối phó',
    FAST_MILESTONE: 'Mốc like quá nhanh',
};
const SEVERITY_LABELS = { HIGH: 'Cao', MEDIUM: 'Trung bình', LOW: 'Thấp' };
const SEVERITY_COLORS = {
    HIGH: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626' },
    MEDIUM: { bg: '#fff7ed', border: '#fed7aa', color: '#c2410c' },
    LOW: { bg: '#f1f5f9', border: '#e2e8f0', color: '#64748b' },
};
const ALERT_STATUS_COLORS = {
    NEW: { bg: '#fef3c7', border: '#fde68a', color: '#b45309' },
    RESOLVED: { bg: '#ecfdf5', border: '#a7f3d0', color: '#059669' },
};

const SeverityBadge = ({ severity }) => {
    const c = SEVERITY_COLORS[severity] || SEVERITY_COLORS.LOW;
    return (
        <span className={styles.coinBadge}
              style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
            {SEVERITY_LABELS[severity] || severity || '—'}
        </span>
    );
};

const AlertStatusBadge = ({ alert }) => {
    const c = ALERT_STATUS_COLORS[alert.status] || { bg: '#f1f5f9', border: '#e2e8f0', color: '#475569' };
    const tooltip = alert.status === 'RESOLVED' && alert.resolvedAt
        ? `Xử lý lúc ${fmtDateTime(alert.resolvedAt)}${alert.resolvedBy ? ` bởi #${alert.resolvedBy}` : ''}`
        : undefined;
    return (
        <span className={styles.coinBadge} title={tooltip}
              style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
            {alert.status === 'NEW' ? 'Mới' : alert.status === 'RESOLVED' ? 'Đã xử lý' : alert.status || '—'}
        </span>
    );
};

const AlertsTab = ({ admin, onRestrict, onNewCount }) => {
    const [items, setItems] = useState([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [newCount, setNewCount] = useState(0);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, size: PAGE_SIZE };
            if (status) params.status = status;
            const data = await adminForumApi.getCoinAlerts(params);
            setItems(data?.items || []);
            setTotalPages(data?.totalPages || 0);
            setTotalElements(data?.totalElements ?? 0);
            setNewCount(data?.newCount ?? 0);
            onNewCount?.(data?.newCount ?? 0);
        } catch {
            toast.error('Không tải được danh sách cảnh báo');
        } finally {
            setLoading(false);
        }
    }, [page, status, onNewCount]);

    useEffect(() => { load(); }, [load]);

    const scan = async () => {
        setScanning(true);
        try {
            const res = await adminForumApi.scanCoinAlerts();
            toast.success(res?.message || 'Đã quét xong');
            setPage(0);
            load();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Quét thất bại');
        } finally {
            setScanning(false);
        }
    };

    const resolve = async (alertId) => {
        try {
            await adminForumApi.resolveCoinAlert(alertId);
            toast.success('Đã đánh dấu xử lý');
            load();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Xử lý thất bại');
        }
    };

    return (
        <>
            <div className={styles.filterBar}>
                <select className={styles.filterSelect} value={status}
                        onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
                    <option value="">Tất cả</option>
                    <option value="NEW">Mới</option>
                    <option value="RESOLVED">Đã xử lý</option>
                </select>
                {newCount > 0 && (
                    <span className={styles.alertNewBadge}>
                        <ShieldAlert size={13} /> {newCount} cảnh báo mới
                    </span>
                )}
                {admin && (
                    <button className={styles.searchBtn} style={{ marginLeft: 'auto' }}
                            onClick={scan} disabled={scanning}>
                        <Radar size={14} /> {scanning ? 'Đang quét…' : 'Quét ngay'}
                    </button>
                )}
            </div>

            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Mức độ</th>
                            <th>Rule</th>
                            <th>Người dùng</th>
                            <th>Nội dung</th>
                            <th>Thời gian</th>
                            <th>Trạng thái</th>
                            {admin && <th>Thao tác</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={admin ? 7 : 6}><div className={styles.loading}>Đang tải…</div></td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={admin ? 7 : 6}><div className={styles.empty}>Không có cảnh báo nào</div></td></tr>
                        ) : items.map(a => (
                            <tr key={a.id}>
                                <td><SeverityBadge severity={a.severity} /></td>
                                <td><span className={styles.coinBadge}
                                          style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}>
                                    {RULE_LABELS[a.ruleCode] || a.ruleCode || '—'}
                                </span></td>
                                <td>
                                    <UserCell userId={a.userId} userName={a.userName} userAvatar={a.userAvatar} />
                                    {a.relatedUserName && (
                                        <div className={styles.muted} style={{ fontSize: 11.5, marginTop: 3 }}>
                                            cùng với {a.relatedUserName}
                                        </div>
                                    )}
                                </td>
                                <td><div className={styles.alertMessage}>{a.message || <span className={styles.muted}>—</span>}</div></td>
                                <td className={styles.muted}>{fmtDateTime(a.createdAt)}</td>
                                <td><AlertStatusBadge alert={a} /></td>
                                {admin && (
                                    <td>
                                        <div className={styles.rowActions}>
                                            {a.status === 'NEW' && (
                                                <button className={styles.btnGhost} title="Đánh dấu đã xử lý"
                                                        style={{ color: '#059669' }}
                                                        onClick={() => resolve(a.id)}>
                                                    <CheckCircle2 size={13} /> Đã xử lý
                                                </button>
                                            )}
                                            <button className={styles.btnGhost} title="Khóa thưởng user này"
                                                    onClick={() => onRestrict({ userId: a.userId })}>
                                                <Lock size={13} /> Khóa thưởng
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination currentPage={page} totalPages={totalPages} totalElements={totalElements} onPageChange={setPage} />
        </>
    );
};

// ── Tab 6: Cấu hình ──────────────────────────────────────────────────────────
const ConfigTab = ({ admin }) => {
    const [snapshot, setSnapshot] = useState(null);
    const [loading, setLoading] = useState(false);
    const [edited, setEdited] = useState({});
    const [saving, setSaving] = useState(false);
    const [switching, setSwitching] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            setSnapshot(await adminForumApi.getCoinConfig());
            setEdited({});
        } catch {
            toast.error('Không tải được cấu hình coin');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    if (loading && !snapshot) return <div className={styles.loading}>Đang tải…</div>;
    if (!snapshot) return <div className={styles.empty}>Không có dữ liệu cấu hình</div>;

    const enabled = !!snapshot.enabled;
    const items = (snapshot.items || []).filter(i => i.key !== 'enabled');
    const overriddenMeta = snapshot.overriddenMeta || {};

    const changedKeys = Object.keys(edited).filter(k => {
        const original = items.find(i => i.key === k)?.value;
        return String(edited[k]) !== String(original ?? '');
    });

    const toggleKillSwitch = async () => {
        if (enabled && !window.confirm('TẮT toàn bộ thưởng coin diễn đàn ngay lập tức?')) return;
        setSwitching(true);
        try {
            await adminForumApi.coinKillSwitch(!enabled);
            toast.success(enabled ? 'Đã TẮT thưởng coin diễn đàn' : 'Đã BẬT lại thưởng coin diễn đàn');
            load();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Thao tác thất bại');
        } finally {
            setSwitching(false);
        }
    };

    const save = async () => {
        if (changedKeys.length === 0) return;
        setSaving(true);
        try {
            const body = {};
            changedKeys.forEach(k => { body[k] = String(edited[k]); });
            await adminForumApi.updateCoinConfig(body);
            toast.success('Đã cập nhật cấu hình (hiệu lực ngay)');
            load();
        } catch (e) {
            toast.error(e?.response?.data?.message || 'Cập nhật cấu hình thất bại');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className={`${styles.killSwitchPanel} ${enabled ? styles.killSwitchOn : styles.killSwitchOff}`}>
                <div className={styles.killSwitchInfo}>
                    <Power size={22} />
                    <div>
                        <div className={styles.killSwitchTitle}>
                            Thưởng coin diễn đàn: {enabled
                                ? <span style={{ color: '#059669' }}>Đang BẬT</span>
                                : <span style={{ color: '#dc2626' }}>Đang TẮT</span>}
                        </div>
                        <div className={styles.killSwitchDesc}>
                            {enabled
                                ? 'Hệ thống đang phát thưởng coin bình thường.'
                                : 'Mọi hoạt động phát thưởng coin đã bị dừng.'}
                        </div>
                    </div>
                </div>
                {admin && (
                    enabled ? (
                        <button className={styles.killSwitchBtnOff} onClick={toggleKillSwitch} disabled={switching}>
                            <Power size={15} /> {switching ? 'Đang xử lý…' : 'TẮT KHẨN CẤP'}
                        </button>
                    ) : (
                        <button className={styles.killSwitchBtnOn} onClick={toggleKillSwitch} disabled={switching}>
                            <Power size={15} /> {switching ? 'Đang xử lý…' : 'Bật lại thưởng coin'}
                        </button>
                    )
                )}
            </div>

            <h2 className={styles.sectionTitle}>Tham số thưởng coin</h2>
            <div className={styles.panel}>
                {items.map(item => {
                    const meta = overriddenMeta[item.key];
                    const value = edited[item.key] !== undefined ? edited[item.key] : (item.value ?? '');
                    return (
                        <div key={item.key} className={styles.configRow}>
                            <div className={styles.configLabel}>
                                {item.label || item.key}
                                <div className={styles.muted} style={{ fontWeight: 400, fontSize: 11 }}>{item.key}</div>
                            </div>
                            <input type="number" className={styles.configInput}
                                   value={value} disabled={!admin}
                                   onChange={(e) => setEdited({ ...edited, [item.key]: e.target.value })} />
                            {item.overridden && (
                                <span className={styles.overriddenBadge}
                                      title={meta ? `Bởi #${meta.updatedBy} lúc ${fmtDateTime(meta.updatedAt)}` : undefined}>
                                    Đã ghi đè
                                </span>
                            )}
                        </div>
                    );
                })}
                {admin && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                        <button className={styles.searchBtn} onClick={save}
                                disabled={saving || changedKeys.length === 0}>
                            <Save size={14} /> {saving ? 'Đang lưu…' : `Lưu thay đổi${changedKeys.length ? ` (${changedKeys.length})` : ''}`}
                        </button>
                    </div>
                )}
                <p className={styles.configNote}>
                    Giá trị mặc định lấy từ application.yml; thay đổi ở đây có hiệu lực ngay và được giữ qua restart.
                </p>
            </div>
        </>
    );
};

// ── Trang chính ──────────────────────────────────────────────────────────────
const TABS = [
    { key: 'overview', label: 'Tổng quan' },
    { key: 'logs', label: 'Lịch sử thưởng' },
    { key: 'restrictions', label: 'Khóa thưởng' },
    { key: 'ops', label: 'Vận hành' },
    { key: 'alerts', label: 'Nghi vấn' },
    { key: 'config', label: 'Cấu hình' },
];

const AdminCoinManagement = () => {
    const [tab, setTab] = useState('overview');
    const [restrictModal, setRestrictModal] = useState(null); // { userId? }
    const [restrictionsReload, setRestrictionsReload] = useState(0);
    const [alertNewCount, setAlertNewCount] = useState(0);
    const admin = isAdmin();

    const openRestrict = (initial) => setRestrictModal(initial || {});

    return (
        <div className={styles.page}>
            <ForumBreadcrumb items={[
                { label: 'Forum', to: '/admin/forum' },
                { label: 'Coin diễn đàn' },
            ]} />
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Coin diễn đàn</h1>
                    <p className={styles.pageSubtitle}>
                        Theo dõi coin thưởng từ hoạt động diễn đàn — thống kê, lịch sử, khóa thưởng và vận hành
                    </p>
                </div>
            </div>

            <div className={styles.tabBar}>
                {TABS.map(t => (
                    <button key={t.key}
                            className={`${styles.quickTab} ${tab === t.key ? styles.quickTabActive : ''}`}
                            onClick={() => setTab(t.key)}>
                        {t.label}
                        {t.key === 'alerts' && alertNewCount > 0 && (
                            <span className={styles.tabDot}>{alertNewCount}</span>
                        )}
                    </button>
                ))}
            </div>

            {tab === 'overview' && <OverviewTab admin={admin} onRestrict={openRestrict} />}
            {tab === 'logs' && <LogsTab admin={admin} onRestrict={openRestrict} />}
            {tab === 'restrictions' && (
                <RestrictionsTab admin={admin} onRestrict={openRestrict} reloadKey={restrictionsReload} />
            )}
            {tab === 'ops' && <OpsTab admin={admin} />}
            {tab === 'alerts' && (
                <AlertsTab admin={admin} onRestrict={openRestrict} onNewCount={setAlertNewCount} />
            )}
            {tab === 'config' && <ConfigTab admin={admin} />}

            {restrictModal && (
                <RestrictModal
                    initial={restrictModal}
                    onClose={() => setRestrictModal(null)}
                    onDone={() => {
                        setRestrictModal(null);
                        setRestrictionsReload(k => k + 1);
                    }}
                />
            )}
        </div>
    );
};

export default AdminCoinManagement;
