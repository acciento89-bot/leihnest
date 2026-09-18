import { ZodError } from "zod";

const PUBLIC_ERRORS: Record<string, string> = {
  NOT_AVAILABLE: "Für diesen Zeitraum ist die gewünschte Menge nicht verfügbar.",
  RESERVATION_CONFLICT: "Für diesen Zeitraum ist die gewünschte Menge nicht verfügbar.",
  FORBIDDEN: "Dafür hast du keine Berechtigung.",
  NOT_FOUND: "Der angeforderte Eintrag wurde nicht gefunden.",
  INVALID_STATE: "Diese Aktion ist im aktuellen Status nicht möglich.",
};

export function toActionError(error: unknown) {
  if (error instanceof ZodError) {
    return "Bitte prüfe deine Eingaben.";
  }

  if (error instanceof Error && PUBLIC_ERRORS[error.message]) {
    return PUBLIC_ERRORS[error.message];
  }

  return "Etwas ist schiefgelaufen. Bitte versuche es erneut.";
}
