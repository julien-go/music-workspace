import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { WaveformCanvas } from "./WaveformCanvas";

const features = [
  {
    number: "01",
    title: "Projets centralisés",
    description:
      "Regroupez pistes, versions et tâches dans un seul espace de travail partagé.",
  },
  {
    number: "02",
    title: "Versioning audio",
    description:
      "Uploadez et historisez chaque version de vos pistes. Rien ne se perd.",
  },
  {
    number: "03",
    title: "Collaboration par rôles",
    description:
      "Owner, Collaborateur, Viewer — le bon niveau d'accès pour chaque membre.",
  },
  {
    number: "04",
    title: "Suivi des tâches",
    description:
      "Créez, assignez et suivez l'avancement des tâches de production.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-background border-b border-border pt-20 md:pt-28 pb-0">
        <div className="max-w-2xl mx-auto text-center space-y-7 px-4 md:px-6 pb-14">
          <h1 className="text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight text-foreground">
            Créez. Versionnez.{" "}
            <span className="text-accent">Collaborez.</span>
          </h1>
          <p className="text-base md:text-lg text-foreground max-w-lg mx-auto leading-relaxed">
            La plateforme de gestion de projets musicaux pensée pour les équipes
            créatives.
          </p>
          <div className="flex flex-col md:flex-row md:justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/register">Créer un compte</Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link to="/login">Se connecter</Link>
            </Button>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <WaveformCanvas />
        </div>
      </section>

      {/* Features */}
      <section className="bg-background px-4 md:px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {features.map(({ number, title, description }, index) => {
            const isOdd = index % 2 === 0;
            return (
              <div
                key={number}
                className={`group border-t border-border py-7 flex flex-col md:flex-row md:items-center gap-3 md:gap-12 ${isOdd ? "" : "md:flex-row-reverse"}`}
              >
                <span className="w-24 shrink-0 text-4xl md:text-5xl font-bold font-heading text-muted-foreground transition-colors duration-300 ease group-hover:text-accent">
                  {number}
                </span>
                <div className={`flex-1 ${isOdd ? "" : "md:text-right"}`}>
                  <h3 className="font-semibold text-foreground text-base mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
              </div>
            );
          })}
          <div className="border-t border-border" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Music Workspace
        </p>
      </footer>
    </div>
  );
}
