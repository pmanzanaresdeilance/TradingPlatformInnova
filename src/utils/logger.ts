export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

class Logger {
  private level: LogLevel = LogLevel.INFO;

  public setLevel(level: LogLevel): void {
    this.level = level;
  }

  public error(message: string, context: object = {}): void {
    if (this.level >= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message, context));
    }
  }

  public warn(message: string, context: object = {}): void {
    if (this.level >= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message, context));
    }
  }

  public info(message: string, context: object = {}): void {
    if (this.level >= LogLevel.INFO) {
      console.info(this.formatMessage('INFO', message, context));
    }
  }

  public debug(message: string, context: object = {}): void {
    if (this.level >= LogLevel.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message, context));
    }
  }

  private formatMessage(level: string, message: string, context: object): string {
    const timestamp = new Date().toISOString();
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...context
    });
  }
}

export const logger = new Logger();