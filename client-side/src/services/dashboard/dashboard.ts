// src/services/dashboard/dashboard.ts

import { api } from '../api.ts';
import { DashboardStatsDTO } from '../../dto/responseDTO/DashboardStatsDTO';

export const getDashboardStatisticsApi = async (): Promise<DashboardStatsDTO> => {
    try {
        const response = await api.get('/admin/dashboard/statistics');
        return response.data;
    } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
        throw error;
    }
};

export const getDashboardAIAnalysisApi = async () => {
    try {
        const response = await api.get('/admin/dashboard/analysis');
        return response.data;
    } catch (error) {
        console.error('Error fetching AI analysis:', error);
        throw error;
    }
};

