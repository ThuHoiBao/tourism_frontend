// src/hook/useBookings.ts
import { useState, useEffect, useCallback } from 'react';
import { getAllBookingsByUserApi } from '../services/booking/booking.ts';

// Định nghĩa kiểu dữ liệu trả về của Custom Hook
interface BookingsHook {
    bookings: any[]; // Sử dụng any[] vì DTO đã chuyển sang Plain Object
    loading: boolean;
    error: string | null;
    refetch: () => void; // Hàm để kích hoạt việc tải lại dữ liệu
}

/**
 * Custom Hook để lấy danh sách booking của người dùng.
 * @param userID ID của người dùng.
 * @param bookingStatus Trạng thái booking để filter (null/undefined cho tất cả).
 * @returns {bookings, loading, error, refetch}
 */
const useBookings = (userID: number, bookingStatus?: string | null): BookingsHook => {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [refetchTrigger, setRefetchTrigger] = useState(0);

    // Hàm để kích hoạt việc tải lại dữ liệu (exposed to component)
    const refetch = useCallback(() => setRefetchTrigger(prev => prev + 1), []);

    useEffect(() => {
        const fetchBookings = async () => {
            // Ngăn chặn gọi API nếu userID không hợp lệ
            if (!userID || userID <= 0) {
                console.warn('⚠️ useBookings: Invalid userID, skipping fetch.');
                setLoading(false);
                setBookings([]);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                
                console.log(`🔄 useBookings: Fetching data for User ID: ${userID} and Status: ${bookingStatus || 'ALL'}`);
                
                const data = await getAllBookingsByUserApi(userID, bookingStatus);
                
                console.log(`✅ useBookings: Received ${data.length} bookings.`);
                setBookings(data);
                
            } catch (err: any) {
                console.error('❌ useBookings error:', err);
                
                // Xử lý trường hợp 404 (Không tìm thấy booking)
                if (err.response?.status === 404) {
                     setBookings([]);
                     setError(null);
                } else {
                     setError("Không thể tải danh sách giao dịch. Vui lòng thử lại.");
                }
               
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [userID, bookingStatus, refetchTrigger]); // Phụ thuộc vào userID, status và refetchTrigger

    return { bookings, loading, error, refetch };
};

export default useBookings;