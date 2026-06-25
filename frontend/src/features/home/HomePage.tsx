import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background p-12 space-y-10">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-foreground">Music Workspace</h1>
        <h2 className="text-2xl text-foreground">Design system — Syne heading</h2>
        <h3 className="text-xl text-foreground">h3 heading</h3>
        <h4 className="text-lg text-foreground">h4 heading</h4>
        <p className="text-foreground">Corps de texte en DM Sans — regular 400</p>
        <p className="font-medium text-muted-foreground">Muted foreground — medium 500</p>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Buttons — shadcn variants</p>
        <div className="flex flex-wrap gap-3">
          <Button>Primary (accent)</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Surfaces</p>
        <div className="flex gap-4">
          <div className="bg-surface rounded-card border border-border p-4 text-foreground text-sm">surface</div>
          <div className="bg-surface-elevated rounded-card border border-border p-4 text-foreground text-sm">surface-elevated</div>
          <div className="bg-accent rounded-card p-4 text-foreground text-sm">accent</div>
        </div>
      </div>
    </div>
  );
}
