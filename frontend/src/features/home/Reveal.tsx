import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn, prefersReducedMotion } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  /** Stagger, in ms, applied once the element enters the viewport. */
  delay?: number;
  className?: string;
};

export function Reveal({ children, delay = 0, className }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Reveal upfront when animation is unwanted or unobservable (reduced motion,
  // or no IntersectionObserver on very old engines) so nothing stays at opacity 0.
  const [shown, setShown] = useState(
    () => prefersReducedMotion() || typeof IntersectionObserver === "undefined"
  );

  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;

    let timeout = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        timeout = window.setTimeout(() => setShown(true), delay);
      },
      { threshold: 0 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [delay, shown]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none",
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        className
      )}
    >
      {children}
    </div>
  );
}
