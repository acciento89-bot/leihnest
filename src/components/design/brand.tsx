import Image from "next/image";
import Link from "next/link";

export function NestBrand({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return <Link href={href} className={`nest-brand${compact ? " nest-brand-small" : ""}`} aria-label="LeihNest">
    <Image src="/images/leihnest/nest-logo.png" width={49} height={52} alt="" unoptimized />
    <span>LeihNest</span>
  </Link>;
}
