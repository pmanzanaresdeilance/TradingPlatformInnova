import { logger } from '@/utils/logger';

interface QueueTask<T> {
  id: string;
  operation: () => Promise<T>;
  priority: number;
  timestamp: number;
  retries: number;
}

export class RequestQueue {
  private static instance: RequestQueue;
  private queue: QueueTask<any>[] = [];
  private processing = false;
  private maxRetries = 3;
  private retryDelay = 1000;
  private maxConcurrent = 5;
  private activeRequests = 0;

  private constructor() {}

  public static getInstance(): RequestQueue {
    if (!RequestQueue.instance) {
      RequestQueue.instance = new RequestQueue();
    }
    return RequestQueue.instance;
  }

  public async enqueue<T>(
    operation: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    const task: QueueTask<T> = {
      id: Math.random().toString(36).substring(7),
      operation,
      priority,
      timestamp: Date.now(),
      retries: 0
    };

    this.queue.push(task);
    this.sortQueue();

    logger.debug('Task enqueued', {
      taskId: task.id,
      priority,
      queueLength: this.queue.length
    });

    if (!this.processing) {
      this.processQueue();
    }

    return new Promise((resolve, reject) => {
      const checkResult = setInterval(() => {
        const taskIndex = this.queue.findIndex(t => t.id === task.id);
        if (taskIndex === -1) {
          clearInterval(checkResult);
          resolve(task.result);
        }
      }, 100);
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0 || this.activeRequests >= this.maxConcurrent) {
      return;
    }

    this.processing = true;
    this.activeRequests++;

    try {
      const task = this.queue[0];
      
      try {
        const result = await task.operation();
        task.result = result;
        this.queue.shift();

        logger.debug('Task completed successfully', {
          taskId: task.id,
          queueLength: this.queue.length
        });
      } catch (error) {
        if (task.retries < this.maxRetries) {
          task.retries++;
          // Move to end of same priority group
          this.queue.shift();
          this.queue.push({
            ...task,
            timestamp: Date.now()
          });
          this.sortQueue();

          logger.warn('Task failed, retrying', {
            taskId: task.id,
            retryCount: task.retries,
            error
          });

          await new Promise(resolve => 
            setTimeout(resolve, this.retryDelay * task.retries)
          );
        } else {
          logger.error('Task failed permanently', {
            taskId: task.id,
            error
          });
          this.queue.shift();
        }
      }
    } finally {
      this.activeRequests--;
      this.processing = false;

      if (this.queue.length > 0) {
        this.processQueue();
      }
    }
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => {
      // Sort by priority first (higher priority first)
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      // Then by timestamp (older first)
      return a.timestamp - b.timestamp;
    });
  }

  public getQueueStatus(): {
    length: number;
    active: number;
    pending: number;
  } {
    return {
      length: this.queue.length,
      active: this.activeRequests,
      pending: this.queue.length - this.activeRequests
    };
  }
}