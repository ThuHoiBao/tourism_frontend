// src/hooks/useFeaturedTours.ts

import { useState, useEffect } from 'react';
// Giả định ToursResponseDTO là kiểu dữ liệu cho một tour
import { TourRequestDTO } from '../dto/requestDTO/TourRequestDTO.ts';
import { getFeaturedToursApi } from '../services/tours/tours.ts';

// Định nghĩa kiểu dữ liệu cho giá trị trả về của Custom Hook
interface FeaturedToursHook {
    featuredTours: TourRequestDTO[];
    loading: boolean;
    error: string | null;
}

/**
 * Custom Hook để tải và quản lý trạng thái của các tour nổi bật.
 * @returns {FeaturedToursHook} { featuredTours, loading, error }
 */
const useFeaturedTours = (): FeaturedToursHook => {
    const [featuredTours, setFeaturedTours] = useState<TourRequestDTO[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTours = async () => {
            try {
                const tours: TourRequestDTO[] = await getFeaturedToursApi();
                setFeaturedTours(tours);
                console.log("ddddddddddd: "+tours)
            } catch (err) {
                console.error("Lỗi khi tải tour nổi bật:", err);
                // Gán lỗi kiểu string
                setError("Không thể tải dữ liệu tour nổi bật.");
            } finally {
                setLoading(false);
            }
        };

        fetchTours();
    }, []);

    // Trả về dữ liệu, trạng thái tải, và lỗi, khớp với kiểu FeaturedToursHook
    return { featuredTours, loading, error };
};

export default useFeaturedTours;