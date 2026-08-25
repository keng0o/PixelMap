export type MapPoi = Readonly<{
  id: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  source: string;
}>;

export type PreviewPoi = MapPoi & Readonly<{
  gridX: number;
  gridY: number;
}>;
