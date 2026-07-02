import { useRef, useEffect } from "react";

export function WaveformCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetMouseX = useRef(0.5);
  const smoothMouseX = useRef(0.5);
  const isHovering = useRef(false);
  const hoverStrength = useRef(0);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const safeCtx = ctx as CanvasRenderingContext2D;

    const accentColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--accent")
        .trim() || "#E8642A";

    let time = 0;
    let animId: number;

    function setupCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      safeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      targetMouseX.current = (e.clientX - rect.left) / rect.width;
      isHovering.current = true;
    }

    function handleMouseLeave() {
      isHovering.current = false;
    }

    setupCanvas();
    window.addEventListener("resize", setupCanvas);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    function draw() {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      safeCtx.clearRect(0, 0, w, h);

      smoothMouseX.current += (targetMouseX.current - smoothMouseX.current) * 0.04;
      hoverStrength.current +=
        ((isHovering.current ? 1 : 0) - hoverStrength.current) * 0.025;

      const barWidth = 3;
      const gap = 2;
      const step = barWidth + gap;
      const numBars = Math.floor(w / step);
      const offsetX = (w - numBars * step) / 2;
      const centerY = h / 2;
      const maxAmplitude = (h / 2) * 0.88;

      safeCtx.fillStyle = accentColor;
      safeCtx.globalAlpha = 0.55;

      for (let i = 0; i < numBars; i++) {
        const x = offsetX + i * step;
        const t = i / numBars;

        const raw =
          Math.sin(t * 9 + time * 0.8) * 0.42 +
          Math.sin(t * 17 + time * 0.5) * 0.26 +
          Math.sin(t * 5 - time * 0.6) * 0.2 +
          Math.sin(t * 28 + time * 0.35) * 0.12;

        const baseHeight = Math.abs(raw) * maxAmplitude;

        const dist = Math.abs(t - smoothMouseX.current);
        const boost =
          Math.exp(-dist * dist * 200) * hoverStrength.current * maxAmplitude * 0.32;

        const barHeight = baseHeight + boost;
        const asym = 0.52 + 0.1 * Math.sin(t * 6.5 + time * 0.18);

        safeCtx.fillRect(x, centerY - barHeight * asym, barWidth, barHeight * asym);
        safeCtx.fillRect(x, centerY, barWidth, barHeight * (1 - asym));
      }

      time += 0.008;
      animId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", setupCanvas);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas ref={canvasRef} aria-hidden="true" className="w-full h-30 block" />
  );
}
