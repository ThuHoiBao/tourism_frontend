// src/hook/useAdminBookings.ts

import { useState, useEffect, useCallback } from 'react';
import { searchBookingsForAdminApi } from '../services/booking/booking.ts';
import { BookingSearchRequestDTO, PageableRequest } from '../dto/requestDTO/BookingSearchRequestDTO.ts';

interface AdminBookingsHook {
    bookings: any[]; 
    loading: boolean;
    error: string | null;
    totalPages: number;
    totalElements: number;
    currentPage: number;
    refetch: () => void;
}

/**
 * Custom Hook để lấy danh sách booking cho Admin có phân trang và tìm kiếm.
 */
const useAdminBookings = (
    searchDTO: BookingSearchRequestDTO, 
    pageable: PageableRequest
): AdminBookingsHook => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [refetchTrigger, setRefetchTrigger] = useState(0);

    const refetch = useCallback(() => setRefetchTrigger(prev => prev + 1), []);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await searchBookingsForAdminApi(searchDTO, pageable);
                
                setBookings(response.content);
                setTotalPages(response.totalPages);
                setTotalElements(response.totalElements);
                setCurrentPage(response.number);
                
            } catch (err: any) {
                console.error('❌ useAdminBookings error:', err);
                setError("Không thể tải danh sách bookings. Vui lòng thử lại.");
                setBookings([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [searchDTO, pageable.page, pageable.size, pageable.sortBy, pageable.sortDir, refetchTrigger]); 

    return { bookings, loading, error, totalPages, totalElements, currentPage, refetch };
};

export default useAdminBookings;