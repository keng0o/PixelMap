import { describe, expect, it, vi } from 'vitest';

import {
  locationStateMessage,
  requestCurrentLocation,
  type LocationAdapter,
} from './currentLocation';

function adapter(overrides: Partial<LocationAdapter> = {}): LocationAdapter {
  return {
    getCurrentPosition: vi.fn().mockResolvedValue({
      accuracy: 12.4,
      latitude: 35.5315,
      longitude: 139.6967,
    }),
    hasServicesEnabled: vi.fn().mockResolvedValue(true),
    requestForegroundPermission: vi.fn().mockResolvedValue({
      canAskAgain: true,
      status: 'granted',
    }),
    ...overrides,
  };
}

describe('current location request', () => {
  it('requests permission only when the explicit request function is called', async () => {
    const location = adapter();
    expect(location.requestForegroundPermission).not.toHaveBeenCalled();

    const result = await requestCurrentLocation(location);

    expect(location.requestForegroundPermission).toHaveBeenCalledOnce();
    expect(result).toEqual({
      coordinates: { accuracy: 12.4, latitude: 35.5315, longitude: 139.6967 },
      kind: 'success',
    });
  });

  it('does not access location after permission is denied', async () => {
    const location = adapter({
      requestForegroundPermission: vi.fn().mockResolvedValue({
        canAskAgain: false,
        status: 'denied',
      }),
    });

    await expect(requestCurrentLocation(location)).resolves.toEqual({
      canAskAgain: false,
      kind: 'permission-denied',
    });
    expect(location.hasServicesEnabled).not.toHaveBeenCalled();
    expect(location.getCurrentPosition).not.toHaveBeenCalled();
  });

  it('distinguishes disabled services from a transient failure', async () => {
    await expect(requestCurrentLocation(adapter({
      hasServicesEnabled: vi.fn().mockResolvedValue(false),
    }))).resolves.toEqual({ kind: 'services-disabled' });

    await expect(requestCurrentLocation(adapter({
      getCurrentPosition: vi.fn().mockRejectedValue(new Error('unavailable')),
    }))).resolves.toEqual({ kind: 'unavailable' });
  });
});

describe('location state messages', () => {
  it('explains recovery without relying on color', () => {
    expect(locationStateMessage({ kind: 'idle' })).toBeNull();
    expect(locationStateMessage({ kind: 'requesting' })).toContain('確認');
    expect(locationStateMessage({ canAskAgain: true, kind: 'permission-denied' }))
      .toContain('もう一度');
    expect(locationStateMessage({ canAskAgain: false, kind: 'permission-denied' }))
      .toContain('端末の設定');
    expect(locationStateMessage({ kind: 'services-disabled' })).toContain('オン');
    expect(locationStateMessage({ kind: 'unavailable' })).toContain('もう一度');
    expect(locationStateMessage({
      coordinates: { accuracy: 12.4, latitude: 35.5315, longitude: 139.6967 },
      kind: 'success',
    })).toBe('現在地を取得しました（精度 約12m）');
    expect(locationStateMessage({
      coordinates: { accuracy: null, latitude: 35.5315, longitude: 139.6967 },
      kind: 'success',
    })).toBe('現在地を取得しました');
  });
});
