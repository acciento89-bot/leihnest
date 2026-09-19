import sharp from "sharp";
import { MAX_INPUT_PIXELS, MAX_UPLOAD_BYTES, MEDIA_VARIANTS, type ProcessedImage } from "./media-types";

export function validateSourceBytes(bytes:number){
  if(bytes<=0 || bytes>MAX_UPLOAD_BYTES) throw new Error("IMAGE_TOO_LARGE");
}

export async function processImage(input:Buffer):Promise<ProcessedImage>{
  validateSourceBytes(input.byteLength);
  try{
    const probe=sharp(input,{failOn:"error",limitInputPixels:MAX_INPUT_PIXELS});
    const metadata=await probe.metadata();
    if(!metadata.width || !metadata.height || !["jpeg","png","webp"].includes(metadata.format ?? "")) throw new Error("INVALID_IMAGE");
    const entries=await Promise.all(Object.entries(MEDIA_VARIANTS).map(async([name,size])=>{
      const bytes=await sharp(input,{failOn:"error",limitInputPixels:MAX_INPUT_PIXELS})
        .rotate()
        .resize({width:size,height:size,fit:"inside",withoutEnlargement:true})
        .webp({quality:84})
        .toBuffer();
      return [name,bytes] as const;
    }));
    return {
      mimeType:"image/webp",
      sourceBytes:input.byteLength,
      sourceWidth:metadata.width,
      sourceHeight:metadata.height,
      variants:Object.fromEntries(entries) as ProcessedImage["variants"],
    };
  }catch(error){
    if(error instanceof Error && error.message==="IMAGE_TOO_LARGE") throw error;
    throw new Error("INVALID_IMAGE");
  }
}
