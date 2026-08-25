import type { PreviewPoi } from './types';

export const PREVIEW_POIS: readonly PreviewPoi[] = [
  {
    id: 'lazona-kawasaki-plaza',
    name: 'ラゾーナ川崎プラザ',
    category: '商業施設',
    latitude: 35.5333,
    longitude: 139.6958,
    source: 'OpenStreetMap / OpenFreeMap',
    gridX: 4,
    gridY: 5,
  },
  {
    id: 'kawasaki-station',
    name: '川崎駅',
    category: '鉄道駅',
    latitude: 35.5315,
    longitude: 139.6967,
    source: 'OpenStreetMap / OpenFreeMap',
    gridX: 10,
    gridY: 8,
  },
  {
    id: 'kawasaki-le-front',
    name: '川崎ルフロン',
    category: '商業施設',
    latitude: 35.5296,
    longitude: 139.6966,
    source: 'OpenStreetMap / OpenFreeMap',
    gridX: 13,
    gridY: 12,
  },
];

export function formatPoiCoordinate(value: number, positive: string, negative: string): string {
  const direction = value >= 0 ? positive : negative;
  return `${Math.abs(value).toFixed(4)}° ${direction}`;
}
