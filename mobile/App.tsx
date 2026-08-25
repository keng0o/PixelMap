import { useCallback, useEffect, useRef, useState } from 'react';
import { DotGothic16_400Regular } from '@expo-google-fonts/dotgothic16/400Regular';
import NetInfo from '@react-native-community/netinfo';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  ActivityIndicator,
  AppState,
  type AppStateStatus,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import type { TileCacheStats } from './src/cache/types';
import {
  IDLE_LOCATION_STATE,
  requestCurrentLocation,
  type LocationAccessState,
} from './src/location/currentLocation';
import { locationAdapter } from './src/location/services';
import { responsiveMapLayout } from './src/layout/responsiveLayout';
import {
  nextConnectivityStatus,
  RefreshQueue,
  shouldRefreshAfterAppState,
  shouldRefreshAfterConnectivity,
} from './src/lifecycle/refreshPolicy';
import { tileCache, tileRepository } from './src/map/services';
import type { TileLoadResult } from './src/map/tileRepository';
import { traceDiagnostic } from './src/observability/diagnostics';
import type { MapPoi } from './src/poi/types';
import {
  DEFAULT_LAYER_VISIBILITY,
  enabledLayerCount,
  type LayerVisibility,
} from './src/settings/layerSettings';
import { layerSettingsRepository } from './src/settings/services';
import { LayerSettingsModal } from './src/ui/LayerSettingsModal';
import { AppErrorBoundary } from './src/ui/AppErrorBoundary';
import { LocationStatusPanel } from './src/ui/LocationStatusPanel';
import { PixelCachePreview } from './src/ui/PixelCachePreview';
import {
  PixelFontProvider,
  PixelText as Text,
  PIXEL_FONT_FAMILY,
} from './src/ui/PixelText';
import { PoiDetailsSheet } from './src/ui/PoiDetailsSheet';

const KAWASAKI_TILE = { sourceId: 'openfreemap', z: 14, x: 14549, y: 6460 } as const;

void SplashScreen.preventAutoHideAsync();

function formatMiB(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function PixelMapScreen() {
  const window = useWindowDimensions();
  const layout = responsiveMapLayout(window.width, window.height);
  const [cacheStats, setCacheStats] = useState<TileCacheStats | null>(null);
  const [tile, setTile] = useState<TileLoadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [layerSettingsError, setLayerSettingsError] = useState<string | null>(null);
  const [layerSettingsOpen, setLayerSettingsOpen] = useState(false);
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>(DEFAULT_LAYER_VISIBILITY);
  const [locationState, setLocationState] = useState<LocationAccessState>(IDLE_LOCATION_STATE);
  const [selectedPoi, setSelectedPoi] = useState<MapPoi | null>(null);
  const locationRequestId = useRef(0);
  const requestId = useRef(0);

  const loadTile = useCallback(async () => {
    const activeRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const { result, stats } = await traceDiagnostic(
        {
          attributes: { 'tile.source_id': KAWASAKI_TILE.sourceId },
          name: 'Load visible map tile',
          operation: 'map.tile.load',
        },
        async (span) => {
          await tileCache.initialize();
          const nextResult = await tileRepository.load(KAWASAKI_TILE);
          const nextStats = await tileCache.stats();
          span.setAttribute('tile.bytes', nextResult.bytes.byteLength);
          span.setAttribute('tile.result_source', nextResult.source);
          return { result: nextResult, stats: nextStats };
        },
      );
      if (activeRequest !== requestId.current) return;
      setTile(result);
      setCacheStats(stats);
    } catch (caught) {
      if (activeRequest !== requestId.current) return;
      setError(caught instanceof Error ? caught.message : 'タイルを読み込めませんでした');
    } finally {
      if (activeRequest === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTile();
    return () => {
      locationRequestId.current += 1;
      requestId.current += 1;
    };
  }, [loadTile]);

  useEffect(() => {
    let previousAppState: AppStateStatus = AppState.currentState ?? 'unknown';
    let previousConnectivity: boolean | null = null;
    const refreshQueue = new RefreshQueue(loadTile);
    const appStateSubscription = AppState.addEventListener('change', (nextState) => {
      if (shouldRefreshAfterAppState(previousAppState, nextState)) {
        void refreshQueue.request();
      }
      previousAppState = nextState;
    });
    const unsubscribeNetInfo = NetInfo.addEventListener((nextState) => {
      const snapshot = {
        isConnected: nextState.isConnected,
        isInternetReachable: nextState.isInternetReachable,
      };
      if (shouldRefreshAfterConnectivity(previousConnectivity, snapshot)) {
        void refreshQueue.request();
      }
      previousConnectivity = nextConnectivityStatus(previousConnectivity, snapshot);
    });

    return () => {
      appStateSubscription.remove();
      unsubscribeNetInfo();
      refreshQueue.dispose();
    };
  }, [loadTile]);

  useEffect(() => {
    let active = true;
    void layerSettingsRepository.load()
      .then((stored) => {
        if (active) setLayerVisibility(stored);
      })
      .catch(() => {
        if (active) setLayerSettingsError('保存済みのレイヤー設定を読み込めませんでした');
      });
    return () => {
      active = false;
    };
  }, []);

  const updateLayerVisibility = useCallback((next: LayerVisibility) => {
    setLayerVisibility(next);
    setLayerSettingsError(null);
    void layerSettingsRepository.save(next).catch(() => {
      setLayerSettingsError('レイヤー設定を保存できませんでした');
    });
  }, []);

  const locateUser = useCallback(async () => {
    const activeRequest = ++locationRequestId.current;
    setLocationState({ kind: 'requesting' });
    const result = await requestCurrentLocation(locationAdapter);
    if (activeRequest === locationRequestId.current) setLocationState(result);
  }, []);

  const openLocationSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch {
      setLocationState({ kind: 'unavailable' });
    }
  }, []);

  const status = loading
    ? '地図タイルを準備しています'
    : error
      ? `読み込みエラー: ${error}`
      : tile?.source === 'stale-cache'
        ? '通信できないため、保存済みタイルを表示中です'
        : tile?.source === 'disk-cache'
          ? '端末キャッシュから地図タイルを読み込みました'
          : '地図タイルを取得して端末へ保存しました';

  return (
    <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.safeArea}>
      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: layout.horizontalPadding },
        ]}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
      <View style={[styles.container, { maxWidth: layout.contentMaxWidth }]}>
        <View style={styles.headingRow}>
          <View style={styles.heading}>
            <Text style={styles.eyebrow}>PIXELMAP MOBILE</Text>
            <Text accessibilityRole="header" style={styles.title}>2pxマップ</Text>
            <Text style={styles.subtitle}>川崎駅周辺・OpenFreeMap z14</Text>
          </View>
          <Pressable
            accessibilityHint="位置情報の許可を確認して現在地を取得します"
            accessibilityLabel="現在地を取得"
            accessibilityRole="button"
            accessibilityState={{ busy: locationState.kind === 'requesting' }}
            disabled={locationState.kind === 'requesting'}
            onPress={() => void locateUser()}
            style={({ pressed }) => [styles.locationButton, pressed ? styles.buttonPressed : null]}
          >
            {locationState.kind === 'requesting'
              ? <ActivityIndicator color="#f8d038" size="small" />
              : <Text style={styles.locationButtonIcon}>◎</Text>}
            <Text style={styles.locationButtonText}>
              {locationState.kind === 'requesting' ? '確認中' : '現在地'}
            </Text>
          </Pressable>
          <Pressable
            accessibilityHint="表示する地図レイヤーを変更します"
            accessibilityLabel={`レイヤー設定、${enabledLayerCount(layerVisibility)}件を表示中`}
            accessibilityRole="button"
            onPress={() => setLayerSettingsOpen(true)}
            style={({ pressed }) => [styles.settingsButton, pressed ? styles.buttonPressed : null]}
          >
            <Text style={styles.settingsButtonText}>レイヤー</Text>
            <Text style={styles.settingsButtonCount}>{enabledLayerCount(layerVisibility)} / 6</Text>
          </Pressable>
        </View>

        <View style={[styles.contentGrid, layout.wide ? styles.contentGridWide : null]}>
          <View style={[styles.mapColumn, { width: layout.mapSize }]}>
            <PixelCachePreview
              onSelectPoi={setSelectedPoi}
              selectedPoiId={selectedPoi?.id ?? null}
              seed={tile?.bytes.byteLength ?? 0}
              visibility={layerVisibility}
            />
          </View>
          <View style={[styles.infoColumn, layout.wide ? styles.infoColumnWide : null]}>
            <View
              accessibilityLiveRegion="polite"
              style={[styles.statusPanel, tile?.source === 'stale-cache' ? styles.staleStatusPanel : null]}
            >
              <View style={styles.statusHeading}>
                {loading ? <ActivityIndicator color="#f8d038" size="small" /> : null}
                <Text style={[styles.statusText, error ? styles.errorText : null]}>{status}</Text>
              </View>
              <Text style={styles.metric}>
                キャッシュ: {cacheStats ? `${cacheStats.entryCount}件・${formatMiB(cacheStats.totalBytes)}` : '確認中'}
              </Text>
              <Text style={styles.metric}>
                上限: {cacheStats ? formatMiB(cacheStats.maxBytes) : '64.0 MB'}・LRU自動整理
              </Text>
            </View>

            <LocationStatusPanel
              onOpenSettings={() => void openLocationSettings()}
              onRetry={() => void locateUser()}
              state={locationState}
            />

            {error ? (
              <Pressable
                accessibilityHint="地図タイルの取得をもう一度試します"
                accessibilityRole="button"
                disabled={loading}
                onPress={() => void loadTile()}
                style={({ pressed }) => [styles.button, pressed ? styles.buttonPressed : null]}
              >
                <Text style={styles.buttonText}>もう一度試す</Text>
              </Pressable>
            ) : null}

            <Text style={styles.attribution}>
              © OpenStreetMap contributors / OpenFreeMap / OpenMapTiles
            </Text>
          </View>
        </View>
      </View>
      </ScrollView>
      <StatusBar style="light" />
      <LayerSettingsModal
        error={layerSettingsError}
        onChange={updateLayerVisibility}
        onClose={() => setLayerSettingsOpen(false)}
        value={layerVisibility}
        visible={layerSettingsOpen}
      />
      <PoiDetailsSheet onClose={() => setSelectedPoi(null)} poi={selectedPoi} />
    </SafeAreaView>
  );
}

function PixelMapApp() {
  const [fontLoaded, fontError] = useFonts({
    [PIXEL_FONT_FAMILY]: DotGothic16_400Regular,
  });

  useEffect(() => {
    if (fontLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontError, fontLoaded]);

  if (!fontLoaded && !fontError) return null;

  return (
    <PixelFontProvider enabled={fontLoaded}>
      <PixelMapScreen />
    </PixelFontProvider>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppErrorBoundary>
        <PixelMapApp />
      </AppErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  attribution: { color: '#8f8a78', fontSize: 11, lineHeight: 16, textAlign: 'center' },
  button: {
    alignItems: 'center', alignSelf: 'stretch', backgroundColor: '#f8d038',
    borderColor: '#f8f0d8', borderWidth: 2, minHeight: 48, justifyContent: 'center', paddingHorizontal: 18,
  },
  buttonPressed: { opacity: 0.75 },
  buttonText: { color: '#101018', fontSize: 16 },
  container: {
    alignItems: 'center', alignSelf: 'center', gap: 14, width: '100%',
  },
  contentGrid: { alignItems: 'center', gap: 14, width: '100%' },
  contentGridWide: { alignItems: 'flex-start', flexDirection: 'row', gap: 20, justifyContent: 'center' },
  errorText: { color: '#ff9a88' },
  eyebrow: { color: '#88c860', fontSize: 12, letterSpacing: 2 },
  heading: { flex: 1, gap: 3 },
  headingRow: { alignItems: 'center', alignSelf: 'stretch', flexDirection: 'row', gap: 12 },
  infoColumn: { alignSelf: 'stretch', gap: 14 },
  infoColumnWide: { flex: 1, minWidth: 0 },
  metric: { color: '#a8a088', fontSize: 12, lineHeight: 18 },
  mapColumn: { alignSelf: 'center', maxWidth: '100%' },
  locationButton: {
    alignItems: 'center', borderColor: '#88c860', borderWidth: 2,
    justifyContent: 'center', minHeight: 48, minWidth: 68, paddingHorizontal: 8,
  },
  locationButtonIcon: { color: '#f8d038', fontSize: 15, lineHeight: 16 },
  locationButtonText: { color: '#f8f0d8', fontSize: 11 },
  safeArea: { backgroundColor: '#101018', flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 16 },
  settingsButton: {
    alignItems: 'center', borderColor: '#f8f0d8', borderWidth: 2,
    justifyContent: 'center', minHeight: 48, minWidth: 78, paddingHorizontal: 10,
  },
  settingsButtonCount: { color: '#a8a088', fontSize: 11, marginTop: 2 },
  settingsButtonText: { color: '#f8f0d8', fontSize: 12 },
  statusHeading: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  statusPanel: {
    alignSelf: 'stretch', backgroundColor: '#202028', borderColor: '#f8f0d8',
    borderWidth: 2, gap: 4, padding: 12,
  },
  statusText: { color: '#f8f0d8', flex: 1, fontSize: 14, lineHeight: 20 },
  staleStatusPanel: { borderColor: '#f8d038' },
  subtitle: { color: '#a8a088', fontSize: 13 },
  title: { color: '#f8f0d8', fontSize: 28 },
});
