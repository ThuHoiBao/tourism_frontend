import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './Header.module.scss';
import { FaPhoneAlt, FaCoins, FaEdit, FaListAlt, FaBell, FaInfoCircle, FaSignOutAlt, FaHeart, FaComment, FaReply, FaUserPlus, FaTicketAlt, FaCheckCircle, FaTimesCircle, FaCreditCard, FaExclamationCircle, FaUndo } from 'react-icons/fa';
import { IoIosAirplane } from "react-icons/io";
import { GiShipBow } from "react-icons/gi";
import { useAuth } from '../../context/AuthContext';
import axios from '../../utils/axiosCustomize';
import websocketService from '../../services/websocket';
import futureLogoLight from '../../assets/brand/future-logo-light.svg';
import futureLogoDark from '../../assets/brand/future-logo-dark.svg';

const NotificationDropdown = ({ styles, onClose, notifications, onMarkAsRead, onViewAll, onNotificationClick }) => {
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                onClose();
            }
        };
        
        setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 100);
        
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const formatTime = (timestamp) => {
        if (!timestamp) return 'Vừa xong';
        const now = new Date();
        const time = new Date(timestamp);
        if (isNaN(time.getTime())) return 'Vừa xong';
        const diff = Math.floor((now - time) / 1000);
        if (diff < 0) return 'Vừa xong';
        if (diff < 60) return 'Vừa xong';
        if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
        return time.toLocaleDateString('vi-VN');
    };

    const getNotificationMeta = (type) => {
        switch (type) {
            case 'POST_LIKED':
                return { icon: <FaHeart />, color: '#ef4444', bg: '#fef2f2' };
            case 'POST_COMMENTED':
                return { icon: <FaComment />, color: '#3b82f6', bg: '#eff6ff' };
            case 'COMMENT_REPLIED':
                return { icon: <FaReply />, color: '#8b5cf6', bg: '#f5f3ff' };
            case 'COMMENT_LIKED':
                return { icon: <FaHeart />, color: '#f97316', bg: '#fff7ed' };
            case 'NEW_POST_FROM_FOLLOWING':
                return { icon: <FaUserPlus />, color: '#10b981', bg: '#ecfdf5' };
            case 'NEW_COUPON':
            case 'COUPON_UPDATED':
            case 'COUPON_EXPIRING':
                return { icon: <FaTicketAlt />, color: '#f59e0b', bg: '#fffbeb' };
            case 'BOOKING_CONFIRMED':
                return { icon: <FaCheckCircle />, color: '#10b981', bg: '#ecfdf5' };
            case 'BOOKING_CANCELLED':
                return { icon: <FaTimesCircle />, color: '#ef4444', bg: '#fef2f2' };
            case 'REFUND_REQUESTED':
                return { icon: <FaUndo />, color: '#f59e0b', bg: '#fffbeb' };
            case 'REFUND_APPROVED':
                return { icon: <FaCheckCircle />, color: '#10b981', bg: '#ecfdf5' };
            case 'REFUND_REJECTED':
                return { icon: <FaTimesCircle />, color: '#ef4444', bg: '#fef2f2' };
            case 'PAYMENT_SUCCESS':
                return { icon: <FaCreditCard />, color: '#3b82f6', bg: '#eff6ff' };
            default:
                return { icon: <FaExclamationCircle />, color: '#6b7280', bg: '#f3f4f6' };
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className={styles.notificationDropdown} ref={dropdownRef}>
            <div className={styles.notificationHeader}>
                <div className={styles.notifHeaderLeft}>
                    <FaBell className={styles.notifHeaderIcon} />
                    <span>Thông báo</span>
                </div>
                {unreadCount > 0 && (
                    <span className={styles.notifBadge}>{unreadCount} mới</span>
                )}
            </div>

            <div className={styles.notificationList}>
                {notifications.length === 0 ? (
                    <div className={styles.emptyNotification}>
                        <div className={styles.emptyIconWrap}>
                            <FaBell className={styles.emptyIcon} />
                        </div>
                        <p>Chưa có thông báo nào</p>
                        <span>Các hoạt động sẽ xuất hiện ở đây</span>
                    </div>
                ) : (
                    notifications.map((notification) => {
                        const meta = getNotificationMeta(notification.type);
                        return (
                            <div
                                key={notification.notificationID}
                                className={`${styles.notificationItem} ${!notification.isRead ? styles.unread : ''}`}
                                onClick={() => onNotificationClick(notification)}
                            >
                                <div
                                    className={styles.notifIconWrap}
                                    style={{ background: meta.bg, color: meta.color }}
                                >
                                    {meta.icon}
                                </div>
                                <div className={styles.notificationContent}>
                                    <h4>{notification.title}</h4>
                                    <p>{notification.message}</p>
                                    <span className={styles.notificationTime}>
                                        {formatTime(notification.createdAt)}
                                    </span>
                                </div>
                                {!notification.isRead && <div className={styles.unreadDot} />}
                            </div>
                        );
                    })
                )}
            </div>

            {notifications.length > 0 && (
                <div className={styles.viewAllLink} onClick={onViewAll}>
                    Xem tất cả thông báo
                </div>
            )}
        </div>
    );
};

const ProfileModal = ({ styles, onClose, user, onLogout }) => {
    const navigate = useNavigate();
    const fullName = user?.fullName || 'Khách hàng';
    const coinBalance = user?.coinBalance || 0;

    const handleMenuClick = (tab) => {
        onClose();
        navigate(`/information/${tab}`);
    };

    const handleLogoutClick = () => {
        onClose();
        onLogout();
    };

    return (
        <div className={styles.profileModal}>
            <div className={styles.modalHeader}>
                <span className={styles.modalUsername}>{fullName}</span>
                <span className={styles.modalStatus}>
                    <FaCoins className={styles.coinIcon} /> {coinBalance} Điểm
                </span>
                <span className={styles.memberTier}>Bạn là thành viên Future Travel</span>
            </div>
            <ul className={styles.modalMenu}>
                <li onClick={() => handleMenuClick('profile')}><FaEdit /> Hồ sơ cá nhân</li>
                <li onClick={() => handleMenuClick('transaction')}><FaListAlt /> Danh sách giao dịch</li>
                <li onClick={() => handleMenuClick('favorites')}><FaInfoCircle /> Chuyến đi yêu thích</li>
                <li onClick={handleLogoutClick}><FaSignOutAlt /> Đăng xuất</li>
            </ul>
        </div>
    );
};


const Header = () => {
    const { user, isAuthenticated, loading, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const headerRef = useRef(null); // direct DOM ref for zero-latency scroll class toggle

    const currentPath = location.pathname;
    const isHomePage = currentPath === '/';
    const isInformationPage = currentPath.startsWith('/information');
    const isToursPage = currentPath.startsWith('/tours');

    const userId = user?.id || user?.userID;

    const fetchUnreadCount = useCallback(async () => {
        if (!isAuthenticated || !userId) {
            console.log('Skip fetchUnreadCount: not authenticated or no userId');
            console.log('isAuthenticated:', isAuthenticated, 'userId:', userId);
            return;
        }

        console.log('🔔 Fetching unread count for user:', userId);
        
        try {
            const response = await axios.get('/notifications/unread-count', { params: { userId } });
            console.log('✅ Unread Count Response:', response);

            let count = 0;
            
            if (typeof response.data === 'number') {
                count = response.data;
            } else if (response.data && typeof response.data.count === 'number') {
                count = response.data.count;
            } else if (response.data && typeof response.data.total === 'number') {
                count = response.data.total;
            } else if (response.data && typeof response.data.data === 'number') {
                count = response.data.data;
            } else {
                console.warn('Unexpected response format:', response.data);
            }

            console.log('📊 Setting unread count to:', count);
            setUnreadCount(count);
        } catch (error) {
            console.error('❌ Error fetching unread count:', error);
            console.error('Error details:', error.response?.data);
        }
    }, [isAuthenticated, userId]);

    const handleViewAllNotifications = async () => {
        setIsNotificationOpen(false);

        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

        try {
            await axios.put('/notifications/read-all', null, { params: { userId } });
            console.log('✅ Marked all as read');
        } catch (error) {
            console.error('❌ Error marking all as read:', error);
            fetchUnreadCount();
        }
    };

    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated || !userId) return;

        console.log('📥 Fetching notifications for user:', userId);
        
        try {
            const response = await axios.get('/notifications', {
                params: { userId, page: 0, size: 10 }
            });
            console.log('✅ Notifications Response:', response);
            const sorted = (response.data.content || []).sort((a, b) => {
                if (!a.createdAt && !b.createdAt) return b.notificationID - a.notificationID;
                if (!a.createdAt) return 1;
                if (!b.createdAt) return -1;
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            setNotifications(sorted);
        } catch (error) {
            console.error('❌ Error fetching notifications:', error);
            setNotifications([]);
        }
    }, [isAuthenticated, userId]);

    const handleMarkAsRead = async (notificationID) => {
        if (!notificationID) return;

        console.log('📝 Marking notification as read:', notificationID);

        setNotifications(prev => prev.map(notif =>
            notif.notificationID === notificationID ? { ...notif, isRead: true } : notif
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            await axios.put(`/notifications/${notificationID}/read`);
            console.log('✅ Marked as read successfully');
            fetchUnreadCount();
        } catch (error) {
            console.error('❌ Error marking notification as read:', error);
            fetchNotifications();
            fetchUnreadCount();
        }
    };

    const getNotificationLink = (notification) => {
        const type = notification.type;
        const meta = notification.metadata;
        const postId = meta?.postId;
        const commentId = meta?.commentId;
        const parentCommentId = meta?.parentCommentId;

        if (['POST_LIKED', 'POST_COMMENTED', 'COMMENT_REPLIED', 'COMMENT_LIKED', 'NEW_POST_FROM_FOLLOWING'].includes(type)) {
            if (!postId) return '/forum';
            // Với comment/reply → scroll đến đúng comment đó
            const anchor = commentId
                ? `#comment-${parentCommentId || commentId}`
                : '';
            return `/forum/post/${postId}${anchor}`;
        }
        if (['BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_PENDING', 'REFUND_REQUESTED', 'REFUND_APPROVED', 'REFUND_REJECTED',
             'BOOKING_REFUND_REQUESTED', 'BOOKING_REFUNDED'].includes(type)) {
            return '/information/transaction';
        }
        if (['NEW_COUPON', 'COUPON_UPDATED', 'COUPON_EXPIRING'].includes(type)) {
            return '/tours';
        }
        return null;
    };

    const extractBookingCode = (notification) => {
        // 1. Ưu tiên lấy từ metadata (thông báo mới)
        if (notification.metadata?.bookingCode) return notification.metadata.bookingCode;
        // 2. Fallback: extract từ message text (thông báo cũ chưa có metadata)
        //    Pattern: "Booking BKxxxxxxxx " hoặc "booking BKxxxxxxxx "
        const match = (notification.message || '').match(/[Bb]ooking\s+(BK[A-Za-z0-9]+)/);
        return match ? match[1] : null;
    };

    const handleNotificationItemClick = async (notification) => {
        if (!notification.isRead) {
            handleMarkAsRead(notification.notificationID);
        }
        setIsNotificationOpen(false);
        const link = getNotificationLink(notification);
        if (!link) return;

        if (link === '/information/transaction') {
            const bookingCode = extractBookingCode(notification);
            navigate(link, bookingCode ? { state: { bookingCode } } : {});
        } else {
            navigate(link);
        }
    };

    const handleNotificationClick = async () => {
        console.log('🔔 Notification bell clicked');
        
        const willBeOpen = !isNotificationOpen;
        setIsNotificationOpen(willBeOpen);

        if (willBeOpen) {
            setIsModalOpen(false);
            await fetchNotifications();
        }
    };

    useEffect(() => {
        console.log('🚀 Main effect triggered');
        console.log('isAuthenticated:', isAuthenticated);
        console.log('user:', user);
        console.log('userId:', userId);

        if (!isAuthenticated || !userId) {
            console.log('⏸️ Skip: User not authenticated or no userId');
            return;
        }

        console.log('✅ User authenticated, fetching data...');

        fetchUnreadCount();

        const token = localStorage.getItem('access_token');
        if (token) {
            console.log('🔌 Connecting WebSocket for user:', userId);
            
            websocketService.connect(userId, token, (notification) => {
                console.log('📬 Real-time notification received:', notification);
                
                setNotifications(prev => [notification, ...prev]);
                setUnreadCount(prev => prev + 1);
                
                fetchUnreadCount();

                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(notification.title, {
                        body: notification.message,
                        icon: '/favicon.svg'
                    });
                }
            });
        }

        const interval = setInterval(() => {
            console.log('⏰ Polling interval - fetching unread count');
            fetchUnreadCount();
        }, 60000); 
        return () => {
            console.log('🧹 Cleanup: clearing interval and disconnecting WebSocket');
            clearInterval(interval);
            websocketService.disconnect();
        };
    }, [isAuthenticated, userId, fetchUnreadCount]);

    useEffect(() => {
        if (isAuthenticated && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log('🔔 Notification permission:', permission);
            });
        }
    }, [isAuthenticated]);

    useEffect(() => {
        // Pages with a hero image start transparent, then turn white on scroll.
        const isTransparentRoute = isHomePage || isInformationPage || isToursPage;
        const el = headerRef.current;

        // Immediately set correct class on route change (no animation needed here)
        if (isTransparentRoute) {
            setScrolled(false);
            if (el) { el.classList.remove(styles.headerScrolled); el.classList.add(styles.headerHero); }
        } else {
            setScrolled(true);
            if (el) { el.classList.remove(styles.headerHero); el.classList.add(styles.headerScrolled); }
        }

        const handleScroll = () => {
            if (!isTransparentRoute || !el) return;
            const shouldScroll = window.scrollY > 50;
            // Direct DOM toggle — CSS transition fires THIS frame, no React re-render lag
            if (shouldScroll) {
                el.classList.remove(styles.headerHero);
                el.classList.add(styles.headerScrolled);
            } else {
                el.classList.remove(styles.headerScrolled);
                el.classList.add(styles.headerHero);
            }
            // setScrolled only swaps the logo src — React re-render is fine here
            // because classList is already correct, so no visual jump
            setScrolled(shouldScroll);
        };

        if (isTransparentRoute) {
            window.addEventListener('scroll', handleScroll, { passive: true });
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, [isHomePage, isInformationPage, isToursPage]);

    const getNavLinkClass = (path) => {
        if (path === '/') return currentPath === '/' ? styles.navLinkActive : styles.navLink;
        return currentPath.startsWith(path) ? styles.navLinkActive : styles.navLink;
    };

    const handleProfileClick = () => {
        if (isAuthenticated) {
            setIsNotificationOpen(false); 
            setIsModalOpen(!isModalOpen);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            setIsModalOpen(false);
            setNotifications([]);
            setUnreadCount(0);
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isModalOpen && !e.target.closest(`.${styles.profileContainer}`)) {
                setIsModalOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isModalOpen]);

    const isHeroHeader = (isHomePage || isInformationPage || isToursPage) && !scrolled;
    const logoSrc = isHeroHeader ? futureLogoLight : futureLogoDark;
    const headerClasses = `${styles.header} ${scrolled ? styles.headerScrolled : styles.headerHero}`;

    if (loading) {
        return (
            <div ref={headerRef} className={headerClasses}>
                <div className={styles.headerLeft}>
                    <Link className={styles.logo} to="/">
                        <img className={styles.logoImage} src={logoSrc} alt="Future Travel" />
                    </Link>
                </div>
                <div className={styles.headerRight}>
                    <span className={styles.loading}>Đang tải...</span>
                </div>
            </div>
        );
    }

    return (
        <div ref={headerRef} className={headerClasses}>
            <div className={styles.headerLeft}>
                <Link className={styles.logo} to="/">
                    <img className={styles.logoImage} src={logoSrc} alt="Future Travel" />
                </Link>
                <Link to="/" className={getNavLinkClass('/')}>Trang chủ</Link>
                <Link to="/tours" className={getNavLinkClass('/tours')}>Chuyến đi</Link>
                <Link to="/forum" className={getNavLinkClass('/forum')}>Diễn đàn</Link>

                <Link to="/flights" className={getNavLinkClass('/flights')}><IoIosAirplane /> Vé máy bay</Link>
                <Link to="/entertainment" className={getNavLinkClass('/entertainment')}>Vui chơi giải trí</Link>
                <Link to="/trains" className={getNavLinkClass('/trains')}><GiShipBow /> Vé tàu</Link>
            </div>

            <div className={styles.headerRight}>
                {isAuthenticated && user ? (
                    <div className={styles.profileContainer}>
                        <span className={styles.phone}>
                            <FaPhoneAlt /> 1900 2045
                        </span>

                        {/* Notification Bell */}
                        <div className={styles.notificationBellContainer}>
                            <button
                                className={`${styles.notificationBell} ${isNotificationOpen ? styles.active : ''}`}
                                onClick={handleNotificationClick}
                                type="button"
                            >
                                <FaBell />
                                {unreadCount > 0 && (
                                    <span className={styles.notificationBadge}>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </button>
                            {isNotificationOpen && (
                                <NotificationDropdown
                                    styles={styles}
                                    onClose={() => setIsNotificationOpen(false)}
                                    notifications={notifications}
                                    onMarkAsRead={handleMarkAsRead}
                                    onViewAll={handleViewAllNotifications}
                                    onNotificationClick={handleNotificationItemClick}
                                />
                            )}
                        </div>

                        <div
                            className={`${styles.user} ${isModalOpen ? styles.userActive : ''}`}
                            onClick={handleProfileClick}
                        >
                            {user.fullName || 'User'}
                            <FaCoins className={styles.coinIndicator} />
                        </div>

                        {isModalOpen && (
                            <ProfileModal
                                styles={styles}
                                onClose={() => setIsModalOpen(false)}
                                user={user}
                                onLogout={handleLogout}
                            />
                        )}
                    </div>
                ) : (
                    <div className={styles.authContainer}>
                        <span className={styles.phone}>
                            <FaPhoneAlt /> 1900 2045
                        </span>
                        <div className={styles.authButtons}>
                            <Link to="/login" className={styles.loginButton}>Đăng nhập</Link>
                            <Link to="/register" className={styles.registerButton}>Đăng ký</Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Header;
