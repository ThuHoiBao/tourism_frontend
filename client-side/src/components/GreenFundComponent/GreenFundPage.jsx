import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TreePine, Leaf, Sprout, Users, Heart, Trophy,
    MapPin, CalendarDays, Share2, Download, Coins, TreeDeciduous,
    Globe, Medal, Award, Crown, Plane, Luggage, Wallet, HeartHandshake,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { getGreenFundDashboardApi, getMyGreenFundApi } from '../../services/greenFund.ts';
import GreenFundDonateModal from './GreenFundDonateModal';
import styles from './GreenFundPage.module.scss';

// ── Ảnh thật (Unsplash) minh họa rừng & trồng cây xanh ───────────────────────
const IMG = {
    heroBg: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80',
    gallery: [
        { url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=640&q=80', caption: 'Nắng xuyên tán rừng' },
        { url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=640&q=80', caption: 'Đồi xanh bát ngát' },
        { url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=640&q=80', caption: 'Lối mòn giữa rừng' },
        { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=640&q=80', caption: 'Rừng sương ban mai' },
    ],
    steps: [
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=520&q=80',
        'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&w=520&q=80',
        'https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?auto=format&fit=crop&w=520&q=80',
    ],
};

const hideOnError = (e) => { e.currentTarget.style.display = 'none'; };

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

// ── Huy hiệu hạng (icon thay cho emoji 🥇🥈🥉) ───────────────────────────────
const RankMedal = ({ rank }) => {
    if (rank === 1) return <Trophy size={38} className={styles.medalGold} />;
    if (rank === 2) return <Medal size={32} className={styles.medalSilver} />;
    if (rank === 3) return <Award size={32} className={styles.medalBronze} />;
    return <span className={styles.rankNum}>#{rank}</span>;
};

// ── Component con: hàng leaderboard ─────────────────────────────────────────
const LeaderboardSection = ({ data, dataMonth }) => {
    const [period, setPeriod] = useState('all');
    const list = (period === 'all' ? data : dataMonth) || [];
    const top3 = list.slice(0, 3);
    const rest = list.slice(3);
    // Podium: hạng 2 - hạng 1 - hạng 3 (giữa cao nhất)
    const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

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
                <p className={styles.emptyText}>
                    <Sprout size={16} className={styles.inlineIcon} /> Chưa có ai trên bảng vàng — hãy là người đầu tiên
                </p>
            ) : (
                <>
                    <div className={styles.podium}>
                        {podiumOrder.map((entry) => (
                            <div
                                key={entry.rank}
                                className={`${styles.podiumCard} ${entry.rank === 1 ? styles.podiumFirst : ''}`}
                            >
                                {entry.rank === 1 && <Crown size={24} className={styles.podiumCrown} />}
                                <span className={styles.podiumMedal}><RankMedal rank={entry.rank} /></span>
                                <span className={styles.podiumName}>
                                    {entry.badge?.icon && <span className={styles.podiumBadgeIcon}>{entry.badge.icon}</span>}
                                    {entry.userName || `Người dùng #${entry.userId}`}
                                </span>
                                <span className={styles.podiumTrees}>
                                    {fmtNum(entry.trees)} cây <TreePine size={15} className={styles.inlineIcon} />
                                </span>
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
                                            <td className={styles.lbTrees}>{fmtNum(entry.trees)} <Sprout size={14} className={styles.inlineIcon} /></td>
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
            toast.info('Bạn chưa có cây nào — góp ngay để nhận chứng nhận');
            return;
        }
        downloadCertificate({
            userName: user?.fullName || user?.username || 'Bạn',
            trees: mine.trees,
            badge: mine.badge,
        });
        toast.success('Đã tải chứng nhận của bạn');
    };

    return (
        <div className={styles.page}>
            {/* ── 1. HERO ───────────────────────────────────────────────── */}
            <section className={styles.hero}>
                <div
                    className={styles.heroBg}
                    style={{ backgroundImage: `url(${IMG.heroBg})` }}
                    aria-hidden="true"
                />
                <div className={styles.heroOverlay} aria-hidden="true" />

                <span className={`${styles.floatLeaf} ${styles.leaf1}`}><Leaf size={30} /></span>
                <span className={`${styles.floatLeaf} ${styles.leaf2}`}><Sprout size={40} /></span>
                <span className={`${styles.floatLeaf} ${styles.leaf3}`}><Leaf size={26} /></span>
                <span className={`${styles.floatLeaf} ${styles.leaf4}`}><Sprout size={28} /></span>
                <span className={`${styles.floatLeaf} ${styles.leaf5}`}><TreePine size={30} /></span>

                <div className={styles.heroInner}>
                    <h1 className={styles.heroTitle}>
                        <TreePine size={46} className={styles.heroTitleIcon} /> Quỹ Trồng Cây Xanh
                    </h1>
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
                        <Sprout size={19} /> Góp trồng cây ngay
                    </button>
                </div>

                <div className={styles.heroWave} aria-hidden="true">
                    <svg viewBox="0 0 1440 90" preserveAspectRatio="none">
                        <path d="M0,48 C240,90 480,10 720,40 C960,70 1200,20 1440,50 L1440,90 L0,90 Z" fill="currentColor" />
                    </svg>
                </div>
            </section>

            <div className={styles.container}>
                {loading ? (
                    <div className={styles.loadingState}>
                        <Leaf size={18} className={styles.inlineIcon} /> Đang tải dữ liệu Quỹ Xanh...
                    </div>
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
                                    {fmtNum(goal.currentTrees)} / {fmtNum(goal.targetTrees)} cây{' '}
                                    <TreePine size={17} className={styles.inlineIcon} />
                                </p>
                                <p className={styles.goalCaption}>
                                    Cứ {fmtVnd(dashboard?.costPerTree || 1000)} quỹ = 1 cây xanh.{' '}
                                    {Number(dashboard?.bookingContributionPercent || 0)}% mỗi booking được trích vào quỹ.
                                </p>
                            </section>
                        )}

                        {/* ── GALLERY: cảm hứng phủ xanh ───────────────── */}
                        <section className={`${styles.section} ${styles.gallerySection}`}>
                            <h2 className={styles.sectionTitle}><Globe size={22} /> Cùng phủ xanh Việt Nam</h2>
                            <p className={styles.gallerySub}>
                                Mỗi đóng góp của bạn hôm nay là một tán rừng cho ngày mai.
                            </p>
                            <div className={styles.galleryGrid}>
                                {IMG.gallery.map((g, i) => (
                                    <figure key={i} className={styles.galleryItem}>
                                        <img
                                            className={styles.galleryImg}
                                            src={g.url}
                                            alt={g.caption}
                                            loading="lazy"
                                            onError={hideOnError}
                                        />
                                        <figcaption className={styles.galleryCaption}>{g.caption}</figcaption>
                                    </figure>
                                ))}
                            </div>
                        </section>

                        {/* ── 3. MY CONTRIBUTION ───────────────────────── */}
                        {userId && mine && (
                            <section className={`${styles.section} ${styles.myCard}`}>
                                <h2 className={styles.sectionTitle}><Heart size={22} /> Đóng góp của tôi</h2>
                                <div className={styles.myBody}>
                                    <div className={styles.myTreeBlock}>
                                        <span className={styles.myTreeCount}>{fmtNum(mine.trees)}</span>
                                        <span className={styles.myTreeLabel}>cây xanh <TreePine size={15} className={styles.inlineIcon} /></span>
                                        <span className={styles.myVnd}>{fmtVnd(mine.totalVnd)} · {fmtNum(mine.donationCount)} lượt góp</span>
                                    </div>

                                    <div className={styles.myBadgeBlock}>
                                        {mine.badge ? (
                                            <>
                                                <span className={styles.myBadgeIcon}>{mine.badge.icon}</span>
                                                <span className={styles.myBadgeName}>{mine.badge.name}</span>
                                            </>
                                        ) : (
                                            <span className={styles.myBadgeNone}>
                                                <Sprout size={15} className={styles.inlineIcon} /> Chưa có danh hiệu — góp 1 cây để nhận danh hiệu Mầm xanh
                                            </span>
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
                                        <Download size={16} /> Tải chứng nhận
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
                            <h2 className={styles.sectionTitle}><TreeDeciduous size={22} /> Những cánh rừng đã trồng</h2>
                            {batches.length === 0 ? (
                                <p className={styles.emptyText}>
                                    <Sprout size={16} className={styles.inlineIcon} /> Đợt trồng đầu tiên đang được chuẩn bị...
                                </p>
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
                                                <TreePine size={56} />
                                            </div>
                                            <div className={styles.batchBody}>
                                                <h3 className={styles.batchLocation}><MapPin size={15} /> {batch.location}</h3>
                                                <p className={styles.batchMeta}>
                                                    <CalendarDays size={14} /> {fmtDate(batch.plantedDate)}
                                                    <span className={styles.batchTrees}><Sprout size={14} className={styles.inlineIcon} /> {fmtNum(batch.treeCount)} cây</span>
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
                            <h2 className={styles.sectionTitle}><Leaf size={22} /> Đóng góp gần đây</h2>
                            {recent.length === 0 ? (
                                <p className={styles.emptyText}>
                                    <HeartHandshake size={16} className={styles.inlineIcon} /> Chưa có đóng góp nào — hãy là người mở màn
                                </p>
                            ) : (
                                <ul className={styles.feedList}>
                                    {recent.map((item, idx) => (
                                        <li key={idx} className={styles.feedItem}>
                                            <span className={styles.feedIcon}>
                                                {item.source === 'BOOKING' ? <Plane size={18} /> : <Heart size={18} />}
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
                                    <div className={styles.stepThumb}>
                                        <img src={IMG.steps[0]} alt="" loading="lazy" onError={hideOnError} />
                                        <span className={styles.stepEmoji}><Luggage size={24} /></span>
                                    </div>
                                    <span className={styles.stepNumber}>1</span>
                                    <h3>Đặt tour hoặc góp coin</h3>
                                    <p>Mỗi booking tự động trích một phần vào quỹ, hoặc bạn góp coin trực tiếp.</p>
                                </div>
                                <span className={styles.stepArrow}>→</span>
                                <div className={styles.stepCard}>
                                    <div className={styles.stepThumb}>
                                        <img src={IMG.steps[1]} alt="" loading="lazy" onError={hideOnError} />
                                        <span className={styles.stepEmoji}><Wallet size={24} /></span>
                                    </div>
                                    <span className={styles.stepNumber}>2</span>
                                    <h3>Quỹ tích lũy minh bạch</h3>
                                    <p>Toàn bộ đóng góp được ghi nhận công khai, theo dõi theo thời gian thực.</p>
                                </div>
                                <span className={styles.stepArrow}>→</span>
                                <div className={styles.stepCard}>
                                    <div className={styles.stepThumb}>
                                        <img src={IMG.steps[2]} alt="" loading="lazy" onError={hideOnError} />
                                        <span className={styles.stepEmoji}><TreePine size={24} /></span>
                                    </div>
                                    <span className={styles.stepNumber}>3</span>
                                    <h3>Trồng cây thật</h3>
                                    <p>Cây được trồng tại các điểm du lịch, có ảnh và địa điểm cụ thể từng đợt.</p>
                                </div>
                            </div>
                        </section>

                        {/* CTA cuối trang */}
                        <section className={styles.bottomCta}>
                            <p><Sprout size={20} className={styles.inlineIcon} /> Sẵn sàng gieo mầm xanh tiếp theo?</p>
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
