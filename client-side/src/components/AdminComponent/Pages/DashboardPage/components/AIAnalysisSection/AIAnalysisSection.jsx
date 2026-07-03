import React, { useState } from 'react';
import styles from './AIAnalysisSection.module.scss';
import { getDashboardAIAnalysisApi } from '../../../../../../services/dashboard/dashboard.ts';
import {
    Brain, Lightbulb, Wand2, TrendingUp,
    CheckCircle2, AlertTriangle, Loader2,
    RefreshCw, Globe, DollarSign, Users, Map as MapIcon,
    CalendarDays, Bot, Star, Database, ShieldCheck, Info, ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const MODES = [
    { key: 'OVERVIEW', label: 'Tổng quan', Icon: Globe, color: '#1f6fb2' },
    { key: 'REVENUE', label: 'Doanh thu', Icon: DollarSign, color: '#10b981' },
    { key: 'USERS', label: 'Người dùng', Icon: Users, color: '#06b6d4' },
    { key: 'TOURS', label: 'Tours', Icon: MapIcon, color: '#f59e0b' },
];

const fmtDate = (d) => d ? format(d, 'dd/MM/yyyy', { locale: vi }) : '';

const parseLocalDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    const [year, month, day] = String(value).split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
};

const addDays = (date, days) => {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
};

const inclusiveDays = (from, to) => {
    if (!from || !to) return 0;
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.max(1, Math.round((to.getTime() - from.getTime()) / oneDay) + 1);
};

const formatValue = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    const raw = String(value).trim();
    const moneyMatch = raw.match(/^(-?\d+(?:\.\d+)?)\s*VND$/i);
    if (moneyMatch) {
        return `${Number(moneyMatch[1]).toLocaleString('vi-VN')} VND`;
    }
    if (/^-?\d+(?:\.\d+)?$/.test(raw)) {
        return Number(raw).toLocaleString('vi-VN');
    }
    return raw;
};

const getPeriodInfo = (analysisData, dateRange) => {
    const currentFrom = parseLocalDate(analysisData?.periodFrom) || dateRange?.from || null;
    const currentTo = parseLocalDate(analysisData?.periodTo) || dateRange?.to || null;
    const days = inclusiveDays(currentFrom, currentTo);
    const previousFrom = currentFrom ? addDays(currentFrom, -days) : null;
    const previousTo = currentFrom ? addDays(currentFrom, -1) : null;

    return {
        days,
        currentLabel: currentFrom && currentTo ? `${fmtDate(currentFrom)} - ${fmtDate(currentTo)}` : 'Khoảng ngày admin đang chọn',
        previousLabel: previousFrom && previousTo ? `${fmtDate(previousFrom)} - ${fmtDate(previousTo)}` : 'Khoảng thời gian liền trước',
    };
};

const getInsightIcon = (type) => {
    switch (type) {
        case 'POSITIVE': return <CheckCircle2 className={styles.positive} size={20} />;
        case 'NEGATIVE': return <AlertTriangle className={styles.negative} size={20} />;
        default: return <Lightbulb className={styles.neutral} size={20} />;
    }
};

const verificationMeta = (status) => {
    switch (status) {
        case 'VERIFIED':
            return { label: 'Đã kiểm chứng bằng dữ liệu hệ thống', className: styles.verified, Icon: ShieldCheck };
        case 'LIMITED':
            return { label: 'Có số liệu nhưng cần đọc kèm ghi chú', className: styles.limited, Icon: Info };
        default:
            return { label: 'AI chưa có số liệu chứng minh', className: styles.unverified, Icon: AlertTriangle };
    }
};

const qualityLabel = (quality) => {
    switch (quality) {
        case 'VERIFIED': return 'Đã xác minh';
        case 'LIMITED': return 'Cần đọc kèm ghi chú';
        case 'FALLBACK': return 'Dữ liệu dự phòng';
        default: return 'Chưa rõ';
    }
};

const metricCopy = (metric, period) => {
    const key = metric?.metricKey || '';
    const value = formatValue(metric?.currentValue);
    const previous = formatValue(metric?.previousValue);
    const formula = metric?.formula || 'Hệ thống tính từ dữ liệu đang có.';
    const periodLabel = period?.currentLabel || 'giai đoạn đang xem';
    const previousLabel = period?.previousLabel || 'giai đoạn so sánh';

    const copy = {
        'revenue.total': {
            short: 'Tổng tiền đã thu từ các booking đã thanh toán.',
            meaning: 'Cho biết quy mô doanh thu đã thật sự ghi nhận, không tính tiền còn chờ thanh toán.',
            detail: `Số này cho biết tổng doanh thu đã thu được từ các booking có trạng thái đã thanh toán. Giá trị ${value} là phần tiền chắc chắn hơn để nhìn sức khỏe doanh thu tổng thể; nó không bao gồm tiền khách còn đang nợ, tiền chờ hoàn hoặc booking đã hủy.`
        },
        'revenue.thisPeriod': {
            short: 'Doanh thu đã thu trong khoảng ngày admin đang xem.',
            meaning: 'Cho biết giai đoạn đang xem tạo ra bao nhiêu tiền thật từ booking đã thanh toán.',
            detail: `Số này cho biết trong ${periodLabel}, doanh nghiệp đã thu được ${value} từ booking đã thanh toán. Hệ thống so với ${previousLabel} là ${previous} để biết doanh thu đang tăng hay giảm. Công thức: ${formula}`
        },
        'revenue.growthRate': {
            short: 'Tỷ lệ tăng hoặc giảm doanh thu so với giai đoạn liền trước.',
            meaning: 'Cho biết doanh thu đang tốt lên hay xấu đi theo phần trăm.',
            detail: `Số này biến chênh lệch doanh thu thành phần trăm để admin dễ đọc xu hướng. Giá trị ${value} nghĩa là doanh thu trong ${periodLabel} đang tăng hoặc giảm ở mức đó so với ${previousLabel}. Nếu giai đoạn so sánh không có doanh thu, cần đọc thận trọng vì phần trăm có thể không phản ánh đủ sức khỏe kinh doanh.`
        },
        'revenue.pendingPayment': {
            short: 'Tiền tiềm năng từ booking khách chưa thanh toán.',
            meaning: 'Cho biết bao nhiêu tiền đang treo ở bước thanh toán, chưa phải doanh thu chắc chắn.',
            detail: `Số này chỉ khoản tiền tiềm năng còn treo ở bước khách chưa thanh toán. Giá trị ${value} càng cao thì rủi ro nghẽn dòng tiền càng lớn: hệ thống có nhu cầu đặt tour nhưng tiền chưa vào doanh nghiệp. Admin nên ưu tiên nhắc thanh toán, gọi xác nhận lại hoặc điều chỉnh chính sách giữ chỗ.`
        },
        'revenue.pendingRefund': {
            short: 'Số tiền có khả năng phải hoàn lại cho khách.',
            meaning: 'Cho biết rủi ro dòng tiền đi ra do các booking đang chờ hoàn tiền.',
            detail: `Số này cho biết có ${value} đang nằm ở nhóm có thể phải hoàn lại. Đây không phải doanh thu để dùng yên tâm, mà là khoản cần chuẩn bị xử lý để tránh chậm hoàn tiền và ảnh hưởng trải nghiệm khách.`
        },
        'revenue.cancelled': {
            short: 'Doanh thu tiềm năng đã mất vì booking bị hủy.',
            meaning: 'Cho biết giá trị đơn hàng không còn cơ hội ghi nhận doanh thu.',
            detail: `Số này cho biết ${value} doanh thu tiềm năng đã mất vì booking bị hủy. Nó giúp admin nhìn tác động tài chính của việc hủy đơn, từ đó kiểm tra nguyên nhân như tư vấn chưa rõ, chính sách đặt cọc chưa phù hợp hoặc khách đổi kế hoạch.`
        },
        'user.total': {
            short: 'Tổng số tài khoản khách hàng trong hệ thống.',
            meaning: 'Cho biết quy mô tệp khách hàng hiện có để chăm sóc và khai thác lại.',
            detail: `Số này cho biết hệ thống hiện có ${value} khách hàng. Đây là quy mô tệp khách đang có, dùng để đánh giá nền khách hàng, không phải số khách mới trong giai đoạn đang xem.`
        },
        'user.active': {
            short: 'Khách hàng còn hoạt động bình thường.',
            meaning: 'Cho biết bao nhiêu khách có thể đăng nhập, đặt tour và nhận chăm sóc.',
            detail: `Số này cho biết có ${value} khách hàng đang hoạt động. Đây là nhóm có thể tiếp tục nhận email/Zalo chăm sóc, ưu đãi hoặc quay lại đặt tour.`
        },
        'user.newThisMonth': {
            short: 'Khách mới phát sinh trong khoảng ngày admin đang xem.',
            meaning: 'Cho biết khả năng thu hút khách mới trong giai đoạn đang xem.',
            detail: `Số này cho biết trong ${periodLabel}, doanh nghiệp thu hút được ${value} khách mới. Hệ thống so với ${previousLabel} là ${previous} để biết marketing và kênh tiếp cận khách mới đang tốt lên hay yếu đi.`
        },
        'user.newLastMonth': {
            short: 'Khách mới ở giai đoạn liền trước, dùng làm mốc so sánh.',
            meaning: 'Cho biết nền so sánh để đánh giá khách mới hiện tại tăng hay giảm.',
            detail: `Số này là mốc so sánh của ${previousLabel}. Nếu khách mới trong giai đoạn đang xem thấp hơn mốc này, AI có cơ sở nói tốc độ thu hút khách mới đang giảm.`
        },
        'user.growthRate': {
            short: 'Tỷ lệ tăng hoặc giảm khách mới.',
            meaning: 'Cho biết hiệu quả thu hút khách mới thay đổi bao nhiêu phần trăm.',
            detail: `Số này cho biết lượng khách mới trong ${periodLabel} thay đổi ${value} so với ${previousLabel}. Nếu âm, admin nên kiểm tra quảng cáo, voucher, nội dung landing page và nguồn khách. Công thức: ${formula}`
        },
        'user.locked': {
            short: 'Tài khoản khách hàng đang bị khóa.',
            meaning: 'Cho biết có bao nhiêu khách không thể dùng tài khoản bình thường.',
            detail: `Số này cho biết có ${value} tài khoản khách đang bị khóa. Nếu số này tăng, doanh nghiệp có thể mất cơ hội chăm sóc hoặc bán lại cho nhóm khách đó; admin nên kiểm tra lý do khóa và ảnh hưởng tới trải nghiệm.`
        },
        'booking.total': {
            short: 'Tổng booking phát sinh trong khoảng ngày admin đang xem.',
            meaning: 'Cho biết lượng nhu cầu đặt tour mà hệ thống ghi nhận trong giai đoạn đang xem.',
            detail: `Số này cho biết trong ${periodLabel} có ${value} booking phát sinh. Đây là mẫu số để đọc các tỷ lệ như chuyển đổi, hủy, chờ thanh toán; nếu tổng booking thấp thì các tỷ lệ phần trăm cần đọc cẩn thận.`
        },
        'booking.paid': {
            short: 'Booking đã thanh toán trong giai đoạn đang xem.',
            meaning: 'Cho biết bao nhiêu booking đã chuyển thành doanh thu thật.',
            detail: `Số này cho biết có ${value} booking đã thanh toán trong ${periodLabel}. Đây là nhóm booking quan trọng nhất vì đã tạo doanh thu thực thu, dùng để tính tỷ lệ chuyển đổi.`
        },
        'booking.cancelled': {
            short: 'Booking bị hủy trong giai đoạn đang xem.',
            meaning: 'Cho biết lượng đơn đặt tour đã mất trong giai đoạn đang xem.',
            detail: `Số này cho biết có ${value} booking bị hủy trong ${periodLabel}. Nếu số này cao, admin nên xem lý do hủy, chất lượng tư vấn, thời hạn thanh toán và chính sách đặt cọc.`
        },
        'booking.cancellationRate': {
            short: 'Tỷ lệ booking bị hủy trên tổng booking.',
            meaning: 'Cho biết rủi ro mất đơn trong quy trình đặt tour.',
            detail: `Số này cho biết tỷ lệ hủy booking là ${value}. Nghĩa là trong tổng số booking phát sinh, có bao nhiêu phần trăm không đi tới kết quả mong muốn. Công thức: ${formula}`
        },
        'booking.pendingConfirmation': {
            short: 'Booking đang chờ nhân viên xác nhận.',
            meaning: 'Cho biết điểm nghẽn ở bước tư vấn/xác nhận nội bộ.',
            detail: `Số này cho biết có ${value} booking đang chờ xác nhận. Nếu cao, khách có thể phải đợi lâu trước khi biết tour còn chỗ hay chưa; admin nên kiểm tra tốc độ xử lý của đội tư vấn.`
        },
        'booking.pendingPayment': {
            short: 'Booking đã tạo nhưng khách chưa thanh toán.',
            meaning: 'Cho biết điểm nghẽn ở bước khách quyết định trả tiền.',
            detail: `Số này cho biết có ${value} booking đang chờ thanh toán. Đây là nhóm có nhu cầu thật nhưng chưa thành doanh thu; admin nên nhắc thanh toán, kiểm tra phương thức thanh toán hoặc điều chỉnh chính sách giữ chỗ.`
        },
        'booking.pendingRefund': {
            short: 'Booking đang chờ xử lý hoàn tiền.',
            meaning: 'Cho biết tải vận hành và rủi ro trải nghiệm sau hủy.',
            detail: `Số này cho biết có ${value} booking đang chờ hoàn tiền. Nếu xử lý chậm, khách dễ khiếu nại hoặc đánh giá xấu; admin nên ưu tiên kiểm tra trạng thái hoàn tiền.`
        },
        'booking.conversionRate': {
            short: 'Tỷ lệ booking chuyển thành thanh toán thành công.',
            meaning: 'Cho biết quy trình đặt tour có biến nhu cầu thành doanh thu thật hay không.',
            detail: `Số này cho biết tỷ lệ chuyển đổi booking là ${value}. Nếu thấp, nghĩa là nhiều booking dừng trước bước thanh toán thành công; điểm nghẽn thường nằm ở tư vấn, xác nhận, đặt cọc hoặc thanh toán. Công thức: ${formula}`
        },
        'tour.total': {
            short: 'Tổng số tour đang có trong hệ thống.',
            meaning: 'Cho biết quy mô danh mục sản phẩm tour.',
            detail: `Số này cho biết hệ thống hiện có ${value} tour. Đây là quy mô danh mục sản phẩm, dùng để xem doanh nghiệp đang có bao nhiêu lựa chọn tour để bán.`
        },
        'tour.active': {
            short: 'Tour đang mở bán hoặc đang hoạt động.',
            meaning: 'Cho biết số tour hiện có thể khai thác kinh doanh.',
            detail: `Số này cho biết có ${value} tour đang hoạt động. Đây là nhóm tour có thể tiếp tục bán, quảng bá hoặc gắn lịch khởi hành.`
        },
        'tour.departures': {
            short: 'Tổng lịch khởi hành trong hệ thống.',
            meaning: 'Cho biết quy mô lịch vận hành tour.',
            detail: `Số này cho biết hệ thống có ${value} lịch khởi hành. Nó giúp admin nhìn lượng lịch cần quản lý, không trực tiếp nói tour nào bán tốt hay bán kém.`
        },
        'tour.upcomingDepartures': {
            short: 'Lịch khởi hành sắp diễn ra.',
            meaning: 'Cho biết khối lượng tour cần chuẩn bị vận hành sắp tới.',
            detail: `Số này cho biết có ${value} lịch khởi hành sắp diễn ra. Admin nên dùng để chuẩn bị nhân sự, xe, khách sạn, vé và nhắc khách trước ngày đi.`
        },
        'tour.averageRating': {
            short: 'Điểm đánh giá trung bình của tour.',
            meaning: 'Cho biết chất lượng dịch vụ qua phản hồi khách hàng.',
            detail: `Số này cho biết điểm đánh giá trung bình là ${value}. Nếu điểm thấp, admin nên mở danh sách review để xem khách phàn nàn về lịch trình, hướng dẫn viên, dịch vụ hay giá trị tour.`
        },
        'tour.hotTop3': {
            short: 'Tour có booking đã thanh toán trong giai đoạn đang xem.',
            meaning: 'Cho biết có bao nhiêu tour thật sự tạo ra doanh thu đã thu.',
            detail: `Số này cho biết trong ${periodLabel} có ${value} tour tạo ra booking đã thanh toán. Một tour được xem là bán chạy khi có booking PAID trong giai đoạn này; hệ thống xếp tour có nhiều booking đã thanh toán lên trước, nếu bằng nhau thì tour có doanh thu cao hơn đứng trước. Nếu số này bằng 0, nghĩa là giai đoạn đang xem chưa có tour nào thật sự chuyển thành doanh thu đã thu.`
        },
        'tour.needingAttention': {
            short: 'Tour có dấu hiệu vận hành cần kiểm tra.',
            meaning: 'Cho biết có bao nhiêu tour cần admin mở ra xử lý trước.',
            detail: `Số này cho biết hiện có ${value} tour cần admin mở ra kiểm tra. Trong hệ thống hiện tại, tour bị đưa vào nhóm cần xử lý khi có booking chờ hoàn tiền hoặc dấu hiệu vận hành cần theo dõi; đây là cảnh báo xử lý, không phải bảng xếp hạng bán chạy.`
        }
    };

    return copy[key] || {
        short: 'Số liệu dùng để đối chiếu với nhận định AI.',
        meaning: metric?.note || 'Cho biết một tín hiệu nghiệp vụ trong hệ thống.',
        detail: `${metric?.note || 'Số liệu này dùng để kiểm tra kết luận AI.'} Cách tính: ${formula}`
    };
};

const shortDefinition = (metric, period) => metricCopy(metric, period).short;
const businessMeaning = (metric, period) => metricCopy(metric, period).meaning;
const businessExplanation = (metric, period) => metricCopy(metric, period).detail;

const comparisonText = (metric, period) => {
    const hasPrevious = metric.previousValue && metric.previousValue !== '-';
    if (!hasPrevious) {
        if ((metric.metricKey || '') === 'tour.hotTop3') {
            return `Tính theo giai đoạn đang xem ${period.currentLabel}; chỉ tính tour có booking đã thanh toán.`;
        }
        if ((metric.metricKey || '') === 'tour.needingAttention') {
            return 'Đây là cảnh báo vận hành hiện tại, dùng để biết tour nào cần admin kiểm tra ngay.';
        }
        if ((metric.metricKey || '').includes('growthRate')) {
            return 'Tỷ lệ này đã được tính từ giai đoạn đang xem so với giai đoạn so sánh.';
        }
        if ((metric.metricKey || '').includes('newLastMonth')) {
            return `Đây là mốc so sánh của ${period.previousLabel}, dùng làm nền để biết khách mới tăng hay giảm.`;
        }
        return 'Đây là số liệu trạng thái/tổng hợp trong hệ thống, không bắt buộc phải so với giai đoạn trước.';
    }
    return `Giai đoạn so sánh ${period.previousLabel}: ${formatValue(metric.previousValue)}. Chênh lệch: ${formatValue(metric.changeValue)}.`;
};

const trustLevel = (analysisData) => {
    const items = [
        ...(analysisData?.insights || []),
        ...(analysisData?.predictions || []),
        ...(analysisData?.recommendations || []),
    ];
    if (!items.length) return { label: 'Chưa có AI', tone: styles.limited, score: '0/0' };
    const verified = items.filter((item) => item.verificationStatus === 'VERIFIED').length;
    const unverified = items.filter((item) => item.verificationStatus === 'UNVERIFIED').length;
    if (unverified > 0) return { label: 'Cần kiểm tra', tone: styles.unverified, score: `${verified}/${items.length}` };
    return { label: 'Cao', tone: styles.verified, score: `${verified}/${items.length}` };
};

const AIAnalysisSection = ({ analysis: initialAnalysis, dateRange }) => {
    const [analysisData, setAnalysisData] = useState(initialAnalysis);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('insights');
    const [mode, setMode] = useState('OVERVIEW');
    const [highlightMetricKey, setHighlightMetricKey] = useState(null);
    const [expandedMetricKey, setExpandedMetricKey] = useState(null);

    const evidenceGroups = analysisData?.aiEvidenceDashboard?.groups || [];
    const evidenceCount = evidenceGroups.reduce((total, group) => total + (group.metrics?.length || 0), 0);
    const allMetrics = evidenceGroups.flatMap((group) => group.metrics || []);
    const period = getPeriodInfo(analysisData, dateRange);

    const findMetric = (metricKey) => allMetrics.find((item) => item.metricKey === metricKey) || null;

    const openMetric = (metricKey) => {
        setHighlightMetricKey(metricKey);
        setExpandedMetricKey(metricKey);
        setActiveTab('evidence');
        setTimeout(() => {
            const row = document.querySelector(`[data-metric-key="${metricKey}"]`);
            row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 80);
    };

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

    const MetricProof = ({ item }) => {
        const keys = item?.usedMetricKeys || [];
        const status = item?.verificationStatus || (keys.length ? 'VERIFIED' : 'UNVERIFIED');
        const meta = verificationMeta(status);
        const Icon = meta.Icon;

        return (
            <div className={styles.proofBox}>
                <div className={`${styles.verifyBadge} ${meta.className}`}>
                    <Icon size={13} />
                    <span>{meta.label}</span>
                </div>

                {keys.length > 0 ? (
                    <div className={styles.proofMetrics}>
                        <strong>Những con số làm căn cứ</strong>
                        {keys.map((key) => {
                            const metric = findMetric(key);
                            if (!metric) return null;
                            return (
                                <button key={key} className={styles.proofMetric} onClick={() => openMetric(key)}>
                                    <span>{metric.label}</span>
                                    <b>{formatValue(metric.currentValue)}</b>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className={styles.unverifiedNote}>Nội dung này chưa có số liệu hệ thống để chứng minh.</div>
                )}

                {item?.confidenceReason && <div className={styles.confidenceReason}>{item.confidenceReason}</div>}
            </div>
        );
    };

    const EvidenceTable = () => (
        <div className={styles.evidencePanel}>
            <div className={styles.sourceBanner}>
                <Database size={18} />
                <div>
                    <strong>Kiểm chứng số liệu</strong>
                    <span>
                        Bảng này giải thích từng con số AI đang dùng. Admin chỉ cần đọc theo 3 câu hỏi:
                        số này là gì, lấy từ đâu, và nó chứng minh điều gì.
                    </span>
                </div>
            </div>

            <div className={styles.periodGuide}>
                <div>
                    <strong>Giai đoạn đang xem</strong>
                    <b>{period.currentLabel}</b>
                    <span>Là khoảng ngày admin chọn trên bộ lọc dashboard. Các chỉ số “hiện tại” được tính trong khoảng này.</span>
                </div>
                <div>
                    <strong>Giai đoạn so sánh</strong>
                    <b>{period.previousLabel}</b>
                    <span>Là khoảng thời gian liền trước, có cùng số ngày với giai đoạn đang xem. Dùng để biết số liệu đang tăng hay giảm.</span>
                </div>
                <div>
                    <strong>Cách đọc nhanh</strong>
                    <b>{period.days} ngày được phân tích</b>
                    <span>Nếu một số liệu ghi “không cần so sánh”, nghĩa là đó là tổng trạng thái hiện tại, ví dụ tổng khách hàng hoặc tổng tour.</span>
                </div>
            </div>

            <div className={styles.trustExplainer}>
                <div>
                    <strong>Tại sao có thể tin?</strong>
                    <span>Mỗi nhận định AI đều được nối với dữ liệu thật từ hệ thống đặt tour, khách hàng hoặc tour. Nếu AI nói một điều mà không có số liệu chứng minh, hệ thống sẽ đánh dấu “chưa có dẫn chứng”.</span>
                </div>
            </div>

            {evidenceGroups.length === 0 ? (
                <div className={styles.emptyEvidence}>Chưa có bảng kiểm chứng số liệu.</div>
            ) : evidenceGroups.map((group) => (
                <section key={group.groupKey} className={styles.evidenceGroup}>
                    <h3>{group.groupLabel}</h3>
                    <div className={styles.evidenceTableWrap}>
                        <table className={styles.evidenceTable}>
                            <thead>
                                <tr>
                                    <th>Số liệu</th>
                                    <th>Kết quả trong giai đoạn đang xem</th>
                                    <th>So sánh để hiểu tăng/giảm</th>
                                    <th>Ý nghĩa nghiệp vụ</th>
                                    <th>AI dùng ở đâu</th>
                                    <th>Kiểm chứng</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(group.metrics || []).map((metric) => {
                                    const isExpanded = expandedMetricKey === metric.metricKey;
                                    return (
                                        <React.Fragment key={metric.metricKey}>
                                            <tr
                                                data-metric-key={metric.metricKey}
                                                className={highlightMetricKey === metric.metricKey ? styles.highlightRow : ''}
                                            >
                                                <td>
                                                    <strong>{metric.label}</strong>
                                                    <span>{shortDefinition(metric, period)}</span>
                                                </td>
                                                <td className={styles.valueCell}>{formatValue(metric.currentValue)}</td>
                                                <td>{comparisonText(metric, period)}</td>
                                                <td>{businessMeaning(metric, period)}</td>
                                                <td>
                                                    {(metric.usedByAiItems || []).length > 0
                                                        ? metric.usedByAiItems.join(', ')
                                                        : 'Chưa được AI dùng trong kết luận nào'}
                                                </td>
                                                <td>
                                                    <div className={`${styles.qualityBadge} ${styles[(metric.dataQuality || '').toLowerCase()]}`}>
                                                        {qualityLabel(metric.dataQuality)}
                                                    </div>
                                                    <button
                                                        className={styles.detailButton}
                                                        onClick={() => setExpandedMetricKey(isExpanded ? null : metric.metricKey)}
                                                        aria-expanded={isExpanded}
                                                    >
                                                        <ChevronDown size={13} className={isExpanded ? styles.rotateIcon : ''} />
                                                        {isExpanded ? 'Ẩn' : 'Giải thích'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className={styles.detailRow}>
                                                    <td colSpan={6}>
                                                        <div className={styles.detailNarrative}>
                                                            <strong>Diễn giải nghiệp vụ</strong>
                                                            <p>{businessExplanation(metric, period)}</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            ))}
        </div>
    );

    if (loading) {
        return (
            <div className={styles.aiSection}>
                <div className={styles.loadingState}>
                    <Loader2 className={styles.spinner} size={40} />
                    <h3>AI đang phân tích dữ liệu...</h3>
                    <p>Đang tổng hợp số liệu gốc, bằng chứng và mức độ tin cậy cho admin.</p>
                </div>
            </div>
        );
    }

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
                            <p>Chọn chế độ phân tích để tạo nhận định, dự báo, khuyến nghị kèm số liệu chứng minh.</p>
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

    const modeInfo = MODES.find(m => m.key === mode) || MODES[0];
    const trust = trustLevel(analysisData);

    return (
        <div className={styles.aiSection}>
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

            <div className={styles.summaryCard}>
                <Bot className={styles.summaryIcon} size={28} />
                <div className={styles.summaryContent}>
                    <h3>Tóm tắt điều hành</h3>
                    <p>{analysisData.summary || 'Chưa có tóm tắt AI. Bảng kiểm chứng số liệu vẫn sẵn sàng để kiểm tra.'}</p>
                    <div className={styles.trustRow}>
                        <div className={`${styles.trustBadge} ${trust.tone}`}>
                            <ShieldCheck size={14} />
                            <span>Mức độ kiểm chứng: {trust.label}</span>
                            <b>{trust.score}</b>
                        </div>
                        {analysisData.verificationSummary && <span>{analysisData.verificationSummary}</span>}
                    </div>
                </div>
            </div>

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
                <button className={`${styles.tab} ${activeTab === 'evidence' ? styles.tabActive : ''}`}
                    onClick={() => setActiveTab('evidence')}>
                    <Database size={14} /> Kiểm chứng số liệu
                    <span className={styles.badge}>{evidenceCount}</span>
                </button>
            </div>

            <div className={styles.tabContent}>
                {activeTab === 'insights' && (
                    <div className={styles.cardsGrid}>
                        {(analysisData.insights || []).map((item, i) => (
                            <div key={i} className={`${styles.insightCard} ${styles[item.type?.toLowerCase()] || ''}`}>
                                <div className={styles.cardHeader}>
                                    {getInsightIcon(item.type)}
                                    <span className={styles.priorityBadge}>Ưu tiên P{item.priority}</span>
                                </div>
                                <h4>{item.title}</h4>
                                <p>{item.description}</p>
                                <MetricProof item={item} />
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
                                        <div className={styles.confFill} style={{ width: `${item.confidence || 0}%` }} />
                                    </div>
                                    <div className={styles.confRow}>
                                        <span>Độ tin cậy AI: {item.confidence || 0}%</span>
                                        <span className={styles.timeframe}>{item.timeframe}</span>
                                    </div>
                                </div>
                                <MetricProof item={item} />
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
                                    <strong>Hành động đề xuất:</strong> {item.action}
                                </div>
                                <MetricProof item={item} />
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'evidence' && <EvidenceTable />}
            </div>
        </div>
    );
};

export default AIAnalysisSection;
