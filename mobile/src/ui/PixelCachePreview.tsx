import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PREVIEW_POIS } from '../poi/previewPois';
import type { MapPoi, PreviewPoi } from '../poi/types';
import type { LayerVisibility } from '../settings/layerSettings';

type Props = Readonly<{
  seed: number;
  visibility: LayerVisibility;
  onSelectPoi: (poi: MapPoi) => void;
  selectedPoiId: string | null;
}>;

const GRID_SIZE = 16;

export function PixelCachePreview({ onSelectPoi, seed, selectedPoiId, visibility }: Props) {
  const rows = useMemo(() => Array.from({ length: GRID_SIZE }, (_, y) =>
    Array.from({ length: GRID_SIZE }, (_, x) => {
      const poi = visibility.facilities
        ? PREVIEW_POIS.find((candidate) => candidate.gridX === x && candidate.gridY === y)
        : undefined;
      return {
        color: poi ? '#f8d038' : cellColor(x, y, seed, visibility),
        key: `${x}:${y}`,
        poi,
      };
    }),
  ), [seed, visibility]);

  return (
    <View
      accessibilityLabel="川崎駅周辺の地図プレビュー"
      style={styles.frame}
    >
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((cell) => cell.poi ? (
            <PoiCell
              color={cell.color}
              key={cell.key}
              onPress={() => onSelectPoi(cell.poi as PreviewPoi)}
              poi={cell.poi}
              selected={cell.poi.id === selectedPoiId}
            />
          ) : (
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              key={cell.key}
              style={[styles.cell, { backgroundColor: cell.color }]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function PoiCell({
  color,
  onPress,
  poi,
  selected,
}: Readonly<{ color: string; onPress: () => void; poi: PreviewPoi; selected: boolean }>) {
  return (
    <Pressable
      accessibilityHint="施設の詳細を表示します"
      accessibilityLabel={`${poi.name}、${poi.category}${selected ? '、選択中' : ''}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={11}
      onPress={onPress}
      style={({ pressed }) => [
        styles.cell,
        styles.poiCell,
        selected ? styles.selectedPoiCell : null,
        { backgroundColor: color },
        pressed ? styles.poiCellPressed : null,
      ]}
    />
  );
}

function cellColor(x: number, y: number, seed: number, visibility: LayerVisibility): string {
  const value = (x * 17 + y * 31 + seed) % 23;
  if (visibility.labels && y % 7 === 2 && x % 5 < 2) return '#f8f0d8';
  if (visibility.buildings && (x * 5 + y * 7 + seed) % 31 < 3) return '#d0b078';
  if (visibility.transport && (x + y * 3 + seed) % 19 === 0) return '#d8d0b8';
  if (visibility.nature && value < 4) return '#4890e0';
  if (visibility.landuse && value < 10) return '#6fae52';
  if (visibility.nature || visibility.landuse) return '#7cbc54';
  return '#303038';
}

const styles = StyleSheet.create({
  cell: { flex: 1 },
  frame: {
    aspectRatio: 1,
    backgroundColor: '#7cbc54',
    borderColor: '#f8f0d8',
    borderWidth: 2,
    overflow: 'hidden',
    width: '100%',
  },
  poiCell: { borderColor: '#fff4a8', borderWidth: 1 },
  poiCellPressed: { opacity: 0.6 },
  row: { flex: 1, flexDirection: 'row' },
  selectedPoiCell: { borderColor: '#ff6f59', borderWidth: 3 },
});
