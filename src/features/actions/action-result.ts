import { ZodError } from "zod";
import type { WorkspaceLocale } from "@/features/workspace/workspace";

const PUBLIC_ERRORS: Record<string, string> = {
  NOT_AVAILABLE: "Für diesen Zeitraum ist die gewünschte Menge nicht verfügbar.",
  RESERVATION_CONFLICT: "Für diesen Zeitraum ist die gewünschte Menge nicht verfügbar.",
  FORBIDDEN: "Dafür hast du keine Berechtigung.",
  NOT_FOUND: "Der angeforderte Eintrag wurde nicht gefunden.",
  INVALID_STATE: "Diese Aktion ist im aktuellen Status nicht möglich.",
  INVITATION_INVALID: "Diese Einladung ist ungültig oder abgelaufen.",
  INVITATION_EMAIL_MISMATCH: "Diese Einladung gehört zu einer anderen E-Mail-Adresse.",
};

const ENGLISH_ERRORS: Record<string,string> = {
  NOT_AVAILABLE: "The requested quantity is not available for these dates.",
  RESERVATION_CONFLICT: "The requested quantity is not available for these dates.",
  FORBIDDEN: "You do not have permission to do that.",
  NOT_FOUND: "The requested entry could not be found.",
  INVALID_STATE: "This action is not available in the current state.",
  INVITATION_INVALID: "This invitation is invalid or has expired.",
  INVITATION_EMAIL_MISMATCH: "This invitation belongs to another email address.",
};
export function toActionError(error: unknown, locale: WorkspaceLocale = "de") {
  if (locale === "en") {
    if (error instanceof ZodError) return "Please check your entries.";
    if (error instanceof Error && Object.prototype.hasOwnProperty.call(ENGLISH_ERRORS,error.message)) return ENGLISH_ERRORS[error.message];
    return "Something went wrong. Please try again.";
  }
  if (error instanceof ZodError) {
    return "Bitte prüfe deine Eingaben.";
  }

  if (error instanceof Error && Object.prototype.hasOwnProperty.call(PUBLIC_ERRORS,error.message)) {
    return PUBLIC_ERRORS[error.message];
  }

  return "Etwas ist schiefgelaufen. Bitte versuche es erneut.";
}
