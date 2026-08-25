import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import type { TileCacheStats } from './src/cache/types';
import { tileCache, tileRepository } from './src/map/services';
import type { TileLoadResult } from './src/map/tileRepository';
import { PixelCachePreview } from './src/ui/PixelCachePreview';

const KAWASAKI_TILE = { sourceId: 'openfreemap', z: 14, x: 14549, y: 6460 } as const;

function formatMiB(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function PixelMapScreen() {
  const [cacheStats, setCacheStats] = useState<TileCacheStats | null>(null);
  const [tile, setTile] = useState<TileLoadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);

  const loadTile = useCallback(async () => {
    const activeRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      await tileCache.initialize();
      const result = await tileRepository.load(KAWASAKI_TILE);
      const stats = await tileCache.stats();
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
      requestId.current += 1;
    };
  }, [loadTile]);

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
      <View style={styles.container}>
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={styles.eyebrow}>PIXELMAP MOBILE</Text>
          <Text accessibilityRole="header" style={styles.title}>2pxマップ</Text>
          <Text style={styles.subtitle}>川崎駅周辺・OpenFreeMap z14</Text>
        </View>

        <PixelCachePreview seed={tile?.bytes.byteLength ?? 0} />

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
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PixelMapScreen />
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
  buttonText: { color: '#101018', fontSize: 16, fontWeight: '700' },
  container: {
    alignItems: 'center', flex: 1, gap: 14, justifyContent: 'center',
    marginHorizontal: 'auto', maxWidth: 560, padding: 16, width: '100%',
  },
  errorText: { color: '#ff9a88' },
  eyebrow: { color: '#88c860', fontSize: 12, letterSpacing: 2 },
  heading: { alignSelf: 'stretch', gap: 3 },
  metric: { color: '#a8a088', fontSize: 12, lineHeight: 18 },
  safeArea: { backgroundColor: '#101018', flex: 1 },
  statusHeading: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  statusPanel: {
    alignSelf: 'stretch', backgroundColor: '#202028', borderColor: '#f8f0d8',
    borderWidth: 2, gap: 4, padding: 12,
  },
  statusText: { color: '#f8f0d8', flex: 1, fontSize: 14, lineHeight: 20 },
  staleStatusPanel: { borderColor: '#f8d038' },
  subtitle: { color: '#a8a088', fontSize: 13 },
  title: { color: '#f8f0d8', fontSize: 28, fontWeight: '700' },
});
