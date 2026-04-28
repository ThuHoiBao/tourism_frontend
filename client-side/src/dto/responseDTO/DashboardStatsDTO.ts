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
}

export interface Insight {
    title: string;
    description: string;
    type: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    priority: number;
}

export interface Prediction {
    metric: string;
    prediction: string;
    confidence: number;
    timeframe: string;
}

export interface Recommendation {
    title: string;
    description: string;
    action: string;
    impact: number;
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