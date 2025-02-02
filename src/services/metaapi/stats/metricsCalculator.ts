import { Trade } from '@/types';
import { logger } from '../utils/logger';
import { MetaStats } from 'metaapi.cloud-sdk';

export class MetricsCalculator {
  private metaStats: MetaStats;

  constructor(token: string) {
    this.metaStats = new MetaStats(token, {
      domain: 'agiliumtrade.agiliumtrade.ai',
      requestTimeout: 60000
    });
  }

  // Get metrics from MetaAPI
  public async getMetrics(accountId: string, startTime: Date, endTime: Date) {
    try {
      const account = await this.metaStats.getAccount(accountId);
      const metaApiAccountId = account?.id;

      const metrics = await this.metaStats.getMetrics(accountId, {
        name: 'tradingMetrics',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        includePositions: true
      });

      logger.info('Retrieved metrics from MetaAPI', {
        accountId,
        metaApiAccountId,
        startTime,
        endTime
      });

      return metrics;
    } catch (error) {
      logger.error('Failed to get metrics from MetaAPI', { 
        error,
        accountId,
        metaApiAccountId: error?.account?.id
      });
      throw error;
    }
  }

  // Get historical trades
  public async getHistoricalTrades(accountId: string, startTime: Date, endTime: Date) {
    try {
      const account = await this.metaStats.getAccount(accountId);
      const metaApiAccountId = account?.id;

      const trades = await this.metaStats.getAccountTrades(
        accountId,
        startTime.toISOString(),
        endTime.toISOString()
      );

      logger.info('Retrieved historical trades from MetaAPI', {
        accountId,
        metaApiAccountId,
        tradesCount: trades.length
      });

      return trades;
    } catch (error) {
      logger.error('Failed to get historical trades from MetaAPI', { 
        error,
        accountId,
        metaApiAccountId: error?.account?.id
      });
      throw error;
    }
  }

  // Calcula el porcentaje de trades ganadores
  public calculateWinRate(trades: Trade[]): number {
    if (trades.length === 0) return 0;

    const winningTrades = trades.filter(trade => 
      trade.profit_loss !== undefined && trade.profit_loss > 0
    ).length;

    return (winningTrades / trades.length) * 100;
  }

  // Calcula la relación entre ganancias y pérdidas
  public calculateProfitFactor(trades: Trade[]): number {
    const profits = trades.reduce((sum, trade) => 
      sum + (trade.profit_loss > 0 ? trade.profit_loss : 0), 0
    );

    const losses = Math.abs(trades.reduce((sum, trade) => 
      sum + (trade.profit_loss < 0 ? trade.profit_loss : 0), 0
    ));

    return losses === 0 ? profits : profits / losses;
  }

  // Calcula el drawdown máximo
  public calculateDrawdown(equity: number[]): number {
    let maxDrawdown = 0;
    let peak = equity[0];

    for (const value of equity) {
      if (value > peak) {
        peak = value;
      }
      
      const drawdown = (peak - value) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    return maxDrawdown;
  }

  // Genera reporte completo de métricas
  public async generateReport(trades: Trade[], timeframe: string): Promise<any> {
    try {
      const winRate = this.calculateWinRate(trades);
      const profitFactor = this.calculateProfitFactor(trades);
      
      const returns = trades.map(t => 
        t.profit_loss ? t.profit_loss / t.lot_size : 0
      );

      const report = {
        timeframe,
        metrics: {
          totalTrades: trades.length,
          profitableTrades: trades.filter(t => t.profit_loss > 0).length,
          winRate,
          profitFactor,
          averageWin: this.calculateAverageWin(trades),
          averageLoss: this.calculateAverageLoss(trades),
          largestWin: this.calculateLargestWin(trades),
          largestLoss: this.calculateLargestLoss(trades)
        }
      };

      logger.info('Reporte de trading generado', { timeframe });
      return report;
    } catch (error) {
      logger.error('Error generando reporte', { error });
      throw error;
    }
  }

  // Helpers para cálculos específicos
  private calculateAverageWin(trades: Trade[]): number {
    const winningTrades = trades.filter(t => t.profit_loss > 0);
    if (winningTrades.length === 0) return 0;
    
    return winningTrades.reduce((sum, t) => 
      sum + (t.profit_loss || 0), 0
    ) / winningTrades.length;
  }

  private calculateAverageLoss(trades: Trade[]): number {
    const losingTrades = trades.filter(t => t.profit_loss < 0);
    if (losingTrades.length === 0) return 0;
    
    return Math.abs(losingTrades.reduce((sum, t) => 
      sum + (t.profit_loss || 0), 0
    ) / losingTrades.length);
  }

  private calculateLargestWin(trades: Trade[]): number {
    return Math.max(...trades.map(t => t.profit_loss || 0));
  }

  private calculateLargestLoss(trades: Trade[]): number {
    return Math.abs(Math.min(...trades.map(t => t.profit_loss || 0)));
  }
}