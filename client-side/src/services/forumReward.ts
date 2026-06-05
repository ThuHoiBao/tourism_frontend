import { api } from './api';

export interface ForumRewardItem {
    action: 'COMMENT' | 'POST' | 'LIKE_MILESTONE' | 'COMMENT_LIKE_MILESTONE' | 'FOLLOW' | 'DAILY';
    amount: number;
    reason: string;
    status: 'CREDITED' | 'PENDING' | 'CANCELLED';
    createdAt: string;
}

export interface ForumRewardPolicy {
    postAmount: number;
    postDelayHours: number;
    maxRewardedPostsPerDay: number;
    postLikeMilestones: number[];
    postLikeMilestoneAmount: number;
    commentAmount: number;
    minCommentLength: number;
    maxRewardedCommentsPerDay: number;
    commentLikeMilestones: number[];
    commentLikeMilestoneAmount: number;
    followAmount: number;
    dailyAmount: number;
    streakBonus: number;
    streakLength: number;
}

export interface ForumCoinSummary {
    enabled: boolean;
    dailyCap: number;
    todayEarned: number;
    totalFromForum: number;
    streak: number;            // chuỗi hoạt động hiện tại (ngày)
    streakTodayDone: boolean;  // hôm nay đã nhận daily chưa
    recentRewards: ForumRewardItem[];
    policy: ForumRewardPolicy;
}

export const getCoinSummaryApi = async (userId: number | string): Promise<ForumCoinSummary | null> => {
    const response = await api.get(`/forum/posts/coin-summary?userId=${userId}`);
    return response.data?.data ?? null;
};

export interface ForumCoinHistory {
    items: ForumRewardItem[];
    page: number;
    totalPages: number;
    totalElements: number;
    hasNext: boolean;
}

export const getCoinHistoryApi = async (
    userId: number | string,
    page = 0,
    size = 10
): Promise<ForumCoinHistory | null> => {
    const response = await api.get(`/forum/posts/coin-history?userId=${userId}&page=${page}&size=${size}`);
    return response.data?.data ?? null;
};
