import { useEffect, useRef } from "react";

const InteractiveBackground = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: null, y: null, vx: 0, vy: 0 });
  const particlesRef = useRef([]);
  const animationRef = useRef(null);
  const hueRef = useRef(220);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let width, height;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const config = {
      particleCount: 90,
      particleRadius: 2.8,
      lineDist: 140,
      mouseRadius: 180,
      mouseLineWeight: 2.5,
      baseSpeed: 0.65,
      hueBase: 215,
      hueSpread: 50,
      reduceMotion: prefersReduced,
    };

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    };
    resize();
    window.addEventListener("resize", resize);

    const init = () => {
      particlesRef.current = [];
      for (let i = 0; i < config.particleCount; i++) {
        const r = config.particleRadius + Math.random() * 0.8;
        particlesRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * config.baseSpeed,
          vy: (Math.random() - 0.5) * config.baseSpeed,
          r,
          hue: config.hueBase + (Math.random() - 0.5) * config.hueSpread,
        });
      }
    };
    init();

    const drawLine = (x1, y1, x2, y2, weight, hue, opacity) => {
      ctx.strokeStyle = `hsla(${hue}, 95%, 75%, ${opacity})`;
      ctx.lineWidth = weight;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo(
        x1 + (x2 - x1) * 0.1,
        y1 + (y2 - y1) * 0.1,
        x1 + (x2 - x1) * 0.9,
        y1 + (y2 - y1) * 0.9,
        x2,
        y2
      );
      ctx.stroke();
    };

    const animate = () => {
      if (config.reduceMotion) return;

      ctx.fillStyle = "rgba(15, 23, 42, 0.15)";
      ctx.fillRect(0, 0, width, height);

      const particles = particlesRef.current;
      const m = mouseRef.current;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 95%, 78%, 0.85)`;
        ctx.fill();

        if (m.x !== null && m.y !== null) {
          const dx = p.x - m.x;
          const dy = p.y - m.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < config.mouseRadius) {
            const strength = Math.max(0, p.r * 1.2);
            const ax = (dx / dist) * strength;
            const ay = (dy / dist) * strength;
            p.vx += ax;
            p.vy += ay;

            const opacity = (1 - dist / config.mouseRadius) * 0.8;
            drawLine(p.x, p.y, m.x, m.y, config.mouseLineWeight * (1 - dist / config.mouseRadius) * 1.5, p.hue, opacity);
          }
        }

        p.vx *= 0.98;
        p.vy *= 0.98;
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < config.lineDist) {
            const opacity = (1 - dist / config.lineDist) * 0.5;
            drawLine(p1.x, p1.y, p2.x, p2.y, 0.8, (p1.hue + p2.hue) / 2, opacity);
          }
        }
      }

      hueRef.current = (hueRef.current + 0.03) % 360;
      animationRef.current = requestAnimationFrame(animate);
    };

    const onMove = (e) => {
      const m = mouseRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const prevX = m.x ?? x;
      const prevY = m.y ?? y;
      m.vx = (x - prevX) * 0.18;
      m.vy = (y - prevY) * 0.18;
      m.x = x;
      m.y = y;
    };

    const onLeave = () => {
      const m = mouseRef.current;
      m.x = null;
      m.y = null;
      m.vx = 0;
      m.vy = 0;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    if (!config.reduceMotion) {
      animate();
    }

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ background: "radial-gradient(ellipse at top, #0f172a 0%, #020617 70%)" }}
      aria-hidden="true"
    />
  );
};

export default InteractiveBackground;
