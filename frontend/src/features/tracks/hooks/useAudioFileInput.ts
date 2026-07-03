import { useRef, useState } from "react";
import { validateAudioFile } from "../utils";

/** Owns an audio file input: validation on pick, error message, reset. */
export function useAudioFileInput() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const clearInput = () => {
    if (inputRef.current) inputRef.current.value = "";
  };

  const onChange = (selected: File | null) => {
    if (!selected) {
      setFile(null);
      setFileError(null);
      return;
    }
    const validationError = validateAudioFile(selected);
    if (validationError) {
      setFileError(validationError);
      setFile(null);
      clearInput();
      return;
    }
    setFileError(null);
    setFile(selected);
  };

  const clear = () => {
    setFile(null);
    setFileError(null);
    clearInput();
  };

  return { file, fileError, inputRef, onChange, clear };
}
