import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import styles from './Header.module.scss';
import { FaPhoneAlt, FaCoins, FaEdit, FaListAlt, FaBell, FaInfoCircle, FaSignOutAlt } from 'react-icons/fa';
import { IoIosAirplane } from "react-icons/io";
import { GiShipBow } from "react-icons/gi";
import { useAuth } from '../../context/AuthContext';
import axios from '../../utils/axiosCustomize';
import websocketService from '../../services/websocket';

const NotificationDropdown = ({ styles, onClose, notifications, onMarkAsRead, onViewAll }) => {
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
        const now = new Date();
        const time = new Date(timestamp);
        const diff = Math.floor((now - time) / 1000);

        if (diff < 60) return 'Vừa xong';
        if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
        return time.toLocaleDateString('vi-VN');
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'NEW_COUPON':
            case 'COUPON_UPDATED':
            case 'COUPON_EXPIRING': return '🎟️';
            case 'BOOKING_CONFIRMED':
            case 'BOOKING_CANCELLED': return '✈️';
            case 'PAYMENT_SUCCESS': return '💳';
            default: return '📢';
        }
    };

    return (
        <div className={styles.notificationDropdown} ref={dropdownRef}>
            <div className={styles.notificationHeader}>
                <h3>Thông báo</h3>
            </div>
            <div className={styles.notificationList}>
                {notifications.length === 0 ? (
                    <div className={styles.emptyNotification}>
                        <FaBell className={styles.emptyIcon} />
                        <p>Không có thông báo mới</p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.notificationID}
                            className={`${styles.notificationItem} ${!notification.isRead ? styles.unread : ''}`}
                            onClick={() => onMarkAsRead(notification.notificationID)}
                        >
                            <div className={styles.notificationIcon}>
                                {getNotificationIcon(notification.type)}
                            </div>
                            <div className={styles.notificationContent}>
                                <h4>{notification.title}</h4>
                                <p>{notification.message}</p>
                                <span className={styles.notificationTime}>
                                    {formatTime(notification.createdAt)}
                                </span>
                            </div>
                            {!notification.isRead && <div className={styles.unreadDot}></div>}
                        </div>
                    ))
                )}
            </div>
           {notifications.length > 0 && (
                <div 
                    className={styles.viewAllLink} 
                    onClick={onViewAll}
                    style={{ cursor: 'pointer' }} 
                >
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
                <li onClick={() => handleMenuClick('favorites')}><FaInfoCircle /> Tour yêu thích</li>
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

    const currentPath = location.pathname;
    const isHomePage = currentPath === '/';
    const isInformationPage = currentPath.startsWith('/information');

    const userId = user?.id || user?.userID;

    const fetchUnreadCount = useCallback(async () => {
        if (!isAuthenticated || !userId) {
            console.log('Skip fetchUnreadCount: not authenticated or no userId');
            console.log('isAuthenticated:', isAuthenticated, 'userId:', userId);
            return;
        }

        console.log('🔔 Fetching unread count for user:', userId);
        
        try {
            const response = await axios.get('/notifications/unread-count');
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
            await axios.put('/notifications/read-all');
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
                params: { page: 0, size: 10 }
            });
            console.log('✅ Notifications Response:', response);
            setNotifications(response.data.content || []);
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
                        icon: '/favicon.ico'
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
        // Transparent on top for Home and Information pages, turn blue on scroll
        const isTransparentRoute = isHomePage || isInformationPage;

        const handleScroll = () => {
            if (isTransparentRoute) {
                setScrolled(window.scrollY > 2);
            }
        };

        if (isTransparentRoute) {
            window.addEventListener('scroll', handleScroll);
            handleScroll();
        } else {
            setScrolled(true);
        }

        return () => window.removeEventListener('scroll', handleScroll);
    }, [isHomePage, isInformationPage]);

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

    const headerClasses = `${styles.header} ${scrolled ? styles.headerScrolled : ''}`;

    if (loading) {
        return (
            <div className={headerClasses}>
                <div className={styles.headerLeft}>
                    <span className={styles.logo}>Future</span>
                </div>
                <div className={styles.headerRight}>
                    <span className={styles.loading}>Đang tải...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={headerClasses}>
            <div className={styles.headerLeft}>
                <Link className={styles.logo} to="/"><img className={styles.logos} src='https://res.cloudinary.com/dnt8vx1at/image/upload/v1766193584/FT_kpfvjq.png'/></Link>
                <Link to="/" className={getNavLinkClass('/')}>Trang chủ</Link>
                <Link to="/tours" className={getNavLinkClass('/tours')}>Tours</Link>
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