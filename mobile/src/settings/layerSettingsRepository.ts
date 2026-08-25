import { normalizeLayerVisibility, type LayerVisibility } from './layerSettings';

export const LAYER_SETTINGS_STORAGE_KEY = 'pixelmap.layer-visibility.v1';

export interface LayerSettingsStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

type StoredLayerSettings = Readonly<{
  version: 1;
  layers: LayerVisibility;
}>;

export class LayerSettingsRepository {
  private writeTail: Promise<void> = Promise.resolve();

  constructor(private readonly storage: LayerSettingsStorage) {}

  async load(): Promise<LayerVisibility> {
    const stored = await this.storage.getItem(LAYER_SETTINGS_STORAGE_KEY);
    if (!stored) return normalizeLayerVisibility(null);
    try {
      const parsed = JSON.parse(stored) as Partial<StoredLayerSettings>;
      return parsed.version === 1
        ? normalizeLayerVisibility(parsed.layers)
        : normalizeLayerVisibility(null);
    } catch {
      return normalizeLayerVisibility(null);
    }
  }

  save(layers: LayerVisibility): Promise<void> {
    const payload: StoredLayerSettings = {
      version: 1,
      layers: normalizeLayerVisibility(layers),
    };
    const write = () => this.storage.setItem(LAYER_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
    const result = this.writeTail.then(write, write);
    this.writeTail = result.then(() => undefined, () => undefined);
    return result;
  }
}
