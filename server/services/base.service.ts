import { logEvent } from '../utils/logger';

type LogOptions = {
    action?: string;
    userId?: string;
    requestId?: string;
    data?: Record<string, unknown>;
};

type ErrorLogOptions = LogOptions & { error?: unknown };

export abstract class BaseService {
    /**
     * Service name for logging (module name)
     */
    protected abstract serviceName: string;

    protected logInfo(message: string, options?: LogOptions) {
        logEvent({
            severity: 'INFO',
            message,
            module: this.serviceName,
            ...options,
        });
    }

    protected logError(message: string, options?: ErrorLogOptions) {
        logEvent({
            severity: 'ERROR',
            message,
            module: this.serviceName,
            ...options,
        });
    }

    protected logWarn(message: string, options?: LogOptions) {
        logEvent({
            severity: 'WARNING',
            message,
            module: this.serviceName,
            ...options,
        });
    }

    protected logDebug(message: string, options?: LogOptions) {
        logEvent({
            severity: 'DEBUG',
            message,
            module: this.serviceName,
            ...options,
        });
    }
}
