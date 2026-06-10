// src/dto/responseDTO/DashboardStatsDTO.ts

export interface DashboardStatsDTO {
    userStats: UserStats;
    revenueStats: RevenueStats;
    bookingStats: BookingStats;
    tourStats: TourStats;
    recentActivities: RecentActivity[];
    aiAnalysis: AIAnalysis;
    chartsData: ChartsData;
}

export interface UserStats {
    totalUsers: number;
    activeUsers: number;
    lockedUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    userGrowthRate: number;
    dailyGrowth: DailyUserGrowth[];
}

export interface RevenueStats {
    totalRevenue: number;
    pendingConfirmation: number;
    pendingPayment: number;
    todayRevenue: number;
    thisWeekRevenue: number;
    thisMonthRevenue: number;
    lastMonthRevenue: number;
    revenueGrowthRate: number;
    dailyRevenue: DailyRevenue[];
    revenueByTour: { [key: string]: number };
}

export interface BookingStats {
    totalBookings: number;
    paidBookings: number;
    pendingConfirmation: number;
    pendingPayment: number;
    pendingRefund: number;
    cancelledBookings: number;
    todayBookings: number;
    thisWeekBookings: number;
    conversionRate: number;
    statusDistribution: BookingStatusCount[];
}

export interface TourStats {
    totalTours: number;
    activeTours: number;
    totalDepartures: number;
    upcomingDepartures: number;
    hotTours: HotTour[];
    toursNeedingAttention: TourNeedingAttention[];
    averageRating: number;
}

export interface RecentActivity {
    type: string;
    description: string;
    timestamp: string;
    severity: 'INFO' | 'WARNING' | 'URGENT';
    relatedCode: string;
}

export interface AIAnalysis {
    summary: string;
    insights: Insight[];
    predictions: Prediction[];
    recommendations: Recommendation[];
    periodFrom?: string;
    periodTo?: string;
    mode?: string;
    generatedAt?: string;
    verificationSummary?: string;
    aiEvidenceDashboard?: AiEvidenceDashboard;
}

export interface Insight {
    title: string;
    description: string;
    type: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    priority: number;
    usedMetricKeys?: string[];
    verificationStatus?: 'VERIFIED' | 'LIMITED' | 'UNVERIFIED';
    confidenceReason?: string;
}

export interface Prediction {
    metric: string;
    prediction: string;
    confidence: number;
    timeframe: string;
    usedMetricKeys?: string[];
    verificationStatus?: 'VERIFIED' | 'LIMITED' | 'UNVERIFIED';
    confidenceReason?: string;
}

export interface Recommendation {
    title: string;
    description: string;
    action: string;
    impact: number;
    usedMetricKeys?: string[];
    verificationStatus?: 'VERIFIED' | 'LIMITED' | 'UNVERIFIED';
    confidenceReason?: string;
}

export interface AiEvidenceDashboard {
    groups: AiEvidenceGroup[];
}

export interface AiEvidenceGroup {
    groupKey: string;
    groupLabel: string;
    metrics: AiEvidenceMetric[];
}

export interface AiEvidenceMetric {
    metricKey: string;
    label: string;
    currentValue: string;
    previousValue: string;
    changeValue: string;
    changePercent?: number;
    formula: string;
    sourceService: string;
    sourceEndpoint: string;
    usedByAiItems: string[];
    dataQuality: 'VERIFIED' | 'LIMITED' | 'FALLBACK';
    note: string;
}

export interface ChartsData {
    revenueChart: DailyRevenue[];
    userGrowthChart: DailyUserGrowth[];
    bookingStatusChart: BookingStatusCount[];
    tourPerformanceChart: TourPerformance[];
}

export interface DailyUserGrowth {
    date: string;
    newUsers: number;
    totalUsers: number;
}

export interface DailyRevenue {
    date: string;
    revenue: number;
    bookingCount: number;
}

export interface BookingStatusCount {
    status: string;
    count: number;
    revenue: number;
}

export interface HotTour {
    tourId: number;
    tourCode: string;
    tourName: string;
    bookingCount: number;
    revenue: number;
    averageRating: number;
}

export interface TourNeedingAttention {
    tourId: number;
    tourCode: string;
    tourName: string;
    reason: string;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface TourPerformance {
    tourName: string;
    bookings: number;
    revenue: number;
    rating: number;
}

export interface VectorSyncRunDTO {
    id: number;
    triggerType: string;
    status: string;
    startedAt?: string;
    finishedAt?: string;
    durationMs?: number;
    tourDocs?: number;
    locationDocs?: number;
    reviewDocs?: number;
    couponDocs?: number;
    totalDocs?: number;
    eventCount?: number;
    entityTypes?: string;
    errorMessage?: string;
}

export interface VectorSyncSummaryDTO {
    from: string;
    to: string;
    todaySyncCount: number;
    successCount: number;
    failedCount: number;
    pendingEventCount: number;
    syncRunning: boolean;
    lastRun?: VectorSyncRunDTO | null;
    recentRuns: VectorSyncRunDTO[];
}
