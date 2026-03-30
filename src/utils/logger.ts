import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

/**
 * Logs a message with optional data
 * @param message The log message
 * @param data Optional metadata or objects to log
 */
export const log = (message: string, data?: any) => {
  if (data) {
    logger.info(message, { data });
  } else {
    logger.info(message);
  }
};