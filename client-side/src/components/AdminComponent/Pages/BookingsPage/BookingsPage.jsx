// src/components/AdminComponent/Pages/BookingsPage/BookingsPage.jsx
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import styles from './BookingsPage.module.scss';
import { FaCalendarCheck, FaSearch, FaRedoAlt, FaChevronLeft, FaChevronRight, FaCalendarAlt, FaChevronDown, FaCheck } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import useAdminBookings from '../../../../hook/useAdminBookings.ts';
import useWebSocket from '../../../../hook/useWebSocket.ts';
import BookingItem from './BookingItem';

const statusOptions = [
    { key: null, label: 'Tất cả trạng thái' },
    { key: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
    { key: 'PENDING_CONFIRMATION', label: 'Chờ xác nhận' },
    { key: 'PAID', label: 'Đã thanh toán' },
    { key: 'CANCELLED', label: 'Đã hủy' },
    { key: 'OVERDUE_PAYMENT', label: 'Quá hạn thanh toán' },
    { key: 'REVIEWED', label: 'Đã đánh giá' },
    { key: 'PENDING_REFUND', label: 'Chờ hoàn tiền' }
];

const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

// --- CUSTOM STATUS DROPDOWN COMPONENT ---
const StatusDropdown = ({ value, onChange, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const selectedLabel = options.find(opt => opt.key === value)?.label || 'Chọn trạng thái';

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (key) => {
        onChange(key);
        setIsOpen(false);
    };

    return (
        <div className={styles.customDropdown} ref={dropdownRef}>
            <button 
                type="button" 
                className={styles.dropdownToggle} 
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedLabel}
                <FaChevronDown className={`${styles.dropdownIcon} ${isOpen ? styles.rotated : ''}`} />
            </button>

            {isOpen && (
                <div className={styles.dropdownMenu}>
                    {options.map(option => (
                        <div 
                            key={option.key || 'all'} 
                            className={`${styles.dropdownItem} ${value === option.key ? styles.active : ''}`}
                            onClick={() => handleSelect(option.key)}
                        >
                            {option.label}
                            {value === option.key && <FaCheck className={styles.checkIcon} />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const BookingsPage = () => {
    // const [bookingCode, setBookingCode] = useState('');
    // const [bookingStatus, setBookingStatus] = useState(null);
    const [bookingDate, setBookingDate] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 5;
    const location = useLocation();
    
    //  Khởi tạo state bookingStatus dựa trên URL params
    const [bookingStatus, setBookingStatus] = useState(() => {
        const params = new URLSearchParams(location.search);
        return params.get('status') || null;
    });
    const [bookingCode, setBookingCode] = useState(() => {
        const params = new URLSearchParams(location.search);
        return params.get('search') || ''; // Nếu có ?search=... thì lấy, không thì rỗng
    });
   useEffect(() => {
        const params = new URLSearchParams(location.search);
        
        // 1. Xử lý Status
        const statusParam = params.get('status');
        if (statusParam) {
            setBookingStatus(statusParam);
        } else {
            setBookingStatus(null); // Reset nếu không có param
        }

        // 2. Xử lý Search (Booking Code)
        const searchParam = params.get('search');
        if (searchParam) {
            setBookingCode(searchParam);
        } else {
            setBookingCode(''); // Reset nếu không có param
        }

        // Reset trang về 0 khi URL thay đổi để đảm bảo tìm kiếm từ đầu
        setCurrentPage(0);
        
    }, [location.search]);
    const searchDTO = useMemo(() => ({
        bookingCode: bookingCode.trim() === '' ? null : bookingCode,
        bookingStatus: bookingStatus,
        bookingDate: bookingDate ? new Date(bookingDate.setHours(0,0,0,0)).toISOString().split('.')[0] : null,
    }), [bookingCode, bookingStatus, bookingDate]);
    
    const pageable = useMemo(() => ({
        page: currentPage,
        size: pageSize,
        sortBy: 'bookingDate',
        sortDir: 'DESC'
    }), [currentPage]);

    const { bookings, loading, error, totalPages, totalElements, refetch, silentRefetch, updateBookingInList } = useAdminBookings(searchDTO, pageable);

    // ✨ WEBSOCKET: Lắng nghe cập nhật từ backend
    // 1. Patch ngay booking đó trong list (không loading flash)
    // 2. Silent-refetch để đồng bộ dữ liệu đầy đủ trong nền mà không hiện spinner
    const handleWebSocketMessage = useCallback((event) => {
        console.log('🔔 [Admin WS] Booking update received:', event);
        if (event?.bookingID) {
            // Only patch fields that are explicitly non-null
            const patch = {};
            if (event.bookingStatus != null) patch.bookingStatus = event.bookingStatus;
            if (event.cancelReason  != null) patch.cancelReason  = event.cancelReason;
            if (event.refundAmount  != null) patch.refundAmount  = event.refundAmount;
            if (event.coinRefundStatus != null) patch.coinRefundStatus = event.coinRefundStatus;
            if (Object.keys(patch).length > 0) updateBookingInList(event.bookingID, patch);
        }
        silentRefetch();
    }, [updateBookingInList, silentRefetch]);

    useWebSocket({
        topic: '/topic/admin/bookings',
        onMessage: handleWebSocketMessage,
        enabled: true
    });

    const handleSearch = () => {
        setCurrentPage(0);
        refetch();
    };

    const handleReset = () => {
        setBookingCode('');
        setBookingStatus(null);
        setBookingDate(null);
        setCurrentPage(0);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 0 && newPage < totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <div className={styles.pageContainer}>
            <h1 className={styles.pageTitle}>
                <FaCalendarCheck className={styles.icon} /> Quản Lý Bookings
            </h1>
            
            {/* Filter Bar */}
            <div className={styles.filterBar}>
                <div className={`${styles.filterItem} ${styles.searchItem}`}>
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm Mã Booking..." 
                        value={bookingCode}
                        onChange={(e) => setBookingCode(e.target.value)}
                        className={styles.filterInput}
                    />
                    <FaSearch className={styles.inputIcon} />
                </div>
                
                <div className={styles.filterItem}>
                    <StatusDropdown
                        value={bookingStatus}
                        onChange={setBookingStatus}
                        options={statusOptions}
                    />
                </div>

                <div className={`${styles.filterItem} ${styles.dateItem}`}>
                    <DatePicker
                        selected={bookingDate}
                        onChange={(date) => setBookingDate(date)}
                        placeholderText="Ngày đặt"
                        dateFormat="dd/MM/yyyy"
                        isClearable
                        wrapperClassName={styles.datePickerWrapper}
                        customInput={
                            <div className={styles.customDateInput}>
                                <input readOnly value={bookingDate ? formatDate(bookingDate) : ''} placeholder="Ngày đặt" />
                                <FaCalendarAlt className={styles.dateIcon} />
                            </div>
                        }
                    />
                </div>

                <button 
                    className={styles.searchButton} 
                    onClick={handleSearch}
                    disabled={loading}
                >
                    <FaSearch /> Tìm kiếm
                </button>
                <button 
                    className={styles.resetButton} 
                    onClick={handleReset}
                    disabled={loading}
                >
                    <FaRedoAlt /> Làm mới
                </button>
            </div>

            {/* Booking Table */}
            <div className={styles.tableWrapper}>
                {loading ? (
                    <div className={styles.loadingState}>Đang tải danh sách bookings...</div>
                ) : error ? (
                    <div className={styles.errorState}>{error}</div>
                ) : (
                    <>
                        {bookings.length === 0 ? (
                            <div className={styles.emptyState}>Không tìm thấy Booking nào phù hợp.</div>
                        ) : (
                            <table className={styles.bookingsTable}>
                                <thead>
                                    <tr>
                                        <th>Mã Booking</th>
                                        <th>Tour</th>
                                        <th>Ngày Khởi Hành</th>
                                        <th>Ngày Đặt</th>
                                        <th>Trạng Thái</th>
                                        <th>Hành Động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map(booking => (
                                        <BookingItem 
                                            key={booking.bookingID} 
                                            booking={booking} 
                                            formatPrice={formatPrice} 
                                            formatDate={formatDate}
                                            refetch={refetch}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </>
                )}
            </div>

            {/* Pagination */}
            {!loading && (
                <div className={styles.pagination}>
                    <span>
                        {totalElements > 0 ? 
                            `Showing ${Math.min(totalElements, currentPage * pageSize + 1)} - ${Math.min(totalElements, (currentPage + 1) * pageSize)} of ${totalElements} bookings` 
                            : 
                            `Showing 0 of 0 bookings`
                        }
                    </span>
                    
                    {totalElements > 0 && totalPages > 1 && (
                        <div className={styles.paginationControls}>
                            <button 
                                onClick={() => handlePageChange(currentPage - 1)} 
                                disabled={currentPage === 0}
                                className={styles.pageButton}
                            >
                                <FaChevronLeft />
                            </button>
                            
                            <span className={styles.pageNumber}>{currentPage + 1} / {totalPages}</span>
                            
                            <button 
                                onClick={() => handlePageChange(currentPage + 1)} 
                                disabled={currentPage === totalPages - 1}
                                className={styles.pageButton}
                            >
                                <FaChevronRight />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BookingsPage;
