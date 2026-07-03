import { api } from './api';

export interface GreenFundBatch {
    id: number;
    location: string;
    plantedDate: string;
    treeCount: number;
    imageUrl?: string;
    note?: string;
}

export interface GreenFundSummary {
    enabled: boolean;
    costPerTree: number;               // VND cho 1 cây (vd 1000)
    minDonationCoin: number;
    bookingContributionPercent: number;
    totalFundRaised: number;
    treesPlanted: number;
    pendingFund: number;
    totalContributors: number;
    bySource: { BOOKING?: number; DONATION?: number };
    batches: GreenFundBatch[];
}

export interface GreenFundDonateResult {
    donatedCoins: number;
    donatedVnd: number;
    treesEquivalent: number;
    myTotalTrees: number;
}

export interface GreenFundBadge {
    icon: string;
    name: string;
    threshold: number;
}

export interface GreenFundMe {
    totalVnd: number;
    trees: number;
    donationCount: number;
    badge?: GreenFundBadge | null;
    nextBadge?: (GreenFundBadge & { remaining: number }) | null;
    recent: Array<{
        source: 'BOOKING' | 'DONATION';
        amountVnd: number;
        coinAmount: number | null;
        bookingCode: string | null;
        createdAt: string;
    }>;
}

export interface GreenFundLeaderboardEntry {
    rank: number;
    userId: number;
    userName: string;
    totalVnd: number;
    trees: number;
    contributionCount: number;
    badge?: GreenFundBadge | null;
}

export interface GreenFundDashboard extends GreenFundSummary {
    goal?: {
        label: string;
        targetTrees: number;
        currentTrees: number;
        percent: number;
    } | null;
    leaderboard: GreenFundLeaderboardEntry[];
    leaderboardMonth: GreenFundLeaderboardEntry[];
    recentContributions: Array<{
        source: 'BOOKING' | 'DONATION';
        userName: string;
        amountVnd: number;
        trees: number;
        createdAt: string;
    }>;
}

export const getGreenFundSummaryApi = async (): Promise<GreenFundSummary | null> => {
    const response = await api.get('/green-fund/summary');
    return response.data?.data ?? null;
};

// Giữ nguyên envelope {success, data, message} để caller lấy được message cảm ơn
export const donateGreenFundApi = async (
    userId: number | string,
    coinAmount: number,
    anonymous: boolean
): Promise<{ success: boolean; data: GreenFundDonateResult; message?: string }> => {
    const response = await api.post('/green-fund/donate', { userId, coinAmount, anonymous });
    return response.data;
};

export const getMyGreenFundApi = async (userId: number | string): Promise<GreenFundMe | null> => {
    const response = await api.get(`/green-fund/me?userId=${userId}`);
    return response.data?.data ?? null;
};

// Dashboard công khai cho trang /green-fund (summary + goal + leaderboard + feed)
export const getGreenFundDashboardApi = async (): Promise<GreenFundDashboard | null> => {
    const response = await api.get('/green-fund/dashboard');
    return response.data?.data ?? null;
};

export const getGreenFundLeaderboardApi = async (
    period: 'all' | 'month' = 'all',
    limit = 10
): Promise<GreenFundLeaderboardEntry[]> => {
    const response = await api.get('/green-fund/leaderboard', { params: { period, limit } });
    return response.data?.data ?? [];
};
