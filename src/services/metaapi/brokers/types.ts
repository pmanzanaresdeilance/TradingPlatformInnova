export interface BrokerServer {
  name: string;
  address: string;
  description?: string;
  protocol: 'mt4' | 'mt5';
  region?: string;
  reliability?: number;
}

export interface BrokerGroup {
  name: string;
  servers: BrokerServer[];
}