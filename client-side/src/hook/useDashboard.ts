// src/hook/useDashboard.ts

import { useState, useEffect } from 'react';
import { getDashboardStatisticsApi } from '../services/dashboard/dashboard.ts';
import { DashboardStatsDTO } from '../dto/responseDTO/DashboardStatsDTO.ts';

interface UseDashboardReturn {
    stats: DashboardStatsDTO | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export const useDashboard = (): UseDashboardReturn => {
    const [stats, setStats] = useState<DashboardStatsDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getDashboardStatisticsApi();
            setStats(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load dashboard statistics');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    return { stats, loading, error, refetch: fetchStats };
};