// AIAnalysisSection.jsx — Full redesign

import React, { useState } from 'react';
import styles from './AIAnalysisSection.module.scss';
import { getDashboardAIAnalysisApi } from '../../../../../../services/dashboard/dashboard.ts';
import {
    FaBrain, FaLightbulb, FaMagic, FaChartLine,
    FaCheckCircle, FaExclamationTriangle, FaSpinner,
    FaSync, FaGlobe, FaMoneyBillWave, FaUsers, FaMapMarkedAlt,
    FaCalendarAlt, FaRobot
} from 'react-icons/fa';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

// ─── Mode config ──────────────────────────────────────────────────────────────
const MODES = [
    { key: 'OVERVIEW', label: 'Tổng quan', Icon: FaGlobe, color: '#6366f1' },
    { key: 'REVENUE', label: 'Doanh thu', Icon: FaMoneyBillWave, color: '#10b981' },
    { key: 'USERS', label: 'Người dùng', Icon: FaUsers, color: '#06b6d4' },
    { key: 'TOURS', label: 'Tours', Icon: FaMapMarkedAlt, color: '#f59e0b' },
];

const getInsightIcon = (type) => {
    switch (type) {
        case 'POSITIVE': return <FaCheckCircle className={styles.positive} />;
        case 'NEGATIVE': return <FaExclamationTriangle className={styles.negative} />;
        default: return <FaLightbulb className={styles.neutral} />;
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
                    <div className={styles.loadingOrb} />
                    <FaSpinner className={styles.spinner} />
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
                    <div className={styles.blobBg} />

                    <div className={styles.emptyTop}>
                        <div className={styles.brainOrb}>
                            <FaBrain className={styles.brainIcon} />
                        </div>
                        <div className={styles.emptyText}>
                            <h2>Phân tích AI Thông minh</h2>
                            <p>Khám phá insights ẩn trong dữ liệu với sức mạnh Gemini AI. Chọn chế độ phân tích và nhấn bắt đầu.</p>
                        </div>
                    </div>

                    {dateRange?.from && (
                        <div className={styles.dateBadge}>
                            <FaCalendarAlt />
                            <span>{fmtDate(dateRange.from)} → {fmtDate(dateRange.to)}</span>
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
                                <Icon style={{ color: mode === key ? color : undefined }} />
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>

                    {error && <div className={styles.errorMsg}>{error}</div>}

                    <button className={styles.analyzeBtn} onClick={() => handleAnalyze(mode)}>
                        <FaBrain /> Phân tích ngay
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
                    <div className={styles.brainOrbSmall}><FaBrain /></div>
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
                                <Icon /><span>{label}</span>
                            </button>
                        ))}
                    </div>
                    <button className={styles.reAnalyzeBtn} onClick={() => handleAnalyze(mode)}>
                        <FaSync /> Cập nhật
                    </button>
                </div>
            </div>

            {/* Summary card */}
            <div className={styles.summaryCard}>
                <div className={styles.summaryGradient} />
                <FaRobot className={styles.summaryIcon} />
                <div className={styles.summaryContent}>
                    <h3>Tóm tắt điều hành</h3>
                    <p>{analysisData.summary}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabBar}>
                <button className={`${styles.tab} ${activeTab === 'insights' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('insights')}>
                    <FaLightbulb /> Nhận định
                    <span className={styles.badge}>{analysisData.insights?.length || 0}</span>
                </button>
                <button className={`${styles.tab} ${activeTab === 'predictions' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('predictions')}>
                    <FaMagic /> Dự báo
                    <span className={styles.badge}>{analysisData.predictions?.length || 0}</span>
                </button>
                <button className={`${styles.tab} ${activeTab === 'recommendations' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('recommendations')}>
                    <FaChartLine /> Khuyến nghị
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
                                        <span key={j} className={styles.star}>★</span>
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