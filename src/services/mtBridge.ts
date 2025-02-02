import { supabase } from '@/lib/supabase';
import { WebSocket } from 'ws';

interface MTBridgeConfig {
  host: string;
  port: number;
  secure: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

class MTBridgeService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionId: string | null = null;
  private config: MTBridgeConfig;

  constructor(config: MTBridgeConfig) {
    this.config = config;
  }

  connect(connectionId: string) {
    this.connectionId = connectionId;
    const url = `${this.config.secure ? 'wss' : 'ws'}://${this.config.host}:${this.config.port}`;

    try {
      this.ws = new WebSocket(url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleReconnect();
    }
  }

  private setupEventHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.authenticate();
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.handleReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data.toString());
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };
  }

  private async authenticate() {
    if (!this.ws || !this.connectionId) return;

    try {
      const { data: connection } = await supabase
        .from('mt_connections')
        .select('*')
        .eq('id', this.connectionId)
        .single();

      if (connection) {
        this.ws.send(JSON.stringify({
          type: 'auth',
          data: {
            connectionId: this.connectionId,
            accountNumber: connection.account_number,
            server: connection.server,
            platform: connection.platform
          }
        }));
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  }

  private async handleMessage(message: any) {
    switch (message.type) {
      case 'trade_update':
        await this.handleTradeUpdate(message.data);
        break;
      case 'sync_complete':
        await this.handleSyncComplete(message.data);
        break;
      case 'error':
        await this.handleError(message.data);
        break;
    }
  }

  private async handleTradeUpdate(trade: any) {
    try {
      await supabase.from('trades').upsert({
        ticket_number: trade.ticket,
        mt_connection_id: this.connectionId,
        symbol: trade.symbol,
        order_type: trade.type,
        lot_size: trade.volume,
        entry_price: trade.openPrice,
        exit_price: trade.closePrice,
        stop_loss: trade.stopLoss,
        take_profit: trade.takeProfit,
        profit_loss: trade.profit,
        commission: trade.commission,
        swap: trade.swap,
        open_time: trade.openTime,
        close_time: trade.closeTime,
        status: trade.status
      });
    } catch (error) {
      console.error('Failed to update trade:', error);
    }
  }

  private async handleSyncComplete(data: any) {
    try {
      await supabase.from('mt_sync_logs').insert({
        mt_connection_id: this.connectionId,
        status: 'success',
        trades_synced: data.tradesCount,
        completed_at: new Date().toISOString()
      });

      await supabase
        .from('mt_connections')
        .update({ last_sync: new Date().toISOString() })
        .eq('id', this.connectionId);
    } catch (error) {
      console.error('Failed to log sync completion:', error);
    }
  }

  private async handleError(error: any) {
    try {
      await supabase.from('mt_sync_logs').insert({
        mt_connection_id: this.connectionId,
        status: 'error',
        error_message: error.message,
        completed_at: new Date().toISOString()
      });

      await supabase
        .from('mt_connections')
        .update({
          status: 'error',
          error_message: error.message
        })
        .eq('id', this.connectionId);
    } catch (err) {
      console.error('Failed to log error:', err);
    }
  }

  private handleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.reconnectTimer = setTimeout(() => {
        console.log(`Reconnecting... Attempt ${this.reconnectAttempts + 1}`);
        this.reconnectAttempts++;
        this.connect(this.connectionId!);
      }, this.config.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
      this.handleError({
        message: 'Connection lost. Max reconnection attempts reached.'
      });
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.connectionId = null;
    this.reconnectAttempts = 0;
  }

  requestSync() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'sync_request',
        data: { connectionId: this.connectionId }
      }));
    }
  }
}

// Create singleton instance
export const mtBridge = new MTBridgeService({
  host: import.meta.env.VITE_MT_BRIDGE_HOST || 'localhost',
  port: parseInt(import.meta.env.VITE_MT_BRIDGE_PORT || '8080'),
  secure: import.meta.env.VITE_MT_BRIDGE_SECURE === 'true',
  reconnectInterval: 5000,
  maxReconnectAttempts: 5
});