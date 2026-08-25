import { StyleSheet, View } from 'react-native';

type Props = Readonly<{
  seed: number;
}>;

const GRID_SIZE = 16;

export function PixelCachePreview({ seed }: Props) {
  const rows = Array.from({ length: GRID_SIZE }, (_, y) =>
    Array.from({ length: GRID_SIZE }, (_, x) => {
      const value = (x * 17 + y * 31 + seed) % 23;
      const color = value < 4 ? '#4890e0' : value < 10 ? '#6fae52' : '#7cbc54';
      return { color, key: `${x}:${y}` };
    }),
  );

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
