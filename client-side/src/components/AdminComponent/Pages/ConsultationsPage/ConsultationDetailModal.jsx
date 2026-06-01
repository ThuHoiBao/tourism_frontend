import React, { useState, useEffect } from 'react';
import { X, Phone, Mail, CheckCircle, XCircle, Play } from 'lucide-react';
import styles from './ConsultationsPage.module.scss';

const ConsultationDetailModal = ({ item, onClose, onUpdateStatus }) => {
    const [notes, setNotes] = useState('');

    useEffect(() => {
        setNotes(item?.adminNotes || '');
    }, [item]);

    if (!item) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.modalClose} onClick={onClose}><X size={18} /></button>
                <h2 className={styles.modalTitle}>
                    Yêu cầu <code className={styles.code}>{item.requestCode}</code>
                </h2>

                <div className={styles.detailGrid}>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Họ tên</span>
                        <span className={styles.detailValue}>{item.fullName}</span>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Điện thoại</span>
                        <a className={styles.detailValueLink} href={`tel:${item.phone}`}>
                            <Phone size={12} /> {item.phone}
                        </a>
                    </div>
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Email</span>
                        <a className={styles.detailValueLink} href={`mailto:${item.email}`}>
                            <Mail size={12} /> {item.email}
                        </a>
                    </div>
                    {item.tourCode && (
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Tour</span>
                            <span className={styles.detailValue}>
                                <strong>{item.tourCode}</strong>
                                {item.tourName && ` — ${item.tourName}`}
                            </span>
                        </div>
                    )}
                    <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Trạng thái</span>
                        <span className={styles.detailValue}>{item.status}</span>
                    </div>
                    {item.resolvedAt && (
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Đã xử lý lúc</span>
                            <span className={styles.detailValue}>{item.resolvedAt}</span>
                        </div>
                    )}
                </div>

                {item.consultationInfo && (
                    <div className={styles.consultBlock}>
                        <h4>Nội dung tư vấn</h4>
                        <p>{item.consultationInfo}</p>
                    </div>
                )}

                <div className={styles.notesBlock}>
                    <label>Ghi chú của admin</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ghi chú sau khi gọi điện…"
                        rows="3"
                    />
                </div>

                <div className={styles.modalActions}>
                    {item.status === 'PENDING' && (
                        <button className={styles.btnInfo}
                                onClick={() => onUpdateStatus(item.consultationId, 'IN_PROGRESS', notes)}>
                            <Play size={13} /> Bắt đầu xử lý
                        </button>
                    )}
                    {item.status !== 'RESOLVED' && item.status !== 'CLOSED' && (
                        <button className={styles.btnSuccess}
                                onClick={() => onUpdateStatus(item.consultationId, 'RESOLVED', notes)}>
                            <CheckCircle size={13} /> Đánh dấu đã xử lý
                        </button>
                    )}
                    {item.status !== 'CLOSED' && (
                        <button className={styles.btnDanger}
                                onClick={() => onUpdateStatus(item.consultationId, 'CLOSED', notes)}>
                            <XCircle size={13} /> Hủy yêu cầu
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConsultationDetailModal;
