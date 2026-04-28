// src/services/favoriteTour/favoriteTour.ts

import { api } from '../api.ts';
import { TourResponseDTO } from '../../dto/responseDTO/toursResponseDTO.ts';
/**
 * Thêm tour vào danh sách yêu thích của User.
 * @param userId ID của User
 * @param tourId ID của Tour
 */
export const addFavoriteTourApi = async (userId: number, tourId: number): Promise<void> => {
    try {
        await api.post(`/favorite-tours/add`, null, {
            params: { userId, tourId }
        });
        console.log(`Tour ${tourId} added to favorites for User ${userId}.`);
    } catch (error) {
        console.error("Error adding favorite tour:", error);
        throw error;
    }
};

/**
 * Xóa tour khỏi danh sách yêu thích của User.
 * @param userId ID của User
 * @param tourId ID của Tour
 */
export const removeFavoriteTourApi = async (userId: number, tourId: number): Promise<void> => {
    try {
        await api.delete(`/favorite-tours/remove`, {
            params: { userId, tourId }
        });
        console.log(`Tour ${tourId} removed from favorites for User ${userId}.`);
    } catch (error) {
        console.error("Error removing favorite tour:", error);
        throw error;
    }
};
/**
 * Lấy danh sách tour yêu thích của user.
 * Dùng endpoint mới: /api/favorite-tours/user/{userId}
 */
export const getUserFavoriteToursApi = async (userId: number): Promise<any[]> => {
    try {
        // Gọi API sử dụng endpoint đã cấu hình trong BE: /favorite-tours/user/{userId}
        const response = await api.get(`/favorite-tours/user/${userId}`);
        
        // Kiểm tra nếu backend trả về List<TourResponseDTO> (hoặc mảng rỗng)
        if (!Array.isArray(response.data)) {
             // Xử lý trường hợp không tìm thấy tour (ví dụ: trả về string 'Không tìm thấy tour')
             return [];
        }
        
        // Ánh xạ response data vào TourResponseDTO và chuyển sang plain object
        const tours: any[] = response.data.map((tourResponse: any) => {
            const dtoInstance = TourResponseDTO.fromApiResponse(tourResponse);
            return dtoInstance.toPlain();
        });
        
        console.log('Favorite Tours fetched:', tours);
        return tours;
    } catch (error) {
        console.error("Error fetching favorite tours:", error);
        throw error;
    }
};