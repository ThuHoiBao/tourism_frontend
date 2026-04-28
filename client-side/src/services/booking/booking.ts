// src/services/booking/booking.ts
import { api } from '../api.ts'; // Giả định api.ts đã được import đúng
import { BookingResponseDTO } from '../../dto/responseDTO/BookingResponseDTO.ts';
import { BookingSearchRequestDTO, PageableRequest } from '../../dto/requestDTO/BookingSearchRequestDTO.ts';

export const getAllBookingsByUserApi = async (
    userID: number,
    bookingStatus?: string | null
): Promise<any[]> => {
    try {
        console.log(`Fetching bookings for userID: ${userID}, status: ${bookingStatus || 'ALL'}`);

        // Tạo params object, chỉ thêm bookingStatus nếu nó có giá trị
        const params: any = {};
        if (bookingStatus) {
            // Chuyển status thành chữ hoa như yêu cầu của API backend
            params.bookingStatus = bookingStatus.toUpperCase();
        }

        const response = await api.get(`/bookings/user/${userID}`, { params });
        console.log('API response received:', response.data);
        // Xử lý response.data
        if (!Array.isArray(response.data)) {
            console.warn("API response is not an array, returning empty list.");
            return [];
        }

        // Ánh xạ dữ liệu raw thành DTO và sau đó thành Plain Object
        const bookings = response.data.map((item: any) => {
            const dto = BookingResponseDTO.fromApiResponse(item);
            return dto.toPlain();
        });

        console.log('Successfully mapped bookings:', bookings);
        return bookings;

    } catch (error) {
        console.error('Error fetching bookings:', error);
        // Có thể ném lỗi để hook xử lý
        throw error;
    }
};
// Giả định Request DTO:
interface BookingCancellationRequestDTO {
    bookingID: number;
}
interface RefundInformationRequestDTO {
    accountName: string;
    accountNumber: string;
    bank: string;
}

/**
 * Gọi API hủy booking và hoàn tiền bằng Coin (Hoàn tiền tự động)
 */
export const cancelBookingApi = async (bookingID: number): Promise<BookingResponseDTO> => {
    const payload: BookingCancellationRequestDTO = { bookingID };
    const response = await api.post(`/bookings/cancel`, payload);
    return BookingResponseDTO.fromApiResponse(response.data);
};

/**
 * Gọi API yêu cầu hoàn tiền vào ngân hàng (Gửi yêu cầu admin xử lý)
 */
export const requestRefundApi = async (bookingID: number, refundInfo: RefundInformationRequestDTO): Promise<BookingResponseDTO> => {
    const response = await api.post(`/bookings/refund-request/${bookingID}`, refundInfo);
    return BookingResponseDTO.fromApiResponse(response.data);
};

// Định nghĩa cấu trúc response của Spring Page
interface SpringPageResponse {
    content: any[];
    totalPages: number;
    totalElements: number;
    number: number; 
    size: number;
    // ... các trường khác
}

/**
 * Gọi API tìm kiếm Bookings cho Admin với phân trang.
 */
export const searchBookingsForAdminApi = async (
    searchDTO: BookingSearchRequestDTO,
    pageable: PageableRequest
): Promise<SpringPageResponse> => {
    try {
        console.log('Searching bookings with DTO:', searchDTO, 'and Pageable:', pageable);
        
        const response = await api.post(`/bookings/admin/search`, searchDTO, { 
            params: {
                page: pageable.page || 0,
                size: pageable.size || 10,
                sortBy: pageable.sortBy || 'bookingDate',
                sortDir: pageable.sortDir || 'DESC'
            }
        });

        const data: SpringPageResponse = response.data;
        
        // Map content (list of raw bookings) to DTO Plain Objects
        data.content = data.content.map((item: any) => {
            const dto = BookingResponseDTO.fromApiResponse(item);
            return dto.toPlain();
        });

        console.log('Admin search response:', data);
        return data;

    } catch (error) {
        console.error('Error searching bookings:', error);
        throw error;
    }
};

// NEW: API cập nhật trạng thái booking
export interface BookingUpdateStatusRequestDTO {
    bookingID: number;
    bookingStatus: string;
    cancelReason?: string;
}

export const updateBookingStatusApi = async (
    requestDTO: BookingUpdateStatusRequestDTO
): Promise<any> => {
    try {
        const response = await api.post('/bookings/admin/update-status', requestDTO);
        const dto = BookingResponseDTO.fromApiResponse(response.data);
        return dto.toPlain();
    } catch (error) {
        console.error('Error updating booking status:', error);
        throw error;
    }
};