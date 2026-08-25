export type DiagnosticValue = string | number | boolean;

export type DiagnosticContext = Record<string, DiagnosticValue>;

export type TraceOptions = {
  name: string;
  operation: string;
  attributes?: DiagnosticContext;
};

export type DiagnosticSpan = {
  setAttribute(name: string, value: DiagnosticValue): void;
};

export type DiagnosticsAdapter = {
  captureException(error: unknown, context: DiagnosticContext): void;
  trace<T>(options: TraceOptions, task: (span: DiagnosticSpan) => Promise<T>): Promise<T>;
};

const NOOP_SPAN: DiagnosticSpan = { setAttribute: () => undefined };
const MAX_PENDING_EXCEPTIONS = 5;
let adapter: DiagnosticsAdapter | null = null;
let pendingExceptions: { context: DiagnosticContext; error: unknown }[] = [];
let queuePendingExceptions = false;

export function beginDiagnosticsInitialization(): void {
  adapter = null;
  pendingExceptions = [];
  queuePendingExceptions = true;
}

export function configureDiagnostics(nextAdapter: DiagnosticsAdapter | null): void {
  adapter = nextAdapter;
  queuePendingExceptions = false;
  const queued = pendingExceptions;
  pendingExceptions = [];

  if (nextAdapter) {
    queued.forEach(({ error, context }) => {
      try {
        nextAdapter.captureException(error, context);
      } catch {
        // Monitoring must never replace the product failure with a reporting failure.
      }
    });
  }
}

export function captureDiagnosticException(
  error: unknown,
  context: DiagnosticContext = {},
): void {
  if (adapter) {
    try {
      adapter.captureException(error, context);
    } catch {
      // Reporting is best-effort and must not break the recovery screen.
    }
    return;
  }

  if (queuePendingExceptions) {
    pendingExceptions.push({ context, error });
    if (pendingExceptions.length > MAX_PENDING_EXCEPTIONS) pendingExceptions.shift();
  }
}

export function traceDiagnostic<T>(
  options: TraceOptions,
  task: (span: DiagnosticSpan) => Promise<T>,
): Promise<T> {
  if (!adapter) return task(NOOP_SPAN);

  let taskStarted = false;
  const monitoredTask = (span: DiagnosticSpan): Promise<T> => {
    taskStarted = true;
    return task(span);
  };

  try {
    return adapter.trace(options, monitoredTask).catch((error: unknown) => (
      taskStarted ? Promise.reject(error) : task(NOOP_SPAN)
    ));
  } catch (error) {
    return taskStarted ? Promise.reject(error) : task(NOOP_SPAN);
  }
}
