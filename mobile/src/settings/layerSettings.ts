export const LAYER_IDS = [
  'nature',
  'landuse',
  'transport',
  'buildings',
  'facilities',
  'labels',
] as const;

export type LayerId = (typeof LAYER_IDS)[number];
export type LayerVisibility = Readonly<Record<LayerId, boolean>>;

export type LayerDefinition = Readonly<{
  id: LayerId;
  label: string;
  description: string;
}>;

export const LAYER_DEFINITIONS: readonly LayerDefinition[] = [
  { id: 'nature', label: '自然・水域', description: '草地、森、公園、水面、河川' },
  { id: 'landuse', label: '土地利用', description: '住宅地、商業地、学校、工業地' },
  { id: 'transport', label: '交通', description: '道路、歩道、鉄道、地下鉄' },
  { id: 'buildings', label: '建物', description: '建物の形状、屋根、壁、影' },
  { id: 'facilities', label: '施設', description: '駅、学校、公園などの施設表示' },
  { id: 'labels', label: '地名・ラベル', description: '駅名、施設名、地名、地形名' },
];

export const DEFAULT_LAYER_VISIBILITY: LayerVisibility = {
  nature: true,
  landuse: true,
  transport: true,
  buildings: false,
  facilities: true,
  labels: false,
};

export function createUniformLayerVisibility(visible: boolean): LayerVisibility {
  return Object.fromEntries(LAYER_IDS.map((id) => [id, visible])) as unknown as LayerVisibility;
}

export function normalizeLayerVisibility(value: unknown): LayerVisibility {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...DEFAULT_LAYER_VISIBILITY };
  }
  const candidate = value as Record<string, unknown>;
  return Object.fromEntries(
    LAYER_IDS.map((id) => [
      id,
      typeof candidate[id] === 'boolean' ? candidate[id] : DEFAULT_LAYER_VISIBILITY[id],
    ]),
  ) as unknown as LayerVisibility;
}

export function enabledLayerCount(value: LayerVisibility): number {
  return LAYER_IDS.filter((id) => value[id]).length;
}
