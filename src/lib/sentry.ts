import * as Sentry from '@sentry/react-native';

export function initSentry() {
  Sentry.init({
    dsn: 'https://f0b6829cf8b061cf4efa7c9771831289@o4511282102403072.ingest.de.sentry.io/4511354429833296',
    debug: __DEV__,
    tracesSampleRate: 1.0,
  });
}

export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, { extra: context });
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

export function setUserContext(userId: string, phone?: string) {
  Sentry.setUser({ id: userId, phone });
}

export function clearUserContext() {
  Sentry.setUser(null);
} 
