// src/components/InformationComponent/FavoriteTours/FavoriteTours.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getUserFavoriteToursApi, removeFavoriteTourApi } from '../../../services/favoriteTour/favoriteTour.ts';
import FavoriteTourItem from './FavoriteTourItem/FavoriteTourItem.jsx';
import styles from './FavoriteTours.module.scss';

// ✅ SỬA LỖI: Giữ FiHeart, nhưng lấy HeartOff từ bộ 'lu' (Lucide) vì 'fi' không có
import { FiHeart } from 'react-icons/fi';
import { LuHeartOff } from 'react-icons/lu'; 

const FavoriteTours = ({ user }) => {
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const currentUserId = user?.userId || user?.userID || user?.id || null;

    // Fetch favorite tours
    const fetchFavoriteTours = useCallback(async () => {
        if (!currentUserId) {
            setLoading(false);
            setError("Vui lòng đăng nhập để xem danh sách tour yêu thích.");
            setTours([]);
            return;
        }
        
        setLoading(true);
        setError(null);
        try {
            const data = await getUserFavoriteToursApi(currentUserId);
            setTours(data);
        } catch (err) {
            console.error("Error fetching favorite tours:", err);
            setError("Không thể tải danh sách tour yêu thích.");
            setTours([]);
        } finally {
            setLoading(false);
        }
    }, [currentUserId]);

    useEffect(() => {
        fetchFavoriteTours();
    }, [fetchFavoriteTours]);

    // Handle remove tour
    const handleRemoveTour = async (tourId) => {
        if (!currentUserId) return;
        
        setLoading(true);
        try {
            await removeFavoriteTourApi(currentUserId, tourId);
            await fetchFavoriteTours();
        } catch (err) {
            console.error("Error removing favorite tour:", err);
            alert("Đã xảy ra lỗi khi bỏ yêu thích tour.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.favoriteTours}>
                <div className={styles.loadingState}>
                    <p>Đang tải danh sách tour yêu thích...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.favoriteTours}>
                <div className={styles.errorState}>
                    <p>Lỗi: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.favoriteTours}>
            {/* Header */}
            <div className={styles.pageHeader}>
                <div className={styles.headerTop}>
                    <FiHeart className={styles.heartIcon} />
                    <h1 className={styles.pageTitle}>Tour Yêu Thích</h1>
                </div>
                <p className={styles.pageSubtitle}>
                    Bạn có <span className={styles.countValue}>{tours.length}</span> chương trình tour yêu thích
                </p>
            </div>
            
            {/* Content */}
            {tours.length === 0 ? (
                <div className={styles.emptyState}>
                    {/* ✅ SỬA LỖI: Dùng LuHeartOff thay cho FiHeartOff */}
                    <LuHeartOff className={styles.emptyIcon} />
                    <p>
                        Bạn chưa có tour yêu thích nào.<br />
                        Hãy thêm một vài tour để dễ dàng theo dõi nhé!
                    </p>
                </div>
            ) : (
                <div className={styles.toursList}>
                    {tours.map(tour => (
                        <FavoriteTourItem 
                            key={tour.tourID} 
                            tour={tour} 
                            onRemove={handleRemoveTour}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FavoriteTours;