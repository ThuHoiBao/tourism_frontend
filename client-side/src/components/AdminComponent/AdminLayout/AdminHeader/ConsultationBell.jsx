import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Phone, MapPin, MessageCircle, Headphones } from 'lucide-react';
import { useConsultationAlertsContext } from '../../../../context/ConsultationAlertsContext';
import styles from './ConsultationBell.module.scss';

const formatAgo = (ts) => {
    const diff = (Date.now() - ts) / 1000;
    if (diff < 60)     return 'Vừa xong';
    if (diff < 3600)   return `${Math.floor(diff / 60)}p trước`;
    if (diff < 86400)  return `${Math.floor(diff / 3600)}h trước`;
    return `${Math.floor(diff / 86400)}d trước`;
};

const ConsultationBell = () => {
    const navigate = useNavigate();
    const { unseenItems, pendingItems, unseenCount, pendingCount, clearUnseen } = useConsultationAlertsContext();

    // Hiển thị: ưu tiên item real-time chưa xem; nếu rỗng → fallback PENDING gần nhất từ BE
    const displayItems = unseenItems.length > 0 ? unseenItems : pendingItems;
    const [open, setOpen] = useState(false);
    const wrapRef = useRef(null);

    // Đóng khi click ngoài
    useEffect(() => {
        if (!open) return;
        const onClick = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    const handleOpen = () => {
        setOpen((o) => {
            const next = !o;
            // Khi mở dropdown → coi như admin đã thấy list, clear buffer & badge
            if (next) clearUnseen();
            return next;
        });
    };

    const handleClickItem = () => {
        clearUnseen();
        setOpen(false);
        navigate('/admin/consultations');
    };

    const handleViewAll = () => {
        clearUnseen();
        setOpen(false);
        navigate('/admin/consultations');
    };

    // Số hiển thị trên badge = max(unseen real-time, pending từ BE)
    const badge = Math.max(unseenCount, pendingCount);

    return (
        <div className={styles.bellWrap} ref={wrapRef}>
            <button className={styles.bellBtn} onClick={handleOpen} title="Yêu cầu tư vấn">
                <Bell size={18} />
                {badge > 0 && (
                    <span className={`${styles.badge} ${unseenCount > 0 ? styles.badgePulse : ''}`}>
                        {badge > 99 ? '99+' : badge}
                    </span>
                )}
            </button>

            {open && (
                <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                        <Headphones size={15} />
                        <span>Yêu cầu tư vấn</span>
                        <span className={styles.headerCount}>{pendingCount} chờ xử lý</span>
                    </div>

                    <div className={styles.dropdownBody}>
                        {displayItems.length === 0 ? (
                            <div className={styles.empty}>
                                <Bell size={28} />
                                <p>Chưa có yêu cầu chờ xử lý</p>
                                <small>Yêu cầu tư vấn mới sẽ hiện ở đây</small>
                            </div>
                        ) : (
                            displayItems.map((it, idx) => (
                                <div
                                    key={`${it.requestCode}-${idx}`}
                                    className={styles.item}
                                    onClick={handleClickItem}
                                >
                                    <div className={styles.itemHeader}>
                                        <strong className={styles.itemName}>{it.fullName}</strong>
                                        <span className={styles.itemTime}>{formatAgo(it.receivedAt)}</span>
                                    </div>
                                    <div className={styles.itemMeta}>
                                        {it.phone && (
                                            <span className={styles.metaPill}>
                                                <Phone size={11} /> {it.phone}
                                            </span>
                                        )}
                                        {it.tourCode && (
                                            <span className={styles.metaPill}>
                                                <MapPin size={11} /> {it.tourCode}
                                            </span>
                                        )}
                                    </div>
                                    {it.consultationInfo && (
                                        <div className={styles.itemBody}>
                                            <MessageCircle size={11} /> {it.consultationInfo}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <button className={styles.viewAllBtn} onClick={handleViewAll}>
                        Xem tất cả →
                    </button>
                </div>
            )}
        </div>
    );
};

export default ConsultationBell;
