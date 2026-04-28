// src/dto/requestDTO/BookingSearchRequestDTO.ts

export interface BookingSearchRequestDTO {
    bookingCode?: string | null;
    bookingStatus?: string | null; 
    bookingDate?: string | null; 
}

export interface PageableRequest {
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: 'ASC' | 'DESC';
}