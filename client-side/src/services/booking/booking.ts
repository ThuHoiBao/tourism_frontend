// src/services/booking/booking.ts
import { api } from '../api'; // Giả định api.ts đã được import đúng
import { BookingResponseDTO } from '../../dto/responseDTO/BookingResponseDTO';
import { BookingSearchRequestDTO, PageableRequest } from '../../dto/requestDTO/BookingSearchRequestDTO';

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

// ─── DEAD EVENT ADMIN APIs ─────────────────────────────────────────────────

export interface DeadEventCount {
    coinRefund: number;
    notification: number;
    total: number;
}

export interface DeadEventPage {
    content: OutboxEventDTO[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
    empty: boolean;
}

export interface OutboxEventDTO {
    id: number;
    idempotencyKey: string;
    exchange: string;
    routingKey: string;
    payload: string;
    status: string;
    retries: number;
    maxRetries: number;
    maxBackoffSecs: number;
    lockedBy: string | null;
    lockedAt: string | null;
    nextRetryAt: string;
    createdAt: string;
    sentAt: string | null;
    errorMessage: string | null;
}

export interface DeadEventDetailResponse {
    id: number;
    taskType: string;
    status: string;
    statusLabel: string;
    routingKey: string;
    eventType: string | null;
    idempotencyKey: string;
    retryText: string;
    retries: number;
    maxRetries: number;
    maxBackoffSecs: number;
    createdAt: string;
    nextRetryAt: string;
    sentAt: string | null;
    lockedBy: string | null;
    lockedAt: string | null;
    latestError: string | null;
    suggestion: string | null;
    booking: {
        bookingID: number | null;
        bookingCode: string | null;
        bookingStatus: string | null;
        userId: number | null;
        customerName: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
        contactAddress: string | null;
        cancelReason: string | null;
        departureId: number | null;
        tourName: string | null;
        tourCode: string | null;
        departureDate: string | null;
        coinRefundStatus: string | null;
    } | null;
    refund: {
        totalPrice: number | null;
        paidByCoin: number | null;
        refundAmount: number | null;
        coinRefundAmount: number | null;
        refundBank: string | null;
        refundAccountNumberMasked: string | null;
        refundAccountName: string | null;
    } | null;
    rawPayload: string | null;
    payloadJson: Record<string, any>;
}

/** Lấy danh sách DEAD outbox events (phân trang, mới nhất trước) */
export const getDeadEventsApi = async (page = 0, size = 20): Promise<DeadEventPage> => {
    const response = await api.get('/bookings/admin/outbox/dead', { params: { page, size } });
    return response.data;
};

/** Lay chi tiet DEAD event da enrich thong tin nghiep vu tu booking DB */
export const getDeadEventDetailApi = async (id: number): Promise<DeadEventDetailResponse> => {
    const response = await api.get(`/bookings/admin/outbox/dead/${id}`);
    return response.data;
};

/** Đếm DEAD events phân loại theo type */
export const getDeadEventCountApi = async (): Promise<DeadEventCount> => {
    const response = await api.get('/bookings/admin/outbox/dead/count');
    return response.data;
};

/** Reset 1 DEAD event về NEW để scheduler retry */
export const retryDeadEventApi = async (id: number): Promise<void> => {
    await api.post(`/bookings/admin/outbox/retry/${id}`);
};

/** Reset tất cả DEAD events (hoặc theo routingKey) về NEW */
export const retryAllDeadEventsApi = async (routingKey?: string): Promise<{ retried: number }> => {
    const params: any = {};
    if (routingKey) params.routingKey = routingKey;
    const response = await api.post('/bookings/admin/outbox/retry-all', null, { params });
    return response.data;
};

// ────────────────────────────────────────────────────────────
// Queue Health
// ────────────────────────────────────────────────────────────

export interface QueueHealthResponse {
    queue: string;
    ready: number;
    unacked: number;
    consumers: number;
    dlqReady: number;
    status: 'HEALTHY' | 'BACKLOG' | 'CONSUMER_DOWN' | 'DLQ_ATTENTION' | 'BROKER_DOWN';
    message: string;
    checkedAt: string;
}

export const getQueueHealthApi = async (): Promise<QueueHealthResponse> => {
    const response = await api.get('/bookings/admin/outbox/rabbitmq-health');
    return response.data;
};
