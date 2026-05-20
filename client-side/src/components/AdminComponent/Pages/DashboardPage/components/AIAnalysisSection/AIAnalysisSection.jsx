// AIAnalysisSection.jsx — Full redesign with Lucide React icons

import React, { useState } from 'react';
import styles from './AIAnalysisSection.module.scss';
import { getDashboardAIAnalysisApi } from '../../../../../../services/dashboard/dashboard.ts';
import {
    Brain, Lightbulb, Wand2, TrendingUp,
    CheckCircle2, AlertTriangle, Loader2,
    RefreshCw, Globe, DollarSign, Users, Map,
    CalendarDays, Bot, Star
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

// ─── Mode config ──────────────────────────────────────────────────────────────
const MODES = [
    { key: 'OVERVIEW', label: 'Tổng quan', Icon: Globe, color: '#1f6fb2' },
    { key: 'REVENUE', label: 'Doanh thu', Icon: DollarSign, color: '#10b981' },
    { key: 'USERS', label: 'Người dùng', Icon: Users, color: '#06b6d4' },
    { key: 'TOURS', label: 'Tours', Icon: Map, color: '#f59e0b' },
];

const getInsightIcon = (type) => {
    switch (type) {
        case 'POSITIVE': return <CheckCircle2 className={styles.positive} size={20} />;
        case 'NEGATIVE': return <AlertTriangle className={styles.negative} size={20} />;
        default: return <Lightbulb className={styles.neutral} size={20} />;
    }
};

const fmtDate = (d) => d ? format(d, 'dd/MM/yyyy', { locale: vi }) : '';

// ─── Main Component ───────────────────────────────────────────────────────────
const AIAnalysisSection = ({ analysis: initialAnalysis, dateRange }) => {
    const [analysisData, setAnalysisData] = useState(initialAnalysis);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('insights');
    const [mode, setMode] = useState('OVERVIEW');

    const handleAnalyze = async (selectedMode = mode) => {
        setLoading(true);
        setError(null);
        try {
            const data = await getDashboardAIAnalysisApi(dateRange?.from, dateRange?.to, selectedMode);
            setAnalysisData(data);
            setActiveTab('insights');
        } catch {
            setError('Không thể kết nối với AI. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleModeClick = (key) => {
        setMode(key);
        if (analysisData) handleAnalyze(key);
    };

    // ── Loading ──
    if (loading) {
        return (
            <div className={styles.aiSection}>
                <div className={styles.loadingState}>
                    <Loader2 className={styles.spinner} size={40} />
                    <h3>AI đang phân tích dữ liệu…</h3>
                    <p>Đang xử lý hàng nghìn điểm dữ liệu, vui lòng đợi.</p>
                </div>
            </div>
        );
    }

    // ── Empty state ──
    if (!analysisData) {
        return (
            <div className={styles.aiSection}>
                <div className={styles.emptyState}>
                    <div className={styles.emptyTop}>
                        <div className={styles.brainTile}>
                            <Brain className={styles.brainIcon} size={32} />
                        </div>
                        <div className={styles.emptyText}>
                            <h2>Phân tích AI Thông minh</h2>
                            <p>Khám phá insights ẩn trong dữ liệu với sức mạnh Gemini AI. Chọn chế độ phân tích và nhấn bắt đầu.</p>
                        </div>
                    </div>

                    {dateRange?.from && (
                        <div className={styles.dateBadge}>
                            <CalendarDays size={13} />
                            <span>{fmtDate(dateRange.from)} - {fmtDate(dateRange.to)}</span>
                        </div>
                    )}

                    <div className={styles.modeSelector}>
                        {MODES.map(({ key, label, Icon, color }) => (
                            <button
                                key={key}
                                className={`${styles.modeBtn} ${mode === key ? styles.modeActive : ''}`}
                                style={mode === key ? { '--mode-color': color } : {}}
                                onClick={() => setMode(key)}
                            >
                                <Icon size={15} style={{ color: mode === key ? color : undefined }} />
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>

                    {error && <div className={styles.errorMsg}>{error}</div>}

                    <button className={styles.analyzeBtn} onClick={() => handleAnalyze(mode)}>
                        <Brain size={17} /> Phân tích ngay
                    </button>
                </div>
            </div>
        );
    }

    // ── Has data ──
    const modeInfo = MODES.find(m => m.key === mode) || MODES[0];

    return (
        <div className={styles.aiSection}>
            {/* Header */}
            <div className={styles.sectionHeader}>
                <div className={styles.headerLeft}>
                    <div className={styles.brainTileSmall}><Brain size={20} /></div>
                    <div>
                        <h2 className={styles.sectionTitle}>Phân tích AI Thông minh</h2>
                        <p className={styles.sectionSub}>Powered by Gemini AI · {modeInfo.label}</p>
                    </div>
                </div>
                <div className={styles.headerRight}>
                    <div className={styles.modeSelectorSmall}>
                        {MODES.map(({ key, label, Icon, color }) => (
                            <button
                                key={key}
                                className={`${styles.modeChip} ${mode === key ? styles.modeChipActive : ''}`}
                                style={mode === key ? { background: color, borderColor: color } : {}}
                                onClick={() => handleModeClick(key)}
                                title={label}
                            >
                                <Icon size={13} /><span>{label}</span>
                            </button>
                        ))}
                    </div>
                    <button className={styles.reAnalyzeBtn} onClick={() => handleAnalyze(mode)}>
                        <RefreshCw size={13} /> Cập nhật
                    </button>
                </div>
            </div>

            {/* Summary card */}
            <div className={styles.summaryCard}>
                <div className={styles.summaryGradient} />
                <Bot className={styles.summaryIcon} size={28} />
                <div className={styles.summaryContent}>
                    <h3>Tóm tắt điều hành</h3>
                    <p>{analysisData.summary}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabBar}>
                <button className={`${styles.tab} ${activeTab === 'insights' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('insights')}>
                    <Lightbulb size={14} /> Nhận định
                    <span className={styles.badge}>{analysisData.insights?.length || 0}</span>
                </button>
                <button className={`${styles.tab} ${activeTab === 'predictions' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('predictions')}>
                    <Wand2 size={14} /> Dự báo
                    <span className={styles.badge}>{analysisData.predictions?.length || 0}</span>
                </button>
                <button className={`${styles.tab} ${activeTab === 'recommendations' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('recommendations')}>
                    <TrendingUp size={14} /> Khuyến nghị
                    <span className={styles.badge}>{analysisData.recommendations?.length || 0}</span>
                </button>
            </div>

            <div className={styles.tabContent}>
                {activeTab === 'insights' && (
                    <div className={styles.cardsGrid}>
                        {(analysisData.insights || []).map((item, i) => (
                            <div key={i} className={`${styles.insightCard} ${styles[item.type?.toLowerCase()] || ''}`}>
                                <div className={styles.cardHeader}>
                                    {getInsightIcon(item.type)}
                                    <span className={styles.priorityBadge}>P{item.priority}</span>
                                </div>
                                <h4>{item.title}</h4>
                                <p>{item.description}</p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'predictions' && (
                    <div className={styles.cardsGrid}>
                        {(analysisData.predictions || []).map((item, i) => (
                            <div key={i} className={styles.predictionCard}>
                                <div className={styles.predMetric}>{item.metric}</div>
                                <div className={styles.predValue}>{item.prediction}</div>
                                <div className={styles.predFooter}>
                                    <div className={styles.confBar}>
                                        <div className={styles.confFill} style={{ width: `${item.confidence}%` }} />
                                    </div>
                                    <div className={styles.confRow}>
                                        <span>Độ tin cậy: {item.confidence}%</span>
                                        <span className={styles.timeframe}>{item.timeframe}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'recommendations' && (
                    <div className={styles.cardsGrid}>
                        {(analysisData.recommendations || []).map((item, i) => (
                            <div key={i} className={styles.recCard}>
                                <div className={styles.impactRow}>
                                    {Array.from({ length: item.impact || 1 }).map((_, j) => (
                                        <Star key={j} className={styles.star} size={14} fill="currentColor" />
                                    ))}
                                </div>
                                <h4>{item.title}</h4>
                                <p>{item.description}</p>
                                <div className={styles.actionBox}>
                                    <strong>Hành động:</strong> {item.action}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIAnalysisSection;
