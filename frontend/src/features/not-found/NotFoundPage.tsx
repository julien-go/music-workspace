import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/components/hooks/useDocumentTitle";

export default function NotFoundPage() {
  useDocumentTitle("Page introuvable");
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <p className="font-heading text-7xl md:text-8xl font-bold text-muted-foreground/30">
        404
      </p>
      <div className="space-y-2">
        <h1 className="text-xl md:text-2xl font-heading font-bold text-foreground">
          Page introuvable
        </h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          Cette page n'existe pas ou a été déplacée.
        </p>
      </div>
      <Button asChild>
        <Link to="/">Retour à l'accueil</Link>
      </Button>
    </div>
  );
}
