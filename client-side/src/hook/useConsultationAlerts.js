import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import consultationApi from '../services/consultations/consultationApi';
import useWebSocket from './useWebSocket';

const ORIGINAL_TITLE = 'Tourism Admin';

/**
 * Sinh chuông "ding-dong" bằng Web Audio API — không phụ thuộc file MP3 external.
 * Hai tone E5 (659Hz) → A5 (880Hz), fade out ~0.45s, tổng âm thanh dễ chịu.
 */
function playDing(audioCtx) {
    try {
        const ctx = audioCtx;
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();

        const now = ctx.currentTime;
        const master = ctx.createGain();
        master.gain.value = 0.25;
        master.connect(ctx.destination);

        // Tone 1: E5
        const o1 = ctx.createOscillator();
        const g1 = ctx.createGain();
        o1.type = 'sine';
        o1.frequency.value = 659.25;
        g1.gain.setValueAtTime(0.0001, now);
        g1.gain.exponentialRampToValueAtTime(0.4, now + 0.02);
        g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        o1.connect(g1).connect(master);
        o1.start(now); o1.stop(now + 0.26);

        // Tone 2: A5 (delay 0.12s)
        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.type = 'sine';
        o2.frequency.value = 880;
        g2.gain.setValueAtTime(0.0001, now + 0.12);
        g2.gain.exponentialRampToValueAtTime(0.4, now + 0.14);
        g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
        o2.connect(g2).connect(master);
        o2.start(now + 0.12); o2.stop(now + 0.46);
    } catch (e) {
        console.warn('[Alert] Audio play failed:', e);
    }
}

/**
 * Hook trung tâm cho hệ thống cảnh báo yêu cầu tư vấn:
 *  - Đếm số PENDING (badge sidebar)
 *  - Buffer 10 yêu cầu mới nhất chưa xem (cho dropdown bell)
 *  - Phát âm thanh + push Browser Notification khi có yêu cầu mới
 *  - Nhấp nháy tab title khi user đang ở tab khác
 *
 * Mount 1 lần ở AdminLayout, broadcast qua context nếu cần.
 */
export default function useConsultationAlerts() {
    const [pendingCount, setPendingCount] = useState(0);
    const [unseenItems, setUnseenItems] = useState([]);   // yêu cầu đến qua WebSocket trong session (max 10)
    const [pendingItems, setPendingItems] = useState([]); // PENDING gần nhất từ BE (fallback khi unseen rỗng)

    const blinkIntervalRef = useRef(null);
    const audioCtxRef = useRef(null);
    const audioUnlockedRef = useRef(false);

    // ── Load số PENDING lúc mount + xin permission notification ───────────────
    useEffect(() => {
        consultationApi.stats().then(s => setPendingCount(s?.pending || 0)).catch(() => {});
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }
    }, []);

    // ── Unlock AudioContext sau click/keydown đầu tiên (autoplay policy bypass) ─
    useEffect(() => {
        const unlock = () => {
            if (audioUnlockedRef.current) return;
            try {
                const Ctx = window.AudioContext || window.webkitAudioContext;
                if (!Ctx) return;
                audioCtxRef.current = new Ctx();
                // Play silent buffer để "warm up" audio context
                const buf = audioCtxRef.current.createBuffer(1, 1, 22050);
                const src = audioCtxRef.current.createBufferSource();
                src.buffer = buf;
                src.connect(audioCtxRef.current.destination);
                src.start(0);
                audioUnlockedRef.current = true;
                console.info('[Alert] Audio unlocked');
            } catch (e) {
                console.warn('[Alert] Audio unlock failed:', e);
            }
        };
        document.addEventListener('click', unlock, { once: false });
        document.addEventListener('keydown', unlock, { once: false });
        return () => {
            document.removeEventListener('click', unlock);
            document.removeEventListener('keydown', unlock);
            if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
        };
    }, []);

    // ── Tab title blink khi có unseen và user ở tab khác ──────────────────────
    const startBlink = useCallback((count) => {
        if (blinkIntervalRef.current) return;
        let flag = false;
        blinkIntervalRef.current = setInterval(() => {
            document.title = flag
                ? `(${count}) Yêu cầu tư vấn mới`
                : ORIGINAL_TITLE;
            flag = !flag;
        }, 1000);
    }, []);

    const stopBlink = useCallback(() => {
        if (blinkIntervalRef.current) {
            clearInterval(blinkIntervalRef.current);
            blinkIntervalRef.current = null;
        }
        document.title = ORIGINAL_TITLE;
    }, []);

    // Dừng blink khi user focus lại tab
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') stopBlink();
        };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [stopBlink]);

    // ── WebSocket subscribe ───────────────────────────────────────────────────
    useWebSocket({
        topic: '/topic/admin/consultations',
        onMessage: (event) => {
            // event là BookingEventDTO map từ ConsultationEvent
            const item = {
                requestCode: event?.bookingCode || '',
                fullName:    event?.contactFullName || 'Khách',
                phone:       event?.contactPhone || '',
                tourCode:    event?.tourCode || '',
                tourName:    event?.tourName || '',
                consultationInfo: event?.cancelReason || '',
                receivedAt:  Date.now(),
            };

            setPendingCount(c => c + 1);
            setUnseenItems(items => [item, ...items].slice(0, 10));

            // 1. Toast persistent (không tự đóng nhanh)
            toast.info(
                `🔔 Tư vấn mới từ ${item.fullName}${item.phone ? ' — ' + item.phone : ''}`,
                { autoClose: 8000, hideProgressBar: false }
            );

            // 2. Âm thanh (Web Audio API — không cần file MP3)
            if (audioUnlockedRef.current && audioCtxRef.current) {
                playDing(audioCtxRef.current);
            } else {
                console.info('[Alert] Audio chưa unlock — click bất kỳ chỗ nào trên trang để bật âm thanh');
            }

            // 3. Browser notification (khi tab background)
            if (document.visibilityState !== 'visible'
                && 'Notification' in window && Notification.permission === 'granted') {
                try {
                    const n = new Notification('Yêu cầu tư vấn mới', {
                        body: `${item.fullName}${item.phone ? ' • ' + item.phone : ''}${item.tourCode ? ' • ' + item.tourCode : ''}`,
                        icon: '/favicon.ico',
                        tag: item.requestCode,
                    });
                    n.onclick = () => {
                        window.focus();
                        window.location.href = '/admin/consultations';
                    };
                } catch {}
            }

            // 4. Blink tab title
            const newCount = unseenItems.length + 1;
            if (document.visibilityState !== 'visible') startBlink(newCount);
        },
    });

    // ── API cho component ─────────────────────────────────────────────────────
    /** Fetch 5 yêu cầu PENDING gần nhất để hiển thị trong dropdown bell. */
    const fetchPendingItems = useCallback(async () => {
        try {
            const data = await consultationApi.list({ status: 'PENDING', page: 0, size: 5 });
            const list = (data?.content || []).map(c => ({
                requestCode: c.requestCode,
                fullName: c.fullName,
                phone: c.phone,
                tourCode: c.tourCode,
                tourName: c.tourName,
                consultationInfo: c.consultationInfo,
                // createdAt từ BE dạng "2026-06-01 14:38:00"
                receivedAt: c.createdAt ? new Date(c.createdAt.replace(' ', 'T')).getTime() : Date.now(),
            }));
            setPendingItems(list);
        } catch {}
    }, []);

    const refreshPendingCount = useCallback(async () => {
        try {
            const s = await consultationApi.stats();
            setPendingCount(s?.pending || 0);
        } catch {}
        fetchPendingItems();
    }, [fetchPendingItems]);

    /** Coi như admin đã "xem" — clear buffer + dừng blink + sync pending từ BE. */
    const clearUnseen = useCallback(() => {
        setUnseenItems([]);
        stopBlink();
        refreshPendingCount();
    }, [stopBlink, refreshPendingCount]);

    return {
        pendingCount,
        unseenItems,
        pendingItems,
        unseenCount: unseenItems.length,
        clearUnseen,
        refreshPendingCount,
    };
}
