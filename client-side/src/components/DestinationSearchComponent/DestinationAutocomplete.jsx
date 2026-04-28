// File: src/components/homPageComponent/DestinationAutocomplete/DestinationAutocomplete.jsx

import React, { useState, useEffect } from 'react';
import styles from './DestinationSearch.module.scss'; 
import { FaMapMarkerAlt, FaCompass } from 'react-icons/fa'; 

// ⚠️ ĐẢM BẢO ĐƯỜNG DẪN NÀY CHÍNH XÁC:
import { fetchPlaceAutocomplete, AutocompletePrediction } from '../../services/mapbox.ts'; 

// Hàm lấy Icon hoặc Ảnh đại diện
const getIcon = (item) => {
    if (item.photo_url) {
        return <img src={item.photo_url} alt={item.main_text} className={styles.placeImage} />;
    }
    
    // Icon cho Điểm đến 
    if (item.type === 'destination') {
        return (
            <div className={styles.attractionIcon} style={{color: '#007bff'}}>
                 <FaMapMarkerAlt /> 
            </div>
        );
    }
    
    // Icon cho Điểm tham quan 
    return (
         <div className={styles.attractionIcon} style={{color: '#ff5722'}}>
            <FaCompass />
        </div>
    );
};

const DestinationAutocomplete = ({ inputValue, onSelect, onClear }) => {
    const [allSuggestions, setAllSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadSuggestions = async () => {
            if (inputValue.length < 2) {
                setAllSuggestions([]);
                return;
            }

            setLoading(true);
            setError(null);
            
            try {
                const results: AutocompletePrediction[] = await fetchPlaceAutocomplete(inputValue);
                
                // Cập nhật kết quả mới nhất
                setAllSuggestions(results);
            } catch (err) {
                console.error("Lỗi Autocomplete:", err);
                setError("Không thể tải gợi ý. Vui lòng kiểm tra Access Token/Key hoặc kết nối mạng.");
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(() => {
            loadSuggestions();
        }, 300); 

        return () => clearTimeout(timeoutId); 
    }, [inputValue]);

    const handleSelect = (item) => {
        // Gửi tên địa điểm lên component cha (Banner)
        onSelect(item);
        // Xóa danh sách gợi ý để đóng hộp gợi ý ngay lập tức
       // setAllSuggestions([]); 
    };
    
    // Điều kiện hiển thị model
    const showModel = inputValue.length >= 1 && (allSuggestions.length > 0 || loading || error);

    if (!showModel) {
        return null;
    }

    const hasResults = allSuggestions.length > 0;
    const scrollableStyle = hasResults ? {} : { maxHeight: 'none', overflowY: 'hidden' };


    return (
        <div className={styles.autocompleteContainer} style={scrollableStyle}>
            {/* Nút Xóa (Close/Clear) */}
            {/* <button className={styles.closeButton} onClick={onClear}>×</button> */}

            {/* Chỉ hiện "Đang tìm kiếm" nếu chưa có kết quả nào */}
            {loading && allSuggestions.length === 0 && <p className={styles.status}>Đang tìm kiếm...</p>}
            
            {error && <p className={styles.error}>{error}</p>}
            
            <div className={styles.section}>
                {(loading || hasResults) && (
                    <h4 className={styles.sectionTitle}>Điểm đến ({allSuggestions.length})</h4>
                )}
                
                {allSuggestions.length > 0 ? (
                    allSuggestions.map((item) => (
                        <div key={item.place_id} className={styles.item} onClick={() => handleSelect(item)}>
                            {getIcon(item)}
                            <div className={styles.textContainer}>
                                <span className={styles.mainText}>
                                    {item.main_text}
                                </span>
                                {item.secondary_text && <span className={styles.secondaryText}>{item.secondary_text}</span>} 
                            </div>
                        </div>
                    ))
                ) : (
                    // Thông báo không tìm thấy chung
                    !loading && !error && inputValue.length >= 2 && (
                        <p className={styles.status}>Không tìm thấy kết quả phù hợp cho: **{inputValue}**.</p>
                    )
                )}
            </div>
        </div>
    );
};

export default DestinationAutocomplete;