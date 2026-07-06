import React, { useState } from 'react';
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
    TreePine,
    Bot,
    ChevronDown,
    Briefcase,
    ClipboardList,
    UsersRound,
    Cog
} from 'lucide-react';
import styles from './AdminSidebar.module.scss';
import futureLogoDark from '../../../../assets/brand/future-logo-dark.svg';
import { useConsultationAlertsContext } from '../../../../context/ConsultationAlertsContext';

// Cấu trúc menu gom nhóm.
// - Mục có `path` (không có `children`)  -> item đứng riêng, không dropdown.
// - Mục có `children`                    -> dropdown, có thể đóng/mở.
const navGroups = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    {
        name: 'Kinh doanh Tour',
        icon: Briefcase,
        children: [
            { name: 'Quản lý Tours', path: '/admin/tours', icon: Map },
            { name: 'Lịch khởi hành', path: '/admin/departures', icon: Plane },
            { name: 'Địa điểm', path: '/admin/locations', icon: MapPin },
            { name: 'Coupons', path: '/admin/coupons', icon: Ticket },
        ],
    },
    {
        name: 'Vận hành Đặt tour',
        icon: ClipboardList,
        children: [
            { name: 'Quản lý Bookings', path: '/admin/bookings', icon: CalendarCheck2 },
            { name: 'Sự cố Bookings', path: '/admin/dead-events', icon: Skull },
        ],
    },
    {
        name: 'Cộng đồng & Điểm thưởng',
        icon: MessagesSquare,
        children: [
            { name: 'Quản lý Diễn đàn', path: '/admin/forum', icon: MessagesSquare },
            { name: 'Hoàn Điểm', path: '/admin/coin-withdrawals', icon: Landmark },
            { name: 'Quỹ Xanh', path: '/admin/green-fund', icon: TreePine },
        ],
    },
    {
        name: 'Khách hàng',
        icon: UsersRound,
        children: [
            { name: 'Quản lý Users', path: '/admin/users', icon: Users },
            { name: 'Yêu cầu tư vấn', path: '/admin/consultations', icon: Headphones, badge: 'consultation' },
        ],
    },
    {
        name: 'Hệ thống',
        icon: Cog,
        children: [
            { name: 'Chi nhánh & Chính sách', path: '/admin/branches-policies', icon: Building2 },
            { name: 'Dữ liệu trợ lý ảo', path: '/admin/chatbot-sync', icon: Bot },
            { name: 'Settings', path: '/admin/settings', icon: Settings },
        ],
    },
];

const AdminSidebar = () => {
    const location = useLocation();
    const { pendingCount } = useConsultationAlertsContext();

    const isActive = (path) => location.pathname.startsWith(path);
    const groupIsActive = (group) => group.children?.some((c) => isActive(c.path));

    // Mở sẵn nhóm đang chứa trang hiện tại (auto-expand).
    const [openGroups, setOpenGroups] = useState(() => {
        const initial = {};
        navGroups.forEach((g) => {
            if (g.children && g.children.some((c) => isActive(c.path))) {
                initial[g.name] = true;
            }
        });
        return initial;
    });

    const toggleGroup = (name) =>
        setOpenGroups((prev) => ({ ...prev, [name]: !prev[name] }));

    const renderBadge = () =>
        pendingCount > 0 ? (
            <span className={styles.navBadge}>{pendingCount > 99 ? '99+' : pendingCount}</span>
        ) : null;

    return (
        <div className={styles.adminSidebar}>
            <div className={styles.logoSection}>
                <img className={styles.logo} src={futureLogoDark} alt="Future Travel" />
            </div>

            <span className={styles.groupLabel}>Menu chính</span>

            <nav>
                <ul className={styles.menuList}>
                    {navGroups.map((group) => {
                        // Item đứng riêng (không có children) -> render như link thường.
                        if (!group.children) {
                            return (
                                <li
                                    key={group.path}
                                    className={`${styles.menuItem} ${isActive(group.path) ? styles.menuItemActive : ''}`}
                                >
                                    <Link to={group.path} title={group.name}>
                                        <group.icon className={styles.menuIcon} size={17} />
                                        <span className={styles.menuLabel}>{group.name}</span>
                                    </Link>
                                </li>
                            );
                        }

                        const open = !!openGroups[group.name];
                        const active = groupIsActive(group);
                        const hasConsult = group.children.some((c) => c.badge === 'consultation');
                        // Khi dropdown đóng, đẩy badge lên header nhóm để không bị ẩn.
                        const showGroupBadge = hasConsult && !open;

                        return (
                            <li key={group.name} className={styles.groupItem}>
                                <button
                                    type="button"
                                    className={`${styles.groupHeader} ${active ? styles.groupHeaderActive : ''}`}
                                    onClick={() => toggleGroup(group.name)}
                                    aria-expanded={open}
                                    title={group.name}
                                >
                                    <group.icon className={styles.menuIcon} size={17} />
                                    <span className={styles.menuLabel}>{group.name}</span>
                                    {showGroupBadge && renderBadge()}
                                    <ChevronDown
                                        className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
                                        size={15}
                                    />
                                </button>

                                <ul className={`${styles.submenu} ${open ? styles.submenuOpen : ''}`}>
                                    {group.children.map((item) => {
                                        const isConsult = item.badge === 'consultation';
                                        return (
                                            <li
                                                key={item.path}
                                                className={`${styles.subItem} ${isActive(item.path) ? styles.subItemActive : ''}`}
                                            >
                                                <Link to={item.path} title={item.name}>
                                                    <item.icon className={styles.subIcon} size={15} />
                                                    <span className={styles.menuLabel}>{item.name}</span>
                                                    {isConsult && renderBadge()}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className={styles.footerSection}>
                <ul className={styles.menuList}>
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
