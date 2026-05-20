import React, { useState, useEffect, useCallback } from 'react';
import { Heart, HeartOff, Loader2 } from 'lucide-react';
import { getUserFavoriteToursApi, removeFavoriteTourApi } from '../../../services/favoriteTour/favoriteTour.ts';
import FavoriteTourItem from './FavoriteTourItem/FavoriteTourItem.jsx';
import styles from './FavoriteTours.module.scss';

const FavoriteTours = ({ user }) => {
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const currentUserId = user?.userId || user?.userID || user?.id || null;

    const fetchFavoriteTours = useCallback(async () => {
        if (!currentUserId) {
            setLoading(false);
            setError('Vui lòng đăng nhập để xem danh sách chuyến đi yêu thích.');
            setTours([]);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const data = await getUserFavoriteToursApi(currentUserId);
            setTours(data);
        } catch (err) {
            console.error('Error fetching favorite tours:', err);
            setError('Không thể tải danh sách chuyến đi yêu thích.');
            setTours([]);
        } finally {
            setLoading(false);
        }
    }, [currentUserId]);

    useEffect(() => {
        fetchFavoriteTours();
    }, [fetchFavoriteTours]);

    const handleRemoveTour = async (tourId) => {
        if (!currentUserId) return;

        setLoading(true);
        try {
            await removeFavoriteTourApi(currentUserId, tourId);
            await fetchFavoriteTours();
        } catch (err) {
            console.error('Error removing favorite tour:', err);
            alert('Đã xảy ra lỗi khi bỏ yêu thích chuyến đi.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.favoriteTours}>
                <div className={styles.loadingState}>
                    <Loader2 size={22} className={styles.spinIcon} />
                    <p>Đang tải danh sách chuyến đi yêu thích...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.favoriteTours}>
                <div className={styles.errorState}>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.favoriteTours}>
            <header className={styles.pageHeader}>
                <div className={styles.headerIcon}>
                    <Heart size={22} strokeWidth={2.5} />
                </div>
                <div>
                    <p className={styles.eyebrow}>Danh sách lưu</p>
                    <h2 className={styles.pageTitle}>Chuyến đi yêu thích</h2>
                    <p className={styles.pageSubtitle}>
                        Bạn đang theo dõi <strong>{tours.length}</strong> chuyến đi để quay lại đặt nhanh hơn.
                    </p>
                </div>
            </header>

            {tours.length === 0 ? (
                <div className={styles.emptyState}>
                    <HeartOff size={52} strokeWidth={1.8} />
                    <h3>Chưa có chuyến đi yêu thích</h3>
                    <p>Hãy lưu lại những hành trình bạn thích để dễ so sánh ngày khởi hành, giá và lịch trình.</p>
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
