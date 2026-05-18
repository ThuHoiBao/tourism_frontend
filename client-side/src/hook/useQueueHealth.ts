import { useState, useEffect, useCallback } from 'react';
import { getQueueHealthApi } from '../services/booking/booking';
import type { QueueHealthResponse } from '../services/booking/booking';

const useQueueHealth = () => {
    const [health, setHealth]   = useState<QueueHealthResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getQueueHealthApi();
            setHealth(data);
            setError(null);
        } catch (e: any) {
            setError(e?.response?.data?.message ?? e?.message ?? 'Lỗi kết nối');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
        const id = setInterval(refresh, 30_000);
        return () => clearInterval(id);
    }, [refresh]);

    return { health, loading, error, refresh };
};

export default useQueueHealth;
