import { useEffect, useRef, useCallback } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { resolveWebSocketUrl } from '../utils/websocketUrl';

interface UseWebSocketProps {
    topic: string | string[] | null | undefined;
    onMessage: (message: any) => void;
    enabled?: boolean;
}

const useWebSocket = ({ topic, onMessage, enabled = true }: UseWebSocketProps) => {
    const stompClientRef = useRef<Client | null>(null);
    // Keep latest onMessage in a ref so subscriptions never go stale
    // (no need to disconnect/reconnect when the handler changes)
    const onMessageRef = useRef(onMessage);
    useEffect(() => {
        onMessageRef.current = onMessage;
    }, [onMessage]);

    const connect = useCallback(() => {
        if (!enabled) return;
        const topics = (Array.isArray(topic) ? topic : [topic])
            .filter((value): value is string => Boolean(value));
        if (topics.length === 0) return;

        const wsUrl = resolveWebSocketUrl();
        const socket = new SockJS(wsUrl);
        const client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            
            onConnect: () => {
                console.log('[WS] Connected:', wsUrl, topics);
                
                topics.forEach(t => {
                    client.subscribe(t, (message) => {
                        try {
                            const data = JSON.parse(message.body);
                            console.log(`[WS] Received from ${t}:`, data);
                            // Always call the LATEST onMessage (via ref — no stale closure)
                            onMessageRef.current(data);
                        } catch (error) {
                            console.error('[WS] Error parsing message:', error);
                        }
                    });
                });
            },
            
            onStompError: (frame) => {
                console.error('[WS] STOMP error:', frame);
            },

            onWebSocketError: (error) => {
                console.error('[WS] WebSocket error:', error);
            },
            
            onDisconnect: () => {
                console.log('[WS] Disconnected');
            }
        });

        client.activate();
        stompClientRef.current = client;
    }, [topic, enabled]); // ← onMessage intentionally NOT here; handled via ref above

    useEffect(() => {
        connect();

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                stompClientRef.current = null;
            }
        };
    }, [connect]);

    return { client: stompClientRef.current };
};

export default useWebSocket;
