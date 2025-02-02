declare module 'metaapi.cloud-sdk' {
  export interface MetaApiOptions {
    domain?: string;
    requestTimeout?: number;
    retryOpts?: {
      retries?: number;
      minDelayInSeconds?: number;
      maxDelayInSeconds?: number;
    };
  }

  export interface MetatraderAccount {
    id: string;
    name: string;
    type: 'cloud-g1' | 'cloud-g2';
    login: string;
    server: string;
    platform: 'mt4' | 'mt5';
    state: 'DEPLOYED' | 'DEPLOYING' | 'UNDEPLOYED';
    magic: number;
    connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
    connect(): Promise<MetatraderConnection>;
    deploy(): Promise<void>;
    undeploy(): Promise<void>;
    remove(): Promise<void>;
    getRiskManagement(): RiskManagement;
    getCopyFactory(): CopyFactory;
    getMetaStats(): MetaStats;
  }

  export interface RiskManagement {
    getPresets(): Promise<RiskPreset[]>;
    createPreset(preset: {
      name: string;
      maxLoss: number;
      dailyLoss: number;
      weeklyLoss: number;
      monthlyLoss: number;
      maxPositions: number;
      maxLots: number;
    }): Promise<RiskPreset>;
  }

  export interface RiskPreset {
    id: string;
    name: string;
    maxLoss: number;
    dailyLoss: number;
    weeklyLoss: number;
    monthlyLoss: number;
    maxPositions: number;
    maxLots: number;
  }

  export interface CopyFactory {
    createStrategy(strategy: {
      name: string;
      description: string;
      subscriptionFee?: number;
    }): Promise<Strategy>;
    subscribeToStrategy(strategyId: string): Promise<Subscription>;
  }

  export interface Strategy {
    id: string;
    name: string;
    description: string;
    subscriptionFee?: number;
  }

  export interface Subscription {
    id: string;
    strategyId: string;
    accountId: string;
  }

  export interface MetaStats {
    getStatistics(period: 'day' | 'week' | 'month' | 'year'): Promise<Statistics>;
  }

  export interface Statistics {
    trades: number;
    profitFactor: number;
    totalProfit: number;
    winRate: number;
    averageWin: number;
    averageLoss: number;
    sharpeRatio: number;
  }

  export interface MetatraderConnection {
    getPositions(): Promise<MetatraderPosition[]>;
    getHistoryOrdersByTimeRange(startTime: Date, endTime: Date): Promise<MetatraderOrder[]>;
    subscribeToMarketData(symbol: string): Promise<void>;
    createMarketBuyOrder(symbol: string, volume: number, stopLoss?: number, takeProfit?: number): Promise<any>;
    modifyPosition(positionId: string, stopLoss?: number, takeProfit?: number): Promise<any>;
    closePosition(positionId: string): Promise<any>;
  }

  export interface MetatraderPosition {
    id: string;
    positionId: string;
    symbol: string;
    type: string;
    volume: number;
    openPrice: number;
    stopLoss?: number;
    takeProfit?: number;
    profit: number;
    commission: number;
    swap: number;
    openTime: string;
    timeframe?: string;
  }

  export interface MetatraderOrder {
    id: string;
    orderId: string;
    symbol: string;
    type: string;
    volume: number;
    openPrice: number;
    closePrice: number;
    stopLoss?: number;
    takeProfit?: number;
    profit: number;
    commission: number;
    swap: number;
    openTime: string;
    closeTime: string;
    timeframe?: string;
  }

  export default class MetaApi {
    constructor(token: string, opts?: MetaApiOptions);
    metatraderAccountApi: {
      createAccount(account: Partial<MetatraderAccount>): Promise<MetatraderAccount>;
      getAccount(accountId: string): Promise<MetatraderAccount>;
      getAccounts(): Promise<MetatraderAccount[]>;
    };
  }
}