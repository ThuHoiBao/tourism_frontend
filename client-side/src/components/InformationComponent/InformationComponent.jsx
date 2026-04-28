import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import PersonalProfile from './PersonalProfile/PersonalProfile';
import TransactionList from './TransactionList/TransactionList';
import FavoriteTours from './FavoriteTours/FavoriteTours';
import styles from './InformationComponent.module.scss';
import AvatarUploadModal from './AvatarUploadModal/AvatarUploadModal';
import { useAuth } from '../../context/AuthContext.jsx';
import coverImg from '../../assets/images/nuidoi.jpg';

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
    
    const getActiveTab = () => {
        if (tab) return tab;
        const path = location.pathname;
        if (path.includes('/transaction')) return 'transaction';
        if (path.includes('/favorites')) return 'favorites';
        return 'transaction';
    };
    
    const [activeTab, setActiveTab] = useState(getActiveTab());
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
    
    const handleAvatarUpdateSuccess = (updatedUserPlainObject) => {
        updateUser(updatedUserPlainObject);
    };
    
    useEffect(() => {
        const newTab = getActiveTab();
        if (newTab !== activeTab) {
            setActiveTab(newTab);
        }
    }, [location.pathname, tab]);
    
    const handleMenuClick = (tab) => {
        setActiveTab(tab);
        navigate(`/information/${tab}`);
    };
    
    const renderContent = () => {
        switch (activeTab) {
            case 'transaction':
                return <TransactionList user={user} />;
            case 'favorites':
                return <FavoriteTours user={user}/>;
            default:
                return <TransactionList user={user} />;
        }
    };
    
    if (loading) {
        return (
            <div className={styles.informationWrapper}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <p>Đang tải thông tin...</p>
                </div>
            </div>
        );
    }
    
    if (!user) {
        return (
            <div className={styles.informationWrapper}>
                <div className={styles.errorContainer}>
                    <p>Không tìm thấy thông tin người dùng</p>
                    <button onClick={() => navigate('/login')}>
                        Đăng nhập lại
                    </button>
                </div>
            </div>
        );
    }
    
    const userData = user?.data || user;
    
    return (
        <div className={styles.informationWrapper}>
            {/* Premium Cover & Profile Header */}
            <div className={styles.profileHero}>
                <div className={styles.coverSection}>
                    <div className={styles.coverImage}>
                        <img 
                            src={coverImg}
                            alt="cover" 
                            className={styles.cover}
                            loading="eager"
                            decoding="async"
                            onError={(e) => {
                                import('../../assets/images/nuidoi.jpg').then(mod => {
                                    e.currentTarget.src = mod.default || mod;
                                }).catch(() => {});
                            }}
                        />
                    </div>
                </div>

                {/* Profile Info Overlay */}
                <div className={styles.profileInfoContainer}>
                    <div className={styles.avatarSection}>
                        <div className={styles.avatarWrapper} onClick={() => setIsAvatarModalOpen(true)}>
                            <img 
                                src={userData?.avatar || 'https://th.bing.com/th/id/OIP.KMh7jiRqiGInQryreHc-UwHaHa?w=180&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3'}
                                alt={userData?.fullName || 'User'}
                                className={styles.avatar}
                            />
                            <div className={styles.editAvatarBtn}>
                                <i className="fas fa-camera"></i>
                            </div>
                        </div>
                    </div>
                    <div className={styles.nameSection}>
                        <h1 className={styles.userName}>{userData?.fullName || 'Khách hàng'}</h1>
                        <p className={styles.userRole}>Thành viên Future Travel</p>
                    </div>
                </div>

                {/* Facebook-style Navigation Tabs */}
                <div className={styles.profileTabs}>
                    <div className={styles.tabsContainer}>
                        <button
                            className={`${styles.profileTab} ${activeTab === 'transaction' ? styles.profileTabActive : ''}`}
                            onClick={() => handleMenuClick('transaction')}
                        >
                            <i className="fas fa-list-alt"></i>
                            <span>Danh sách giao dịch</span>
                        </button>
                        <button
                            className={`${styles.profileTab} ${activeTab === 'favorites' ? styles.profileTabActive : ''}`}
                            onClick={() => handleMenuClick('favorites')}
                        >
                            <i className="fas fa-heart"></i>
                            <span>Tour yêu thích</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main 2-Column Layout */}
            <div className={styles.container}>
                {/* Main Content */}
                <div className={styles.contentArea}>
                    {renderContent()}
                </div>

                {/* Right Sidebar - Personal Profile Form */}
                <div className={styles.rightSidebar}>
                    <PersonalProfile isSidebarVersion={true} />
                </div>
            </div>
            
            {/* Avatar Upload Modal */}
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
