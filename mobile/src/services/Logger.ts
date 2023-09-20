
const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
export type LogLevel = typeof LOG_LEVELS[number]
export type LogMessage = string|{}
export type LogProducer = (() => LogMessage) | LogMessage

type LogConfig = {
    namesRestrictedTo: string[] | undefined;
    globalLoggingEnabled: boolean;
    minimumLogLevel: LogLevel;
}

let logConfig: LogConfig = loadLogConfig();

const LOGGERS_BY_NAME = new Map<String, Logger>();

export class Logger {

    private logEnabled: boolean|undefined = undefined;

    private constructor(private readonly name: string) {}

    public log(level: LogLevel, content: LogProducer) {
        if(this.logEnabled === undefined) {
            this.logEnabled = Logger.isLogEnabled(this.name);
        }

        if(!this.logEnabled) {
            return;
        }

        if(LOG_LEVELS.indexOf(logConfig.minimumLogLevel) > LOG_LEVELS.indexOf(level)) {
            return;
        }


        const message = typeof content === 'function' ? content() : content;
        if(typeof message === 'string') {
            console[level](`[${this.name}] ${message}`);
        } else {
            console[level](`[${this.name}]`, message);
        }
    }

    public debug(content: LogProducer) { this.log('debug', content); }
    public info(content: LogProducer) { this.log('info', content); }
    public warn(content: LogProducer) { this.log('warn', content); }
    public error(content: LogProducer) { this.log('error', content); }

    public static named(name: string) {
        if(LOGGERS_BY_NAME.has(name)) {
            return LOGGERS_BY_NAME.get(name)!;
        }

        const instance = new Logger(name);
        LOGGERS_BY_NAME.set(name, instance);
        return instance;
    }

    public static isLogEnabled(name: string) {
        const loggingGloballyEnabled = import.meta.env.VITE_LOGGING_ENABLED === 'true';

        return loggingGloballyEnabled
            || logConfig.globalLoggingEnabled
            || (logConfig.namesRestrictedTo && logConfig.namesRestrictedTo.includes(name));
    }

    public static resetAllLoggersCaches() {
        Array.from(LOGGERS_BY_NAME.values()).forEach(logger =>
            logger.logEnabled = undefined
        )
    }
}

export const PERF_LOGGER = Logger.named("perf");

function loadLogConfig(): LogConfig {
    const str = localStorage.getItem("_logConfig")
    if(!str) {
        return { namesRestrictedTo: undefined, globalLoggingEnabled: false, minimumLogLevel: "debug" };
    } else {
        return JSON.parse(str) as LogConfig;
    }
}

export function updateLogConfigTo(updatedLogConfig: LogConfig) {
    localStorage.setItem("_logConfig", JSON.stringify(updatedLogConfig));
    Logger.resetAllLoggersCaches();

    logConfig = updatedLogConfig;
}
