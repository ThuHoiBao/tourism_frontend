import { api } from '../api';

export interface CoinWithdrawalItem {
    id: number;
    referenceCode: string;
    userId: number;
    coinAmount: number;
    moneyAmount: number;
    bank: string;
    accountNumberMasked: string;
    accountName: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'MANUAL';
    transferRef?: string | null;
    operationKey?: string | null;
    retryCount: number;
    errorSource?: 'IAM' | 'RABBITMQ' | 'NOTIFICATION' | 'SEPAY' | 'SYSTEM' | null;
    note?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CoinWithdrawalRequest {
    userId: number;
    coinAmount: number;
    bank: string;
    accountNumber: string;
    accountName: string;
}

export interface SpringPageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    number: number;
    size: number;
}

export const createCoinWithdrawalApi = async (payload: CoinWithdrawalRequest): Promise<CoinWithdrawalItem> => {
    const response = await api.post('/coin-withdrawals', payload);
    return response.data;
};

export const getMyCoinWithdrawalsApi = async (userId: number): Promise<CoinWithdrawalItem[]> => {
    const response = await api.get('/coin-withdrawals/my-history', { params: { userId } });
    return response.data;
};

export const searchCoinWithdrawalsAdminApi = async (
    filters: { status?: string; userId?: string; errorSource?: string },
    page = 0,
    size = 10,
): Promise<SpringPageResponse<CoinWithdrawalItem>> => {
    const params: Record<string, any> = { page, size, sortBy: 'createdAt', sortDir: 'DESC' };
    if (filters.status) params.status = filters.status;
    if (filters.userId) params.userId = filters.userId;
    if (filters.errorSource) params.errorSource = filters.errorSource;
    const response = await api.get('/coin-withdrawals/admin/search', { params });
    return response.data;
};

export const getCoinWithdrawalDetailApi = async (id: number): Promise<CoinWithdrawalItem> => {
    const response = await api.get(`/coin-withdrawals/admin/${id}`);
    return response.data;
};

export const retryCoinWithdrawalApi = async (id: number): Promise<void> => {
    await api.post(`/coin-withdrawals/admin/${id}/retry`);
};

export interface ConfirmManualPayoutRequest {
    transferRef?: string;
    note?: string;
}

export const confirmManualPayoutApi = async (id: number, payload?: ConfirmManualPayoutRequest): Promise<CoinWithdrawalItem> => {
    const response = await api.post(`/coin-withdrawals/admin/${id}/confirm-manual`, payload ?? {});
    return response.data;
};