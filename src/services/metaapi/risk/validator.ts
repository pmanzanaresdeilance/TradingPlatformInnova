import { RiskSettings, RiskValidationResult } from './types';
import { logger } from '../utils/logger';

export class RiskValidator {
  private static readonly DRAWDOWN_LIMITS = { min: 0.01, max: 0.5 };
  private static readonly EXPOSURE_LIMITS = { min: 0.01, max: 0.2 };
  private static readonly EQUITY_LIMITS = { min: 0, max: 1000000 };
  private static readonly MARGIN_LIMITS = { min: 0.1, max: 1 };

  public validateSettings(settings: Partial<RiskSettings>): RiskValidationResult {
    const errors: string[] = [];

    try {
      // Validate maxDrawdown
      if (settings.maxDrawdown !== undefined) {
        if (settings.maxDrawdown < RiskValidator.DRAWDOWN_LIMITS.min || 
            settings.maxDrawdown > RiskValidator.DRAWDOWN_LIMITS.max) {
          errors.push(`Maximum drawdown must be between ${RiskValidator.DRAWDOWN_LIMITS.min * 100}% and ${RiskValidator.DRAWDOWN_LIMITS.max * 100}%`);
        }
      }

      // Validate maxExposurePerPair
      if (settings.maxExposurePerPair !== undefined) {
        if (settings.maxExposurePerPair < RiskValidator.EXPOSURE_LIMITS.min || 
            settings.maxExposurePerPair > RiskValidator.EXPOSURE_LIMITS.max) {
          errors.push(`Maximum exposure per pair must be between ${RiskValidator.EXPOSURE_LIMITS.min * 100}% and ${RiskValidator.EXPOSURE_LIMITS.max * 100}%`);
        }
      }

      // Validate minEquity
      if (settings.minEquity !== undefined) {
        if (settings.minEquity < RiskValidator.EQUITY_LIMITS.min || 
            settings.minEquity > RiskValidator.EQUITY_LIMITS.max) {
          errors.push(`Minimum equity must be between $${RiskValidator.EQUITY_LIMITS.min} and $${RiskValidator.EQUITY_LIMITS.max}`);
        }
      }

      // Validate marginCallLevel
      if (settings.marginCallLevel !== undefined) {
        if (settings.marginCallLevel < RiskValidator.MARGIN_LIMITS.min || 
            settings.marginCallLevel > RiskValidator.MARGIN_LIMITS.max) {
          errors.push(`Margin call level must be between ${RiskValidator.MARGIN_LIMITS.min * 100}% and ${RiskValidator.MARGIN_LIMITS.max * 100}%`);
        }
      }

      // Validate optional fields if provided
      if (settings.maxPositionsPerPair !== undefined && settings.maxPositionsPerPair < 1) {
        errors.push('Maximum positions per pair must be at least 1');
      }

      if (settings.maxDailyLoss !== undefined && settings.maxDailyLoss < 0) {
        errors.push('Maximum daily loss must be positive');
      }

      if (settings.maxWeeklyLoss !== undefined && settings.maxWeeklyLoss < 0) {
        errors.push('Maximum weekly loss must be positive');
      }

      if (settings.maxMonthlyLoss !== undefined && settings.maxMonthlyLoss < 0) {
        errors.push('Maximum monthly loss must be positive');
      }

      if (settings.maxLotSize !== undefined && settings.maxLotSize <= 0) {
        errors.push('Maximum lot size must be greater than 0');
      }

      if (settings.maxOpenPositions !== undefined && settings.maxOpenPositions < 1) {
        errors.push('Maximum open positions must be at least 1');
      }

      if (settings.stopOutLevel !== undefined && 
          (settings.stopOutLevel <= 0 || settings.stopOutLevel >= 1)) {
        errors.push('Stop out level must be between 0 and 1');
      }

      if (settings.riskPerTrade !== undefined && 
          (settings.riskPerTrade <= 0 || settings.riskPerTrade > 0.1)) {
        errors.push('Risk per trade must be between 0% and 10%');
      }

      logger.debug('Risk settings validation completed', {
        settingsCount: Object.keys(settings).length,
        errorsCount: errors.length
      });

      return {
        isValid: errors.length === 0,
        errors
      };
    } catch (error) {
      logger.error('Error validating risk settings', { error });
      return {
        isValid: false,
        errors: ['Internal validation error occurred']
      };
    }
  }
}