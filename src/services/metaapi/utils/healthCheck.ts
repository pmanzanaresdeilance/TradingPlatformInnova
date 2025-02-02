import { logger } from './logger';

export class HealthCheck {
  private static instance: HealthCheck;
  private interval: NodeJS.Timeout | null = null;
  private checks: Map<string, () => Promise<boolean>> = new Map();
  private status: Map<string, boolean> = new Map();

  private constructor() {}

  public static getInstance(): HealthCheck {
    if (!HealthCheck.instance) {
      HealthCheck.instance = new HealthCheck();
    }
    return HealthCheck.instance;
  }

  public addCheck(name: string, check: () => Promise<boolean>): void {
    this.checks.set(name, check);
  }

  public start(intervalMs: number = 60000): void {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(() => this.runChecks(), intervalMs);
    this.runChecks(); // Run immediately
  }

  public stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  public getStatus(): Map<string, boolean> {
    return new Map(this.status);
  }

  private async runChecks(): Promise<void> {
    for (const [name, check] of this.checks) {
      try {
        const result = await check();
        this.status.set(name, result);
        
        if (!result) {
          logger.warn(`Health check failed: ${name}`);
        } else {
          logger.debug(`Health check passed: ${name}`);
        }
      } catch (error) {
        this.status.set(name, false);
        logger.error(`Health check error: ${name}`, { error });
      }
    }
  }
}