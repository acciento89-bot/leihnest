export type ItemIllustrationKind =
  | "pavilion"
  | "benches"
  | "projector"
  | "speaker"
  | "generic";

export function ItemIllustration({ kind }: { kind: ItemIllustrationKind }) {
  const common = {
    viewBox: "0 0 120 72",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: "h-16 w-28 text-[var(--brand-dark)]",
  };

  if (kind === "pavilion") {
    return (
      <svg {...common} data-visual-style="duotone-real-object">
        <path d="M18 32 38 14h44l20 18H18Z" fill="currentColor" opacity=".10" stroke="none" />
        <path d="M18 32 38 14h44l20 18" />
        <path d="M24 32h72" />
        <path d="M30 32v27M90 32v27M45 32v27M75 32v27" />
        <path d="M18 59h84" opacity=".35" />
      </svg>
    );
  }

  if (kind === "benches") {
    return (
      <svg {...common} data-visual-style="duotone-real-object">
        <path d="M25 24h70v7H25zM19 39h82v7H19z" fill="currentColor" opacity=".10" stroke="none" />
        <path d="M28 27h64M35 27v15M85 27v15" />
        <path d="M22 42h76M28 42v16M92 42v16" />
        <path d="M34 51h52M39 51v10M81 51v10" opacity=".65" />
      </svg>
    );
  }

  if (kind === "projector") {
    return (
      <svg {...common} data-visual-style="duotone-real-object">
        <rect x="24" y="22" width="72" height="38" rx="8" fill="currentColor" opacity=".08" stroke="none" />
        <rect x="24" y="22" width="72" height="38" rx="8" />
        <circle cx="76" cy="41" r="11" />
        <circle cx="76" cy="41" r="5" fill="currentColor" opacity=".18" />
        <path d="M34 34h18M34 42h12M32 60l-5 7M88 60l5 7" />
      </svg>
    );
  }

  if (kind === "speaker") {
    return (
      <svg {...common} data-visual-style="duotone-real-object">
        <rect x="39" y="8" width="42" height="56" rx="8" fill="currentColor" opacity=".08" stroke="none" />
        <rect x="39" y="8" width="42" height="56" rx="8" />
        <circle cx="60" cy="26" r="7" />
        <circle cx="60" cy="47" r="11" fill="currentColor" opacity=".12" />
        <circle cx="60" cy="47" r="11" />
        <path d="M51 15h18" opacity=".55" />
      </svg>
    );
  }

  return (
    <svg {...common} data-visual-style="duotone-real-object">
      <path d="M27 25 60 10l33 15v36H27V25Z" fill="currentColor" opacity=".08" stroke="none" />
      <path d="m27 25 33 15 33-15M60 40v27M27 25v36l33 6 33-6V25L60 10 27 25Z" />
      <path d="m43 18 34 15" opacity=".45" />
    </svg>
  );
}
