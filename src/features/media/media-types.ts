export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_INPUT_PIXELS = 40_000_000;
export const MEDIA_VARIANTS = { thumb: 256, card: 640, large: 1600 } as const;

export type MediaVariant = keyof typeof MEDIA_VARIANTS;
export type MediaKind = "PROFILE" | "GROUP" | "ITEM";
export type ProcessedImage = {
  mimeType: "image/webp";
  sourceBytes: number;
  sourceWidth: number;
  sourceHeight: number;
  variants: Record<MediaVariant, Buffer>;
};
