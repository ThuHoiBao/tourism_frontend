// src/components/ToursPageComponent/FilterAndSearchInput/FilterAndSearchInput.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLocations } from '../../../hook/useLocations.ts';
import styles from './FilterAndSearchInput.module.scss';
import ratingStyles from './RatingFilter.module.scss';

// Cấu hình các tùy chọn cứng
const BUDGET_OPTIONS = [
    'Dưới 5 triệu', 'Từ 5 - 10 triệu', 
    'Từ 10 - 20 triệu', 'Trên 20 triệu'
];
const RATING_OPTIONS = [5, 4, 3, 2, 1, 0]; // Thêm 0 vào cuối
const TRANSPORTATION_OPTIONS = ['Xe', 'Máy bay'];

// ✨ Hàm render sao (vàng + xám)
const renderStars = (rating) => {
    const stars = [];
    
    // Số sao vàng (solid)
    for (let i = 0; i < rating; i++) {
        stars.push(
            <i 
                key={`filled-${i}`} 
                className="fas fa-star" 
                style={{color: '#ffc107', fontSize: '18px'}}
            ></i>
        );
    }
    
    // Số sao xám (regular/outline)
    for (let i = rating; i < 5; i++) {
        stars.push(
            <i 
                key={`empty-${i}`} 
                className="far fa-star" 
                style={{color: '#d0d0d0', fontSize: '18px'}}
            ></i>
        );
    }
    
    return stars;
};

// Hàm Fuzzy Search đơn giản
const fuzzySearch = (list, query) => {
    if (!query) return list;
    const lowerQuery = query.toLowerCase().trim();
    return list.filter(item => 
        item.name.toLowerCase().includes(lowerQuery)
    );
};

const FilterAndSearchInput = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { startLocations, endLocations, loading: locationsLoading } = useLocations();

    // 1. Trạng thái Local cho các ô input/select
    const [searchNameTour, setSearchNameTour] = useState(searchParams.get('searchNameTour') || '');
    const [budget, setBudget] = useState(searchParams.get('budget') || '');
    const [startLocationId, setStartLocationId] = useState(searchParams.get('startLocationID') || '-1');
    const [endLocationId, setEndLocationId] = useState(searchParams.get('endLocationID') || '-1');
    const [transportation, setTransportation] = useState(searchParams.get('transportation') || '');
    const [selectedRating, setSelectedRating] = useState(parseInt(searchParams.get('rating')) || 0);

    // 2. Trạng thái cho Dropdown Search và Query
    const [startLocationSearch, setStartLocationSearch] = useState('');
    const [endLocationSearch, setEndLocationSearch] = useState('');
    const [isStartDropdownOpen, setIsStartDropdownOpen] = useState(false);
    const [isEndDropdownOpen, setIsEndDropdownOpen] = useState(false);

    // 3. Logic Fuzzy Search
    const filteredStartLocations = useMemo(() => {
        return fuzzySearch(startLocations, startLocationSearch);
    }, [startLocations, startLocationSearch]);

    const filteredEndLocations = useMemo(() => {
        return fuzzySearch(endLocations, endLocationSearch);
    }, [endLocations, endLocationSearch]);
    
    // Thiết lập tên hiển thị ban đầu
    useEffect(() => {
        const currentStartLoc = startLocations.find(loc => loc.locationID.toString() === startLocationId);
        if (!isStartDropdownOpen) {
            setStartLocationSearch(currentStartLoc ? currentStartLoc.name : '');
        }
        
        const currentEndLoc = endLocations.find(loc => loc.locationID.toString() === endLocationId);
        if (!isEndDropdownOpen) {
            setEndLocationSearch(currentEndLoc ? currentEndLoc.name : '');
        }
    }, [startLocations, endLocations, startLocationId, endLocationId, isStartDropdownOpen, isEndDropdownOpen]);

    // 4. Hàm xử lý khi chọn địa điểm
    const handleLocationSelect = useCallback((location, type) => {
        if (type === 'start') {
            setStartLocationId(location.locationID.toString());
            setStartLocationSearch(location.name);
            setIsStartDropdownOpen(false);
        } else {
            setEndLocationId(location.locationID.toString());
            setEndLocationSearch(location.name);
            setIsEndDropdownOpen(false);
        }
    }, []);

    // 5. Hàm xử lý Tìm kiếm/Apply Filter
    const handleApplyFilter = (e) => {
        e.preventDefault();
        
        const newParams = {};
        
        if (searchNameTour) newParams.searchNameTour = searchNameTour;
        if (budget) newParams.budget = budget;
        if (startLocationId && startLocationId !== '-1') newParams.startLocationID = startLocationId;
        if (endLocationId && endLocationId !== '-1') newParams.endLocationID = endLocationId;
        if (transportation) newParams.transportation = transportation;
        if (selectedRating > 0) newParams.rating = selectedRating.toString();
        
        setSearchParams(newParams, { replace: true });
        
        setIsStartDropdownOpen(false);
        setIsEndDropdownOpen(false);
    };

    // Hàm toggle dropdown
    const handleDropdownToggle = (type, isOpen) => {
        if (type === 'start') {
            setIsStartDropdownOpen(isOpen);
            if (isOpen) setStartLocationSearch('');
        } else {
            setIsEndDropdownOpen(isOpen);
            if (isOpen) setEndLocationSearch('');
        }
    };
    // ✨ HÀM LÀM MỚI BỘ LỌC ✨
    const handleResetFilters = () => {
        // 1. Reset các state về giá trị mặc định
        setSearchNameTour('');
        setBudget('');
        setStartLocationId('-1');
        setEndLocationId('-1');
        setTransportation('');
        setSelectedRating(0);
        setStartLocationSearch(''); // Reset giá trị hiển thị Dropdown
        setEndLocationSearch(''); // Reset giá trị hiển thị Dropdown
        
        // 2. Xóa tất cả query parameters khỏi URL
        setSearchParams({}, { replace: true });
    };
    if (locationsLoading) return <div className={styles.filterContainer}>Đang tải bộ lọc...</div>;

    return (
        <div className={styles.filterContainer}>
            {/* Thanh Tìm kiếm */}
            <div className={styles.headerWithReset}>
                <h3 className={styles.filterTitle}>Bạn muốn đi đâu ?</h3>
                <p onClick={handleResetFilters} className={styles.resetText}>Làm mới</p>
            </div>
            <form onSubmit={handleApplyFilter} className={styles.searchBar}>
                <input
                    type="text"
                    placeholder="Nơi bạn muốn đến..."
                    value={searchNameTour}
                    onChange={(e) => setSearchNameTour(e.target.value)}
                />
            </form>
            
            <div className={styles.filterBlock}>
                {/* Ngân sách */}
                <div className={styles.filterSection}>
                    <h3 className={styles.filterTitle}>Ngân sách</h3>
                    <div className={styles.budgetOptions}>
                        {BUDGET_OPTIONS.map(opt => (
                            <button
                                key={opt}
                                className={budget === opt ? styles.active : ''}
                                onClick={() => setBudget(budget === opt ? '' : opt)}
                                type="button"
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Điểm Khởi Hành */}
                <div className={styles.filterSection}>
                    <h3 className={styles.filterTitle}>Điểm khởi hành</h3>
                    <div className={styles.dropdown}>
                        <input
                            type="text"
                            value={isStartDropdownOpen ? startLocationSearch : (startLocations.find(loc => loc.locationID.toString() === startLocationId)?.name || 'Tất cả')}
                            onChange={(e) => setStartLocationSearch(e.target.value)}
                            onFocus={() => handleDropdownToggle('start', true)}
                            placeholder="Chọn hoặc tìm kiếm"
                            readOnly={!isStartDropdownOpen}
                        />
                        {isStartDropdownOpen && (
                            <div className={styles.dropdownContent}>
                                {filteredStartLocations.map(loc => (
                                    <div 
                                        key={loc.locationID}
                                        className={styles.dropdownItem}
                                        onClick={() => handleLocationSelect(loc, 'start')}
                                    >
                                        {loc.name}
                                    </div>
                                ))}
                                {filteredStartLocations.length === 0 && <div className={styles.noResult}>Không tìm thấy</div>}
                            </div>
                        )}
                        <span className={styles.dropdownToggle} onClick={() => handleDropdownToggle('start', !isStartDropdownOpen)}>
                            {isStartDropdownOpen ? '▲' : '▼'}
                        </span>
                    </div>
                </div>

                {/* Điểm Đến */}
                <div className={styles.filterSection}>
                    <h3 className={styles.filterTitle}>Điểm đến</h3>
                    <div className={styles.dropdown}>
                        <input
                            type="text"
                            value={isEndDropdownOpen ? endLocationSearch : (endLocations.find(loc => loc.locationID.toString() === endLocationId)?.name || 'Tất cả')}
                            onChange={(e) => setEndLocationSearch(e.target.value)}
                            onFocus={() => handleDropdownToggle('end', true)}
                            placeholder="Chọn hoặc tìm kiếm"
                            readOnly={!isEndDropdownOpen}
                        />
                        {isEndDropdownOpen && (
                            <div className={styles.dropdownContent}>
                                {filteredEndLocations.map(loc => (
                                    <div 
                                        key={loc.locationID}
                                        className={styles.dropdownItem}
                                        onClick={() => handleLocationSelect(loc, 'end')}
                                    >
                                        {loc.name}
                                    </div>
                                ))}
                                {filteredEndLocations.length === 0 && <div className={styles.noResult}>Không tìm thấy</div>}
                            </div>
                        )}
                         <span className={styles.dropdownToggle} onClick={() => handleDropdownToggle('end', !isEndDropdownOpen)}>
                            {isEndDropdownOpen ? '▲' : '▼'}
                        </span>
                    </div>
                </div>

                {/* Phương Tiện */}
                <div className={styles.filterSection}>
                    <h3 className={styles.filterTitle}>Phương tiện</h3>
                    <div className={styles.transportationOptions}>
                        {TRANSPORTATION_OPTIONS.map(opt => (
                            <button
                                key={opt}
                                className={transportation === opt ? styles.active : ''}
                                onClick={() => setTransportation(transportation === opt ? '' : opt)}
                                type="button"
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ⭐ Đánh giá - Hiển thị sao bằng CSS thuần */}
                <div className={styles.filterSection}>
                    <h3 className={styles.filterTitle}>Đánh giá</h3>
                    <div className={ratingStyles.ratingOptions}>
                        {RATING_OPTIONS.map(ratingValue => (
                            <label 
                                key={ratingValue}
                                htmlFor={`rating-${ratingValue}`}
                                className={`${ratingStyles.ratingLabel} ${selectedRating === ratingValue ? ratingStyles.selected : ''}`}
                            >
                                <input
                                    type="radio"
                                    id={`rating-${ratingValue}`}
                                    name="rating"
                                    value={ratingValue}
                                    checked={selectedRating === ratingValue}
                                    onChange={() => setSelectedRating(ratingValue)}
                                    className={ratingStyles.ratingRadio}
                                />
                                <div className={ratingStyles.customRadio}></div>
                                
                                {/* Sao được tạo bằng CSS - thêm data-rating để CSS xử lý */}
                                <div className={ratingStyles.starsContainer} data-rating={ratingValue}></div>
                                
                                {ratingValue === 0 && (
                                    <span className={ratingStyles.allLabel}>Trở lên</span>
                                )}
                                {ratingValue === 1 && (
                                    <span className={ratingStyles.allLabel}>Trở lên</span>
                                )}
                                {ratingValue === 2 && (
                                    <span className={ratingStyles.allLabel}>Trở lên</span>
                                )}
                                {ratingValue === 3 && (
                                    <span className={ratingStyles.allLabel}>Trở lên</span>
                                )}
                                {ratingValue === 4 && (
                                    <span className={ratingStyles.allLabel}>Trở lên</span>
                                )}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Nút Áp dụng */}
                <button 
                    className={styles.applyButton} 
                    onClick={handleApplyFilter}
                >
                    Áp dụng
                </button>
            </div>
        </div>
    );
};

export default FilterAndSearchInput;