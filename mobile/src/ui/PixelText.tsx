import { createContext, forwardRef, type ReactNode, useContext } from 'react';
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

export const PixelText = forwardRef<NativeText, TextProps>(function PixelText(
  { style, ...props },
  ref,
) {
  const enabled = useContext(PixelFontEnabledContext);
  return <NativeText {...props} ref={ref} style={[enabled ? styles.pixelFont : null, style]} />;
});

const styles = StyleSheet.create({
  pixelFont: { fontFamily: PIXEL_FONT_FAMILY, fontWeight: '400' },
});
