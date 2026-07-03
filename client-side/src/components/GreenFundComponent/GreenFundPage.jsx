import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TreePine, Leaf, Sprout, Users, Heart, Trophy,
    MapPin, CalendarDays, Share2, Download, Coins, TreeDeciduous,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { getGreenFundDashboardApi, getMyGreenFundApi } from '../../services/greenFund.ts';
import GreenFundDonateModal from './GreenFundDonateModal';
import styles from './GreenFundPage.module.scss';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtVnd = (n) => `${Number(n || 0).toLocaleString('vi-VN')}đ`;
const fmtNum = (n) => Number(n || 0).toLocaleString('vi-VN');

const fmtDate = (s) => {
    if (!s) return '';
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString('vi-VN');
};

const timeAgo = (s) => {
    if (!s) return 'Vừa xong';
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    return d.toLocaleDateString('vi-VN');
};

const SOURCE_LABELS = { BOOKING: 'từ chuyến đi', DONATION: 'quyên góp' };

// ── Count-up hook (animation số chạy khi mount) ──────────────────────────────
const useCountUp = (target, duration = 1500) => {
    const [value, setValue] = useState(0);
    const started = useRef(false);

    useEffect(() => {
        const end = Number(target || 0);
        if (!end) { setValue(end); return undefined; }
        if (started.current && value === end) return undefined;
        started.current = true;

        const steps = 40;
        const stepTime = Math.max(duration / steps, 20);
        let current = 0;
        const increment = end / steps;
        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                setValue(end);
                clearInterval(timer);
            } else {
                setValue(Math.floor(current));
            }
        }, stepTime);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target, duration]);

    return value;
};

const CountUpNumber = ({ value, suffix }) => {
    const display = useCountUp(value);
    return <span>{fmtNum(display)}{suffix}</span>;
};

// ── Chứng nhận PNG bằng canvas (không cần lib ngoài) ─────────────────────────
const downloadCertificate = ({ userName, trees, badge }) => {
    const W = 1000;
    const H = 700;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // Nền gradient xanh
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#166534');
    grad.addColorStop(0.55, '#16a34a');
    grad.addColorStop(1, '#86efac');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Khung trắng bên trong
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    const pad = 46;
    ctx.fillRect(pad, pad, W - pad * 2, H - pad * 2);

    // Viền kép
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 4;
    ctx.strokeRect(pad + 14, pad + 14, W - (pad + 14) * 2, H - (pad + 14) * 2);
    ctx.strokeStyle = '#86efac';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pad + 24, pad + 24, W - (pad + 24) * 2, H - (pad + 24) * 2);

    ctx.textAlign = 'center';

    // Cây trang trí góc
    ctx.font = '40px serif';
    ctx.fillText('🌿', pad + 70, pad + 84);
    ctx.fillText('🌿', W - pad - 70, pad + 84);
    ctx.fillText('🌱', pad + 70, H - pad - 56);
    ctx.fillText('🌱', W - pad - 70, H - pad - 56);

    // Tiêu đề
    ctx.fillStyle = '#166534';
    ctx.font = 'bold 46px Georgia, serif';
    ctx.fillText('CHỨNG NHẬN ĐÓNG GÓP', W / 2, 180);

    ctx.fillStyle = '#16a34a';
    ctx.font = '22px Georgia, serif';
    ctx.fillText('— Quỹ Trồng Cây Xanh Futuretravel —', W / 2, 222);

    // Icon cây lớn
    ctx.font = '76px serif';
    ctx.fillText('🌳', W / 2, 320);

    // Nội dung
    ctx.fillStyle = '#14532d';
    ctx.font = 'bold 34px Georgia, serif';
    ctx.fillText(userName || 'Bạn', W / 2, 392);

    ctx.fillStyle = '#334155';
    ctx.font = '24px Georgia, serif';
    ctx.fillText(`đã góp trồng ${fmtNum(trees)} cây xanh cùng Futuretravel`, W / 2, 436);

    // Badge
    if (badge?.name) {
        ctx.fillStyle = '#15803d';
        ctx.font = 'bold 26px Georgia, serif';
        ctx.fillText(`${badge.icon || '🌱'}  ${badge.name}`, W / 2, 496);
    }

    // Ngày cấp
    ctx.fillStyle = '#64748b';
    ctx.font = '18px Georgia, serif';
    ctx.fillText(
        `Ngày cấp: ${new Date().toLocaleDateString('vi-VN')}`,
        W / 2,
        badge?.name ? 548 : 510
    );

    ctx.fillStyle = '#16a34a';
    ctx.font = 'italic 18px Georgia, serif';
    ctx.fillText('Mỗi chuyến đi — một mầm xanh cho Việt Nam', W / 2, H - pad - 60);

    // Tải về
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `chung-nhan-quy-xanh-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
};

// ── Component con: hàng leaderboard ─────────────────────────────────────────
const LeaderboardSection = ({ data, dataMonth }) => {
    const [period, setPeriod] = useState('all');
    const list = (period === 'all' ? data : dataMonth) || [];
    const top3 = list.slice(0, 3);
    const rest = list.slice(3);
    // Podium: hạng 2 - hạng 1 - hạng 3 (giữa cao nhất)
    const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);
    const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };

    return (
        <section className={styles.section}>
            <div className={styles.sectionHead}>
                <h2 className={styles.sectionTitle}><Trophy size={22} /> Bảng vàng người gieo mầm</h2>
                <div className={styles.lbTabs}>
                    <button
                        type="button"
                        className={`${styles.lbTab} ${period === 'all' ? styles.lbTabActive : ''}`}
                        onClick={() => setPeriod('all')}
                    >
                        Tất cả
                    </button>
                    <button
                        type="button"
                        className={`${styles.lbTab} ${period === 'month' ? styles.lbTabActive : ''}`}
                        onClick={() => setPeriod('month')}
                    >
                        Tháng này
                    </button>
                </div>
            </div>

            {list.length === 0 ? (
                <p className={styles.emptyText}>Chưa có ai trên bảng vàng — hãy là người đầu tiên 🌱</p>
            ) : (
                <>
                    <div className={styles.podium}>
                        {podiumOrder.map((entry) => (
                            <div
                                key={entry.rank}
                                className={`${styles.podiumCard} ${entry.rank === 1 ? styles.podiumFirst : ''}`}
                            >
                                <span className={styles.podiumMedal}>{medals[entry.rank] || `#${entry.rank}`}</span>
                                <span className={styles.podiumName}>
                                    {entry.badge?.icon && <span className={styles.podiumBadgeIcon}>{entry.badge.icon}</span>}
                                    {entry.userName || `Người dùng #${entry.userId}`}
                                </span>
                                <span className={styles.podiumTrees}>{fmtNum(entry.trees)} cây 🌳</span>
                                <span className={styles.podiumMeta}>{fmtNum(entry.contributionCount)} lượt góp</span>
                            </div>
                        ))}
                    </div>

                    {rest.length > 0 && (
                        <div className={styles.lbTableWrap}>
                            <table className={styles.lbTable}>
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Thành viên</th>
                                        <th>Số cây</th>
                                        <th>Lượt góp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rest.map((entry) => (
                                        <tr key={entry.rank}>
                                            <td className={styles.lbRank}>{entry.rank}</td>
                                            <td>
                                                {entry.badge?.icon && <span className={styles.lbBadgeIcon} title={entry.badge.name}>{entry.badge.icon}</span>}
                                                {entry.userName || `Người dùng #${entry.userId}`}
                                            </td>
                                            <td className={styles.lbTrees}>{fmtNum(entry.trees)} 🌱</td>
                                            <td>{fmtNum(entry.contributionCount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </section>
    );
};

// ── Trang chính ──────────────────────────────────────────────────────────────
const GreenFundPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const userId = user?.id || user?.userId || user?.userID;

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mine, setMine] = useState(null);
    const [donateOpen, setDonateOpen] = useState(false);

    const loadDashboard = () => {
        getGreenFundDashboardApi()
            .then((data) => setDashboard(data))
            .catch(() => setDashboard(null))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    useEffect(() => {
        if (!userId) { setMine(null); return; }
        getMyGreenFundApi(userId)
            .then((data) => setMine(data))
            .catch(() => setMine(null));
    }, [userId]);

    const goal = dashboard?.goal;
    const goalPercent = Math.max(0, Math.min(100, Number(goal?.percent || 0)));
    const batches = dashboard?.batches || [];
    const recent = dashboard?.recentContributions || [];

    const handleDonateClosed = () => {
        setDonateOpen(false);
        // refresh số liệu sau khi góp
        loadDashboard();
        if (userId) {
            getMyGreenFundApi(userId).then((d) => setMine(d)).catch(() => {});
        }
    };

    const handleCertificate = () => {
        if (!mine || !Number(mine.trees)) {
            toast.info('Bạn chưa có cây nào — góp ngay để nhận chứng nhận 🌱');
            return;
        }
        downloadCertificate({
            userName: user?.fullName || user?.username || 'Bạn',
            trees: mine.trees,
            badge: mine.badge,
        });
        toast.success('Đã tải chứng nhận của bạn 🌳');
    };

    return (
        <div className={styles.page}>
            {/* ── 1. HERO ───────────────────────────────────────────────── */}
            <section className={styles.hero}>
                <span className={`${styles.floatLeaf} ${styles.leaf1}`}>🍃</span>
                <span className={`${styles.floatLeaf} ${styles.leaf2}`}>🌿</span>
                <span className={`${styles.floatLeaf} ${styles.leaf3}`}>🍃</span>
                <span className={`${styles.floatLeaf} ${styles.leaf4}`}>🌱</span>
                <span className={`${styles.floatLeaf} ${styles.leaf5}`}>🌿</span>

                <h1 className={styles.heroTitle}>🌳 Quỹ Trồng Cây Xanh</h1>
                <p className={styles.heroSubtitle}>Mỗi chuyến đi — một mầm xanh cho Việt Nam</p>

                <div className={styles.heroStats}>
                    <div className={styles.heroStat}>
                        <TreePine size={26} className={styles.heroStatIcon} />
                        <strong className={styles.heroStatValue}>
                            <CountUpNumber value={dashboard?.treesPlanted} />
                        </strong>
                        <span className={styles.heroStatLabel}>cây đã trồng</span>
                    </div>
                    <div className={styles.heroStat}>
                        <Users size={26} className={styles.heroStatIcon} />
                        <strong className={styles.heroStatValue}>
                            <CountUpNumber value={dashboard?.totalContributors} />
                        </strong>
                        <span className={styles.heroStatLabel}>người chung tay</span>
                    </div>
                    <div className={styles.heroStat}>
                        <Heart size={26} className={styles.heroStatIcon} />
                        <strong className={styles.heroStatValue}>
                            <CountUpNumber value={dashboard?.totalFundRaised} suffix="đ" />
                        </strong>
                        <span className={styles.heroStatLabel}>đã gom vào quỹ</span>
                    </div>
                </div>

                <button type="button" className={styles.heroCta} onClick={() => setDonateOpen(true)}>
                    Góp trồng cây ngay 🌱
                </button>
            </section>

            <div className={styles.container}>
                {loading ? (
                    <div className={styles.loadingState}>Đang tải dữ liệu Quỹ Xanh... 🌿</div>
                ) : (
                    <>
                        {/* ── 2. GOAL PROGRESS ─────────────────────────── */}
                        {goal && (
                            <section className={`${styles.section} ${styles.goalCard}`}>
                                <h2 className={styles.goalLabel}><Sprout size={20} /> {goal.label}</h2>
                                <div className={styles.progressTrack}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${goalPercent}%` }}
                                    >
                                        {goalPercent >= 12 && <span>{goalPercent}%</span>}
                                    </div>
                                </div>
                                <p className={styles.goalCount}>
                                    {fmtNum(goal.currentTrees)} / {fmtNum(goal.targetTrees)} cây 🌳
                                </p>
                                <p className={styles.goalCaption}>
                                    Cứ {fmtVnd(dashboard?.costPerTree || 1000)} quỹ = 1 cây xanh.{' '}
                                    {Number(dashboard?.bookingContributionPercent || 0)}% mỗi booking được trích vào quỹ.
                                </p>
                            </section>
                        )}

                        {/* ── 3. MY CONTRIBUTION ───────────────────────── */}
                        {userId && mine && (
                            <section className={`${styles.section} ${styles.myCard}`}>
                                <h2 className={styles.sectionTitle}><Heart size={22} /> Đóng góp của tôi</h2>
                                <div className={styles.myBody}>
                                    <div className={styles.myTreeBlock}>
                                        <span className={styles.myTreeCount}>{fmtNum(mine.trees)}</span>
                                        <span className={styles.myTreeLabel}>cây xanh 🌳</span>
                                        <span className={styles.myVnd}>{fmtVnd(mine.totalVnd)} · {fmtNum(mine.donationCount)} lượt góp</span>
                                    </div>

                                    <div className={styles.myBadgeBlock}>
                                        {mine.badge ? (
                                            <>
                                                <span className={styles.myBadgeIcon}>{mine.badge.icon}</span>
                                                <span className={styles.myBadgeName}>{mine.badge.name}</span>
                                            </>
                                        ) : (
                                            <span className={styles.myBadgeNone}>Chưa có danh hiệu — góp 1 cây để nhận 🌱 Mầm xanh</span>
                                        )}
                                        {mine.nextBadge && (
                                            <span className={styles.myNextBadge}>
                                                Còn <strong>{fmtNum(mine.nextBadge.remaining)}</strong> cây nữa để đạt{' '}
                                                {mine.nextBadge.icon} {mine.nextBadge.name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.myActions}>
                                    <button type="button" className={styles.certBtn} onClick={handleCertificate}>
                                        <Download size={16} /> Tải chứng nhận 🖼️
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.shareBtn}
                                        onClick={() => navigate('/forum')}
                                    >
                                        <Share2 size={16} /> Chia sẻ lên diễn đàn
                                    </button>
                                </div>
                            </section>
                        )}

                        {/* ── 4. LEADERBOARD ───────────────────────────── */}
                        <LeaderboardSection
                            data={dashboard?.leaderboard}
                            dataMonth={dashboard?.leaderboardMonth}
                        />

                        {/* ── 5. PLANTING BATCHES ──────────────────────── */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}><TreeDeciduous size={22} /> Những cánh rừng đã trồng 🌲</h2>
                            {batches.length === 0 ? (
                                <p className={styles.emptyText}>Đợt trồng đầu tiên đang được chuẩn bị... 🌱</p>
                            ) : (
                                <div className={styles.batchGrid}>
                                    {batches.map((batch) => (
                                        <article key={batch.id} className={styles.batchCard}>
                                            {batch.imageUrl ? (
                                                <img
                                                    className={styles.batchImage}
                                                    src={batch.imageUrl}
                                                    alt={batch.location}
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        const fb = e.currentTarget.nextElementSibling;
                                                        if (fb) fb.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div
                                                className={styles.batchImageFallback}
                                                style={{ display: batch.imageUrl ? 'none' : 'flex' }}
                                            >
                                                🌳
                                            </div>
                                            <div className={styles.batchBody}>
                                                <h3 className={styles.batchLocation}><MapPin size={15} /> {batch.location}</h3>
                                                <p className={styles.batchMeta}>
                                                    <CalendarDays size={14} /> {fmtDate(batch.plantedDate)}
                                                    <span className={styles.batchTrees}>🌱 {fmtNum(batch.treeCount)} cây</span>
                                                </p>
                                                {batch.note && <p className={styles.batchNote}>{batch.note}</p>}
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* ── 6. RECENT CONTRIBUTIONS ──────────────────── */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}><Leaf size={22} /> Đóng góp gần đây 💚</h2>
                            {recent.length === 0 ? (
                                <p className={styles.emptyText}>Chưa có đóng góp nào — hãy là người mở màn 💚</p>
                            ) : (
                                <ul className={styles.feedList}>
                                    {recent.map((item, idx) => (
                                        <li key={idx} className={styles.feedItem}>
                                            <span className={styles.feedIcon}>
                                                {item.source === 'BOOKING' ? '✈️' : '💚'}
                                            </span>
                                            <span className={styles.feedText}>
                                                <strong>{item.userName || 'Một người bạn ẩn danh'}</strong>{' '}
                                                {Number(item.trees) > 0
                                                    ? <span className={styles.feedTrees}>+{fmtNum(item.trees)} cây</span>
                                                    : <span className={styles.feedTrees}>+{fmtVnd(item.amountVnd)}</span>}{' '}
                                                <span className={styles.feedSource}>{SOURCE_LABELS[item.source] || ''}</span>
                                            </span>
                                            <span className={styles.feedTime}>{timeAgo(item.createdAt)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        {/* ── 7. HOW IT WORKS ──────────────────────────── */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}><Sprout size={22} /> Quỹ Xanh hoạt động thế nào?</h2>
                            <div className={styles.stepsRow}>
                                <div className={styles.stepCard}>
                                    <span className={styles.stepNumber}>1</span>
                                    <span className={styles.stepEmoji}>🧳</span>
                                    <h3>Đặt tour hoặc góp coin</h3>
                                    <p>Mỗi booking tự động trích một phần vào quỹ, hoặc bạn góp coin trực tiếp.</p>
                                </div>
                                <span className={styles.stepArrow}>→</span>
                                <div className={styles.stepCard}>
                                    <span className={styles.stepNumber}>2</span>
                                    <span className={styles.stepEmoji}>💰</span>
                                    <h3>Quỹ tích lũy minh bạch</h3>
                                    <p>Toàn bộ đóng góp được ghi nhận công khai, theo dõi theo thời gian thực.</p>
                                </div>
                                <span className={styles.stepArrow}>→</span>
                                <div className={styles.stepCard}>
                                    <span className={styles.stepNumber}>3</span>
                                    <span className={styles.stepEmoji}>🌳</span>
                                    <h3>Trồng cây thật</h3>
                                    <p>Cây được trồng tại các điểm du lịch, có ảnh và địa điểm cụ thể từng đợt.</p>
                                </div>
                            </div>
                        </section>

                        {/* CTA cuối trang */}
                        <section className={styles.bottomCta}>
                            <p>Sẵn sàng gieo mầm xanh tiếp theo? 🌱</p>
                            <button type="button" className={styles.heroCta} onClick={() => setDonateOpen(true)}>
                                <Coins size={18} /> Góp trồng cây ngay
                            </button>
                        </section>
                    </>
                )}
            </div>

            <GreenFundDonateModal isOpen={donateOpen} onClose={handleDonateClosed} />
        </div>
    );
};

export default GreenFundPage;
