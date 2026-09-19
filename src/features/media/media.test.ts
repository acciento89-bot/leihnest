import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import sharp from "sharp";
import { processImage, validateSourceBytes } from "./image-processor";
import { readVariant, removeAsset, writeImageVariants } from "./media-store";

const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFElEQVR42mNk+M/AwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==","base64");
const dirs:string[]=[];

afterEach(async()=>{await Promise.all(dirs.splice(0).map(dir=>rm(dir,{recursive:true,force:true})));});

describe("media processing",()=>{
  it("rejects oversized source bytes",()=>{
    expect(()=>validateSourceBytes(8*1024*1024+1)).toThrow("IMAGE_TOO_LARGE");
  });

  it("rejects malformed image data",async()=>{
    await expect(processImage(Buffer.from("not-an-image"))).rejects.toThrow("INVALID_IMAGE");
  });

  it("normalizes a supported image to private WebP variants",async()=>{
    const processed=await processImage(PNG);
    expect(processed.mimeType).toBe("image/webp");
    expect(Object.keys(processed.variants).sort()).toEqual(["card","large","thumb"]);
    for(const [variant,max] of [["thumb",256],["card",640],["large",1600]] as const){
      const meta=await sharp(processed.variants[variant]).metadata();
      expect(meta.format).toBe("webp");
      expect(meta.width).toBeLessThanOrEqual(max);
      expect(meta.height).toBeLessThanOrEqual(max);
      expect(meta.exif).toBeUndefined();
    }
  });

  it("writes reads and removes generated-key variants",async()=>{
    const dir=await mkdtemp(join(tmpdir(),"leihnest-media-"));dirs.push(dir);
    const processed=await processImage(PNG);
    const key=await writeImageVariants(processed.variants,dir);
    expect(key).toMatch(/^[0-9a-f-]{36}$/i);
    expect((await readVariant(key,"thumb",dir)).length).toBeGreaterThan(0);
    await removeAsset(key,dir);
    await expect(stat(join(dir,key))).rejects.toThrow();
  });

  it("never accepts a caller-supplied path as storage key",async()=>{
    const dir=await mkdtemp(join(tmpdir(),"leihnest-media-"));dirs.push(dir);
    await expect(readVariant("../etc/passwd","thumb",dir)).rejects.toThrow("INVALID_STORAGE_KEY");
  });
});
