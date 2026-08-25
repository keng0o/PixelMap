import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { LayerVisibility } from '../settings/layerSettings';

type Props = Readonly<{
  seed: number;
  visibility: LayerVisibility;
}>;

const GRID_SIZE = 16;

export function PixelCachePreview({ seed, visibility }: Props) {
  const rows = useMemo(() => Array.from({ length: GRID_SIZE }, (_, y) =>
    Array.from({ length: GRID_SIZE }, (_, x) => ({
      color: cellColor(x, y, seed, visibility),
      key: `${x}:${y}`,
    })),
  ), [seed, visibility]);

  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.frame}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((cell) => (
            <View key={cell.key} style={[styles.cell, { backgroundColor: cell.color }]} />
          ))}
        </View>
      ))}
    </View>
  );
}

function cellColor(x: number, y: number, seed: number, visibility: LayerVisibility): string {
  const value = (x * 17 + y * 31 + seed) % 23;
  if (visibility.facilities && (x * 11 + y * 7 + seed) % 71 === 0) return '#f8d038';
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
  row: { flex: 1, flexDirection: 'row' },
});
