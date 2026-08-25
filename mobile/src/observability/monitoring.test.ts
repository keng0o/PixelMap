import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  captureDiagnosticException,
  configureDiagnostics,
  traceDiagnostic,
} from './diagnostics';
import {
  createSentryBackend,
  initializeMonitoring,
  parseTraceSampleRate,
} from './monitoring';

afterEach(() => configureDiagnostics(null));

describe('monitoring configuration', () => {
  it('uses a privacy-conscious default sample rate for invalid input', () => {
    expect(parseTraceSampleRate(undefined)).toBe(0.1);
    expect(parseTraceSampleRate('0.25')).toBe(0.25);
    expect(parseTraceSampleRate('-1')).toBe(0.1);
    expect(parseTraceSampleRate('not-a-number')).toBe(0.1);
  });

  it('does not load the native SDK without a DSN', async () => {
    const loader = vi.fn();

    await expect(initializeMonitoring({}, loader)).resolves.toBe('disabled');
    expect(loader).not.toHaveBeenCalled();
  });

  it('initializes the backend and activates tracing when configured', async () => {
    const captureException = vi.fn();
    const init = vi.fn();
    const setAttribute = vi.fn();
    const setContext = vi.fn();
    const startSpan = vi.fn((_options, task) => task({ setAttribute }));
    const backend = createSentryBackend({
      captureException,
      init,
      startSpan,
      withScope: (task) => task({ setContext }),
    });
    const error = new Error('render failed');

    await expect(initializeMonitoring({
      dsn: 'https://public@example.ingest.sentry.io/1',
      environment: 'preview',
      tracesSampleRate: '0.3',
    }, async () => backend)).resolves.toBe('enabled');
    captureDiagnosticException(error, { boundary: 'root' });
    await traceDiagnostic(
      {
        attributes: { 'tile.source_id': 'openfreemap' },
        name: 'Load tile',
        operation: 'map.tile.load',
      },
      async (span) => {
        span.setAttribute('tile.result_source', 'disk-cache');
      },
    );

    expect(init).toHaveBeenCalledWith({
      attachScreenshot: false,
      attachViewHierarchy: false,
      dsn: 'https://public@example.ingest.sentry.io/1',
      enableAppStartTracking: true,
      enableAutoPerformanceTracing: true,
      enableAutoSessionTracking: true,
      enableCaptureFailedRequests: false,
      environment: 'preview',
      sendDefaultPii: false,
      tracesSampleRate: 0.3,
    });
    expect(setContext).toHaveBeenCalledWith('pixelmap', { boundary: 'root' });
    expect(captureException).toHaveBeenCalledWith(error);
    expect(startSpan).toHaveBeenCalledWith({
      attributes: { 'tile.source_id': 'openfreemap' },
      name: 'Load tile',
      op: 'map.tile.load',
    }, expect.any(Function));
    expect(setAttribute).toHaveBeenCalledWith('tile.result_source', 'disk-cache');
  });

  it('omits empty trace attributes from the Sentry span', async () => {
    const startSpan = vi.fn((_options, task) => task({ setAttribute: vi.fn() }));
    const backend = createSentryBackend({
      captureException: vi.fn(),
      init: vi.fn(),
      startSpan,
      withScope: vi.fn(),
    });

    await initializeMonitoring({ dsn: 'https://public@example.ingest.sentry.io/1' }, async () => backend);
    await traceDiagnostic(
      { name: 'Startup', operation: 'app.start' },
      async () => undefined,
    );

    expect(startSpan).toHaveBeenCalledWith({
      name: 'Startup',
      op: 'app.start',
    }, expect.any(Function));
  });

  it('falls back to no-op diagnostics if SDK loading fails', async () => {
    await expect(initializeMonitoring(
      { dsn: 'https://public@example.ingest.sentry.io/1' },
      async () => { throw new Error('native module unavailable'); },
    )).resolves.toBe('unavailable');

    await expect(traceDiagnostic(
      { name: 'Load tile', operation: 'map.tile.load' },
      async () => 'still works',
    )).resolves.toBe('still works');
  });
});
