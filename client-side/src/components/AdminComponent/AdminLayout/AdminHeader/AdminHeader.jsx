import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaBell, FaGlobe, FaCaretDown, FaSignOutAlt, FaUser } from 'react-icons/fa';
import styles from './AdminHeader.module.scss';
import axios from '../../../../utils/axiosCustomize';
import { toast } from 'react-toastify';

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
                await axios.post('/admin/auth/logout', {
                    refreshToken: refreshToken
                });
            }

            localStorage.removeItem('adminAccessToken');
            localStorage.removeItem('adminRefreshToken');
            localStorage.removeItem('adminUser');

            toast.success('Đăng xuất thành công');
            navigate('/admin/login', { replace: true });

        } catch (error) {
            console.error('Logout error:', error);
            
            // Still clear localStorage even if API fails
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
               <img className={styles.logo} src='https://res.cloudinary.com/dnt8vx1at/image/upload/v1766193584/FT_kpfvjq.png'></img>
            </div>

            <div className={styles.centerSection}>
                <div className={styles.searchBar}>
                    <FaSearch className={styles.searchIcon} />
                    <input type="text" placeholder="Tìm kiếm..." />
                </div>
            </div>

            <div className={styles.rightSection}>
                <div className={styles.languageSelect}>
                    <FaGlobe className={styles.languageIcon} /> 
                    <span>Tiếng Việt</span>
                    <FaCaretDown className={styles.dropdownIcon} />
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
                        <FaCaretDown className={styles.dropdownIcon} />
                    </div>

                    {/* Dropdown Menu */}
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

                            <button 
                                className={styles.menuItem}
                                onClick={handleProfile}
                            >
                                <FaUser className={styles.menuIcon} />
                                <span>Thông tin cá nhân</span>
                            </button>

                            <div className={styles.menuDivider}></div>

                            <button 
                                className={`${styles.menuItem} ${styles.logout}`}
                                onClick={handleLogout}
                            >
                                <FaSignOutAlt className={styles.menuIcon} />
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