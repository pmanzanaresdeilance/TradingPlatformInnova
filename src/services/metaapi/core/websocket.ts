import { WEBSOCKET_CONFIG } from '../config';
import { logger } from '../utils/logger';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private messageQueue: any[] = [];

  constructor(private url: string, private token: string) {}

  public connect(): void {
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
      this.startHeartbeat();
    } catch (error) {
      logger.error('WebSocket connection failed', { error });
      this.handleReconnect();
    }
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
      logger.warn('Message queued - WebSocket not ready', { 
        queueLength: this.messageQueue.length 
      });
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      logger.info('WebSocket connected');
      this.authenticate();
      this.processMessageQueue();
    };

    this.ws.onclose = () => {
      logger.warn('WebSocket disconnected');
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      logger.error('WebSocket error', { error });
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        logger.error('Failed to parse WebSocket message', { error });
      }
    };
  }

  private authenticate(): void {
    this.send({
      type: 'auth',
      token: this.token
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, WEBSOCKET_CONFIG.heartbeatInterval);
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < WEBSOCKET_CONFIG.maxReconnectAttempts) {
      setTimeout(() => {
        logger.info('Attempting to reconnect', {
          attempt: this.reconnectAttempts + 1
        });
        this.reconnectAttempts++;
        this.connect();
      }, WEBSOCKET_CONFIG.reconnectInterval);
    } else {
      logger.error('Max reconnection attempts reached');
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  private handleMessage(message: any): void {
    switch (message.type) {
      case 'pong':
        logger.debug('Heartbeat received');
        break;
      case 'authenticated':
        logger.info('Authentication successful');
        break;
      case 'error':
        logger.error('WebSocket error message', { error: message.error });
        break;
      default:
        logger.debug('Received message', { type: message.type });
    }
  }
}