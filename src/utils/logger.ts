import pino from 'pino';

/**
 * Standardized Pino logger for production-ready structured logging
 */
const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    browser: {
        asObject: true,
    },
    transport:
        process.env.NODE_ENV === 'development'
            ? {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    ignore: 'pid,hostname',
                },
            }
            : undefined,
});

export default logger;

/**
 * Convenience export for common logging patterns
 */
export const log = {
    info: (message: string, obj?: any) => logger.info(obj, message),
    warn: (message: string, obj?: any) => logger.warn(obj, message),
    error: (message: string, obj?: any) => logger.error(obj, message),
    debug: (message: string, obj?: any) => logger.debug(obj, message),
};
