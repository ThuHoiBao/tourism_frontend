// src/components/AdminComponent/Pages/UsersPage/UsersItem.jsx
import React, { useState } from 'react';
import styles from './UsersItem.module.scss';
import { FaLock, FaUnlock, FaListAlt, FaEnvelope, FaPhone, FaBirthdayCake, FaClock, FaCircle } from 'react-icons/fa';
import { LockUserModal, UserOrdersModal } from './UserModals/UserModals';

const UsersItem = ({ user, refetch, index }) => {
    const [isLockModalOpen, setIsLockModalOpen] = useState(false);
    const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const formatLastActive = (dateString) => {
        if (!dateString) return 'Chưa xác định';
        
        const lastActive = new Date(dateString);
        const now = new Date();
        const diffMs = now - lastActive;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        
        return formatDate(dateString);
    };

    const getActivityStatusConfig = (activityStatus) => {
        switch(activityStatus) {
            case 'Online':
                return { label: 'Đang online', color: '#10b981', icon: '🟢' };
            case 'Offline':
                return { label: 'Offline', color: '#6b7280', icon: '⚫' };
            case 'Away':
                return { label: 'Vắng mặt', color: '#f59e0b', icon: '🟡' };
            default:
                return { label: 'Không xác định', color: '#9ca3af', icon: '⚪' };
        }
    };

    const activityConfig = getActivityStatusConfig(user.activityStatus);

    return (
        <>
            <div 
                className={styles.userCard} 
                style={{ animationDelay: `${index * 0.03}s` }}
            >
                {/* Avatar Section */}
                <div className={styles.avatarSection}>
                    <div className={styles.avatarWrapper}>
                        <img src={user.avatar} alt={user.fullName} className={styles.avatar} />
                        {/* Activity Status Dot */}
                        <div 
                            className={styles.activityDot}
                            style={{ backgroundColor: activityConfig.color }}
                            title={activityConfig.label}
                        />
                    </div>
                </div>

                {/* Content Section */}
                <div className={styles.contentSection}>
                    {/* Name and Badges Row */}
                    <div className={styles.nameRow}>
                        <h3 className={styles.userName}>{user.fullName}</h3>
                        <div className={styles.badgeGroup}>
                            {/* Activity Status Badge */}
                            <span 
                                className={styles.activityBadge}
                                style={{ 
                                    backgroundColor: `${activityConfig.color}15`,
                                    color: activityConfig.color,
                                    borderColor: activityConfig.color
                                }}
                            >
                                <FaCircle size={8} />
                                {activityConfig.label}
                            </span>
                            
                            {/* Account Status Badge */}
                            <span className={`${styles.statusBadge} ${user.status ? styles.statusActive : styles.statusLocked}`}>
                                {user.status ? (
                                    <>
                                        <FaUnlock size={12} />
                                        Hoạt động
                                    </>
                                ) : (
                                    <>
                                        <FaLock size={12} />
                                        Đã khóa
                                    </>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className={styles.infoGrid}>
                        <div className={styles.infoItem}>
                            <FaEnvelope className={styles.infoIcon} />
                            <span className={styles.infoText}>{user.email}</span>
                        </div>
                        
                        <div className={styles.infoItem}>
                            <FaPhone className={styles.infoIcon} />
                            <span className={styles.infoText}>{user.phone || 'Chưa cập nhật'}</span>
                        </div>
                        
                        <div className={styles.infoItem}>
                            <FaBirthdayCake className={styles.infoIcon} />
                            <span className={styles.infoText}>{formatDate(user.dateOfBirth)}</span>
                        </div>

                        <div className={styles.infoItem}>
                            <FaClock className={styles.infoIcon} />
                            <span className={styles.infoText} title={formatDate(user.lastActiveAt)}>
                                {formatLastActive(user.lastActiveAt)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Actions Section */}
                <div className={styles.actionsSection}>
                    <button 
                        className={`${styles.actionBtn} ${user.status ? styles.btnLock : styles.btnUnlock}`}
                        onClick={() => setIsLockModalOpen(true)}
                        title={user.status ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                    >
                        {user.status ? <FaLock /> : <FaUnlock />}
                    </button>

                    <button 
                        className={`${styles.actionBtn} ${styles.btnOrders}`}
                        onClick={() => setIsOrdersModalOpen(true)}
                        title="Xem đơn hàng"
                    >
                        <FaListAlt />
                    </button>
                </div>
            </div>

            {/* MODALS */}
            {isLockModalOpen && (
                <LockUserModal 
                    user={user} 
                    onClose={() => setIsLockModalOpen(false)} 
                    onSuccess={refetch} 
                />
            )}

            {isOrdersModalOpen && (
                <UserOrdersModal 
                    user={user} 
                    onClose={() => setIsOrdersModalOpen(false)} 
                />
            )}
        </>
    );
};

export default UsersItem;