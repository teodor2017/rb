import { pino } from "pino";

export const baseLogger = pino({
    level: "debug",
    prettyPrint: {
        colorize: true,
        translateTime: true,
        ignore: "pid,hostname"
    },
    formatters: {
        level: (label, number) => {
            return { level: label };
        }
    }
});

export const createLogger = (filename) => {
    return {
        debug: (msg, ...args) => baseLogger.debug(`[${filename}] ${msg}`, ...args),
        info:  (msg, ...args) => baseLogger.info(`[${filename}] ${msg}`, ...args),
        error: (msg, ...args) => baseLogger.error(`[${filename}] ${msg}`, ...args),
        warn:  (msg, ...args) => baseLogger.warn(`[${filename}] ${msg}`, ...args),
    };
}