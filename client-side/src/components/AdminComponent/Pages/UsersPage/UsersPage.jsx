// src/components/AdminComponent/Pages/UsersPage/UsersPage.jsx

import React, { useState, useEffect } from 'react';
import styles from './UsersPage.module.scss';
import { FaUsers, FaSearch, FaRedoAlt } from 'react-icons/fa';
import { Users, UserCheck, UserX, UserPlus } from 'lucide-react';
import useAdminUsers from '../../../../hook/useAdminUsers.ts';
import useWebSocket from '../../../../hook/useWebSocket.ts';
import UsersItem from './UsersItem';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../../../services/api';

const UsersPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const getInitialEmail = () => {
        const params = new URLSearchParams(location.search);
        return params.get('search') || '';
    };

    const initialEmail = getInitialEmail();

    const [searchForm, setSearchForm] = useState({ 
        fullName: '', 
        phone: '', 
        email: initialEmail
    });

    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 6;

    const [activeSearch, setActiveSearch] = useState({ 
        fullName: null, 
        phone: null, 
        email: initialEmail || null
    });

    const {users, loading, totalPages, totalElements, refetch, updateUserInList } = useAdminUsers(activeSearch, currentPage, pageSize);

    const [userStats, setUserStats] = useState({ total: 0, active: 0, locked: 0, newThisMonth: 0 });
    useEffect(() => {
        const fetchUserStats = async () => {
            try {
                const res = await api.get('/admin/users/stats');
                const data = res.data;
                setUserStats({
                    total: data.totalUsers ?? 0,
                    active: data.activeUsers ?? 0,
                    locked: data.lockedUsers ?? 0,
                    newThisMonth: data.newUsersThisMonth ?? 0,
                });
            } catch (e) {
                console.error('Failed to fetch user stats', e);
            }
        };
        fetchUserStats();
    }, []);

    useWebSocket({
        topic: '/topic/user-activity',
        onMessage: (userData) => {
            console.log('User activity update:', userData);
            updateUserInList(userData);
        },
        enabled: true
    });
    
    useWebSocket({
        topic: '/topic/admin/users',
        onMessage: () => refetch(),
        enabled: true
    });

    useEffect(() => {
        const newEmailParam = getInitialEmail();
        
        if (newEmailParam !== searchForm.email) {
            setSearchForm(prev => ({ ...prev, email: newEmailParam }));
            setActiveSearch(prev => ({ ...prev, email: newEmailParam || null }));
            setCurrentPage(0);
        }
    }, [location.search]);

    const handleSearch = () => {
        setCurrentPage(0);
        setActiveSearch({
            fullName: searchForm.fullName.trim() || null,
            phone: searchForm.phone.trim() || null,
            email: searchForm.email.trim() || null
        });
    };

    const handleReset = () => {
        setSearchForm({ fullName: '', phone: '', email: '' });
        setActiveSearch({ fullName: null, phone: null, email: null });
        setCurrentPage(0);
        navigate('/admin/users', { replace: true });
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) setCurrentPage(newPage);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Generate page numbers
    const getPageRange = () => {
        const range = [];
        const maxVisible = 7;
        
        if (totalPages <= maxVisible) {
            for (let i = 0; i < totalPages; i++) range.push(i);
        } else {
            if (currentPage < 4) {
                for (let i = 0; i < 5; i++) range.push(i);
                range.push('...');
                range.push(totalPages - 1);
            } else if (currentPage > totalPages - 5) {
                range.push(0);
                range.push('...');
                for (let i = totalPages - 5; i < totalPages; i++) range.push(i);
            } else {
                range.push(0);
                range.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) range.push(i);
                range.push('...');
                range.push(totalPages - 1);
            }
        }
        return range;
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <FaUsers className={styles.headerIcon} />
                    <div>
                        <h1 className={styles.title}>Quản Lý Người Dùng</h1>
                        <p className={styles.subtitle}>Tổng người dùng: {totalElements}</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                {[
                    { title: 'TỔNG NGƯỜI DÙNG', value: userStats.total,        Icon: Users,     color: '#1f6fb2', bg: '#e0f2fe' },
                    { title: 'HOẠT ĐỘNG',       value: userStats.active,       Icon: UserCheck, color: '#16a34a', bg: '#dcfce7' },
                    { title: 'BỊ KHÓA',         value: userStats.locked,       Icon: UserX,     color: '#dc2626', bg: '#fee2e2' },
                    { title: 'MỚI THÁNG NÀY',   value: userStats.newThisMonth, Icon: UserPlus,  color: '#d97706', bg: '#fef3c7' },
                ].map(({ title, value, Icon, color, bg }) => (
                    <div key={title} className={styles.statCard}>
                        <div className={styles.iconWrapper} style={{ backgroundColor: bg, color }}>
                            <Icon size={18} />
                        </div>
                        <div className={styles.cardBody}>
                            <h3 className={styles.cardTitle}>{title}</h3>
                            <p className={styles.cardValue}>{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search Bar */}
            <div className={styles.searchSection}>
                <div className={styles.searchInputs}>
                    <input 
                        type="text"
                        className={styles.searchInput} 
                        placeholder="Tìm theo tên người dùng..." 
                        value={searchForm.fullName} 
                        onChange={e => setSearchForm({...searchForm, fullName: e.target.value})} 
                        onKeyPress={handleKeyPress}
                    />
                    
                    <input 
                        type="text"
                        className={styles.searchInput} 
                        placeholder="Tìm theo số điện thoại..." 
                        value={searchForm.phone} 
                        onChange={e => setSearchForm({...searchForm, phone: e.target.value})} 
                        onKeyPress={handleKeyPress}
                    />
                    
                    <input 
                        type="email"
                        className={styles.searchInput} 
                        placeholder="Tìm theo email..." 
                        value={searchForm.email} 
                        onChange={e => setSearchForm({...searchForm, email: e.target.value})} 
                        onKeyPress={handleKeyPress}
                    />
                </div>

                <div className={styles.searchActions}>
                    <button className={styles.searchBtn} onClick={handleSearch}>
                        <FaSearch />
                        <span>Tìm kiếm</span>
                    </button>
                    <button className={styles.resetBtn} onClick={handleReset}>
                        <FaRedoAlt />
                        <span>Đặt lại</span>
                    </button>
                </div>
            </div>

            {/* Users Grid */}
            <div className={styles.content}>
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Loading users...</p>
                    </div>
                ) : users.length > 0 ? (
                    <div className={styles.usersGrid}>
                        {users.map((user, index) => (
                            <UsersItem key={user.userID} user={user} refetch={refetch} index={index} />
                        ))}
                    </div>
                ) : (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>📭</div>
                        <h3>No users found</h3>
                        <p>
                            {activeSearch.email 
                                ? `No results for: ${activeSearch.email}` 
                                : "Try adjusting your search filters"}
                        </p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {!loading && totalElements > 0 && (
                <div className={styles.pagination}>
                    <div className={styles.paginationInfo}>
                        Showing <strong>{currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalElements)}</strong> of <strong>{totalElements}</strong>
                    </div>
                    
                    <div className={styles.paginationControls}>
                        <button 
                            onClick={() => handlePageChange(currentPage - 1)} 
                            disabled={currentPage === 0}
                            className={styles.navBtn}
                        >
                            Previous
                        </button>
                        
                        <div className={styles.pageNumbers}>
                            {getPageRange().map((page, idx) => (
                                page === '...' ? (
                                    <span key={`ellipsis-${idx}`} className={styles.ellipsis}>...</span>
                                ) : (
                                    <button
                                        key={page}
                                        onClick={() => handlePageChange(page)}
                                        className={`${styles.pageBtn} ${currentPage === page ? styles.active : ''}`}
                                    >
                                        {page + 1}
                                    </button>
                                )
                            ))}
                        </div>
                        
                        <button 
                            onClick={() => handlePageChange(currentPage + 1)} 
                            disabled={currentPage === totalPages - 1}
                            className={styles.navBtn}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersPage;