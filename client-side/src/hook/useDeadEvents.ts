// src/hook/useDeadEvents.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import {
    getDeadEventsApi,
    getDeadEventCountApi,
    retryDeadEventApi,
    retryAllDeadEventsApi,
    type DeadEventCount,
    type DeadEventPage,
    type OutboxEventDTO,
} from '../services/booking/booking';

interface UseDeadEventsReturn {
    events: OutboxEventDTO[];
    count: DeadEventCount;
    loading: boolean;
    actionLoading: boolean;
    error: string | null;
    totalPages: number;
    totalElements: number;
    currentPage: number;
    refetch: () => void;
    retryOne: (id: number) => Promise<void>;
    retryAll: (routingKey?: string) => Promise<number>;
    setPage: (page: number) => void;
}

const DEFAULT_COUNT: DeadEventCount = { coinRefund: 0, notification: 0, total: 0 };

const useDeadEvents = (pageSize = 20): UseDeadEventsReturn => {
    const [events, setEvents]           = useState<OutboxEventDTO[]>([]);
    const [count, setCount]             = useState<DeadEventCount>(DEFAULT_COUNT);
    const [loading, setLoading]         = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError]             = useState<string | null>(null);
    const [totalPages, setTotalPages]   = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [trigger, setTrigger]         = useState(0);
    const cancelledRef                  = useRef(false);

    const refetch = useCallback(() => setTrigger(t => t + 1), []);
    const setPage  = useCallback((page: number) => setCurrentPage(page), []);

    useEffect(() => {
        cancelledRef.current = false;
        let active = true;

        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const [pageData, countData] = await Promise.all([
                    getDeadEventsApi(currentPage, pageSize),
                    getDeadEventCountApi(),
                ]);
                if (active) {
                    setEvents(pageData.content ?? []);
                    setTotalPages(pageData.totalPages ?? 0);
                    setTotalElements(pageData.totalElements ?? 0);
                    setCount(countData);
                }
            } catch (e: any) {
                if (active) {
                    const msg = e?.response?.data?.message ?? e?.message ?? 'Lỗi khi tải dữ liệu';
                    setError(msg);
                }
            } finally {
                if (active) setLoading(false);
            }
        };

        load();
        return () => { active = false; };
    }, [currentPage, pageSize, trigger]);

    const retryOne = useCallback(async (id: number): Promise<void> => {
        setActionLoading(true);
        try {
            await retryDeadEventApi(id);
            refetch();
        } finally {
            setActionLoading(false);
        }
    }, [refetch]);

    const retryAll = useCallback(async (routingKey?: string): Promise<number> => {
        setActionLoading(true);
        try {
            const result = await retryAllDeadEventsApi(routingKey);
            refetch();
            return result.retried;
        } finally {
            setActionLoading(false);
        }
    }, [refetch]);

    return {
        events,
        count,
        loading,
        actionLoading,
        error,
        totalPages,
        totalElements,
        currentPage,
        refetch,
        retryOne,
        retryAll,
        setPage,
    };
};

export default useDeadEvents;
