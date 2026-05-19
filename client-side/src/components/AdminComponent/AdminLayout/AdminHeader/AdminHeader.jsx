import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Globe, ChevronDown, LogOut, User } from 'lucide-react';
import styles from './AdminHeader.module.scss';
import axios from '../../../../utils/axiosCustomize';
import { toast } from 'react-toastify';
import futureLogoDark from '../../../../assets/brand/future-logo-dark.svg';

const AdminHeader = () => {
    const navigate = useNavigate();
    const [adminUser, setAdminUser] = useState(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const profileMenuRef = useRef(null);

    useEffect(() => {
        const adminUserStr = localStorage.getItem('adminUser');
        if (adminUserStr) {
            try {
                const user = JSON.parse(adminUserStr);
                setAdminUser(user);
            } catch (error) {
                console.error('Error parsing admin user:', error);
            }
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        try {
            const refreshToken = localStorage.getItem('adminRefreshToken');
            if (refreshToken) {
                await axios.post('/admin/auth/logout', { refreshToken });
            }

            localStorage.removeItem('adminAccessToken');
            localStorage.removeItem('adminRefreshToken');
            localStorage.removeItem('adminUser');

            toast.success('Đăng xuất thành công');
            navigate('/admin/login', { replace: true });

        } catch (error) {
            console.error('Logout error:', error);

            localStorage.removeItem('adminAccessToken');
            localStorage.removeItem('adminRefreshToken');
            localStorage.removeItem('adminUser');

            navigate('/admin/login', { replace: true });
        }
    };

    const handleProfile = () => {
        setShowProfileMenu(false);
        navigate('/admin/profile');
    };

    const getInitials = (name) => {
        if (!name) return 'AD';
        const names = name.split(' ');
        if (names.length >= 2) {
            return (names[0][0] + names[names.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const getRoleDisplay = (role) => {
        const roleMap = {
            'ADMIN': 'Quản trị viên',
            'STAFF': 'Nhân viên'
        };
        return roleMap[role] || role;
    };

    return (
        <header className={styles.adminHeader}>
            <div className={styles.leftSection}>
                <img className={styles.logo} src={futureLogoDark} alt="Future Travel" />
            </div>

            <div className={styles.centerSection}>
                <div className={styles.searchBar}>
                    <Search className={styles.searchIcon} size={15} />
                    <input type="text" placeholder="Tìm kiếm..." />
                </div>
            </div>

            <div className={styles.rightSection}>
                <div className={styles.languageSelect}>
                    <Globe className={styles.languageIcon} size={15} />
                    <span>Tiếng Việt</span>
                    <ChevronDown className={styles.dropdownIcon} size={13} />
                </div>

                <div className={styles.profileWrapper} ref={profileMenuRef}>
                    <div
                        className={styles.profile}
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        <div className={styles.avatar}>
                            {adminUser?.avatar ? (
                                <img src={adminUser.avatar} alt="Admin Avatar" />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    {getInitials(adminUser?.fullName)}
                                </div>
                            )}
                        </div>
                        <div className={styles.userText}>
                            <span className={styles.userName}>
                                {adminUser?.fullName || 'Admin'}
                            </span>
                            <span className={styles.userRole}>
                                {getRoleDisplay(adminUser?.role)}
                            </span>
                        </div>
                        <ChevronDown className={styles.dropdownIcon} size={13} />
                    </div>

                    {showProfileMenu && (
                        <div className={styles.profileMenu}>
                            <div className={styles.menuHeader}>
                                <div className={styles.menuAvatar}>
                                    {adminUser?.avatar ? (
                                        <img src={adminUser.avatar} alt="Avatar" />
                                    ) : (
                                        <div className={styles.avatarPlaceholder}>
                                            {getInitials(adminUser?.fullName)}
                                        </div>
                                    )}
                                </div>
                                <div className={styles.menuUserInfo}>
                                    <p className={styles.menuUserName}>
                                        {adminUser?.fullName || 'Admin'}
                                    </p>
                                    <p className={styles.menuUserEmail}>
                                        {adminUser?.email}
                                    </p>
                                </div>
                            </div>

                            <div className={styles.menuDivider}></div>

                            <button className={styles.menuItem} onClick={handleProfile}>
                                <User className={styles.menuIcon} size={15} />
                                <span>Thông tin cá nhân</span>
                            </button>

                            <div className={styles.menuDivider}></div>

                            <button
                                className={`${styles.menuItem} ${styles.logout}`}
                                onClick={handleLogout}
                            >
                                <LogOut className={styles.menuIcon} size={15} />
                                <span>Đăng xuất</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
