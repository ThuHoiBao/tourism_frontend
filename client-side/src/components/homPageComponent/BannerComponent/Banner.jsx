import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BadgePercent,
    Banknote,
    ChevronRight,
    Globe2,
    MapPin,
    Search,
    Star,
} from 'lucide-react';
import styles from './Banner.module.scss';
import LocationDropdown from './LocationDropdown';
import useFeaturedTours from '../../../hook/useFeaturedTours.ts';

const BUDGET_OPTIONS = [
    'Dưới 5 triệu',
    'Từ 5 - 10 triệu',
    'Từ 10 - 20 triệu',
    'Trên 20 triệu',
];

const DEFAULT_BUDGET = 'Chọn mức giá';

const Banner = () => {
    const navigate = useNavigate();
    const { featuredTours } = useFeaturedTours();
    const featuredTour = featuredTours?.[0];

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationError, setValidationError] = useState('');
    const [isBudgetMenuOpen, setIsBudgetMenuOpen] = useState(false);
    const [isDestinationFocused, setIsDestinationFocused] = useState(false);
    const [searchData, setSearchData] = useState({
        searchNameTour: '',
        endLocationID: '',
        budget: DEFAULT_BUDGET,
    });

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return 'Liên hệ';
        return amount.toLocaleString('vi-VN');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSearchData((prev) => ({
            ...prev,
            [name]: value,
            ...(name === 'searchNameTour' ? { endLocationID: '' } : {}),
        }));
        setValidationError('');
    };

    const handleBudgetSelect = (value) => {
        setSearchData((prev) => ({
            ...prev,
            budget: value,
        }));
        setValidationError('');
        setIsBudgetMenuOpen(false);
    };

    const handleLocationSelect = (location) => {
        setSearchData((prev) => ({
            ...prev,
            searchNameTour: location.name,
            endLocationID: location.locationID.toString(),
        }));
        setValidationError('');
        setIsDestinationFocused(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationError('');
        setLoading(true);
        setError(null);

        const payload = {};
        if (searchData.endLocationID) {
            payload.endLocationID = searchData.endLocationID;
        }
        if (searchData.budget !== DEFAULT_BUDGET) {
            payload.budget = searchData.budget;
        }

        const queryParams = new URLSearchParams(payload).toString();
        navigate(`/tours?${queryParams}`);
        setLoading(false);
    };

    const handleFeaturedClick = (e) => {
        e.stopPropagation();
        if (featuredTour?.tourCode) {
            navigate(`/tour/${featuredTour.tourCode}`);
        }
    };

    return (
        <div className={styles.bannerContainer}>
            <div className={styles.overlay} />

            <div className={styles.content}>
                <section className={styles.heroCopy}>
                    <h1 className={styles.headline}>Hơn 1000+ Chuyến Đi, Khám Phá Ngay</h1>
                    <p className={styles.subHeadline}>Giá tốt - hỗ trợ 24/7 - khắp nơi</p>
                </section>

                <form className={styles.searchBox} onSubmit={handleSubmit}>
                    <div className={`${styles.inputGroup} ${styles.destinationGroup}`}>
                        <MapPin className={styles.icon} size={25} strokeWidth={2.6} />
                        <div className={styles.inputLabels}>
                            <label htmlFor="destination">Bạn muốn đi đâu?</label>
                            <input
                                type="text"
                                id="destination"
                                name="searchNameTour"
                                className={styles.inputField}
                                placeholder="Ví dụ: Đà Nẵng, Phú Quốc,..."
                                value={searchData.searchNameTour}
                                onChange={handleChange}
                                onFocus={() => setIsDestinationFocused(true)}
                                onBlur={() => setTimeout(() => setIsDestinationFocused(false), 200)}
                            />
                        </div>
                    </div>

                    <div className={`${styles.inputGroup} ${styles.budgetGroup}`}>
                        <Banknote className={styles.icon} size={25} strokeWidth={2.4} />
                        <div className={styles.inputLabels}>
                            <label htmlFor="budget">Ngân sách</label>
                            <div
                                className={`${styles.selectDisplay} ${searchData.budget === DEFAULT_BUDGET ? styles.placeholder : ''}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsBudgetMenuOpen((open) => !open);
                                }}
                            >
                                {searchData.budget}
                            </div>
                        </div>

                        {isBudgetMenuOpen && (
                            <div className={styles.customSelectMenu}>
                                {BUDGET_OPTIONS.map((option) => (
                                    <div
                                        key={option}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleBudgetSelect(option);
                                        }}
                                        className={styles.menuItem}
                                    >
                                        {option}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button type="submit" className={styles.searchButton} aria-label="Tìm chuyến đi">
                        <Search className={styles.searchIcon} size={34} strokeWidth={2.7} />
                    </button>

                    {isDestinationFocused && (
                        <LocationDropdown
                            query={searchData.searchNameTour}
                            onSelect={handleLocationSelect}
                            onClose={() => setIsDestinationFocused(false)}
                        />
                    )}
                </form>

                {validationError && (
                    <p className={styles.validationMessage}>{validationError}</p>
                )}

                <aside className={styles.sideInfoBox}>
                    <p className={styles.sideTitle}>{featuredTour?.tourName || 'Khám phá hành trình nổi bật'}</p>
                    <p className={styles.sideDetails}>{featuredTour?.duration || 'Lịch trình linh hoạt'}</p>
                    <p className={styles.priceLabel}>Giá chỉ từ</p>
                    <div className={styles.priceRow}>
                        <p className={styles.priceValue}>
                            {formatCurrency(featuredTour?.money)}
                            {featuredTour?.money && <small>VNĐ/khách</small>}
                        </p>
                        <button
                            type="button"
                            className={styles.arrowIcon}
                            onClick={handleFeaturedClick}
                            aria-label="Xem chuyến đi nổi bật"
                        >
                            <ChevronRight size={30} strokeWidth={2.6} />
                        </button>
                    </div>
                </aside>
            </div>

            <div className={styles.bottomInfoStrip}>
                <div className={styles.infoItem}>
                    <div className={`${styles.infoIcon} ${styles.infoIconPrimary}`}>
                        <Globe2 size={30} strokeWidth={2.4} />
                    </div>
                    <p><strong>1.000+ chuyến đi</strong></p>
                    <p>Chất lượng trong và ngoài nước</p>
                </div>
                <div className={styles.infoItem}>
                    <div className={`${styles.infoIcon} ${styles.infoIconReview}`}>
                        <Star size={30} strokeWidth={2.35} />
                    </div>
                    <p><strong>10K+ đánh giá 5 sao</strong></p>
                    <p>Từ những khách hàng đã đặt chuyến đi</p>
                </div>
                <div className={styles.infoItem}>
                    <div className={`${styles.infoIcon} ${styles.infoIconDeal}`}>
                        <BadgePercent size={30} strokeWidth={2.35} />
                    </div>
                    <p><strong>100+ ưu đãi mỗi ngày</strong></p>
                    <p>Cho khách đặt sớm, theo nhóm, phút chót</p>
                </div>
            </div>

            {loading && <p className={styles.statusMessage}>Đang chuẩn bị chuyển hướng...</p>}
            {error && <p className={styles.statusMessageError}>Lỗi: {error}</p>}
        </div>
    );
};

export default Banner;
