import { createContext, type ReactNode, useContext } from 'react';
import { StyleSheet, Text as NativeText, type TextProps } from 'react-native';

export const PIXEL_FONT_FAMILY = 'DotGothic16_400Regular';

const PixelFontEnabledContext = createContext(false);

export function PixelFontProvider({
  children,
  enabled,
}: Readonly<{ children: ReactNode; enabled: boolean }>) {
  return (
    <PixelFontEnabledContext.Provider value={enabled}>
      {children}
    </PixelFontEnabledContext.Provider>
  );
}

export function PixelText({ style, ...props }: TextProps) {
  const enabled = useContext(PixelFontEnabledContext);
  return <NativeText {...props} style={[enabled ? styles.pixelFont : null, style]} />;
}

const styles = StyleSheet.create({
  pixelFont: { fontFamily: PIXEL_FONT_FAMILY, fontWeight: '400' },
});
