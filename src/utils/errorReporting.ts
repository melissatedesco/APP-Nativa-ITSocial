/**
 * Thin error-reporting wrapper.
 *
 * Activation:
 *   1. Run: npx expo install @sentry/react-native
 *   2. Add EXPO_PUBLIC_SENTRY_DSN=<your-dsn> to your .env file.
 *   3. Add the Expo plugin in app.json/app.config.ts:
 *        "plugins": [["@sentry/react-native/expo", { "organization": "...", "project": "..." }]]
 *
 * Without the package or DSN the module silently falls back to console.error — no crash.
 */

const DSN: string | undefined =
  typeof process !== 'undefined' ? process.env.EXPO_PUBLIC_SENTRY_DSN : undefined;

// Minimal surface of @sentry/react-native that we actually call.
interface SentryLike {
  init(options: {
    dsn: string;
    environment?: string;
    tracesSampleRate?: number;
    enableNative?: boolean;
    attachStacktrace?: boolean;
  }): void;
  captureException(error: unknown): void;
  withScope(callback: (scope: SentryScopeLike) => void): void;
  addBreadcrumb(bc: { message: string; data?: Record<string, unknown>; level?: string }): void;
}

interface SentryScopeLike {
  setExtras(extras: Record<string, unknown>): void;
  setTag(key: string, value: string): void;
}

function getSentry(): SentryLike | null {
  try {
    // Dynamic require so the app doesn't crash when the package isn't installed.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@sentry/react-native') as SentryLike;
  } catch {
    return null;
  }
}

/** Call once at app startup (before the component tree mounts). */
export function initErrorReporting(): void {
  if (!DSN) return;
  const Sentry = getSentry();
  if (!Sentry) return;
  Sentry.init({
    dsn: DSN,
    environment: __DEV__ ? 'development' : 'production',
    // Disable performance tracing in dev; sample 20 % in prod.
    tracesSampleRate: __DEV__ ? 0 : 0.2,
    enableNative: true,
    attachStacktrace: true,
  });
}

/** Report an exception with optional extra context. */
export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (__DEV__) {
    console.error('[ErrorReporting]', error, context ?? '');
  }
  if (!DSN) return;
  const Sentry = getSentry();
  if (!Sentry) return;

  if (context && Object.keys(context).length > 0) {
    Sentry.withScope(scope => {
      scope.setExtras(context);
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/** Add a navigation or action breadcrumb for richer crash context. */
export function addBreadcrumb(
  message: string,
  data?: Record<string, unknown>,
): void {
  if (!DSN) return;
  const Sentry = getSentry();
  if (!Sentry) return;
  Sentry.addBreadcrumb({ message, data, level: 'info' });
}
