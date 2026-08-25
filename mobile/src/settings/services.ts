import Storage from 'expo-sqlite/kv-store';

import { LayerSettingsRepository } from './layerSettingsRepository';

export const layerSettingsRepository = new LayerSettingsRepository(Storage);
