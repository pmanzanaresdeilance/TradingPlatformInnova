import { supabase } from '@/lib/supabase';
import { RiskSettings, RiskCheckResult } from './types';
import { RiskValidator } from './validator';
import { logger } from '../utils/logger';
import { RISK_MANAGEMENT_CONFIG } from '../config';

export class RiskManager {
  private validator: RiskValidator;

  constructor() {
    this.validator = new RiskValidator();
  }

  public async saveSettings(
    accountId: string,
    settings: Partial<RiskSettings>
  ): Promise<RiskSettings> {
    try {
      // Validate settings before saving
      const validation = this.validator.validateSettings(settings);
      if (!validation.isValid) {
        throw new Error(`Invalid risk settings: ${validation.errors.join(', ')}`);
      }

      // Merge with default settings
      const mergedSettings = {
        ...RISK_MANAGEMENT_CONFIG,
        ...settings
      };

      // Save to database
      const { data, error } = await supabase
        .from('meta_api_risk_settings')
        .upsert({
          account_id: accountId,
          ...mergedSettings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'account_id'
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Risk settings saved successfully', {
        accountId,
        settingsCount: Object.keys(settings).length
      });

      return data;
    } catch (error) {
      logger.error('Failed to save risk settings', { error, accountId });
      throw error;
    }
  }

  public async getSettings(accountId: string): Promise<RiskSettings> {
    try {
      const { data, error } = await supabase
        .from('meta_api_risk_settings')
        .select('*')
        .eq('account_id', accountId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No settings found, return defaults
          return RISK_MANAGEMENT_CONFIG;
        }
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to get risk settings', { error, accountId });
      throw error;
    }
  }

  public async checkRiskLimits(
    accountId: string,
    equity: number,
    margin: number,
    positions: any[]
  ): Promise<RiskCheckResult> {
    try {
      const settings = await this.getSettings(accountId);
      const result: RiskCheckResult = {
        allowed: true,
        currentValues: {}
      };

      // Check drawdown
      const balance = equity + margin;
      const drawdown = (balance - equity) / balance;
      result.currentValues.drawdown = drawdown;

      if (drawdown >= settings.maxDrawdown) {
        result.allowed = false;
        result.reason = 'Maximum drawdown limit reached';
        return result;
      }

      // Check margin level
      const marginLevel = equity / margin;
      result.currentValues.marginLevel = marginLevel;

      if (marginLevel <= settings.marginCallLevel) {
        result.allowed = false;
        result.reason = 'Margin call level reached';
        return result;
      }

      // Check minimum equity
      result.currentValues.equity = equity;
      if (equity < settings.minEquity) {
        result.allowed = false;
        result.reason = 'Minimum equity requirement not met';
        return result;
      }

      // Check exposure per pair
      const exposureByPair = new Map<string, number>();
      for (const position of positions) {
        const exposure = exposureByPair.get(position.symbol) || 0;
        exposureByPair.set(
          position.symbol,
          exposure + (position.volume * position.openPrice)
        );
      }

      for (const [symbol, exposure] of exposureByPair) {
        const exposureRatio = exposure / equity;
        result.currentValues.exposure = exposureRatio;

        if (exposureRatio > settings.maxExposurePerPair) {
          result.allowed = false;
          result.reason = `Maximum exposure limit reached for ${symbol}`;
          return result;
        }
      }

      logger.info('Risk check completed', {
        accountId,
        allowed: result.allowed,
        reason: result.reason
      });

      return result;
    } catch (error) {
      logger.error('Failed to check risk limits', { error, accountId });
      throw error;
    }
  }

  public async calculatePositionSize(
    accountId: string,
    symbol: string,
    stopLoss: number,
    entryPrice: number,
    equity: number
  ): Promise<number> {
    try {
      const settings = await this.getSettings(accountId);
      
      // Calculate risk amount based on risk per trade setting
      const riskAmount = equity * (settings.riskPerTrade || 0.01);
      
      // Calculate position size based on stop loss distance
      const stopLossDistance = Math.abs(entryPrice - stopLoss);
      const pipValue = this.calculatePipValue(symbol);
      
      let positionSize = riskAmount / (stopLossDistance * pipValue);

      // Round to nearest 0.01 lot
      positionSize = Math.floor(positionSize * 100) / 100;

      // Check against max lot size
      if (settings.maxLotSize && positionSize > settings.maxLotSize) {
        positionSize = settings.maxLotSize;
      }

      logger.info('Position size calculated', {
        accountId,
        symbol,
        positionSize,
        riskAmount
      });

      return positionSize;
    } catch (error) {
      logger.error('Failed to calculate position size', { error, accountId });
      throw error;
    }
  }

  private calculatePipValue(symbol: string): number {
    // Implement pip value calculation based on symbol
    // This is a simplified example
    if (symbol.includes('JPY')) {
      return 0.01;
    }
    return 0.0001;
  }
}