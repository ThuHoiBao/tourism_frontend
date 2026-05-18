// src/components/ToursPageComponent/ToursPage.jsx (CẬP NHẬT)

import React, { useEffect, useState, useMemo,useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchToursApi } from '../../services/tours/tours.ts';
import { useLocations } from '../../hook/useLocations.ts';
import FilterAndSearchInput from './FilterAndSearchInput/FilterAndSearchInput.jsx'; 
import TourComponent from './TourComponent/TourComponent.jsx'; 
import styles from './ToursPage.module.scss'; 
import { useAuth } from '../../context/AuthContext.jsx';
import { FaHome } from 'react-icons/fa';
import toursHeroImage from '../../assets/images/digitalarbyter-maJ7hJBE654-unsplash.jpg';
// Định nghĩa các Tùy chọn Sắp xếp
const SORT_OPTIONS = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'PRICE_ASC', label: 'Giá từ thấp đến cao' },
    { value: 'PRICE_DESC', label: 'Giá từ cao đến thấp' },
    { value: 'DEPARTURE_NEAR', label: 'Ngày khởi hành gần nhất' },
];
const ToursPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { endLocations, loading: locationsLoading } = useLocations(); 
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentSort, setCurrentSort] = useState(SORT_OPTIONS[0]); // Mặc định: 'Tất cả'
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const currentSearchParams = Object.fromEntries(searchParams.entries());
    const {user} = useAuth();
    const currentUserId = user?.userId || user?.userID || user?.id  || null;
    const currentEndPointInfo = useMemo(() => {
        const endLocationId = currentSearchParams.endLocationID || '-1';
        return endLocations.find(loc => loc.locationID.toString() === endLocationId);
    }, [endLocations, currentSearchParams.endLocationID]);

    useEffect(() => {
        const fetchTours = async () => {
            setLoading(true);
            setError(null);
            
            const requestData = currentSearchParams;

            try {
                // data đã là mảng plain object từ searchToursApi
                const data = await searchToursApi(requestData,currentUserId); 
                setTours(data);
                setCurrentSort(SORT_OPTIONS[0]); // Reset sắp xếp về 'Tất cả' sau mỗi lần tìm kiếm
            } catch (err) {
                setError("Có lỗi xảy ra khi tìm kiếm tour.");
                setTours([]); 
                console.error("Fetch tours error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTours();
        
    }, [searchParams, currentUserId]); 

    // ✨ LOGIC SẮP XẾP SỬ DỤNG useMemo ✨
    const sortedTours = useMemo(() => {
        if (!tours || tours.length === 0 || currentSort.value === 'ALL') {
            return tours;
        }

        const sorted = [...tours]; // Tạo bản sao để sắp xếp
        
        switch (currentSort.value) {
            case 'PRICE_ASC': // Giá từ thấp đến cao (Dùng trường 'money')
                sorted.sort((a, b) => a.money - b.money);
                break;
            case 'PRICE_DESC': // Giá từ cao đến thấp (Dùng trường 'money')
                sorted.sort((a, b) => b.money - a.money);
                break;
            case 'DEPARTURE_NEAR': // Ngày khởi hành gần nhất
                sorted.sort((a, b) => {
                    // departureDates là mảng các ngày đã được sort sẵn trong BE, ta lấy ngày đầu tiên (gần nhất)
                    const dateA = a.departureDates?.[0]?.fullDate; 
                    const dateB = b.departureDates?.[0]?.fullDate;

                    if (!dateA) return 1; 
                    if (!dateB) return -1;

                    // Sắp xếp ngày gần nhất lên đầu (so sánh timestamp)
                    return new Date(dateA).getTime() - new Date(dateB).getTime();
                });
                break;
            default:
                break;
        }
        return sorted;
    }, [tours, currentSort.value]);
    
// Kiểm tra xem người dùng đã chọn điểm đến cụ thể hay chưa
const isSpecificDestinationSelected = currentEndPointInfo && currentEndPointInfo.locationID !== -1;
const destinationName = isSpecificDestinationSelected ? currentEndPointInfo.name : 'Future Travel';
const heroTitle = isSpecificDestinationSelected
    ? currentEndPointInfo.name.toUpperCase()
    : 'DU LỊCH FUTURE TRAVEL';
const heroDescription = isSpecificDestinationSelected
    ? (currentEndPointInfo.description || 'Khám phá điểm đến hấp dẫn này cùng Future Travel với các hành trình được chọn lọc kỹ lưỡng.')
    : 'Khám phá những hành trình trong và ngoài nước được Future Travel tuyển chọn, với lịch khởi hành linh hoạt, mức giá rõ ràng và trải nghiệm được chăm chút từ lúc tìm tour đến khi trở về.';
// Hàm xử lý khi chọn tùy chọn sắp xếp
    const handleSortSelect = useCallback((option) => {
        setCurrentSort(option);
        setIsSortDropdownOpen(false);
    }, []);
    return (
        <>
            <section
                className={styles.pageHero}
                style={{ backgroundImage: `url(${toursHeroImage})` }}
            >
                <div className={styles.heroInner}>
                    <div className={styles.heroBreadcrumb}>
                        <span className={styles.crumb} onClick={() => navigate('/')} style={{cursor: 'pointer'}}><FaHome /> Du lịch</span>
                        <span className={styles.crumbDivider}>/</span>
                        <span className={styles.crumb}>Trong nước</span>
                        <span className={styles.crumbDivider}>/</span>
                        <span className={styles.crumbActive}>{destinationName}</span>
                    </div>
                    <div className={styles.heroTextBlock}>
                        <h1 className={styles.heroTitle}>{heroTitle}</h1>
                        <p className={styles.heroSub}>{heroDescription}</p>
                    </div>
                </div>
            </section>

            <div className={styles.toursPageLayout}>
                {/* Cột Trái: Bộ Lọc */}
                <div className={styles.filterColumn}>
                    <FilterAndSearchInput /> 
                </div>

                {/* Cột Phải: Thông tin Điểm đến và Kết Quả */}
                <div className={styles.resultsColumn}>
                    {/* ✨ HEADER KẾT QUẢ VÀ SẮP XẾP MỚI ✨ */}
                    <div className={styles.resultHeader}> 
                        <div className={styles.resultSummary}>
                            <span className={styles.resultEyebrow}>Kết quả tìm kiếm</span>
                            <h3 className={styles.tourCount}>
                                <span className={styles.tourCountValue}>{tours.length}</span>
                                <span>chương trình tour phù hợp</span>
                            </h3>
                        </div>
                        {/* DROP DOWN SẮP XẾP */}
                        <div className={styles.sortContainer}>
                            <span className={styles.sortLabel}>Sắp xếp:</span>
                            <div 
                                className={styles.sortDropdown}
                                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                            >
                                <span className={styles.sortSelected}>{currentSort.label}</span>
                                <i className={`fas fa-chevron-${isSortDropdownOpen ? 'up' : 'down'}`}></i>
                                
                                {isSortDropdownOpen && (
                                    <div className={styles.sortOptionsList}>
                                        {SORT_OPTIONS.map(option => (
                                            <div 
                                                key={option.value}
                                                className={`${styles.sortOption} ${currentSort.value === option.value ? styles.activeSort : ''}`}
                                                onClick={() => handleSortSelect(option)}
                                            >
                                                {option.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {(loading || locationsLoading) && <p>Đang tải dữ liệu...</p>}
                    {error && <p className={styles.errorMessage}>Lỗi: {error}</p>}
                    
                    {/* SỬ DỤNG DANH SÁCH TOUR ĐÃ SẮP XẾP */}
                   {!loading && !error && (
                    <TourComponent 
                        tours={sortedTours} 
                        currentUserId={currentUserId} // TRUYỀN ID XUỐNG
                    />
                )}
                    {/* Xóa logic hiển thị 'Không tìm thấy' cũ vì đã được xử lý trong TourComponent */}
                    
                </div>
            </div>
        </>
    );
};

export default ToursPage;
