// src/hooks/useLocations.ts
import { useState, useEffect } from 'react';
import { getStartLocationsApi, getEndLocationsApi, Location } from '../services/location/location.ts';

interface UseLocationsResult {
    startLocations: Location[];
    endLocations: Location[];
    loading: boolean;
    error: any;
}

export const useLocations = (): UseLocationsResult => {
    const [startLocations, setStartLocations] = useState<Location[]>([]);
    const [endLocations, setEndLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                // Fetch cả hai API song song
                const [starts, ends] = await Promise.all([
                    getStartLocationsApi(),
                    getEndLocationsApi()
                ]);

                // Thêm tùy chọn "Tất cả" (ID: -1) vào đầu danh sách
                const allOption: Location = { locationID: -1, name: 'Tất cả' };

                setStartLocations([allOption, ...starts]);
                setEndLocations([allOption, ...ends]);
            } catch (err) {
                setError(err);
                console.error("Failed to fetch locations:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLocations();
    }, []);

    return { startLocations, endLocations, loading, error };
};