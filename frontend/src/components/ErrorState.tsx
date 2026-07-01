import { Button } from "@/components/ui/button";

interface Props {
  message: string;
  onRetry: () => void;
}

/**
 * Blocking error state for a failed initial page fetch: a centered message with
 * a retry action. Not for mutation failures (those use toasts).
 */
export function ErrorState({ message, onRetry }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="ghost" onClick={onRetry}>
        Réessayer
      </Button>
    </div>
  );
}
