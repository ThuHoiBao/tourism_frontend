import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Map,
    CalendarCheck2,
    Ticket,
    MapPin,
    Building2,
    Users,
    Skull,
    Landmark,
    Settings,
    LogOut,
    Plane,
    MessagesSquare,
    Headphones,
    Bot
} from 'lucide-react';
import styles from './AdminSidebar.module.scss';
import futureLogoDark from '../../../../assets/brand/future-logo-dark.svg';
import { useConsultationAlertsContext } from '../../../../context/ConsultationAlertsContext';

const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Đồng bộ Chatbot', path: '/admin/chatbot-sync', icon: Bot },
    { name: 'Quản lý Tours', path: '/admin/tours', icon: Map },
    { name: 'Quản lý Departure', path: '/admin/departures', icon: Plane },
    { name: 'Quản lý Bookings', path: '/admin/bookings', icon: CalendarCheck2 },
    { name: 'Quản lý Coupons', path: '/admin/coupons', icon: Ticket },
    { name: 'Quản lý Locations', path: '/admin/locations', icon: MapPin },
    { name: 'Quản lý Branches Policies', path: '/admin/branches-policies', icon: Building2 },
    { name: 'Quản lý Users', path: '/admin/users', icon: Users },
    { name: 'Quản lý Hoàn Điểm', path: '/admin/coin-withdrawals', icon: Landmark },
    { name: 'Quản lý sự cố Bookings', path: '/admin/dead-events', icon: Skull },
    { name: 'Quản lý Diễn đàn', path: '/admin/forum', icon: MessagesSquare },
    { name: 'Yêu cầu tư vấn', path: '/admin/consultations', icon: Headphones },
];

const AdminSidebar = () => {
    const location = useLocation();
    const isActive = (path) => location.pathname.startsWith(path);
    const { pendingCount } = useConsultationAlertsContext();

    return (
        <div className={styles.adminSidebar}>
            <div className={styles.logoSection}>
                <img className={styles.logo} src={futureLogoDark} alt="Future Travel" />
            </div>

            <span className={styles.groupLabel}>Menu chính</span>

            <nav>
                <ul className={styles.menuList}>
                    {navItems.map(item => {
                        const isConsult = item.path === '/admin/consultations';
                        return (
                            <li
                                key={item.path}
                                className={`${styles.menuItem} ${isActive(item.path) ? styles.menuItemActive : ''}`}
                            >
                                <Link to={item.path}>
                                    <item.icon className={styles.menuIcon} size={17} />
                                    <span className={styles.menuLabel}>{item.name}</span>
                                    {isConsult && pendingCount > 0 && (
                                        <span className={styles.navBadge}>{pendingCount > 99 ? '99+' : pendingCount}</span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className={styles.footerSection}>
                <ul className={styles.menuList}>
                    <li className={styles.menuItem}>
                        <Link to="/admin/settings">
                            <Settings className={styles.menuIcon} size={17} />
                            <span className={styles.menuLabel}>Settings</span>
                        </Link>
                    </li>
                    <li className={`${styles.menuItem} ${styles.logout}`}>
                        <Link to="/logout">
                            <LogOut className={styles.menuIcon} size={17} />
                            <span className={styles.menuLabel}>Logout</span>
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default AdminSidebar;
