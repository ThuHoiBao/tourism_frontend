import React, { useEffect, useState } from 'react';
import { Sparkles, ThumbsUp, ThumbsDown, Lightbulb, Star, Clock, RefreshCw } from 'lucide-react';
import reviewSummaryApi from '../../../services/tour/reviewSummaryApi';
import styles from './ReviewSummaryCard.module.scss';

const fmtRelative = (iso) => {
    if (!iso) return '';
    try {
        const d = new Date(iso.replace(' ', 'T'));
        const diffMs = Date.now() - d.getTime();
        const mins = Math.floor(diffMs / 60000);
        if (mins < 60) return `${mins} phút trước`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs} giờ trước`;
        const days = Math.floor(hrs / 24);
        if (days < 30) return `${days} ngày trước`;
        return iso.slice(0, 10);
    } catch { return iso.slice(0, 10); }
};

const Section = ({ title, icon: Icon, color, content }) => (
    <div className={styles.section} style={{ borderLeftColor: color }}>
        <h4 className={styles.sectionTitle} style={{ color }}>
            <Icon size={15} /> {title}
        </h4>
        <pre className={styles.sectionContent}>{content || 'Chưa có dữ liệu'}</pre>
    </div>
);

const Skeleton = () => (
    <div className={styles.card}>
        <div className={`${styles.header} ${styles.skel}`} style={{ height: 24, width: '60%' }} />
        <div className={styles.grid}>
            {[0, 1, 2].map(i => (
                <div key={i} className={styles.section}>
                    <div className={`${styles.skel}`} style={{ height: 16, width: '50%', marginBottom: 10 }} />
                    <div className={`${styles.skel}`} style={{ height: 60 }} />
                </div>
            ))}
        </div>
    </div>
);

const ReviewSummaryCard = ({ tourCode }) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!tourCode) return;
        setLoading(true);
        reviewSummaryApi.getByTourCode(tourCode)
            .then(setSummary)
            .catch(() => setSummary(null))
            .finally(() => setLoading(false));
    }, [tourCode]);

    if (loading) return <Skeleton />;
    // Không hiển thị nếu chưa có summary (tour < 10 review)
    if (!summary || summary.cacheStatus === 'MISS' || !summary.pros) return null;

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <span className={styles.headerTitle}>
                    <Sparkles size={18} /> Tóm tắt AI từ {summary.reviewCountAtGen} review
                </span>
                {summary.avgRatingAtGen != null && (
                    <span className={styles.avgRating}>
                        <Star size={14} fill="#f59e0b" color="#f59e0b" />
                        {summary.avgRatingAtGen.toFixed(1)}/5
                    </span>
                )}
                {summary.isStale && (
                    <span className={styles.staleTag}>
                        <RefreshCw size={11} /> Đang cập nhật
                    </span>
                )}
            </div>

            <div className={styles.grid}>
                <Section title="Ưu điểm chính" icon={ThumbsUp} color="#059669" content={summary.pros} />
                <Section title="Nhược điểm" icon={ThumbsDown} color="#dc2626" content={summary.cons} />
                <Section title="Lời khuyên" icon={Lightbulb} color="#d97706" content={summary.tips} />
            </div>

            <div className={styles.footer}>
                {summary.generatedAt && (
                    <span><Clock size={11} /> Cập nhật {fmtRelative(summary.generatedAt)}</span>
                )}
                <span className={styles.disclaimer}>
                    · Tóm tắt tự động bằng AI, có thể chưa hoàn toàn chính xác
                </span>
            </div>
        </div>
    );
};

export default ReviewSummaryCard;
