import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ProjectCover } from "@/components/ProjectCover";

export function ProjectCoverWithLightbox({
  name,
  coverUrl,
}: {
  name: string;
  coverUrl: string | null;
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!coverUrl) {
    return <ProjectCover name={name} coverUrl={null} className="shrink-0" />;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="shrink-0 rounded-lg overflow-hidden hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        title="Voir en grand"
      >
        <ProjectCover name={name} coverUrl={coverUrl} />
      </button>
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="bg-surface p-3 sm:max-w-md">
          <DialogTitle className="sr-only">{name}</DialogTitle>
          <img
            src={coverUrl}
            alt={name}
            className="w-full aspect-square object-cover rounded-md"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
