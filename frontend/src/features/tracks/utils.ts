const MAX_AUDIO_SIZE = 70 * 1024 * 1024;

/**
 * Mirrors the server-side checks so bad files are rejected before the upload.
 * An empty `file.type` is let through — some valid audio files have no browser
 * MIME; the server re-checks by content. Returns null when accepted.
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
