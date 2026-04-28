// src/dto/responseDTO/ReviewResponseDTO.ts

// Định nghĩa interface cho dữ liệu phản hồi từ API ReviewController
export interface ReviewResponseDTO {
    // Các trường cơ bản của Review
    reviewID: number;
    rating: number;
    comment: string;
    
    // Các trường liên kết (từ Booking và Tour)
    bookingCode: string;
    tourCode: string;
    
    // Danh sách URL ảnh
    imageUrls: string[]; 
}

