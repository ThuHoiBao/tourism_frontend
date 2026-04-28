import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

class WebSocketService {
    constructor() {
        this.stompClient = null;
        this.isConnected = false;
        this.subscriptions = {};
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    connect(userId, token, onNotificationReceived) {
        if (this.isConnected) {
            console.log('WebSocket already connected');
            return;
        }

        const socket = new SockJS(`${process.env.REACT_APP_API_URL}/ws`);
        this.stompClient = Stomp.over(socket);

        if (process.env.NODE_ENV === 'production') {
            this.stompClient.debug = () => {};
        }

        const headers = {
            'Authorization': `Bearer ${token}`
        };

        this.stompClient.connect(
            headers, 
            () => {
                console.log('WebSocket connected for user:', userId);
                this.isConnected = true;
                this.reconnectAttempts = 0;

                const subscription = this.stompClient.subscribe(
                    `/topic/user/${userId}/notifications`,
                    (message) => {
                        try {
                            const notification = JSON.parse(message.body);
                            console.log('Received notification:', notification);
                            if (onNotificationReceived) {
                                onNotificationReceived(notification);
                            }
                        } catch (error) {
                            console.error('Error parsing notification:', error);
                        }
                    }
                );

                this.subscriptions[`user-${userId}`] = subscription;
            },
            (error) => {
                console.error('WebSocket connection error:', error);
                this.isConnected = false;
                
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
                    
                    setTimeout(() => {
                        this.connect(userId, token, onNotificationReceived);
                    }, delay);
                }
            }
        );
    }

    disconnect() {
        if (this.stompClient && this.isConnected) {
            Object.values(this.subscriptions).forEach(subscription => {
                subscription.unsubscribe();
            });
            
            this.subscriptions = {};
            this.stompClient.disconnect(() => {
                console.log('WebSocket disconnected');
                this.isConnected = false;
            });
        }
    }

    isWebSocketConnected() {
        return this.isConnected;
    }
}

const websocketService = new WebSocketService();
export default websocketService;