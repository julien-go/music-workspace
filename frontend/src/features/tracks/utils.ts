const MAX_AUDIO_SIZE = 70 * 1024 * 1024;

/**
 * Mirrors the server-side checks (type + 70MB cap) so oversized or mistyped
 * files are rejected before the upload starts instead of after minutes of
 * transfer. Returns a user-facing message, or null when the file is accepted.
 * An empty `file.type` is let through — some valid audio files have no
 * detectable MIME in the browser; the server does a content-based check anyway.
 */
export function validateAudioFile(file: File): string | null {
  if (file.type && !file.type.startsWith("audio/")) {
    return "Seuls les fichiers audio sont acceptés.";
  }
  if (file.size > MAX_AUDIO_SIZE) {
    return "Le fichier ne doit pas dépasser 70 Mo.";
  }
  return null;
}
