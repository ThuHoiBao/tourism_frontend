// src/services/dashboard/dashboard.ts

import { api } from '../api';
import { DashboardStatsDTO } from '../../dto/responseDTO/DashboardStatsDTO';
import { format } from 'date-fns';

export const getDashboardStatisticsApi = async (from?: Date, to?: Date): Promise<DashboardStatsDTO> => {
    try {
        const params: Record<string, string> = {};
        if (from) params.from = format(from, 'yyyy-MM-dd');
        if (to) params.to = format(to, 'yyyy-MM-dd');
        const response = await api.get('/admin/dashboard/statistics', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
        throw error;
    }
};

export const getDashboardAIAnalysisApi = async (from?: Date, to?: Date, mode: string = 'OVERVIEW') => {
    try {
        const params: Record<string, string> = { mode };
        if (from) params.from = format(from, 'yyyy-MM-dd');
        if (to) params.to = format(to, 'yyyy-MM-dd');
        const response = await api.get('/admin/dashboard/analysis', { params, timeout: 120000 });
        return response.data;
    } catch (error) {
        console.error('Error fetching AI analysis:', error);
        throw error;
    }
};

