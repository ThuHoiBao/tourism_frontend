// src/services/review/review.ts (Tạo file mới)

import { api } from '../api.ts'; 
import { ReviewResponseDTO } from '../../dto/responseDTO/ReviewResponseDTO.ts'; 
interface ReviewFormDTO {
    rating: number;
    comment: string;
    images: File[]; // File objects từ input
    tourID: number;
    bookingID: number;
}

/**
 * Gửi đánh giá và hình ảnh lên Backend.
 * Sử dụng FormData để handle MultipartFile.
 */
export const submitReviewApi = async (reviewData: ReviewFormDTO) => {
    const formData = new FormData();

    formData.append('rating', String(reviewData.rating));
    formData.append('comment', reviewData.comment);
    formData.append('tourID', String(reviewData.tourID));
    formData.append('bookingID', String(reviewData.bookingID));

    // Thêm các file vào FormData
    reviewData.images.forEach(file => {
        formData.append('images', file); // Tên field phải khớp với backend: 'images'
    });
    console.log('Submitting review with data:', reviewData);
    const response = await api.post('/reviews', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    console.log('Review submission response:', response.data);
    return response.data; 
    // Trả về Review object
};
/**
 * Gọi API lấy đánh giá chi tiết theo Booking ID.
 */
export const getReviewByBookingIdApi = async (bookingID: number): Promise<ReviewResponseDTO> => {
    const response = await api.get(`/reviews/${bookingID}`);
    // Giả định bạn có ReviewResponseDTO.fromApiResponse để map dữ liệu
    return response.data; // Trả về raw data (hoặc map nó nếu cần)
};