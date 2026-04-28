//services/loction/location.ts
import  {api}  from '../api.ts'; // Import instance Axios đã cấu hình (từ src/services/tours/api.ts)
import { SearchToursRequestDTO } from '../../dto/responseDTO/searchToursRequestDTO.ts' // DTO GỬI ĐI
// import { ToursResponseDTO } from '../../dto/responseDTO/toursResponseDTO.ts'; 
import { TourRequestDTO } from '../../dto/requestDTO/TourRequestDTO.ts';
import { LocationDataDTO } from '../../dto/responseDTO/LocationDataDTO.ts';
export enum Region {
    NORTH = "NORTH",
    CENTRAL = "CENTRAL",
    SOUTH = "SOUTH"
}

interface DestinationMockData {
    locationID: number;
    endPoint: string;
    listImage: string;
    region: Region; // Thêm region
};

/**
 * Hàm API mới: Lấy danh sách 9 Điểm đến Yêu thích
 * @returns {DestinationMockData[]} Danh sách 9 điểm đến (giả lập)
 */
export const getFavoriteDestinationsApi = async (region: Region): Promise<DestinationMockData[]> => {
    console.log("destinations for region: " + region);
    
    // URL ảnh mặc định khi không tìm thấy ảnh từ Backend
    const DEFAULT_IMAGE_URL = 'https://images.unsplash.com/photo-1626608017817-211d7c48177d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8JUM0JTkxJUMzJUEwJTIwbCVFMSVCQSVBMXR8ZW58MHx8MHx8fDA%3D';

    const payload = {
        region: region
    };

    try {
        const response = await api.post(`/locations/destinations-by-region`, payload);
        console.log("khu vuccccccccccccccccc: "+ response)
        // Giả định Backend trả về danh sách các object có cấu trúc tương tự DestinationMockData
        const destinations: DestinationMockData[] = response.data.map((item: any) => ({
            endPoint: item.name,
            
            // ✨ LOGIC KIỂM TRA VÀ GÁN ẢNH MẶC ĐỊNH
            listImage: item.imageUrl // Lấy imageUrl
                ? item.imageUrl.toString() // Nếu tồn tại, chuyển về string
                : DEFAULT_IMAGE_URL, // Nếu null/undefined, dùng ảnh mặc định
            
            region: item.region,
            locationID:item.locationID,
        }));
        console.log("region"+ region)
        return destinations;
        

    } catch (error) {
        console.error(`Error fetching destinations for region ${region}:`, error);
        
        // Đảm bảo luôn trả về mảng rỗng nếu xảy ra lỗi API
        return [];
    }
};

// Định nghĩa interface Location (dùng cho cả điểm khởi hành và điểm đến)
export interface Location {
    locationID: number;
    name: string;
    imageUrl?: string;
    description?: string;
}

/**
 * Lấy danh sách các Điểm Khởi Hành
 */
export const getStartLocationsApi = async (): Promise<Location[]> => {
    try {
        const response = await api.get(`/locations/start-location`);
        return response.data as Location[];
    } catch (error) {
        console.error("Error fetching start locations:", error);
        return [];
    }
};

/**
 * Lấy danh sách các Điểm Đến
 */
export const getEndLocationsApi = async (): Promise<Location[]> => {
    try {
        const response = await api.get(`/locations/end-location`);
        return response.data as Location[];
    } catch (error) {
        console.error("Error fetching end locations:", error);
        return [];
    }
};