import { describe, expect, it, vi } from 'vitest';

import {
  connectivityStatus,
  nextConnectivityStatus,
  RefreshQueue,
  shouldRefreshAfterAppState,
  shouldRefreshAfterConnectivity,
} from './refreshPolicy';

describe('connectivityStatus', () => {
  it('distinguishes confirmed online, offline, and unknown states', () => {
    expect(connectivityStatus({ isConnected: true, isInternetReachable: null })).toBe(true);
    expect(connectivityStatus({ isConnected: true, isInternetReachable: false })).toBe(false);
    expect(connectivityStatus({ isConnected: null, isInternetReachable: null })).toBeNull();
  });

  it('refreshes only on a confirmed offline-to-online transition', () => {
    const online = { isConnected: true, isInternetReachable: true };

    expect(shouldRefreshAfterConnectivity(false, online)).toBe(true);
    expect(shouldRefreshAfterConnectivity(null, online)).toBe(false);
    expect(shouldRefreshAfterConnectivity(true, online)).toBe(false);
  });

  it('retains a confirmed offline state through an unknown intermediate snapshot', () => {
    const unknown = { isConnected: null, isInternetReachable: null };

    expect(nextConnectivityStatus(false, unknown)).toBe(false);
    expect(nextConnectivityStatus(true, unknown)).toBe(true);
    expect(nextConnectivityStatus(null, unknown)).toBeNull();
  });
});

describe('shouldRefreshAfterAppState', () => {
  it('refreshes when the app returns from inactive or background', () => {
    expect(shouldRefreshAfterAppState('background', 'active')).toBe(true);
    expect(shouldRefreshAfterAppState('inactive', 'active')).toBe(true);
    expect(shouldRefreshAfterAppState('active', 'active')).toBe(false);
    expect(shouldRefreshAfterAppState('unknown', 'active')).toBe(false);
  });
});

describe('RefreshQueue', () => {
  it('coalesces overlapping requests into one sequential follow-up', async () => {
    let finishRefresh: (() => void) | undefined;
    const refresh = vi.fn(() => new Promise<void>((resolve) => {
      finishRefresh = resolve;
    }));
    const queue = new RefreshQueue(refresh);

    const draining = queue.request();
    void queue.request();
    void queue.request();
    expect(refresh).toHaveBeenCalledTimes(1);

    finishRefresh?.();
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(2));
    finishRefresh?.();
    await draining;

    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('accepts a new request after a failed refresh', async () => {
    const refresh = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(undefined);
    const queue = new RefreshQueue(refresh);

    await expect(queue.request()).resolves.toBeUndefined();
    await expect(queue.request()).resolves.toBeUndefined();
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('drops pending and future requests after disposal', async () => {
    let finishRefresh: (() => void) | undefined;
    const refresh = vi.fn(() => new Promise<void>((resolve) => {
      finishRefresh = resolve;
    }));
    const queue = new RefreshQueue(refresh);

    const draining = queue.request();
    void queue.request();
    queue.dispose();
    finishRefresh?.();
    await draining;
    await queue.request();

    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
