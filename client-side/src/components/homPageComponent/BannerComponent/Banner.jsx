// File: src/components/homPageComponent/BannerComponent/Banner.jsx (FULL CODE)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 👈 Thêm useNavigate
import styles from './Banner.module.scss';
import { FaSearch, FaMoneyBillAlt, FaMapMarkerAlt } from 'react-icons/fa'; 
import LocationDropdown from './LocationDropdown';

import searchIcon from '../../../assets/images/flight.png';
import thumbsUpIcon from '../../../assets/images/rating.png';
import creditCardIcon from '../../../assets/images/endow.png';
import rightArrowImage from '../../../assets/images/right-arrow.png';
import useFeaturedTours from '../../../hook/useFeaturedTours.ts';

// --- Utils Functions ---

const budgetOptions = [
    'Dưới 5 triệu',
    'Từ 5 - 10 triệu',
    'Từ 10 - 20 triệu',
    'Trên 20 triệu',
];

// --- Banner Component ---

const Banner = () => {
    // Hook để điều hướng
    const navigate = useNavigate(); 
    const { featuredTours } = useFeaturedTours(); 
    console.log('Featured Tours in Banner:', featuredTours);
    const displayTours = featuredTours.slice(0, 5); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationError, setValidationError] = useState('');

    const [searchData, setSearchData] = useState({
        searchNameTour: '',
        endLocationID: '',
        budget: 'Chọn mức giá',
    });
    
    const [isBudgetMenuOpen, setIsBudgetMenuOpen] = useState(false);
    const [isDestinationFocused, setIsDestinationFocused] = useState(false);

    const formatCurrency = (amount) => {

    if (amount === undefined || amount === null) return 'Liên hệ';

    return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }).replace('₫', '');

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
        setSearchData({
            ...searchData,
            budget: value,
        });
        setValidationError('');
        setIsBudgetMenuOpen(false); 
    }

    const handleLocationSelect = (location) => {
        setSearchData((prev) => ({
            ...prev,
            searchNameTour: location.name,
            endLocationID: location.locationID.toString(),
        }));
        setValidationError('');
        setIsDestinationFocused(false);
    };

    /**
     * HÀM XỬ LÝ SUBMIT CHÍNH: Tạo query params và CHUYỂN HƯỚNG.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();

        setValidationError('');
        setLoading(true);
        setError(null);

        // 1. Tạo payload để truyền qua URL (không truyền searchNameTour)
        const payload = {};

        if (searchData.endLocationID) {
            payload.endLocationID = searchData.endLocationID;
        }

        if (searchData.budget !== 'Chọn mức giá') {
            payload.budget = searchData.budget;
        }

        console.log('Chuyển hướng với dữ liệu:', payload);

        // 2. Tạo URLSearchParams từ payload (Tự động mã hóa URL)
        const queryParams = new URLSearchParams(payload).toString();

        // 3. Chuyển hướng đến trang /tours kèm theo query parameters
        navigate(`/tours?${queryParams}`); 
        
        // Dừng loading ở đây vì việc gọi API thực hiện ở trang /tours
        setLoading(false);
    };

    const handleDepartureClick = (e) => {
        e.stopPropagation(); 
        navigate(`/tour/${displayTours[0]?.tourCode}`);
    };
    return (
        <div className={styles.bannerContainer}>
            <div className={styles.overlay}></div>
            <div className={styles.content}>

                <h1 className={styles.headline}>Hơn 1000+ Tour, Khám Phá Ngay</h1>
                <p className={styles.subHeadline}>Giá tốt – hỗ trợ 24/7 – khắp nơi</p>

                <form className={styles.searchBox} onSubmit={handleSubmit}>
                    
                    {/* Input 1: Nơi muốn đi */}
                    <div className={`${styles.inputGroup} ${styles.destinationGroup}`}>
                        <FaMapMarkerAlt className={styles.icon} /> 
                        <div className={styles.inputLabels}>
                            <label htmlFor="destination">Bạn muốn đi đâu ?</label>
                            <input
                                type="text"
                                id="destination"
                                name="searchNameTour" 
                                className={styles.inputField}
                                placeholder="Ví dụ: Đà Nẵng, Phú Quốc,..."
                                value={searchData.searchNameTour}
                                onChange={handleChange}
                                onFocus={() => setIsDestinationFocused(true)}
                                // Dùng setTimeout để giữ Autocomplete mở một chút khi click ra ngoài
                                onBlur={() => setTimeout(() => setIsDestinationFocused(false), 200)} 
                            />
                        </div>
                    </div>

                    {/* Input 2: Ngân sách */}
                    <div className={`${styles.inputGroup} ${styles.budgetGroup}`}>
                        <FaMoneyBillAlt className={styles.icon} />
                        <div className={styles.inputLabels}>
                            <label htmlFor="budget">Ngân sách</label>
                            <div 
                                className={`${styles.selectDisplay} ${searchData.budget === 'Chọn mức giá' ? styles.placeholder : ''}`}
                                onClick={(e) => {
                                    e.preventDefault(); 
                                    setIsBudgetMenuOpen(!isBudgetMenuOpen);
                                }} 
                            >
                                {searchData.budget}
                            </div>
                        </div>
                          
                        {isBudgetMenuOpen && (
                            <div className={styles.customSelectMenu}> 
                                {budgetOptions.map(option => (
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

                    {/* Button: Tìm */}
                    <button type="submit" className={styles.searchButton}>
                        <FaSearch className={styles.searchIcon} />
                    </button>
                    
                    {isDestinationFocused && (
                        <LocationDropdown
                            query={searchData.searchNameTour}
                            onSelect={handleLocationSelect}
                            onClose={() => setIsDestinationFocused(false)}
                        />
                    )}
                </form>

                {/* Validation Error Message */}
                {validationError && (
                    <p className={styles.validationMessage}>
                        {validationError}
                    </p>
                )}

                {/* Khối thông tin tour nổi bật bên phải banner (Giữ nguyên) */}
                <div className={styles.sideInfoBox}>
                    <p className={styles.sideTitle}>{displayTours[0]?.tourName}</p>
                    <p className={styles.sideDetails}>{displayTours[0]?.duration}</p>
                    <p className={styles.priceLabel}>Giá chỉ từ</p>
                    <p className={styles.priceValue}>{formatCurrency(displayTours[0]?.money)} <small>VNĐ/khách</small></p>
                    <div className={styles.arrowIcon}>
                        <img src={rightArrowImage} alt="Mũi tên" style={{width: '20px', height: '20px'}} 
                        onClick={(e) => handleDepartureClick(e)} />
                    </div>
                </div>
            </div>

            {/* Dải thông tin dưới cùng (Giữ nguyên) */}
            <div className={styles.bottomInfoStrip}>
                <div className={styles.infoItem}>
                    <img src={searchIcon} alt="Search Icon" className={styles.infoIconImage} />
                    <p><strong>1.000+ tours</strong></p>
                    <p>Chất lượng trong và ngoài nước</p>
                </div>
                <div className={styles.infoItem}>
                    <img src={thumbsUpIcon} alt="Thumbs Up Icon" className={styles.infoIconImage} />
                    <p><strong>10K+ đánh giá 5 sao</strong></p>
                    <p>Từ những khách hàng đã đặt tour</p>
                </div>
                <div className={styles.infoItem}>
                    <img src={creditCardIcon} alt="Credit Card Icon" className={styles.infoIconImage} />
                    <p><strong>100+ ưu đãi mỗi ngày</strong></p>
                    <p>Cho khách đặt sớm, theo nhóm, phút chót</p>
                </div>
            </div>

            {/* Chỉ giữ lại phần loading/error để dễ debug khi cần */}
            {loading && <p className={styles.statusMessage} style={{color: 'white'}}>Đang chuẩn bị chuyển hướng...</p>}
            {error && <p className={styles.statusMessage} style={{color: 'red'}}>Lỗi: {error}</p>}
        </div>
    );
};

export default Banner;