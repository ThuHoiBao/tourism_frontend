import React from 'react';
import Badge from '../../../../shared/Badge/Badge';

// green < 0.3, yellow 0.3–0.7, red > 0.7
const colorFor = (score) => {
    if (score == null) return '#9ca3af';
    if (score < 0.3) return '#059669';
    if (score <= 0.7) return '#d97706';
    return '#dc2626';
};

const labelMeaning = (label) => {
    switch (label) {
        case 'SAFE': return 'An toàn — tự động xuất bản';
        case 'BORDERLINE': return 'Đáng ngờ — cần admin xem xét';
        case 'TOXIC': return 'Vi phạm rõ ràng — đã bị ẩn';
        default: return 'Chưa kiểm duyệt';
    }
};

const ModerationBadge = ({ score, label, reason }) => {
    if (score == null && !label) {
        return (
            <span style={{ color: '#9ca3af', fontSize: 12 }} title="Nội dung chưa qua kiểm duyệt AI">—</span>
        );
    }
    const pct = score != null ? Math.round(score * 100) : null;

    // Tooltip: giải thích thang điểm + nhãn + lý do AI
    const tooltip =
        `Điểm vi phạm: ${pct != null ? pct + '/100' : 'N/A'} (0 = an toàn, 100 = độc hại)\n`
        + `${labelMeaning(label)}`
        + (reason ? `\nLý do: ${reason}` : '');

    return (
        <span title={tooltip} style={{ cursor: 'help' }}>
            <Badge color={colorFor(score)} style={{ color: '#fff' }}>
                {label || 'N/A'}{pct != null ? ` · ${pct}%` : ''}
            </Badge>
        </span>
    );
};

export default ModerationBadge;
