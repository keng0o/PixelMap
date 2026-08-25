export type Coordinates = Readonly<{
  accuracy: number | null;
  latitude: number;
  longitude: number;
}>;

export type LocationAccessState =
  | Readonly<{ kind: 'idle' }>
  | Readonly<{ kind: 'requesting' }>
  | Readonly<{ coordinates: Coordinates; kind: 'success' }>
  | Readonly<{ canAskAgain: boolean; kind: 'permission-denied' }>
  | Readonly<{ kind: 'services-disabled' }>
  | Readonly<{ kind: 'unavailable' }>;

export type ForegroundPermission = Readonly<{
  canAskAgain: boolean;
  status: 'denied' | 'granted' | 'undetermined';
}>;

export type LocationAdapter = Readonly<{
  getCurrentPosition: () => Promise<Coordinates>;
  hasServicesEnabled: () => Promise<boolean>;
  requestForegroundPermission: () => Promise<ForegroundPermission>;
}>;

export const IDLE_LOCATION_STATE: LocationAccessState = { kind: 'idle' };

export async function requestCurrentLocation(
  adapter: LocationAdapter,
): Promise<LocationAccessState> {
  try {
    const permission = await adapter.requestForegroundPermission();
    if (permission.status !== 'granted') {
      return {
        canAskAgain: permission.canAskAgain,
        kind: 'permission-denied',
      };
    }

    if (!await adapter.hasServicesEnabled()) return { kind: 'services-disabled' };

    return {
      coordinates: await adapter.getCurrentPosition(),
      kind: 'success',
    };
  } catch {
    return { kind: 'unavailable' };
  }
}

export function locationStateMessage(state: LocationAccessState): string | null {
  switch (state.kind) {
    case 'idle': return null;
    case 'requesting': return '現在地を確認しています…';
    case 'success': {
      const accuracy = state.coordinates.accuracy === null
        ? ''
        : `（精度 約${Math.round(state.coordinates.accuracy)}m）`;
      return `現在地を取得しました${accuracy}`;
    }
    case 'permission-denied':
      return state.canAskAgain
        ? '位置情報の許可が必要です。許可してから、もう一度お試しください。'
        : '端末の設定で、PixelMapの位置情報を許可してください。';
    case 'services-disabled':
      return '端末の位置情報サービスがオフです。設定でオンにしてから、もう一度お試しください。';
    case 'unavailable':
      return '現在地を取得できませんでした。電波のよい場所で、もう一度お試しください。';
  }
}
