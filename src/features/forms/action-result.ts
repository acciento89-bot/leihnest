const PUBLIC_ERRORS: Record<string, string> = {
  RESERVATION_CONFLICT: "Im gewählten Zeitraum ist nicht genug Bestand verfügbar.",
  FORBIDDEN: "Du hast für diese Aktion keine Berechtigung.",
  NOT_FOUND: "Der angeforderte Eintrag wurde nicht gefunden.",
};

export function toActionError(error: unknown) {
  if (error instanceof Error && PUBLIC_ERRORS[error.message]) {
    return PUBLIC_ERRORS[error.message];
  }

  return "Die Aktion konnte nicht ausgeführt werden.";
}
