import { useRef, useEffect } from "react";

export function WaveformCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetMouseX = useRef(0.5);
  const smoothMouseX = useRef(0.5);
  const isHovering = useRef(false);
  const hoverStrength = useRef(0);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const accentColor =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--accent")
        .trim() || "#949dfa";
    // Parse the accent hex once so bar opacity can be modulated per amplitude.
    const r = parseInt(accentColor.slice(1, 3), 16);
    const g = parseInt(accentColor.slice(3, 5), 16);
    const b = parseInt(accentColor.slice(5, 7), 16);

    const numBars = 96;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let time = 0;
    let animId = 0;

    function setupCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      targetMouseX.current = (e.clientX - rect.left) / rect.width;
      isHovering.current = true;
    }

    function handleMouseLeave() {
      isHovering.current = false;
    }

    function draw() {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx!.clearRect(0, 0, w, h);

      // Old animation: smooth (lerped) mouse tracking + gradual hover fade.
      smoothMouseX.current +=
        (targetMouseX.current - smoothMouseX.current) * 0.04;
      hoverStrength.current +=
        ((isHovering.current ? 1 : 0) - hoverStrength.current) * 0.025;

      const centerY = h / 2;
      const gap = w / numBars;
      const barWidth = Math.max(1.5, gap * 0.45);
      const radius = barWidth / 2;
      const maxHeight = h * 0.9;

      for (let i = 0; i < numBars; i++) {
        const x = i * gap;
        const t = i / numBars;

        // Old animation: 4 layered sines for the perpetual undulation.
        const raw =
          Math.sin(t * 9 + time * 0.8) * 0.42 +
          Math.sin(t * 17 + time * 0.5) * 0.26 +
          Math.sin(t * 5 - time * 0.6) * 0.2 +
          Math.sin(t * 28 + time * 0.35) * 0.12;

        // Old animation: gaussian bump around the cursor, faded by hoverStrength.
        const dist = Math.abs(t - smoothMouseX.current);
        const boost = Math.exp(-dist * dist * 200) * hoverStrength.current * 0.32;

        const amp = Math.min(1, Math.abs(raw) + boost);

        // New form: rounded, vertically centered symmetric bar; opacity tracks amplitude.
        const barHeight = Math.max(barWidth, amp * maxHeight);
        const y = centerY - barHeight / 2;
        ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.3 + amp * 0.6})`;
        ctx!.beginPath();
        ctx!.roundRect(x, y, barWidth, barHeight, radius);
        ctx!.fill();
      }

      time += 0.008;
      if (!reduceMotion) animId = requestAnimationFrame(draw);
    }

    setupCanvas();
    window.addEventListener("resize", setupCanvas);
    if (!reduceMotion) {
      canvas.addEventListener("mousemove", handleMouseMove);
      canvas.addEventListener("mouseleave", handleMouseLeave);
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
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="block w-full h-[110px] cursor-crosshair"
    />
  );
}
