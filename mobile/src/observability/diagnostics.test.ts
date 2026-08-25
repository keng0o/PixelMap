import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  beginDiagnosticsInitialization,
  captureDiagnosticException,
  configureDiagnostics,
  traceDiagnostic,
  type DiagnosticsAdapter,
} from './diagnostics';

afterEach(() => configureDiagnostics(null));

describe('diagnostics', () => {
  it('runs traced work when monitoring is disabled', async () => {
    await expect(traceDiagnostic(
      { name: 'Load tile', operation: 'map.tile.load' },
      async (span) => {
        span.setAttribute('tile.source', 'network');
        return 'complete';
      },
    )).resolves.toBe('complete');
  });

  it('forwards exceptions and traces without changing task results', async () => {
    const captureException = vi.fn();
    const traceCalls = vi.fn();
    const trace: DiagnosticsAdapter['trace'] = async (options, task) => {
      traceCalls(options);
      return task({ setAttribute: vi.fn() });
    };
    configureDiagnostics({ captureException, trace });
    const error = new Error('render failed');

    captureDiagnosticException(error, { boundary: 'root' });
    const result = await traceDiagnostic(
      { name: 'Load tile', operation: 'map.tile.load' },
      async (span) => {
        span.setAttribute('tile.source', 'disk-cache');
        return 42;
      },
    );

    expect(result).toBe(42);
    expect(captureException).toHaveBeenCalledWith(error, { boundary: 'root' });
    expect(traceCalls).toHaveBeenCalledTimes(1);
  });

  it('flushes a bounded startup exception queue after an adapter becomes available', () => {
    const captureException = vi.fn();
    beginDiagnosticsInitialization();
    for (let index = 0; index < 6; index += 1) {
      captureDiagnosticException(new Error(`failure-${index}`), { index });
    }

    configureDiagnostics({
      captureException,
      trace: async (_options, task) => task({ setAttribute: vi.fn() }),
    });

    expect(captureException).toHaveBeenCalledTimes(5);
    expect(captureException.mock.calls[0]?.[1]).toEqual({ index: 1 });
  });

  it('keeps reporting failures from breaking the recovery flow', () => {
    configureDiagnostics({
      captureException: () => { throw new Error('reporting failed'); },
      trace: async (_options, task) => task({ setAttribute: vi.fn() }),
    });

    expect(() => captureDiagnosticException(new Error('app failed'))).not.toThrow();
  });

  it('runs product work once without tracing when the adapter fails first', async () => {
    const task = vi.fn(async () => 'map loaded');
    configureDiagnostics({
      captureException: vi.fn(),
      trace: () => { throw new Error('tracing failed'); },
    });

    await expect(traceDiagnostic(
      { name: 'Load tile', operation: 'map.tile.load' },
      task,
    )).resolves.toBe('map loaded');
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('falls back when the adapter rejects before starting product work', async () => {
    const task = vi.fn(async () => 'map loaded');
    configureDiagnostics({
      captureException: vi.fn(),
      trace: async () => { throw new Error('tracing unavailable'); },
    });

    await expect(traceDiagnostic(
      { name: 'Load tile', operation: 'map.tile.load' },
      task,
    )).resolves.toBe('map loaded');
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('does not repeat product work when the traced task itself fails', async () => {
    const taskError = new Error('tile failed');
    const task = vi.fn(async () => { throw taskError; });
    configureDiagnostics({
      captureException: vi.fn(),
      trace: async (_options, run) => run({ setAttribute: vi.fn() }),
    });

    await expect(traceDiagnostic(
      { name: 'Load tile', operation: 'map.tile.load' },
      task,
    )).rejects.toBe(taskError);
    expect(task).toHaveBeenCalledTimes(1);
  });
});
