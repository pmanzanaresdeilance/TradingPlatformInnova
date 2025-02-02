export interface MetaApiConfig {
  token: string;
  domain?: string;
  requestTimeout?: number;
}

export interface MetaApiAccount {
  id: string;
  name: string;
  type: 'cloud-g1' | 'cloud-g2';
  login: string;
  server: string;
  platform: 'mt4' | 'mt5';
  state: 'DEPLOYED' | 'DEPLOYING' | 'UNDEPLOYED';
  magic: number;
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
}

export interface CreateAccountOptions {
  name?: string;
  login: string;
  password: string;
  server: string;
  platform: 'mt4' | 'mt5';
  magic?: number;
  region?: 'new-york' | 'london' | 'singapore';
}