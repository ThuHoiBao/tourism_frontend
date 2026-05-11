// src/hook/useDashboard.ts

import { useState, useEffect, useCallback } from 'react';
import { subDays } from 'date-fns';
import { getDashboardStatisticsApi } from '../services/dashboard/dashboard.ts';
import { DashboardStatsDTO } from '../dto/responseDTO/DashboardStatsDTO.ts';

export interface DateRange {
    from: Date;
    to: Date;
}

interface UseDashboardReturn {
    stats: DashboardStatsDTO | null;
    loading: boolean;
    error: string | null;
    dateRange: DateRange;
    setDateRange: (range: DateRange) => void;
    refetch: () => void;
}

export const useDashboard = (): UseDashboardReturn => {
    const [stats, setStats] = useState<DashboardStatsDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange>({
        from: subDays(new Date(), 30),
        to: new Date()
    });

    const fetchStats = useCallback(async (from?: Date, to?: Date) => {
        try {
            setLoading(true);
            setError(null);
            const data = await getDashboardStatisticsApi(from, to);
            setStats(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load dashboard statistics');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats(dateRange.from, dateRange.to);
    }, [dateRange]);

    const refetch = () => fetchStats(dateRange.from, dateRange.to);

    return { stats, loading, error, dateRange, setDateRange, refetch };
};