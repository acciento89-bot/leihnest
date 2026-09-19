import Image from "next/image";
export type PhotoKind = "pavilion" | "speaker" | "projector" | "chair" | "toolbox" | "benches";
export function photoForItem(name: string): PhotoKind | null {
  if (/garnitur|bierbank|bench|bierzelt/i.test(name)) return "benches";
  if (/pavillon|pavilion|gazebo|zelt|tent/i.test(name)) return "pavilion";
  if (/lautsprecher|speaker|musikanlage|sound/i.test(name)) return "speaker";
  if (/beamer|projector/i.test(name)) return "projector";
  if (/stuhl|stühl|chair/i.test(name)) return "chair";
  if (/werkzeug|tool/i.test(name)) return "toolbox";
  return null;
}
export function ItemPhoto({ kind, name, symbolic = false, locale = "de", eager = false }: { kind: PhotoKind | null; name: string; symbolic?: boolean; locale?: "de" | "en"; eager?: boolean }) {
  if (!kind) return <div className="nest-photo-missing"><span>{name.trim().slice(0,1).toLocaleUpperCase()}</span><small>{locale === "de" ? "Noch kein Foto" : "No photo yet"}</small></div>;
  return <div className={`nest-photo nest-photo-${kind}`}>
    <Image src={`/images/leihnest/${kind}.webp`} width={600} height={450} alt={symbolic ? `${locale === "de" ? "Symbolfoto" : "Illustrative photo"}: ${name}` : name} loading={eager ? "eager" : "lazy"} unoptimized />
    {symbolic && <span className="nest-photo-caption">{locale === "de" ? "Symbolfoto" : "Illustrative photo"}</span>}
  </div>;
}
