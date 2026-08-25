import {
  beginDiagnosticsInitialization,
  configureDiagnostics,
  type DiagnosticContext,
  type DiagnosticsAdapter,
} from './diagnostics';

export type MonitoringConfig = {
  dsn?: string;
  environment?: string;
  tracesSampleRate?: string;
};

export type MonitoringState = 'disabled' | 'enabled' | 'unavailable';

type MonitoringBackend = DiagnosticsAdapter & {
  initialize(config: {
    dsn: string;
    environment: string;
    tracesSampleRate: number;
  }): void;
};

type MonitoringBackendLoader = () => Promise<MonitoringBackend>;

type SentryInitOptions = {
  attachScreenshot: false;
  attachViewHierarchy: false;
  dsn: string;
  enableAppStartTracking: true;
  enableAutoPerformanceTracing: true;
  enableAutoSessionTracking: true;
  enableCaptureFailedRequests: false;
  environment: string;
  sendDefaultPii: false;
  tracesSampleRate: number;
};

type SentryFacade = {
  captureException(error: unknown): void;
  init(options: SentryInitOptions): void;
  startSpan<T>(
    options: { attributes?: DiagnosticContext; name: string; op: string },
    task: (span: { setAttribute(name: string, value: DiagnosticContext[string]): void }) => T,
  ): T;
  withScope(task: (scope: {
    setContext(name: string, context: DiagnosticContext): void;
  }) => void): void;
};

export function parseTraceSampleRate(value: string | undefined): number {
  if (!value?.trim()) return 0.1;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 0.1;
}

export function createSentryBackend(Sentry: SentryFacade): MonitoringBackend {
  const trace: DiagnosticsAdapter['trace'] = (options, task) => Sentry.startSpan(
    {
      name: options.name,
      op: options.operation,
      ...(options.attributes ? { attributes: options.attributes } : {}),
    },
    (span) => task({
      setAttribute: (name, value) => span.setAttribute(name, value),
    }),
  );

  return {
    initialize: ({ dsn, environment, tracesSampleRate }) => {
      Sentry.init({
        attachScreenshot: false,
        attachViewHierarchy: false,
        dsn,
        enableAppStartTracking: true,
        enableAutoPerformanceTracing: true,
        enableAutoSessionTracking: true,
        enableCaptureFailedRequests: false,
        environment,
        sendDefaultPii: false,
        tracesSampleRate,
      });
    },
    captureException: (error: unknown, context: DiagnosticContext) => {
      Sentry.withScope((scope) => {
        scope.setContext('pixelmap', context);
        Sentry.captureException(error);
      });
    },
    trace,
  };
}

/* v8 ignore next -- the native package boundary is verified by Expo export. */
async function loadSentryBackend(): Promise<MonitoringBackend> {
  return createSentryBackend(await import('@sentry/react-native'));
}

export async function initializeMonitoring(
  config: MonitoringConfig,
  loadBackend: MonitoringBackendLoader = loadSentryBackend,
): Promise<MonitoringState> {
  beginDiagnosticsInitialization();
  const dsn = config.dsn?.trim();
  if (!dsn) {
    configureDiagnostics(null);
    return 'disabled';
  }

  try {
    const backend = await loadBackend();
    backend.initialize({
      dsn,
      environment: config.environment?.trim() || 'production',
      tracesSampleRate: parseTraceSampleRate(config.tracesSampleRate),
    });
    configureDiagnostics(backend);
    return 'enabled';
  } catch {
    configureDiagnostics(null);
    return 'unavailable';
  }
}

/* v8 ignore next -- Expo injects these values at bundle time. */
export function initializeMonitoringFromEnvironment(): Promise<MonitoringState> {
  return initializeMonitoring({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment: process.env.EXPO_PUBLIC_APP_ENV,
    tracesSampleRate: process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
  });
}
