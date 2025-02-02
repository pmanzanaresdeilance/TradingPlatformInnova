import { RISK_MANAGEMENT_CONFIG } from '../config';
import { logger } from '../utils/logger';

export class RiskManager {
  private currentDrawdown: number = 0;
  private exposureByPair: Map<string, number> = new Map();

  public async calculatePositionSize(
    symbol: string,
    accountBalance: number,
    riskPercentage: number
  ): Promise<number> {
    try {
      // Check drawdown limit
      if (this.currentDrawdown >= RISK_MANAGEMENT_CONFIG.maxDrawdown) {
        throw new Error('Maximum drawdown limit reached');
      }

      // Check symbol exposure
      const currentExposure = this.exposureByPair.get(symbol) || 0;
      if (currentExposure >= RISK_MANAGEMENT_CONFIG.maxExposurePerPair) {
        throw new Error('Maximum exposure limit reached for symbol');
      }

      // Calculate position size based on risk
      const riskAmount = accountBalance * riskPercentage;
      const positionSize = this.calculateLotSize(riskAmount, symbol);

      logger.info('Position size calculated', {
        symbol,
        positionSize,
        riskAmount
      });

      return positionSize;
    } catch (error) {
      logger.error('Failed to calculate position size', { error });
      throw error;
    }
  }

  public async updateDrawdown(equity: number, balance: number): Promise<void> {
    this.currentDrawdown = (balance - equity) / balance;
    
    if (this.currentDrawdown >= RISK_MANAGEMENT_CONFIG.maxDrawdown) {
      logger.warn('Maximum drawdown reached', {
        currentDrawdown: this.currentDrawdown,
        maxDrawdown: RISK_MANAGEMENT_CONFIG.maxDrawdown
      });
    }
  }

  public async checkMarginCall(equity: number, margin: number): Promise<boolean> {
    const marginLevel = equity / margin;
    
    if (marginLevel <= RISK_MANAGEMENT_CONFIG.marginCallLevel) {
      logger.warn('Margin call alert', {
        equity,
        margin,
        marginLevel
      });
      return true;
    }
    
    return false;
  }

  private calculateLotSize(riskAmount: number, symbol: string): number {
    // Implement lot size calculation based on symbol specifications
    // This is a simplified example
    return riskAmount / 100000; // Standard lot = 100,000 units
  }
}