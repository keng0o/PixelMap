import { describe, expect, it } from 'vitest';

import {
  createUniformLayerVisibility,
  DEFAULT_LAYER_VISIBILITY,
  enabledLayerCount,
  normalizeLayerVisibility,
} from './layerSettings';
import {
  LAYER_SETTINGS_STORAGE_KEY,
  LayerSettingsRepository,
  type LayerSettingsStorage,
} from './layerSettingsRepository';

class MemorySettingsStorage implements LayerSettingsStorage {
  readonly values = new Map<string, string>();
  async getItem(key: string) { return this.values.get(key) ?? null; }
  async setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('layer settings', () => {
  it('uses the mobile defaults for missing or invalid values', () => {
    expect(normalizeLayerVisibility(null)).toEqual(DEFAULT_LAYER_VISIBILITY);
    expect(normalizeLayerVisibility([])).toEqual(DEFAULT_LAYER_VISIBILITY);
  });

  it('preserves booleans and fills missing layer keys from defaults', () => {
    expect(normalizeLayerVisibility({ nature: false, buildings: true, labels: 'yes' })).toEqual({
      ...DEFAULT_LAYER_VISIBILITY,
      nature: false,
      buildings: true,
    });
  });

  it('creates uniform presets and counts enabled layers', () => {
    expect(enabledLayerCount(createUniformLayerVisibility(true))).toBe(6);
    expect(enabledLayerCount(createUniformLayerVisibility(false))).toBe(0);
    expect(enabledLayerCount(DEFAULT_LAYER_VISIBILITY)).toBe(4);
  });

  it('round-trips a versioned layer preference', async () => {
    const storage = new MemorySettingsStorage();
    const repository = new LayerSettingsRepository(storage);
    const selected = { ...DEFAULT_LAYER_VISIBILITY, buildings: true, nature: false };
    await repository.save(selected);
    expect(await repository.load()).toEqual(selected);
    expect(JSON.parse(storage.values.get(LAYER_SETTINGS_STORAGE_KEY) ?? '')).toMatchObject({ version: 1 });
  });

  it.each(['not json', JSON.stringify({ version: 2, layers: { nature: false } })])(
    'falls back safely for unsupported stored data: %s',
    async (stored) => {
      const storage = new MemorySettingsStorage();
      storage.values.set(LAYER_SETTINGS_STORAGE_KEY, stored);
      await expect(new LayerSettingsRepository(storage).load()).resolves.toEqual(DEFAULT_LAYER_VISIBILITY);
    },
  );

  it('continues saving after a failed write', async () => {
    let attempts = 0;
    const storage: LayerSettingsStorage = {
      async getItem() { return null; },
      async setItem() {
        attempts += 1;
        if (attempts === 1) throw new Error('disk full');
      },
    };
    const repository = new LayerSettingsRepository(storage);
    await expect(repository.save(DEFAULT_LAYER_VISIBILITY)).rejects.toThrow('disk full');
    await expect(repository.save(createUniformLayerVisibility(false))).resolves.toBeUndefined();
    expect(attempts).toBe(2);
  });
});
