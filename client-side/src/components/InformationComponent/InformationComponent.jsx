import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Camera, Heart, ListChecks, Sparkles, Coins } from 'lucide-react';
import PersonalProfile from './PersonalProfile/PersonalProfile';
import TransactionList from './TransactionList/TransactionList';
import FavoriteTours from './FavoriteTours/FavoriteTours';
import styles from './InformationComponent.module.scss';
import AvatarUploadModal from './AvatarUploadModal/AvatarUploadModal';
import { useAuth } from '../../context/AuthContext.jsx';
import coverImg from '../../assets/images/photo-1675111066042-9baa4c343157.avif';

const DEFAULT_AVATAR =
    'https://th.bing.com/th/id/OIP.KMh7jiRqiGInQryreHc-UwHaHa?w=180&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3';

const InformationComponent = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { tab } = useParams();
    const { user, updateUser, loading, isAuthenticated } = useAuth();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            navigate('/login');
        }
    }, [loading, isAuthenticated, navigate]);

    const getActiveTab = useCallback(() => {
        if (tab) return tab;
        const path = location.pathname;
        if (path.includes('/transaction')) return 'transaction';
        if (path.includes('/favorites')) return 'favorites';
        return 'transaction';
    }, [location.pathname, tab]);

    const [activeTab, setActiveTab] = useState(getActiveTab());
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    const handleAvatarUpdateSuccess = (updatedUserPlainObject) => {
        updateUser(updatedUserPlainObject);
    };

    useEffect(() => {
        const newTab = getActiveTab();
        setActiveTab(currentTab => (newTab !== currentTab ? newTab : currentTab));
    }, [getActiveTab]);

    const handleMenuClick = (nextTab) => {
        setActiveTab(nextTab);
        navigate(`/information/${nextTab}`);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'transaction':
                return <TransactionList user={user} />;
            case 'favorites':
                return <FavoriteTours user={user} />;
            default:
                return <TransactionList user={user} />;
        }
    };

    if (loading) {
        return (
            <div className={styles.informationWrapper}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Đang tải thông tin tài khoản...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className={styles.informationWrapper}>
                <div className={styles.errorContainer}>
                    <p>Không tìm thấy thông tin người dùng</p>
                    <button onClick={() => navigate('/login')} type="button">
                        Đăng nhập lại
                    </button>
                </div>
            </div>
        );
    }

    const userData = user?.data || user;
    const coinBalance = Number(userData?.coinBalance || 0).toLocaleString('vi-VN');

    return (
        <div className={styles.informationWrapper}>
            <section className={styles.profileHero}>
                <div className={styles.coverSection}>
                    <img
                        src={coverImg}
                        alt="Future Travel cover"
                        className={styles.cover}
                        loading="eager"
                        decoding="async"
                    />
                    <div className={styles.coverOverlay} />
                </div>

                <div className={styles.profileInfoContainer}>
                    <button
                        type="button"
                        className={styles.avatarWrapper}
                        onClick={() => setIsAvatarModalOpen(true)}
                        aria-label="Cập nhật ảnh đại diện"
                    >
                        <img
                            src={userData?.avatar || DEFAULT_AVATAR}
                            alt={userData?.fullName || 'User'}
                            className={styles.avatar}
                        />
                        <span className={styles.editAvatarBtn}>
                            <Camera size={18} strokeWidth={2.5}/>
                        </span>
                    </button>

                    <div className={styles.nameSection}>
                        <span className={styles.memberBadge}>
                            <Sparkles size={14} strokeWidth={2.5} />
                            Thành viên Future Travel
                        </span>
                        <h1 className={styles.userName}>{userData?.fullName || 'Khách hàng'}</h1>
                        <p className={styles.userRole}>Quản lý chuyến đi, điểm thưởng và hồ sơ cá nhân của bạn.</p>
                    </div>

                    <div className={styles.coinCard}>
                        <Coins size={19} strokeWidth={2.4} />
                        <div>
                            <span>{coinBalance}</span>
                            <small>điểm hiện có</small>
                        </div>
                    </div>
                </div>

                <div className={styles.profileTabs}>
                    <div className={styles.tabsContainer}>
                        <button
                            className={`${styles.profileTab} ${activeTab === 'transaction' ? styles.profileTabActive : ''}`}
                            onClick={() => handleMenuClick('transaction')}
                            type="button"
                        >
                            <ListChecks size={18} strokeWidth={2.4} />
                            <span>Danh sách giao dịch</span>
                        </button>
                        <button
                            className={`${styles.profileTab} ${activeTab === 'favorites' ? styles.profileTabActive : ''}`}
                            onClick={() => handleMenuClick('favorites')}
                            type="button"
                        >
                            <Heart size={18} strokeWidth={2.4} />
                            <span>Chuyến đi yêu thích</span>
                        </button>
                    </div>
                </div>
            </section>

            <main className={styles.container}>
                <section className={styles.contentArea}>
                    {renderContent()}
                </section>

                <aside className={styles.rightSidebar}>
                    <PersonalProfile isSidebarVersion={true} />
                </aside>
            </main>

            {isAvatarModalOpen && user && (
                <AvatarUploadModal
                    user={user}
                    onClose={() => setIsAvatarModalOpen(false)}
                    onUpdateSuccess={handleAvatarUpdateSuccess}
                />
            )}
        </div>
    );
};

export default InformationComponent;
