import env from '../config/env';

export const logger = {
  info: (message: string, meta?: any) => {
    log('info', message, meta);
  },
  warn: (message: string, meta?: any) => {
    log('warn', message, meta);
  },
  error: (message: string, meta?: any) => {
    log('error', message, meta);
  },
  debug: (message: string, meta?: any) => {
    log('debug', message, meta);
  }
};

function log(level: string, message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  const isProduction = env.NODE_ENV === 'production';

  if (isProduction) {
    // Structured JSON logging for ELK/Datadog parsing
    console.log(
      JSON.stringify({
        timestamp,
        level: level.toUpperCase(),
        message,
        ...(meta || {}),
      })
    );
  } else {
    // Pretty colored logs for development
    const metaStr = meta && Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
    let levelBadge = `[${level.toUpperCase()}]`;
    if (level === 'error') levelBadge = `\x1b[31m${levelBadge}\x1b[0m`;
    else if (level === 'warn') levelBadge = `\x1b[33m${levelBadge}\x1b[0m`;
    else if (level === 'info') levelBadge = `\x1b[32m${levelBadge}\x1b[0m`;
    else if (level === 'debug') levelBadge = `\x1b[34m${levelBadge}\x1b[0m`;

    console.log(`[${timestamp}] ${levelBadge} ${message}${metaStr}`);
  }
}

export default logger;
