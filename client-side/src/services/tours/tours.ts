//services/tours/tours.ts
import  {api}  from '../api'; // Import instance Axios đã cấu hình (từ src/services/tours/api.ts)
// import { SearchToursRequestDTO } from '../../dto/responseDTO/searchToursRequestDTO' // DTO GỬI ĐI
import { TourResponseDTO } from '../../dto/responseDTO/toursResponseDTO';
import { TourRequestDTO } from '../../dto/requestDTO/TourRequestDTO';// DTO NHẬN VỀ
import { TourSpecialRequestDTO } from '../../dto/requestDTO/TourSpecialRequestDTO';
import { SearchToursRequestDTO } from '../../dto/requestDTO/SearchToursRequestDTO'; // 👈 IMPORT MỚI
const mapTourResponseToDto = (tourResponse: any): TourRequestDTO => {
    const tourDto = new TourRequestDTO();
    
    // Ánh xạ các trường
    tourDto.tourID = tourResponse.tourID;
    tourDto.tourCode = tourResponse.tourCode;
    tourDto.tourName = tourResponse.tourName;
    tourDto.duration = tourResponse.duration;
    tourDto.transportation = tourResponse.transportation;
    tourDto.endPointName = tourResponse.endPointName; 
    
    // Các trường phức tạp
    tourDto.departureDate = tourResponse.departureDate; 
    tourDto.money = tourResponse.money; 
    tourDto.image = tourResponse.image; 
    
    return tourDto;
};
// Hàm chuẩn hóa giá từ chuỗi (ví dụ: "Từ 5 - 10 triệu") thành số
const parseBudgetRange = (budgetString: string): { startPrice: number, endPrice: number } => {
    switch (budgetString) {
        case 'Dưới 5 triệu':
            return { startPrice: 0, endPrice: 5000000 };
        case 'Từ 5 - 10 triệu':
            return { startPrice: 5000000, endPrice: 10000000 };
        case 'Từ 10 - 20 triệu':
            return { startPrice: 10000000, endPrice: 20000000 };
        case 'Trên 20 triệu':
            // Giá trị cuối trong DTO là 999... nên ta dùng nó
            return { startPrice: 20000000, endPrice: 999999999 };
        default:
            return { startPrice: 0, endPrice: 999999999 }; // Mặc định: Không giới hạn
    }
};

/**
 * Gọi API tìm kiếm tour dựa trên các tiêu chí (Sử dụng GET request).
 * @param searchData - Dữ liệu tìm kiếm từ URL params.
 * @returns Promise<TourResponseDTO[]> - Danh sách các TourResponseDTO.
 */
export const searchToursApi = async (searchData: any, userId?: number): Promise<any[]> => {
    // 1. Chuẩn hóa dữ liệu form thành SearchToursRequestDTO
    // ... (Giữ nguyên logic tạo requestDto và payload) ...
    const { startPrice, endPrice } = parseBudgetRange(searchData.budget || ''); 

    const requestDto = new SearchToursRequestDTO();
    
    requestDto.searchNameTour = searchData.searchNameTour || "";
    requestDto.startPrice = startPrice;
    requestDto.endPrice = endPrice;

    requestDto.startLocationID = searchData.startLocationID ? parseInt(searchData.startLocationID) : -1;
    requestDto.endLocationID = searchData.endLocationID ? parseInt(searchData.endLocationID) : -1;

    requestDto.transportation = searchData.transportation || "";
    requestDto.rating = searchData.rating ? parseInt(searchData.rating) : 0; // rating: 1, 2, 3, 4, 5 (0 = All)
    const payload: Record<string, any> = requestDto.toPlain();
    if (userId) {
        payload.userId = userId;
    }
    console.log('Dữ liệu tìm kiếm (Payload - dùng cho GET parameters):', payload);

    try {
        const response = await api.get(`/tours/search`, {
            params: payload 
        });

        // Xử lý trường hợp backend trả về string (Không tìm thấy tour)
        if (typeof response.data === 'string') {
            return [];
        }
        
        // ✨ Ánh xạ Response data vào TourResponseDTO mới ✨
        const tours: TourResponseDTO[] = response.data.map((tourResponse: any) => {
            // Sử dụng static method fromApiResponse để ánh xạ chính xác
            const dtoInstance = TourResponseDTO.fromApiResponse(tourResponse);
            // Chuyển sang Plain object để dễ dùng trong React components
            return dtoInstance.toPlain(); 
        });

        console.log('Tours found:', tours);
        // Trả về mảng các plain objects
        return tours; 
    } catch (error) {
        console.error("Error searching tours:", error);
        throw error;
    }
};
export const getFeaturedToursApi = async (): Promise<TourRequestDTO[]> => { 
    try {
        const request = await api.get(`/tours/display`);
         console.log("Featured Tours request: ", request)
        const rawTours = request.data;
        
        const featuredTours: TourRequestDTO[] = rawTours
            .slice(0, 5) 
            .map(mapTourResponseToDto) // Đầu ra của mapTourResponseToDto là TourRequestDTO
            .map((tour: TourRequestDTO) => tour.toPlain()); // Trả về Plain Object (dễ dùng trong React Component)            
        console.log("Featured Tours Mapped: ", featuredTours)
        return featuredTours;
        
    } catch (error) {
        console.error("Error fetching featured tours from API:", error);
        throw error; 
    }
};
export const getSpecialToursApi = async (): Promise<TourSpecialRequestDTO[]> => {
    try {
        // Gọi API backend mới
        const response = await api.get(`/tours/deepest-discount`);
        console.log("Deepest Discount Tours response: ", response);
        const rawTours = response.data;
        
        // Ánh xạ từng phần tử response vào TourSpecialRequestDTO
        const specialTours: TourSpecialRequestDTO[] = rawTours
            .map((tourResponse: any) => TourSpecialRequestDTO.fromApiResponse(tourResponse))
            // Tùy chọn: Chuyển sang Plain Object để dùng trong Component
            .map((tourDto: TourSpecialRequestDTO) => tourDto.toPlain()); 
            
        console.log("Special Tours Mapped: ", specialTours);
        return specialTours;
        
    } catch (error) {
        console.error("Error fetching special discount tours:", error);
        // Ném lỗi để hook/component xử lý
        throw error; 
    }
};
