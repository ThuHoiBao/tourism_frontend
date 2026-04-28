// src/hook/useSpecialTours.ts

import { useState, useEffect } from 'react';
import { getSpecialToursApi } from '../services/tours/tours.ts';
import { TourSpecialRequestDTO } from '../dto/requestDTO/TourSpecialRequestDTO.ts';


const useSpecialTours = () => {
    const [specialTours, setSpecialTours] = useState<TourSpecialRequestDTO[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSpecialTours = async () => {
            try {
                const tours = await getSpecialToursApi();
                setSpecialTours(tours);
            } catch (err) {
                console.error("Lỗi khi tải tour đặc biệt:", err);
                setError("Không thể tải danh sách tour ưu đãi.");
            } finally {
                setLoading(false);
            }
        };

        fetchSpecialTours();
    }, []);

    return { specialTours, loading, error };
};

export default useSpecialTours;