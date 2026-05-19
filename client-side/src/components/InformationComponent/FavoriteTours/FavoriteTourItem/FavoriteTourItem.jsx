import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import styles from './FavoriteTourItem.module.scss';

const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return 'Liên hệ';
    return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }).replace('₫', 'đ');
};

const FavoriteTourItem = ({ tour, onRemove }) => {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);

    if (!tour) return null;

    const allDepartureDates = tour.departureDates || [];

    const handleConfirmRemove = () => {
        onRemove(tour.tourID);
        setShowModal(false);
    };

    const handleDateClick = (event, departureID) => {
        event.stopPropagation();
        navigate(`/tour/${tour.tourCode}?departureId=${departureID}`);
    };

    const handleViewDetail = (event) => {
        event.stopPropagation();
        if (allDepartureDates.length > 0) {
            const firstDeparture = allDepartureDates[0];
            navigate(`/tour/${tour.tourCode}?departureId=${firstDeparture.departureID}`);
        } else {
            navigate(`/tour/${tour.tourCode}`);
        }
    };

    return (
        <>
            <article className={styles.tourItem}>
                <div className={styles.imageContainer}>
                    <img src={tour.image} alt={tour.tourName} className={styles.tourImage} />
                </div>

                <div className={styles.detailsContainer}>
                    <h3 className={styles.tourName}>{tour.tourName}</h3>

                    <div className={styles.infoGrid}>
                        <div className={styles.infoLine}>
                            <span>Mã chuyến:</span>
                            <strong>{tour.tourCode}</strong>
                        </div>
                        <div className={styles.infoLine}>
                            <span>Khởi hành:</span>
                            <strong className={styles.highlightValue}>{tour.startPointName}</strong>
                        </div>
                        <div className={styles.infoLine}>
                            <span>Thời gian:</span>
                            <strong>{tour.duration}</strong>
                        </div>
                        <div className={styles.infoLine}>
                            <span>Phương tiện:</span>
                            <strong>{tour.transportation}</strong>
                        </div>
                    </div>

                    <div className={styles.dateRow}>
                        <span className={styles.dateLabel}>Ngày khởi hành:</span>
                        <div className={styles.dateBadges}>
                            <button className={styles.dateNavButton} type="button" disabled>
                                ←
                            </button>
                            {allDepartureDates.slice(0, 3).map((date, index) => (
                                <button
                                    key={`${date.departureID}-${index}`}
                                    className={styles.dateBadge}
                                    title={`Ngày: ${date.fullDate}`}
                                    onClick={(event) => handleDateClick(event, date.departureID)}
                                    type="button"
                                >
                                    {date.departureDate}
                                </button>
                            ))}
                            <button className={styles.dateNavButton} type="button" disabled>
                                →
                            </button>
                        </div>
                    </div>

                    <div className={styles.footerRow}>
                        <div className={styles.priceBlock}>
                            <span>Giá từ:</span>
                            <strong>{formatCurrency(tour.money)}</strong>
                        </div>
                        <div className={styles.buttonGroup}>
                            <button className={styles.detailButton} onClick={handleViewDetail} type="button">
                                Xem chi tiết
                            </button>
                            <button className={styles.removeButton} onClick={() => setShowModal(true)} type="button">
                                Bỏ yêu thích
                            </button>
                        </div>
                    </div>
                </div>
            </article>

            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modalContent} onClick={(event) => event.stopPropagation()}>
                        <button className={styles.modalClose} onClick={() => setShowModal(false)} type="button">
                            <X size={18} />
                        </button>
                        <h3>Bỏ yêu thích chuyến đi?</h3>
                        <p>Bạn có chắc chắn muốn bỏ yêu thích “{tour.tourName}” không?</p>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelButton} onClick={() => setShowModal(false)} type="button">
                                Hủy
                            </button>
                            <button className={styles.confirmButton} onClick={handleConfirmRemove} type="button">
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FavoriteTourItem;
