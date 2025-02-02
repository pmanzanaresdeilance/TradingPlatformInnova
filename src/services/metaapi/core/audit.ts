import { supabase } from '@/lib/supabase';
import { logger } from '../utils/logger';

export enum AuditEventType {
  ACCOUNT_CREATED = 'ACCOUNT_CREATED',
  ACCOUNT_UPDATED = 'ACCOUNT_UPDATED',
  ACCOUNT_DELETED = 'ACCOUNT_DELETED',
  CONNECTION_ESTABLISHED = 'CONNECTION_ESTABLISHED',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  TRADE_EXECUTED = 'TRADE_EXECUTED',
  RISK_CHECK_FAILED = 'RISK_CHECK_FAILED',
  SECURITY_VIOLATION = 'SECURITY_VIOLATION'
}

interface AuditEvent {
  type: AuditEventType;
  userId: string;
  accountId?: string;
  metadata?: Record<string, any>;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  timestamp: string;
}

export class AuditLogger {
  private static readonly BATCH_SIZE = 100;
  private static readonly FLUSH_INTERVAL = 5000; // 5 seconds
  private eventQueue: AuditEvent[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;

  public async logEvent(event: Omit<AuditEvent, 'timestamp'>): Promise<void> {
    const fullEvent: AuditEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    this.eventQueue.push(fullEvent);
    logger.debug('Audit event queued', { event: fullEvent });

    if (this.eventQueue.length >= AuditLogger.BATCH_SIZE) {
      await this.flush();
    } else if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(
        () => this.flush(),
        AuditLogger.FLUSH_INTERVAL
      );
    }
  }

  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert(events.map(event => ({
          event_type: event.type,
          user_id: event.userId,
          account_id: event.accountId,
          metadata: event.metadata,
          severity: event.severity,
          created_at: event.timestamp
        })));

      if (error) throw error;

      logger.info('Audit events flushed successfully', {
        count: events.length
      });
    } catch (error) {
      logger.error('Failed to flush audit events', {
        error,
        events
      });
      
      // Re-queue failed events
      this.eventQueue.unshift(...events);
    }
  }

  public async getAuditLogs(
    filters: {
      userId?: string;
      accountId?: string;
      type?: AuditEventType;
      severity?: 'INFO' | 'WARNING' | 'ERROR';
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<AuditEvent[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.accountId) {
        query = query.eq('account_id', filters.accountId);
      }
      if (filters.type) {
        query = query.eq('event_type', filters.type);
      }
      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(log => ({
        type: log.event_type as AuditEventType,
        userId: log.user_id,
        accountId: log.account_id,
        metadata: log.metadata,
        severity: log.severity as 'INFO' | 'WARNING' | 'ERROR',
        timestamp: log.created_at
      }));
    } catch (error) {
      logger.error('Failed to fetch audit logs', { error, filters });
      throw error;
    }
  }
}