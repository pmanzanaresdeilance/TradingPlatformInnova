export interface RiskSettings {
  maxDrawdown: number;
  maxExposurePerPair: number;
  minEquity: number;
  marginCallLevel: number;
  maxPositionsPerPair?: number;
  maxDailyLoss?: number;
  maxWeeklyLoss?: number;
  maxMonthlyLoss?: number;
  maxLotSize?: number;
  maxOpenPositions?: number;
  stopOutLevel?: number;
  riskPerTrade?: number;
}

export interface RiskValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface RiskCheckResult {
  allowed: boolean;
  reason?: string;
  currentValues: {
    drawdown?: number;
    exposure?: number;
    equity?: number;
    marginLevel?: number;
  };
}