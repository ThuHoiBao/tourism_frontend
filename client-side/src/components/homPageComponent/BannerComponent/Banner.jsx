import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgePercent, Banknote, Globe2, MapPin, Search, Star } from 'lucide-react';
import styles from './Banner.module.scss';
import LocationDropdown from './LocationDropdown';
import useFeaturedTours from '../../../hook/useFeaturedTours.ts';

// =============================================
// 🇻🇳 Vietnam travel photos — Unsplash
// =============================================
const VN_PHOTOS = [
    'https://images.unsplash.com/photo-1710141968143-7ea1f6d89025?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dmklRTElQkIlODd0JTIwbmFtJTIwYyVFMSVCQiU5RCUyMHZpJUUxJUJCJTg3dCUyMG5hbSUyMGR1JTIwbCVFMSVCQiU4QmNofGVufDB8fDB8fHww?w=800&q=85', // Hội An đèn lồng
    'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=85', // Ruộng bậc thang Sapa
    'https://images.unsplash.com/photo-1570366583862-f91883984fde?w=800&q=85', // Hạ Long Bay
];

// =============================================
// 🌊 Floating 3D Gallery — mềm mại, không dots, không khung
// =============================================
const TravelGallery = () => {
    const [active, setActive] = useState(0);
    const n = VN_PHOTOS.length;

    useEffect(() => {
        const id = setInterval(() => setActive(a => (a + 1) % n), 2200);
        return () => clearInterval(id);
    }, [n]);

    const getStyle = (i) => {
        let off = ((i - active) % n + n) % n;
        if (off > Math.floor(n / 2)) off -= n; // normalize: [-1, 0, 1] for n=3
        const abs = Math.abs(off);
        if (abs > 1) return { opacity: 0, pointerEvents: 'none', position: 'absolute' };

        // Horizontal coverflow: side cards slide left/right with rotateY tilt
        const xPercent = off * 52;
        const rotateY = off * -22;
        const scale = abs === 0 ? 1.0 : 0.72;
        const brightness = abs === 0 ? 1 : 0.56;

        return {
            position: 'absolute',
            transform: `translate3d(${xPercent}%, 0, 0) rotateY(${rotateY}deg) scale(${scale})`,
            zIndex: 10 - abs,
            opacity: abs === 1 ? 0.82 : 1,
            filter: `brightness(${brightness})`,
            transition: 'transform 0.42s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.35s ease, filter 0.35s ease',
        };
    };

    return (
        <aside className={styles.galleryBox}>
            <div className={styles.coverflow}>
                {VN_PHOTOS.map((url, i) => (
                    <div
                        key={i}
                        className={`${styles.coverCard} ${i === active ? styles.coverCardActive : ''}`}
                        style={getStyle(i)}
                        onClick={() => setActive(i)}
                    >
                        <img src={url} alt={`Vietnam ${i + 1}`} draggable={false} />
                    </div>
                ))}
            </div>
        </aside>
    );
};



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
            {/* bgClip clips the Ken Burns animation inside banner bounds */}
            <div className={styles.bgClip}>
                <div className={styles.bgLayer} />
            </div>
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

                {/* ============================================================
                 * PHẦN TOUR NỔI BẬT CŨ - ĐÃ ẨN, THAY BẰNG TRAVEL PHOTO GALLERY
                 * (giữ lại code để dễ khôi phục nếu cần)
                 * <aside className={styles.sideInfoBox}>
                 *     <p className={styles.sideTitle}>{featuredTour?.tourName}</p>
                 *     <p className={styles.sideDetails}>{featuredTour?.duration}</p>
                 *     <p className={styles.priceLabel}>Giá chỉ từ</p>
                 *     <div className={styles.priceRow}>
                 *         <p className={styles.priceValue}>
                 *             {formatCurrency(featuredTour?.money)}
                 *             {featuredTour?.money && <small>VNĐ/khách</small>}
                 *         </p>
                 *         <button type="button" onClick={handleFeaturedClick}>
                 *             <ChevronRight size={30} />
                 *         </button>
                 *     </div>
                 * </aside>
                 * ============================================================ */}

                {/* 🌊 TRAVEL PHOTO GALLERY - Thay thế phần tour nổi bật */}
                <TravelGallery />
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
