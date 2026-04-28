// src/hook/useFavoriteDestinations.ts (CẬP NHẬT)

import { useState, useEffect } from 'react';
// ✨ Import hàm API mới và Enum Region
import { getFavoriteDestinationsApi, Region } from '../services/location/location.ts'; 

// Định nghĩa kiểu dữ liệu (tương tự DestinationMockData trong tours.ts)
interface DestinationData {
    endPoint: string;
    listImage: string;
    region: Region; // Thêm region
}

// Định nghĩa tham số đầu vào cho Hook
interface FavoriteDestinationsHook {
    destinations: DestinationData[];
    loading: boolean;
    error: string | null;
    fetchDestinationsByRegion: (region: Region) => void;
    activeRegion: Region;
}

/**
 * Hook để lấy danh sách các điểm đến yêu thích theo Region.
 */
const useFavoriteDestinations = (): FavoriteDestinationsHook => {
    const [destinations, setDestinations] = useState<DestinationData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    // ✨ State để theo dõi Miền đang hoạt động (Mặc định Miền Bắc)
    const [activeRegion, setActiveRegion] = useState<Region>(Region.NORTH);

    // Hàm thực hiện việc gọi API
    const fetchDestinations = async (region: Region) => {
        setLoading(true);
        setError(null);
        try {
            // ✨ Gọi API với tham số region
            const data = await getFavoriteDestinationsApi(region);
            setDestinations(data as DestinationData[]);
        } catch (err) {
            console.error("Lỗi khi tải điểm đến yêu thích:", err);
            setError("Không thể tải danh sách điểm đến.");
        } finally {
            setLoading(false);
        }
    };
    
    // Hàm public để Component gọi khi click vào Tab
    const fetchDestinationsByRegion = (region: Region) => {
        setActiveRegion(region);
        fetchDestinations(region);
    }


    useEffect(() => {
        // Tải mặc định Miền Bắc khi component mount
        fetchDestinations(activeRegion); 
    }, []); // Chỉ chạy một lần khi mount

    return { 
        destinations, 
        loading, 
        error, 
        fetchDestinationsByRegion, // Hàm để Component gọi
        activeRegion, // Region đang hiển thị
    };
};

export default useFavoriteDestinations;