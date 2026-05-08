// src/hook/useBookings.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { getAllBookingsByUserApi } from '../services/booking/booking.ts';

// Định nghĩa kiểu dữ liệu trả về của Custom Hook
interface BookingsHook {
    bookings: any[];
    loading: boolean;
    error: string | null;
    refetch: () => void;
    /** Background refresh without loading spinner — for WS-triggered updates */
    silentRefetch: () => void;
    /** Instantly patch a single booking in the list (from WebSocket event) */
    updateBookingInList: (bookingID: number, fields: Partial<Record<string, any>>) => void;
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
    const silentRef = useRef(false);

    const refetch = useCallback(() => setRefetchTrigger(prev => prev + 1), []);

    /** Background refresh without loading spinner — for WS-triggered updates */
    const silentRefetch = useCallback(() => {
        silentRef.current = true;
        setRefetchTrigger(prev => prev + 1);
    }, []);

    /**
     * Instantly update a single booking in the list without a full refetch.
     * Called by the WebSocket handler for immediate UI feedback.
     */
    const updateBookingInList = useCallback((bookingID: number, fields: Partial<Record<string, any>>) => {
        setBookings(prev =>
            prev.map(b => b.bookingID === bookingID ? { ...b, ...fields } : b)
        );
    }, []);

    useEffect(() => {
        const fetchBookings = async () => {
            const isSilent = silentRef.current;
            silentRef.current = false;
            // Ngăn chặn gọi API nếu userID không hợp lệ
            if (!userID || userID <= 0) {
                console.warn('⚠️ useBookings: Invalid userID, skipping fetch.');
                setLoading(false);
                setBookings([]);
                return;
            }

            try {
                if (!isSilent) setLoading(true);
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
                } else if (!isSilent) {
                     setError("Không thể tải danh sách giao dịch. Vui lòng thử lại.");
                }

            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [userID, bookingStatus, refetchTrigger]); // Phụ thuộc vào userID, status và refetchTrigger

    return { bookings, loading, error, refetch, silentRefetch, updateBookingInList };
};

export default useBookings;