import React, { useState } from 'react';
import styles from './AIAnalysisSection.module.scss';
import { getDashboardAIAnalysisApi } from '../../../../../../services/dashboard/dashboard.ts';
import { 
    FaBrain, 
    FaLightbulb, 
    FaMagic, // ✅ Đã thay thế FaCrystalBall bằng FaMagic
    FaChartLine, 
    FaCheckCircle, 
    FaExclamationTriangle,
    FaRobot, 
    FaSpinner,
    FaSync // ✅ Đã di chuyển lên đầu file
} from 'react-icons/fa';

const AIAnalysisSection = ({ analysis: initialAnalysis }) => {
    // State quản lý dữ liệu AI riêng biệt
    const [analysisData, setAnalysisData] = useState(initialAnalysis); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('insights');

    // Hàm gọi API khi bấm nút
    const handleAnalyze = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getDashboardAIAnalysisApi();
            setAnalysisData(data);
        } catch (err) {
            setError("Không thể kết nối với AI Server. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    const getInsightIcon = (type) => {
        switch (type) {
            case 'POSITIVE': return <FaCheckCircle className={styles.positive} />;
            case 'NEGATIVE': return <FaExclamationTriangle className={styles.negative} />;
            default: return <FaLightbulb className={styles.neutral} />;
        }
    };

    // --- GIAO DIỆN CHƯA PHÂN TÍCH (HIỂN THỊ NÚT BẤM) ---
    if (!analysisData && !loading) {
        return (
            <div className={styles.aiAnalysisSection}>
                <div className={styles.emptyState}>
                    <div className={styles.iconWrapper}>
                        <FaRobot className={styles.robotIcon} />
                    </div>
                    <h2>Trợ lý AI Phân tích</h2>
                    <p>Sử dụng thuật toán AI để phân tích dữ liệu, dự đoán xu hướng và đưa ra khuyến nghị chiến lược.</p>
                    
                    {error && <p className={styles.errorMessage}>{error}</p>}

                    <button className={styles.analyzeBtn} onClick={handleAnalyze}>
                        <FaBrain /> Phân tích Dữ liệu Ngay
                    </button>
                </div>
            </div>
        );
    }

    // --- GIAO DIỆN LOADING ---
    if (loading) {
        return (
            <div className={styles.aiAnalysisSection}>
                <div className={styles.loadingState}>
                    <FaSpinner className={styles.spinner} />
                    <h3>Đang phân tích dữ liệu...</h3>
                    <p>Vui lòng đợi trong giây lát, AI đang xử lý các điểm dữ liệu.</p>
                </div>
            </div>
        );
    }

    // --- GIAO DIỆN KHI ĐÃ CÓ DỮ LIỆU ---
    return (
        <div className={styles.aiAnalysisSection}>
            <div className={styles.sectionHeader}>
                <div className={styles.headerLeft}>
                    <FaBrain className={styles.aiIcon} />
                    <div>
                        <h2 className={styles.sectionTitle}>Phân tích AI Thông minh</h2>
                        <p className={styles.sectionSubtitle}>
                            Dữ liệu được tạo bởi AI
                        </p>
                    </div>
                </div>
                {/* Nút phân tích lại */}
                <button className={styles.reAnalyzeBtn} onClick={handleAnalyze}>
                    <FaSync /> Cập nhật
                </button>
            </div>

            {/* AI Summary */}
            <div className={styles.aiSummary}>
                <div className={styles.summaryIcon}>
                    <FaChartLine />
                </div>
                <div className={styles.summaryContent}>
                    <h3>Tóm tắt điều hành</h3>
                    <p>{analysisData.summary}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className={styles.tabsContainer}>
                <div className={styles.tabs}>
                    <button 
                        className={`${styles.tab} ${activeTab === 'insights' ? styles.active : ''}`}
                        onClick={() => setActiveTab('insights')}
                    >
                        <FaLightbulb /> Nhận định
                        <span className={styles.badge}>{analysisData.insights?.length || 0}</span>
                    </button>
                    <button 
                        className={`${styles.tab} ${activeTab === 'predictions' ? styles.active : ''}`}
                        onClick={() => setActiveTab('predictions')}
                    >
                        <FaMagic /> Dự báo {/* ✅ Đổi Icon ở đây */}
                        <span className={styles.badge}>{analysisData.predictions?.length || 0}</span>
                    </button>
                    <button 
                        className={`${styles.tab} ${activeTab === 'recommendations' ? styles.active : ''}`}
                        onClick={() => setActiveTab('recommendations')}
                    >
                        <FaChartLine /> Khuyến nghị
                        <span className={styles.badge}>{analysisData.recommendations?.length || 0}</span>
                    </button>
                </div>

                {/* Tab Content */}
                <div className={styles.tabContent}>
                    {activeTab === 'insights' && (
                        <div className={styles.insightsGrid}>
                            {analysisData.insights?.map((insight, index) => (
                                <div key={index} className={styles.insightCard}>
                                    <div className={styles.insightHeader}>
                                        {getInsightIcon(insight.type)}
                                        <div className={styles.priorityBadge}>
                                            Ưu tiên: {insight.priority}
                                        </div>
                                    </div>
                                    <h4>{insight.title}</h4>
                                    <p>{insight.description}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'predictions' && (
                        <div className={styles.predictionsGrid}>
                            {analysisData.predictions?.map((prediction, index) => (
                                <div key={index} className={styles.predictionCard}>
                                    <div className={styles.predictionMetric}>
                                        {prediction.metric}
                                    </div>
                                    <div className={styles.predictionValue}>
                                        {prediction.prediction}
                                    </div>
                                    <div className={styles.predictionFooter}>
                                        <div className={styles.confidence}>
                                            <div 
                                                className={styles.confidenceBar}
                                                style={{ width: `${prediction.confidence}%` }}
                                            />
                                            <span>Độ tin cậy: {prediction.confidence}%</span>
                                        </div>
                                        <div className={styles.timeframe}>
                                            {prediction.timeframe}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'recommendations' && (
                        <div className={styles.recommendationsGrid}>
                            {analysisData.recommendations?.map((rec, index) => (
                                <div key={index} className={styles.recommendationCard}>
                                    <div className={styles.impactBadge}>
                                        Tác động: {'⭐'.repeat(rec.impact)}
                                    </div>
                                    <h4>{rec.title}</h4>
                                    <p className={styles.description}>{rec.description}</p>
                                    <div className={styles.actionBox}>
                                        <strong>Hành động:</strong> {rec.action}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIAnalysisSection;