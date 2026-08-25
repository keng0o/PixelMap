export type ResponsiveMapLayout = Readonly<{
  contentMaxWidth: number;
  horizontalPadding: number;
  mapSize: number;
  wide: boolean;
}>;

const PHONE_PADDING = 16;
const TABLET_PADDING = 24;
const WIDE_BREAKPOINT = 700;
const WIDE_COLUMN_GAP = 20;

export function responsiveMapLayout(width: number, height: number): ResponsiveMapLayout {
  const safeWidth = Math.max(320, width);
  const safeHeight = Math.max(320, height);
  const wide = safeWidth >= WIDE_BREAKPOINT || safeWidth > safeHeight * 1.35;
  const horizontalPadding = safeWidth >= WIDE_BREAKPOINT ? TABLET_PADDING : PHONE_PADDING;
  const contentMaxWidth = wide ? 960 : 560;
  const contentWidth = Math.min(contentMaxWidth, safeWidth - horizontalPadding * 2);

  if (!wide) {
    return {
      contentMaxWidth,
      horizontalPadding,
      mapSize: Math.floor(Math.min(560, contentWidth)),
      wide,
    };
  }

  const widthLimitedSize = (contentWidth - WIDE_COLUMN_GAP) / 2;
  const heightLimitedSize = safeHeight - 128;
  return {
    contentMaxWidth,
    horizontalPadding,
    mapSize: Math.floor(Math.max(200, Math.min(420, widthLimitedSize, heightLimitedSize))),
    wide,
  };
}
