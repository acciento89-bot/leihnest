export type ItemIllustrationKind =
  | "pavilion"
  | "benches"
  | "projector"
  | "speaker";

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
      <svg {...common}>
        <path d="M18 32 38 14h44l20 18" />
        <path d="M24 32h72" />
        <path d="M30 32v27M90 32v27M45 32v27M75 32v27" />
        <path d="M18 59h84" opacity=".35" />
      </svg>
    );
  }

  if (kind === "benches") {
    return (
      <svg {...common}>
        <path d="M28 27h64M35 27v15M85 27v15" />
        <path d="M22 42h76M28 42v16M92 42v16" />
        <path d="M34 51h52M39 51v10M81 51v10" opacity=".65" />
      </svg>
    );
  }

  if (kind === "projector") {
    return (
      <svg {...common}>
        <rect x="24" y="22" width="72" height="38" rx="8" />
        <circle cx="76" cy="41" r="11" />
        <circle cx="76" cy="41" r="5" opacity=".55" />
        <path d="M34 34h18M34 42h12M32 60l-5 7M88 60l5 7" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect x="39" y="8" width="42" height="56" rx="8" />
      <circle cx="60" cy="26" r="7" />
      <circle cx="60" cy="47" r="11" />
      <path d="M51 15h18" opacity=".55" />
    </svg>
  );
}
