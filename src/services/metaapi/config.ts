import { MetaApiOptions } from 'metaapi.cloud-sdk';

export const META_API_CONFIG: MetaApiOptions = {
  domain: import.meta.env.VITE_META_API_DOMAIN || 'agiliumtrade.agiliumtrade.ai',
  requestTimeout: 60000, // 60 seconds
  application: 'TradingJournal'
};

export const WEBSOCKET_CONFIG = {
  heartbeatInterval: 30000, // 30 seconds
  reconnectInterval: 5000,  // 5 seconds
  maxReconnectAttempts: 5
};

export const RISK_MANAGEMENT_CONFIG = {
  maxDrawdown: 0.1, // 10%
  maxExposurePerPair: 0.05, // 5%
  minEquity: 100, // $100
  marginCallLevel: 0.5, // 50%
  maxPositionsPerPair: 5,
  maxDailyLoss: 500,
  maxWeeklyLoss: 1000,
  maxMonthlyLoss: 2000
};

export const CACHE_CONFIG = {
  ttl: 300, // 5 minutes
  checkPeriod: 60 // 1 minute
};

// API endpoints
export const API_ENDPOINTS = {
  provisioning: 'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai',
  cloud: 'https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai',
  stats: 'https://metastats-api-v1.agiliumtrade.agiliumtrade.ai',
  riskManagement: 'https://risk-management-api-v1.agiliumtrade.agiliumtrade.ai'
};