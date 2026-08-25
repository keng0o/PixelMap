import {
  AccessibilityInfo,
  findNodeHandle,
  Modal,
  Pressable,
  StyleSheet,
  Text as NativeText,
  View,
} from 'react-native';
import { useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatPoiCoordinate } from '../poi/previewPois';
import type { MapPoi } from '../poi/types';
import { PixelText as Text } from './PixelText';

type Props = Readonly<{
  onClose: () => void;
  poi: MapPoi | null;
}>;

export function PoiDetailsSheet({ onClose, poi }: Props) {
  const titleRef = useRef<NativeText>(null);
  const focusTitle = () => {
    const handle = findNodeHandle(titleRef.current);
    if (handle !== null) AccessibilityInfo.setAccessibilityFocus(handle);
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      onShow={focusTitle}
      presentationStyle="overFullScreen"
      transparent
      visible={poi !== null}
    >
      <SafeAreaView
        accessibilityViewIsModal
        onAccessibilityEscape={onClose}
        style={styles.overlay}
      >
        <Pressable
          accessible={false}
          onPress={onClose}
          style={styles.backdrop}
        />
        {poi ? (
          <View style={styles.sheet}>
            <View accessibilityElementsHidden style={styles.handle} />
            <View style={styles.headingRow}>
              <View style={styles.headingCopy}>
                <Text style={styles.eyebrow}>POINT OF INTEREST</Text>
                <Text accessibilityRole="header" ref={titleRef} style={styles.title}>{poi.name}</Text>
                <Text style={styles.category}>{poi.category}</Text>
              </View>
              <Pressable
                accessibilityLabel="施設情報を閉じる"
                accessibilityRole="button"
                onPress={onClose}
                style={({ pressed }) => [styles.closeButton, pressed ? styles.pressed : null]}
              >
                <Text style={styles.closeButtonText}>閉じる</Text>
              </Pressable>
            </View>

            <View style={styles.details}>
              <DetailRow label="緯度" value={formatPoiCoordinate(poi.latitude, 'N', 'S')} />
              <DetailRow label="経度" value={formatPoiCoordinate(poi.longitude, 'E', 'W')} />
              <DetailRow label="データ" value={poi.source} />
            </View>

            <Text style={styles.hint}>黄色い施設セルをタップすると、この情報を表示します。</Text>
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

function DetailRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  category: { color: '#f8d038', fontSize: 13 },
  closeButton: {
    alignItems: 'center', borderColor: '#f8f0d8', borderWidth: 2,
    justifyContent: 'center', minHeight: 44, paddingHorizontal: 14,
  },
  closeButtonText: { color: '#f8f0d8', fontSize: 13 },
  detailLabel: { color: '#a8a088', fontSize: 12, width: 56 },
  detailRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12 },
  detailValue: { color: '#f8f0d8', flex: 1, fontSize: 14, lineHeight: 20 },
  details: { backgroundColor: '#181820', gap: 10, padding: 14 },
  eyebrow: { color: '#88c860', fontSize: 11, letterSpacing: 2 },
  handle: { alignSelf: 'center', backgroundColor: '#686858', height: 4, marginBottom: 14, width: 48 },
  headingCopy: { flex: 1, gap: 3, paddingRight: 12 },
  headingRow: { alignItems: 'center', flexDirection: 'row', marginBottom: 14 },
  hint: { color: '#8f8a78', fontSize: 11, lineHeight: 16, marginTop: 12 },
  overlay: { backgroundColor: 'rgba(0,0,0,0.54)', flex: 1, justifyContent: 'flex-end' },
  pressed: { opacity: 0.65 },
  sheet: {
    backgroundColor: '#202028', borderColor: '#f8f0d8', borderTopWidth: 2,
    gap: 0, paddingBottom: 18, paddingHorizontal: 16, paddingTop: 12,
  },
  title: { color: '#f8f0d8', fontSize: 23 },
});
