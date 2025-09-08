import winston from 'winston';
import morgan from 'morgan';
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Winston logger configuration
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 's3-client' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Also write to console in development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Create a stream object for Morgan
export const logStream = {
  write: (message: string) => {
    logger.info(message.trim(), { type: 'http' });
  }
};

// Morgan middleware for HTTP request logging
export const httpLogger = morgan(
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms',
  { 
    stream: logStream,
    skip: (req: Request, res: Response) => {
      // Skip logging for health check endpoints or static assets
      return req.url === '/api/connection/status' && res.statusCode < 400;
    }
  }
);

// Custom request/response logger for detailed API logging
export const apiLogger = (req: Request, res: Response, next: Function) => {
  const startTime = Date.now();
  
  // Log request
  logger.info('API Request', {
    type: 'api_request',
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method !== 'GET' ? (req.body || {}) : undefined,
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    timestamp: new Date().toISOString()
  });

  // Capture the original res.json function
  const originalJson = res.json;
  
  // Override res.json to log responses
  res.json = function(data: any) {
    const duration = Date.now() - startTime;
    
    logger.info('API Response', {
      type: 'api_response',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseSize: JSON.stringify(data).length,
      timestamp: new Date().toISOString()
    });
    
    // Call the original json function
    return originalJson.call(this, data);
  };

  next();
};

// Error logger
export const errorLogger = (error: Error, req: Request, res: Response, next: Function) => {
  logger.error('Application Error', {
    type: 'error',
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    },
    timestamp: new Date().toISOString()
  });
  
  next(error);
};

// Application event logger
export const logAppEvent = (event: string, data?: any) => {
  logger.info('Application Event', {
    type: 'app_event',
    event,
    data,
    timestamp: new Date().toISOString()
  });
};

// AWS operation logger
export const logAwsOperation = (operation: string, details: any, success: boolean = true) => {
  logger.info('AWS Operation', {
    type: 'aws_operation',
    operation,
    details,
    success,
    timestamp: new Date().toISOString()
  });
};