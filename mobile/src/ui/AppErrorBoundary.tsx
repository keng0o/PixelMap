import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { captureDiagnosticException } from '../observability/diagnostics';

type Props = { children: ReactNode };
type State = { failed: boolean };

export class AppErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    captureDiagnosticException(error, {
      boundary: 'root',
      componentStack: info.componentStack || 'unavailable',
    });
    AccessibilityInfo.announceForAccessibility(
      '地図を表示できませんでした。地図を再読み込みできます。',
    );
  }

  private retry = (): void => {
    this.setState({ failed: false });
  };

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;

    return (
      <SafeAreaView style={styles.safeArea}>
        <View accessibilityLiveRegion="assertive" style={styles.card}>
          <Text style={styles.eyebrow}>PIXELMAP RECOVERY</Text>
          <Text accessibilityRole="header" style={styles.title}>地図を表示できませんでした</Text>
          <Text style={styles.body}>
            一時的な問題が発生しました。もう一度読み込んでください。
          </Text>
          <Pressable
            accessibilityHint="地図画面をもう一度表示します"
            accessibilityRole="button"
            onPress={this.retry}
            style={({ pressed }) => [styles.button, pressed ? styles.buttonPressed : null]}
          >
            <Text style={styles.buttonText}>地図を再読み込み</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  body: { color: '#d8d0b8', fontSize: 15, lineHeight: 24 },
  button: {
    alignItems: 'center', backgroundColor: '#f8d038', borderColor: '#f8f0d8', borderWidth: 2,
    justifyContent: 'center', minHeight: 48, paddingHorizontal: 18,
  },
  buttonPressed: { opacity: 0.75 },
  buttonText: { color: '#101018', fontSize: 16, fontWeight: '700' },
  card: {
    alignSelf: 'center', backgroundColor: '#20202a', borderColor: '#f8f0d8', borderWidth: 2,
    gap: 16, maxWidth: 440, padding: 24, width: '100%',
  },
  eyebrow: { color: '#88c860', fontSize: 12, letterSpacing: 1.4 },
  safeArea: {
    backgroundColor: '#101018', flex: 1, justifyContent: 'center', padding: 20,
  },
  title: { color: '#f8f0d8', fontSize: 24, fontWeight: '700', lineHeight: 34 },
});
