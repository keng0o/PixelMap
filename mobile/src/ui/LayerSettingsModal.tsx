import { Modal, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  createUniformLayerVisibility,
  DEFAULT_LAYER_VISIBILITY,
  enabledLayerCount,
  LAYER_DEFINITIONS,
  type LayerVisibility,
} from '../settings/layerSettings';
import { PixelText as Text } from './PixelText';

type Props = Readonly<{
  error: string | null;
  onChange: (value: LayerVisibility) => void;
  onClose: () => void;
  value: LayerVisibility;
  visible: boolean;
}>;

export function LayerSettingsModal({ error, onChange, onClose, value, visible }: Props) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" visible={visible}>
      <SafeAreaView accessibilityViewIsModal style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text accessibilityRole="header" style={styles.eyebrow}>MAP DISPLAY</Text>
            <Text accessibilityRole="header" style={styles.title}>レイヤー設定</Text>
            <Text style={styles.summary}>{enabledLayerCount(value)} / {LAYER_DEFINITIONS.length} 表示中</Text>
          </View>
          <Pressable
            accessibilityLabel="レイヤー設定を閉じる"
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}
          >
            <Text style={styles.closeButtonText}>完了</Text>
          </Pressable>
        </View>

        <View accessibilityLabel="レイヤーの一括設定" style={styles.presets}>
          <PresetButton label="すべて表示" onPress={() => onChange(createUniformLayerVisibility(true))} />
          <PresetButton label="すべて隠す" onPress={() => onChange(createUniformLayerVisibility(false))} />
          <PresetButton label="初期設定" onPress={() => onChange(DEFAULT_LAYER_VISIBILITY)} />
        </View>

        {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}

        <ScrollView contentContainerStyle={styles.list}>
          {LAYER_DEFINITIONS.map((definition) => (
            <View key={definition.id} style={styles.layerRow}>
              <View style={styles.layerCopy}>
                <Text style={styles.layerLabel}>{definition.label}</Text>
                <Text style={styles.layerDescription}>{definition.description}</Text>
              </View>
              <Switch
                accessibilityHint={`${definition.label}レイヤーの表示を切り替えます`}
                accessibilityLabel={definition.label}
                onValueChange={(enabled) => onChange({ ...value, [definition.id]: enabled })}
                thumbColor={value[definition.id] ? '#f8f0d8' : '#a8a088'}
                trackColor={{ false: '#383840', true: '#619c42' }}
                value={value[definition.id]}
              />
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function PresetButton({ label, onPress }: Readonly<{ label: string; onPress: () => void }>) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.presetButton, pressed ? styles.pressed : null]}
    >
      <Text style={styles.presetButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    alignItems: 'center', borderColor: '#f8f0d8', borderWidth: 2,
    justifyContent: 'center', minHeight: 44, paddingHorizontal: 16,
  },
  closeButtonText: { color: '#f8f0d8', fontSize: 14 },
  error: { color: '#ff9a88', fontSize: 13, marginHorizontal: 16, marginTop: 12 },
  eyebrow: { color: '#88c860', fontSize: 12, letterSpacing: 2 },
  header: {
    alignItems: 'center', borderBottomColor: '#383840', borderBottomWidth: 1,
    flexDirection: 'row', justifyContent: 'space-between', padding: 16,
  },
  headerCopy: { gap: 2 },
  layerCopy: { flex: 1, gap: 3, paddingRight: 12 },
  layerDescription: { color: '#a8a088', fontSize: 12, lineHeight: 17 },
  layerLabel: { color: '#f8f0d8', fontSize: 16 },
  layerRow: {
    alignItems: 'center', backgroundColor: '#202028', borderColor: '#383840',
    borderWidth: 1, flexDirection: 'row', minHeight: 76, padding: 14,
  },
  list: { gap: 8, padding: 16 },
  presetButton: {
    alignItems: 'center', borderColor: '#686858', borderWidth: 1,
    flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 8,
  },
  presetButtonText: { color: '#d8d0b8', fontSize: 12 },
  presets: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14 },
  pressed: { opacity: 0.65 },
  safeArea: { backgroundColor: '#101018', flex: 1 },
  summary: { color: '#a8a088', fontSize: 12 },
  title: { color: '#f8f0d8', fontSize: 24 },
});
