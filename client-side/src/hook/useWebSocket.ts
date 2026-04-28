import { useEffect, useRef, useCallback, use } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

interface UseWebSocketProps {
    topic: string | string[]; 
    onMessage: (message: any) => void;
    enabled?: boolean;
}

const useWebSocket = ({ topic, onMessage, enabled = true }: UseWebSocketProps) => {
    const stompClientRef = useRef<Client | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        if (!enabled) return;

        const socket = new SockJS('http://localhost:8080/ws');
        const client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            
            onConnect: () => {
                console.log('WebSocket Connected');
                
                const topics = Array.isArray(topic) ? topic : [topic];
                
                topics.forEach(t => {
                    client.subscribe(t, (message) => {
                        try {
                            const data = JSON.parse(message.body);
                            console.log(`Received from ${t}:`, data);
                            onMessage(data);
                        } catch (error) {
                            console.error('Error parsing message:', error);
                        }
                    });
                });
            },
            
            onStompError: (frame) => {
                console.error('STOMP error:', frame);
            },
            
            onDisconnect: () => {
                console.log('WebSocket Disconnected');
            }
        });

        client.activate();
        stompClientRef.current = client;
    }, [topic, onMessage, enabled]);

    useEffect(() => {
        connect();

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connect]);

    return { client: stompClientRef.current };
};

export default useWebSocket;