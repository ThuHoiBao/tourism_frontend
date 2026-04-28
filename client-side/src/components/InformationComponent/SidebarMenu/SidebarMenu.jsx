import React from 'react';
import { FaEdit, FaListAlt, FaInfoCircle, FaSignOutAlt } from 'react-icons/fa';
import styles from './SidebarMenu.module.scss';
import { useAuth } from '../../../context/AuthContext';

const SidebarMenu = ({ activeTab, onMenuClick, onAvatarClick }) => {
    const { logout, user: authUser } = useAuth();
    
    const currentUser = authUser?.data || authUser;
    
    console.log('=== SIDEBAR DEBUG ===');
    console.log('authUser:', authUser);
    console.log('currentUser:', currentUser);
    console.log('====================');
    
    if (!currentUser) {
        return <div className={styles.sidebar}>Loading...</div>;
    }
    
    const menuItems = [
        { id: 'profile', label: 'Hồ sơ cá nhân', icon: FaEdit },
        { id: 'transaction', label: 'Danh sách giao dịch', icon: FaListAlt },
        { id: 'favorites', label: 'Tour yêu thích', icon: FaInfoCircle },
    ];

    const handleLogout = async () => {
        await logout();
    };
    
    return (
        <div className={styles.sidebar}>
            <ul className={styles.menuList}>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    
                    return (
                        <li
                            key={item.id}
                            className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`}
                            onClick={() => onMenuClick(item.id)}
                        >
                            <Icon className={styles.menuIcon} />
                            <span>{item.label}</span>
                        </li>
                    );
                })}
                
                <li className={styles.menuItem} onClick={handleLogout}>
                    <FaSignOutAlt className={styles.menuIcon} />
                    <span>Đăng xuất</span>
                </li>
            </ul>
        </div>
    );
};

export default SidebarMenu;