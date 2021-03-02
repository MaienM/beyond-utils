/* eslint-disable no-console */

/**
 * Log an informational message.
 */
export const logInfo = (...message: unknown[]): void => {
	console.info('[BeyondUtils]', ...message);
};

/**
 * Log a warning message.
 */
export const logWarning = (...message: unknown[]): void => {
	console.warn('[BeyondUtils]', ...message);
};

/**
 * Log an error message.
 */
export const logError = (...message: unknown[]): void => {
	console.error('[BeyondUtils]', ...message);
};

/* eslint-enable */
