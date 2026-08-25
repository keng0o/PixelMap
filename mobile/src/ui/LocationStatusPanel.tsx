import { AccessibilityInfo, Pressable, StyleSheet, View } from 'react-native';
import { useEffect } from 'react';

import {
  locationStateMessage,
  type LocationAccessState,
} from '../location/currentLocation';
import { PixelText as Text } from './PixelText';

type Props = Readonly<{
  onOpenSettings: () => void;
  onRetry: () => void;
  state: LocationAccessState;
}>;

export function LocationStatusPanel({ onOpenSettings, onRetry, state }: Props) {
  const message = locationStateMessage(state);

  useEffect(() => {
    if (message !== null && state.kind !== 'requesting') {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, [message, state.kind]);

  if (message === null || state.kind === 'requesting') return null;

  const needsSettings = state.kind === 'services-disabled'
    || (state.kind === 'permission-denied' && !state.canAskAgain);
  const isSuccess = state.kind === 'success';

  return (
    <View
      style={[styles.panel, isSuccess ? styles.successPanel : styles.errorPanel]}
    >
      <View style={styles.copy}>
        <Text accessibilityRole="header" style={styles.title}>
          {isSuccess ? '現在地を確認しました' : '現在地を確認できません'}
        </Text>
        <Text style={styles.message}>{message}</Text>
        {isSuccess ? (
          <Text style={styles.coordinates}>
            {state.coordinates.latitude.toFixed(4)}, {state.coordinates.longitude.toFixed(4)}
          </Text>
        ) : null}
      </View>
      {!isSuccess ? (
        <Pressable
          accessibilityHint={needsSettings
            ? 'PixelMapの位置情報設定を変更します'
            : '現在地の取得をもう一度試します'}
          accessibilityRole="button"
          onPress={needsSettings ? onOpenSettings : onRetry}
          style={({ pressed }) => [styles.action, pressed ? styles.pressed : null]}
        >
          <Text style={styles.actionText}>{needsSettings ? '設定を開く' : '再試行'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'center', borderColor: '#f8f0d8', borderWidth: 2,
    justifyContent: 'center', minHeight: 44, minWidth: 88, paddingHorizontal: 12,
  },
  actionText: { color: '#f8f0d8', fontSize: 12 },
  coordinates: { color: '#a8a088', fontSize: 11, letterSpacing: 0.5 },
  copy: { flex: 1, gap: 3 },
  errorPanel: { borderColor: '#ff9a88' },
  message: { color: '#d8d0b8', fontSize: 12, lineHeight: 17 },
  panel: {
    alignItems: 'center', alignSelf: 'stretch', backgroundColor: '#202028',
    borderWidth: 2, flexDirection: 'row', gap: 12, padding: 12,
  },
  pressed: { opacity: 0.65 },
  successPanel: { borderColor: '#88c860' },
  title: { color: '#f8f0d8', fontSize: 13 },
});
