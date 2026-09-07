import { Link } from "@tanstack/react-router";
import { useDocumentTitle } from "@/components/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import { WaveformCanvas } from "./WaveformCanvas";

const features = [
  {
    number: "01",
    title: "Projets centralisés",
    description: "Pistes, versions et tâches dans un seul espace de travail partagé par l'équipe.",
  },
  {
    number: "02",
    title: "Versioning audio",
    description: "Chaque upload est historisé. Comparez les versions, rien ne se perd.",
  },
  {
    number: "03",
    title: "Rôles & permissions",
    description: "Owner, Collaborateur, Viewer : le bon niveau d'accès pour chaque membre.",
  },
  {
    number: "04",
    title: "Retours ciblés",
    description: "Commentez au bon niveau : le projet, une piste ou une version précise.",
  },
];

const featureCellClasses = [
  "border-b md:border-r md:pr-12",
  "border-b md:pl-12",
  "border-b md:border-b-0 md:border-r md:pr-12",
  "md:pl-12",
];

const eyebrow = "text-[13px] font-semibold uppercase tracking-[0.06em] text-accent mb-3.5";

export default function HomePage() {
  useDocumentTitle();
  return (
    <div className="flex flex-col overflow-x-hidden">
      <section className="relative flex flex-col items-center px-6 lg:px-16 pt-20 lg:pt-30 pb-16 lg:pb-22 text-center">
        <Reveal delay={50}>
          <h1 className="mt-8 max-w-230 text-[2.75rem] sm:text-6xl lg:text-[76px] font-semibold leading-[1.05] tracking-[-0.03em]">
            Créez. Versionnez.
            <br />
            <span className="text-accent">Collaborez.</span>
          </h1>
        </Reveal>
        <Reveal delay={100}>
          <p className="mt-7 max-w-130 text-lg leading-relaxed text-muted-foreground">
            La plateforme de gestion de projets musicaux pour les équipes créatives. Un seul espace
            pour vos pistes, vos versions et votre équipe.
          </p>
        </Reveal>
        <Reveal delay={150}>
          <div className="mt-9 flex flex-col sm:flex-row justify-center gap-3">
            <Button asChild>
              <Link to="/register">Créer un compte</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/login">Se connecter</Link>
            </Button>
          </div>
        </Reveal>
        <Reveal delay={200} className="mt-16 lg:mt-19 w-full max-w-190">
          <WaveformCanvas />
        </Reveal>
      </section>

      <section className="flex justify-center px-6 lg:px-16 pb-24 lg:pb-30">
        <Reveal className="w-full max-w-230 text-center">
          <p className={eyebrow}>L'espace de travail</p>
          <h2 className="mb-11 text-2xl lg:text-[32px] font-semibold tracking-[-0.02em]">
            Toutes vos pistes, vos versions et vos retours réunis au même endroit.
          </h2>
          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-12 -top-12 h-85 bg-[radial-gradient(ellipse_at_50%_30%,rgba(148,157,250,0.14),transparent_70%)] blur-[10px]"
            />
            <div className="group relative rounded-2xl border border-border bg-surface p-2.5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6),0_0_90px_-20px_rgba(148,157,250,0.18)] [transform:perspective(1400px)_rotateX(4deg)] origin-top transition-[transform,box-shadow] duration-500 ease-out hover:[transform:perspective(1400px)_rotateX(4deg)_translateY(-6px)] hover:shadow-[0_48px_110px_-20px_rgba(0,0,0,0.65),0_0_110px_-18px_rgba(148,157,250,0.24)] motion-reduce:transform-none">
              <div className="flex gap-1.5 p-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="h-2.5 w-2.5 rounded-full bg-border" />
              </div>
              <img
                src="/app-screenshot.webp"
                alt="Aperçu de Music Workspace : la vue d'un projet avec ses pistes et leurs versions."
                className="aspect-[16/9.6] w-full rounded-lg object-cover"
              />
            </div>
          </div>
        </Reveal>
      </section>

      <section className="px-6 lg:px-16 pb-10">
        <Reveal className="mx-auto max-w-280 border-b border-border pb-14">
          <p className={eyebrow}>Fonctionnalités</p>
          <h2 className="max-w-160 text-3xl lg:text-[38px] font-semibold tracking-[-0.02em]">
            Un flux de travail construit pour la production, pas pour les fichiers.
          </h2>
        </Reveal>
        <div className="mx-auto grid max-w-280 md:grid-cols-2">
          {features.map(({ number, title, description }, index) => (
            <Reveal
              key={number}
              delay={index * 60 + (index > 0 ? 20 : 0)}
              className={cn("group border-border py-13", featureCellClasses[index])}
            >
              <div className="mb-5 font-heading text-[15px] text-muted-foreground transition-colors duration-300 group-hover:text-accent">
                {number}
              </div>
              <h3 className="mb-3 text-xl font-semibold tracking-[-0.01em] transition-colors duration-300 group-hover:text-accent">
                {title}
              </h3>
              <p className="max-w-95 text-[15px] leading-relaxed text-muted-foreground">
                {description}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="flex justify-center px-6 lg:px-16 py-24 lg:py-25">
        <Reveal className="w-full max-w-280">
          <div className="relative overflow-hidden rounded-[14px] border border-border bg-surface px-8 py-16 text-center lg:p-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(148,157,250,0.1),transparent_60%)]"
            />
            <h2 className="relative mb-3.5 text-3xl lg:text-[34px] font-semibold tracking-[-0.02em]">
              Structurez votre prochain projet.
            </h2>
            <p className="relative mb-8 text-base text-muted-foreground">
              Créez votre espace de travail et invitez vos collaborateurs.
            </p>
            <div className="relative flex justify-center">
              <Button asChild>
                <Link to="/register">Créer un compte</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-280 items-center justify-between px-6 py-8 lg:px-0">
          <div className="font-heading text-[15px] font-semibold">
            <span className="text-accent">Music</span> Workspace
          </div>
          <div className="text-[13px] text-muted-foreground">© {new Date().getFullYear()}</div>
        </div>
      </footer>
    </div>
  );
}
