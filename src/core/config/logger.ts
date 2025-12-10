/**
 * ロガー
 * 構造化ログ出力
 */

import type { LogLevel, LoggingSettings } from './types.js';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
  data?: Record<string, unknown>;
}

export class Logger {
  private settings: LoggingSettings;
  private source: string;

  constructor(source: string, settings?: Partial<LoggingSettings>) {
    this.source = source;
    this.settings = {
      level: 'info',
      format: 'text',
      destination: 'console',
      includeTimestamp: true,
      includeSource: true,
      ...settings,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.settings.level];
  }

  private formatEntry(entry: LogEntry): string {
    if (this.settings.format === 'json') {
      return JSON.stringify(entry);
    }

    let message = '';

    if (this.settings.includeTimestamp) {
      message += `[${entry.timestamp}] `;
    }

    message += `[${entry.level.toUpperCase()}]`;

    if (this.settings.includeSource) {
      message += ` [${entry.source}]`;
    }

    message += ` ${entry.message}`;

    if (entry.data && Object.keys(entry.data).length > 0) {
      message += ` ${JSON.stringify(entry.data)}`;
    }

    return message;
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      source: this.source,
      message,
      data,
    };

    const formatted = this.formatEntry(entry);

    if (this.settings.destination === 'console' || this.settings.destination === 'both') {
      switch (level) {
        case 'debug':
          console.debug(formatted);
          break;
        case 'info':
          console.info(formatted);
          break;
        case 'warn':
          console.warn(formatted);
          break;
        case 'error':
          console.error(formatted);
          break;
      }
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.log('error', message, data);
  }

  child(source: string): Logger {
    return new Logger(`${this.source}:${source}`, this.settings);
  }

  setLevel(level: LogLevel): void {
    this.settings.level = level;
  }
}

export function createLogger(source: string, settings?: Partial<LoggingSettings>): Logger {
  return new Logger(source, settings);
}
