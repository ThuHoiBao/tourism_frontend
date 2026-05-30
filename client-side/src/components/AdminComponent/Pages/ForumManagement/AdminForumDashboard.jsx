import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FileText, Clock, EyeOff, MessageSquare, FileEdit, ShieldCheck, Trash2, History, Flag, UserX, Download, AlertTriangle, Brain } from 'lucide-react';
import { isAdmin } from '../../../../services/forum/adminRole';
import adminForumApi from '../../../../services/forum/adminForumApi';
import StatusBadge from './shared/StatusBadge';
import ModerationBadge from './shared/ModerationBadge';
import styles from './ForumManagement.module.scss';

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

const BarList = ({ data }) => {
    const max = Math.max(1, ...data.map(d => d.count));
    return (
        <div>
            {data.length === 0 && <div className={styles.empty}>Không có dữ liệu</div>}
            {data.map(d => (
                <div className={styles.barRow} key={d.label}>
                    <span className={styles.barLabel}>{d.label}</span>
                    <span className={styles.barTrack}>
                        <span className={styles.barFill} style={{ width: `${(d.count / max) * 100}%` }} />
                    </span>
                    <span className={styles.barValue}>{d.count}</span>
                </div>
            ))}
        </div>
    );
};

const AdminForumDashboard = () => {
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [queue, setQueue] = useState([]);

    // Export CSV: default 30 ngày qua
    const today = new Date().toISOString().slice(0, 10);
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const [exportFrom, setExportFrom] = useState(monthAgo);
    const [exportTo, setExportTo] = useState(today);
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            await adminForumApi.exportModerationCsv({ from: exportFrom, to: exportTo });
            toast.success('Đã tải file CSV');
        } catch {
            toast.error('Xuất CSV thất bại');
        } finally { setExporting(false); }
    };

    useEffect(() => {
        adminForumApi.getStats().then(setStats).catch(() => {});
        adminForumApi.getAnalytics().then(setAnalytics).catch(() => {});
        adminForumApi.getPosts({ status: 'PENDING_REVIEW', page: 0, size: 5 })
            .then(d => setQueue(d?.content || [])).catch(() => {});
    }, []);

    const daily = (analytics?.postsLast30Days || []).map(d => ({
        label: (d.date || '').slice(5), count: d.count,
    }));
    const topCategories = (analytics?.topCategories || []).map(c => ({ label: c.name, count: c.count }));
    const topTags = (analytics?.topTags || []).map(t => ({ label: t.name, count: t.count }));
    const moderation = Object.entries(analytics?.moderationDistribution || {})
        .map(([label, count]) => ({ label, count }));

    return (
        <div className={styles.page}>
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Tổng quan diễn đàn</h1>
                    <p className={styles.pageSubtitle}>Thống kê và hàng đợi kiểm duyệt</p>
                </div>
                <div style={{ display: 'flex', gap: 10, position: 'relative', flexWrap: 'wrap' }}>
                    <Link to="/admin/forum/posts" className={styles.searchBtn}>
                        <FileEdit size={15} /> Quản lý bài viết
                    </Link>
                    <Link to="/admin/forum/comments" className={styles.resetBtn}>
                        <ShieldCheck size={15} /> Kiểm duyệt bình luận
                    </Link>
                    <Link to="/admin/forum/audit-log" className={styles.resetBtn}>
                        <History size={15} /> Nhật ký
                    </Link>
                    <Link to="/admin/forum/reports" className={styles.resetBtn}>
                        <Flag size={15} /> Báo cáo
                    </Link>
                    {isAdmin() && (
                        <Link to="/admin/forum/banned-users" className={styles.resetBtn}>
                            <UserX size={15} /> Bị hạn chế
                        </Link>
                    )}
                    <Link to="/admin/forum/trash" className={styles.resetBtn}>
                        <Trash2 size={15} /> Thùng rác
                    </Link>
                </div>
            </div>

            {/* Export CSV bar */}
            <div className={styles.exportBar}>
                <span className={styles.exportLabel}>
                    <Download size={14} /> Xuất CSV nhật ký kiểm duyệt
                </span>
                <input type="date" className={styles.dateInput}
                       value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} />
                <span className={styles.muted}>→</span>
                <input type="date" className={styles.dateInput}
                       value={exportTo} onChange={(e) => setExportTo(e.target.value)} />
                <button className={styles.searchBtn} onClick={handleExport} disabled={exporting}>
                    <Download size={14} /> {exporting ? 'Đang xuất…' : 'Tải CSV'}
                </button>
            </div>

            <div className={styles.statGrid}>
                <StatCard icon={FileText} label="Tổng bài viết" value={stats?.totalPosts} color="#1a73e8" bg="#eff6ff" />
                <StatCard icon={Clock} label="Chờ duyệt" value={stats?.pendingPosts} color="#7c3aed" bg="#f5f3ff" />
                <StatCard icon={EyeOff} label="Đã ẩn" value={stats?.hiddenPosts} color="#dc2626" bg="#fef2f2" />
                <StatCard icon={MessageSquare} label="Tổng bình luận" value={stats?.totalComments} color="#059669" bg="#ecfdf5" />
            </div>

            <h2 className={styles.sectionTitle}>Hàng đợi kiểm duyệt</h2>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr><th>Tiêu đề</th><th>Tác giả</th><th>Trạng thái</th><th>AI</th><th>Ngày</th><th></th></tr>
                    </thead>
                    <tbody>
                        {queue.length === 0 ? (
                            <tr><td colSpan={6}><div className={styles.empty}>Không có mục chờ duyệt</div></td></tr>
                        ) : queue.map(p => (
                            <tr key={p.postID}>
                                <td className={styles.titleCell}>{p.title}</td>
                                <td>{p.authorName || <span className={styles.muted}>#{p.authorId}</span>}</td>
                                <td><StatusBadge status={p.status} /></td>
                                <td><ModerationBadge score={p.moderationScore} label={p.moderationLabel} /></td>
                                <td className={styles.muted}>{(p.createdAt || '').slice(0, 10)}</td>
                                <td><Link to="/admin/forum/posts">Xử lý →</Link></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className={styles.analyticsGrid}>
                <div className={styles.analyticsBlock}>
                    <h2 className={styles.sectionTitle}>Bài viết 30 ngày qua</h2>
                    <div className={styles.panel}><BarList data={daily} /></div>
                </div>
                <div className={styles.analyticsBlock}>
                    <h2 className={styles.sectionTitle}>Phân bố kiểm duyệt AI</h2>
                    <div className={styles.panel}><BarList data={moderation} /></div>
                </div>
                <div className={styles.analyticsBlock}>
                    <h2 className={styles.sectionTitle}>Top danh mục</h2>
                    <div className={styles.panel}><BarList data={topCategories} /></div>
                </div>
                <div className={styles.analyticsBlock}>
                    <h2 className={styles.sectionTitle}>Top thẻ</h2>
                    <div className={styles.panel}><BarList data={topTags} /></div>
                </div>

                {/* Sprint 5: AI Accuracy */}
                <div className={styles.analyticsBlock}>
                    <h2 className={styles.sectionTitle}><Brain size={16} style={{ verticalAlign: '-2px' }} /> Độ chính xác AI (30 ngày)</h2>
                    <div className={styles.panel}>
                        {analytics?.aiAccuracy?.totalFlagged > 0 ? (
                            <div className={styles.aiAccuracy}>
                                <div className={styles.aiPrecision}>
                                    <span className={styles.aiPrecisionValue}>
                                        {analytics.aiAccuracy.precisionPercent ?? '—'}%
                                    </span>
                                    <span className={styles.aiPrecisionLabel}>Precision (AI đúng / AI flag)</span>
                                </div>
                                <div className={styles.aiBreakdown}>
                                    <div><strong>{analytics.aiAccuracy.totalFlagged}</strong> bài AI gắn cờ</div>
                                    <div className={styles.aiConfirmed}>
                                        ✓ <strong>{analytics.aiAccuracy.confirmedByAdmin}</strong> admin giữ ẩn (AI đúng)
                                    </div>
                                    <div className={styles.aiOverruled}>
                                        ✗ <strong>{analytics.aiAccuracy.overruledByAdmin}</strong> admin duyệt lại (AI sai)
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.empty}>Chưa có dữ liệu AI flag</div>
                        )}
                    </div>
                </div>

                {/* Sprint 5: Top vi phạm */}
                <div className={styles.analyticsBlock}>
                    <h2 className={styles.sectionTitle}><AlertTriangle size={16} style={{ verticalAlign: '-2px' }} /> Top người dùng vi phạm (30 ngày)</h2>
                    <div className={styles.panel}>
                        {(analytics?.topViolators?.length || 0) === 0 ? (
                            <div className={styles.empty}>Chưa có vi phạm nào</div>
                        ) : (
                            <table className={styles.table}>
                                <thead>
                                    <tr><th>Người dùng</th><th>Email</th><th>Số vi phạm</th></tr>
                                </thead>
                                <tbody>
                                    {analytics.topViolators.map(v => (
                                        <tr key={v.userId}>
                                            <td className={styles.titleCell}>{v.userName || `#${v.userId}`}</td>
                                            <td className={styles.muted}>{v.userEmail || '—'}</td>
                                            <td><strong style={{ color: '#dc2626' }}>{v.violationCount}</strong></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminForumDashboard;
