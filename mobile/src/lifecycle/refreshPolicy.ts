import type { AppStateStatus } from 'react-native';

export type ConnectivitySnapshot = {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
};

export function connectivityStatus(snapshot: ConnectivitySnapshot): boolean | null {
  if (snapshot.isConnected === false || snapshot.isInternetReachable === false) return false;
  if (snapshot.isConnected === true) return true;
  return null;
}

export function shouldRefreshAfterConnectivity(
  previousStatus: boolean | null,
  snapshot: ConnectivitySnapshot,
): boolean {
  return previousStatus === false && connectivityStatus(snapshot) === true;
}

export function nextConnectivityStatus(
  previousStatus: boolean | null,
  snapshot: ConnectivitySnapshot,
): boolean | null {
  return connectivityStatus(snapshot) ?? previousStatus;
}

export function shouldRefreshAfterAppState(
  previousState: AppStateStatus,
  nextState: AppStateStatus,
): boolean {
  return (
    (previousState === 'background' || previousState === 'inactive')
    && nextState === 'active'
  );
}

export class RefreshQueue {
  private drainPromise: Promise<void> | null = null;
  private disposed = false;
  private pending = false;

  constructor(private readonly refresh: () => Promise<void>) {}

  request(): Promise<void> {
    if (this.disposed) return Promise.resolve();

    if (this.drainPromise) {
      this.pending = true;
      return this.drainPromise;
    }

    this.drainPromise = this.drain().finally(() => {
      this.drainPromise = null;
    });
    return this.drainPromise;
  }

  dispose(): void {
    this.disposed = true;
    this.pending = false;
  }

  private async drain(): Promise<void> {
    do {
      this.pending = false;
      try {
        await this.refresh();
      } catch {
        // A later lifecycle event must still be able to retry after a failed refresh.
      }
    } while (this.pending && !this.disposed);
  }
}
