// src/services/dashboard/dashboard.ts

import { api } from '../api';
import { DashboardStatsDTO, VectorSyncSummaryDTO } from '../../dto/responseDTO/DashboardStatsDTO';
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

export const getVectorSyncSummaryApi = async (from?: Date, to?: Date, all: boolean = false): Promise<VectorSyncSummaryDTO> => {
    const params: Record<string, string> = {};
    if (from) params.from = format(from, 'yyyy-MM-dd');
    if (to) params.to = format(to, 'yyyy-MM-dd');
    if (all) params.all = 'true';
    const response = await api.get('/admin/dashboard/vector-sync/summary', { params });
    return response.data;
};

export const manualVectorSyncApi = async () => {
    // Sync duyệt toàn bộ tour/location/review/coupon và gọi Pinecone embedding cho từng doc
    // nên có thể chạy lâu hơn timeout mặc định (30s). Nới lên 5 phút để tránh FE báo
    // timeout trong khi BE vẫn đang chạy tiếp.
    const response = await api.post('/admin/dashboard/vector-sync/manual-sync', null, { timeout: 300000 });
    return response.data;
};

export const manualVectorClearApi = async () => {
    // Clear gọi Pinecone deleteAll, thường nhanh nhưng vẫn nới rộng phòng khi mạng chậm.
    const response = await api.delete('/admin/dashboard/vector-sync/manual-clear', { timeout: 120000 });
    return response.data;
};

