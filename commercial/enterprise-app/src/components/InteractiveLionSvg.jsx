import { useState, useEffect, useRef } from "react";

export default function InteractiveLionSvg() {
  const containerRef = useRef(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0, normX: 0, normY: 0, isHovered: false });
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      // Normalized coordinates from -1 to 1
      const normX = (e.clientX / innerWidth) * 2 - 1;
      const normY = (e.clientY / innerHeight) * 2 - 1;

      setMouse({
        x: e.clientX,
        y: e.clientY,
        normX,
        normY,
        isHovered: true,
      });
    };

    const handleMouseLeave = () => {
      setMouse((prev) => ({ ...prev, normX: 0, normY: 0, isHovered: false }));
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Subtle continuous animation pulse
  useEffect(() => {
    let animId;
    let time = 0;
    const animate = () => {
      time += 0.03;
      setPulse(Math.sin(time) * 0.5 + 0.5);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Pupil offsets: eye sockets are at (310, 320) and (490, 320) in 800x800 viewBox
  const maxEyeOffset = 14;
  const eyeOffsetX = mouse.normX * maxEyeOffset;
  const eyeOffsetY = mouse.normY * maxEyeOffset;

  // Parallax shifts for mane layers
  const maneShiftX1 = mouse.normX * 18;
  const maneShiftY1 = mouse.normY * 18;

  const maneShiftX2 = mouse.normX * -12;
  const maneShiftY2 = mouse.normY * -12;

  const maneShiftX3 = mouse.normX * 8;
  const maneShiftY3 = mouse.normY * 8;

  // Dynamic glow brightness based on hover & pulse
  const glowOpacity = mouse.isHovered ? 0.35 + pulse * 0.15 : 0.15 + pulse * 0.08;
  const eyeGlowRadius = mouse.isHovered ? 12 : 8;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none select-none overflow-hidden flex items-center justify-center"
    >
      <svg
        className="w-[750px] h-[750px] sm:w-[950px] sm:h-[950px] lg:w-[1200px] lg:h-[1200px] transition-transform duration-300 ease-out"
        style={{
          transform: `translate(${mouse.normX * 10}px, ${mouse.normY * 10}px)`,
        }}
        viewBox="0 0 800 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Vibrant cyan -> indigo -> emerald gradients */}
          <linearGradient id="lion-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>

          <linearGradient id="lion-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>

          <linearGradient id="lion-grad-3" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          <radialGradient id="lion-glow" cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity={glowOpacity} />
            <stop offset="50%" stopColor="#6366f1" stopOpacity={glowOpacity * 0.5} />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          <filter id="eye-glow-filter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="mane-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
            <feComposite in="SourceGraphic" operator="over" />
          </filter>
        </defs>

        {/* Ambient background aura reacting to cursor */}
        <circle cx="400" cy="380" r="340" fill="url(#lion-glow)" />

        {/* ── PARALLAX MANE LAYER 1 (Outer mane - shifts with cursor) ── */}
        <g
          style={{
            transform: `translate(${maneShiftX1}px, ${maneShiftY1}px)`,
            transition: "transform 0.15s ease-out",
          }}
          opacity={0.7 + pulse * 0.2}
        >
          {/* Top mane curves */}
          <path d="M 400 80 C 340 60, 260 80, 200 140 C 160 180, 130 240, 120 300" stroke="url(#lion-grad-1)" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
          <path d="M 400 80 C 460 60, 540 80, 600 140 C 640 180, 670 240, 680 300" stroke="url(#lion-grad-1)" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
          <path d="M 400 70 C 320 40, 220 70, 160 160 C 120 220, 100 300, 105 360" stroke="url(#lion-grad-2)" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
          <path d="M 400 70 C 480 40, 580 70, 640 160 C 680 220, 700 300, 695 360" stroke="url(#lion-grad-2)" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />

          {/* Flowing side mane strands */}
          <path d="M 120 300 C 95 360, 85 420, 100 480 C 115 530, 150 570, 200 590" stroke="url(#lion-grad-2)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          <path d="M 680 300 C 705 360, 715 420, 700 480 C 685 530, 650 570, 600 590" stroke="url(#lion-grad-2)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          <path d="M 105 360 C 80 430, 80 490, 110 540 C 140 580, 185 610, 240 620" stroke="url(#lion-grad-1)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <path d="M 695 360 C 720 430, 720 490, 690 540 C 660 580, 615 610, 560 620" stroke="url(#lion-grad-1)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        </g>

        {/* ── PARALLAX MANE LAYER 2 (Mid mane - shifts counter to cursor) ── */}
        <g
          style={{
            transform: `translate(${maneShiftX2}px, ${maneShiftY2}px)`,
            transition: "transform 0.15s ease-out",
          }}
          opacity={0.6 + pulse * 0.2}
        >
          <path d="M 350 90 C 280 75, 200 110, 155 190 C 130 240, 115 310, 118 370" stroke="url(#lion-grad-1)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <path d="M 450 90 C 520 75, 600 110, 645 190 C 670 240, 685 310, 682 370" stroke="url(#lion-grad-1)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <path d="M 320 100 C 250 100, 180 150, 140 230 C 115 285, 105 340, 110 400" stroke="url(#lion-grad-3)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          <path d="M 480 100 C 550 100, 620 150, 660 230 C 685 285, 695 340, 690 400" stroke="url(#lion-grad-3)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          <path d="M 200 590 C 250 620, 320 640, 400 645 C 480 640, 550 620, 600 590" stroke="url(#lion-grad-3)" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
          <path d="M 240 620 C 290 650, 350 665, 400 668 C 450 665, 510 650, 560 620" stroke="url(#lion-grad-1)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        </g>

        {/* ── PARALLAX MANE LAYER 3 (Dynamic Energy Wisps) ── */}
        <g
          style={{
            transform: `translate(${maneShiftX3}px, ${maneShiftY3}px)`,
            transition: "transform 0.1s ease-out",
          }}
        >
          <path d="M 370 85 C 300 55, 190 90, 135 200" stroke="url(#lion-grad-1)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
          <path d="M 430 85 C 500 55, 610 90, 665 200" stroke="url(#lion-grad-1)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
          <path d="M 110 420 C 90 470, 95 530, 130 570" stroke="url(#lion-grad-2)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
          <path d="M 690 420 C 710 470, 705 530, 670 570" stroke="url(#lion-grad-2)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        </g>

        {/* ── STABLE LION FACE STRUCTURE ── */}
        {/* Outer Face Outline */}
        <path
          d="M 400 140 C 310 140, 220 200, 190 290 C 165 365, 175 440, 210 510 C 245 575, 310 620, 400 625 C 490 620, 555 575, 590 510 C 625 440, 635 365, 610 290 C 580 200, 490 140, 400 140 Z"
          stroke="url(#lion-grad-1)"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.95"
        />

        {/* Inner face contour */}
        <path
          d="M 400 170 C 325 170, 250 220, 225 300 C 205 365, 210 430, 240 490 C 270 545, 325 580, 400 583 C 475 580, 530 545, 560 490 C 590 430, 595 365, 575 300 C 550 220, 475 170, 400 170 Z"
          stroke="url(#lion-grad-2)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.45"
        />

        {/* ── EARS ── */}
        {/* Left ear */}
        <path d="M 230 210 C 210 160, 230 110, 270 100 C 300 92, 320 110, 310 160 C 300 190, 270 220, 240 240" stroke="url(#lion-grad-1)" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
        <path d="M 250 190 C 245 160, 255 130, 275 120" stroke="url(#lion-grad-2)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />

        {/* Right ear */}
        <path d="M 570 210 C 590 160, 570 110, 530 100 C 500 92, 480 110, 490 160 C 500 190, 530 220, 560 240" stroke="url(#lion-grad-1)" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
        <path d="M 550 190 C 555 160, 545 130, 525 120" stroke="url(#lion-grad-2)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />

        {/* Forehead markings */}
        <path d="M 350 200 C 370 190, 400 185, 400 185 C 400 185, 430 190, 450 200" stroke="url(#lion-grad-2)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <path d="M 360 220 C 380 212, 400 210, 400 210 C 400 210, 420 212, 440 220" stroke="url(#lion-grad-2)" strokeWidth="1" strokeLinecap="round" opacity="0.3" />

        {/* Eyebrows */}
        <path d="M 260 280 C 275 260, 310 250, 350 258" stroke="url(#lion-grad-1)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
        <path d="M 540 280 C 525 260, 490 250, 450 258" stroke="url(#lion-grad-1)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />

        {/* ── MOUSE INTERACTIVE EYES (FOLLOWING CURSOR) ── */}
        {/* Left eye socket */}
        <ellipse cx="310" cy="320" rx="42" ry="28" stroke="url(#lion-grad-1)" strokeWidth="3.5" opacity="0.95" />
        <ellipse cx="310" cy="320" rx="26" ry="18" stroke="url(#lion-grad-2)" strokeWidth="1.5" opacity="0.6" />

        {/* Left eye pupil (moves dynamically with cursor!) */}
        <g style={{ transform: `translate(${eyeOffsetX}px, ${eyeOffsetY}px)`, transition: "transform 0.05s ease-out" }}>
          <ellipse cx="310" cy="320" rx="16" ry="16" fill="url(#lion-grad-1)" filter="url(#eye-glow-filter)" opacity="0.95" />
          <circle cx="310" cy="320" r="8" fill="#0f172a" />
          <circle cx="314" cy="316" r="3.5" fill="#ffffff" opacity="0.9" />
          <circle cx="307" cy="324" r="1.5" fill="#38bdf8" opacity="0.8" />
        </g>

        {/* Right eye socket */}
        <ellipse cx="490" cy="320" rx="42" ry="28" stroke="url(#lion-grad-1)" strokeWidth="3.5" opacity="0.95" />
        <ellipse cx="490" cy="320" rx="26" ry="18" stroke="url(#lion-grad-2)" strokeWidth="1.5" opacity="0.6" />

        {/* Right eye pupil (moves dynamically with cursor!) */}
        <g style={{ transform: `translate(${eyeOffsetX}px, ${eyeOffsetY}px)`, transition: "transform 0.05s ease-out" }}>
          <ellipse cx="490" cy="320" rx="16" ry="16" fill="url(#lion-grad-1)" filter="url(#eye-glow-filter)" opacity="0.95" />
          <circle cx="490" cy="320" r="8" fill="#0f172a" />
          <circle cx="494" cy="316" r="3.5" fill="#ffffff" opacity="0.9" />
          <circle cx="487" cy="324" r="1.5" fill="#38bdf8" opacity="0.8" />
        </g>

        {/* ── NOSE & BRIDGE ── */}
        <path
          d="M 380 400 C 380 385, 390 375, 400 375 C 410 375, 420 385, 420 400 C 420 415, 410 425, 400 425 C 390 425, 380 415, 380 400 Z"
          stroke="url(#lion-grad-1)"
          strokeWidth="3.5"
          fill="url(#lion-grad-2)"
          fillOpacity="0.15"
          opacity="0.95"
        />
        <path d="M 400 350 L 400 375" stroke="url(#lion-grad-2)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />

        {/* ── MUZZLE / MOUTH ── */}
        <path d="M 400 425 L 400 445" stroke="url(#lion-grad-1)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
        <path d="M 400 445 C 370 450, 340 440, 320 430" stroke="url(#lion-grad-1)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
        <path d="M 400 445 C 430 450, 460 440, 480 430" stroke="url(#lion-grad-1)" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />

        {/* Lower jaw / chin */}
        <path d="M 320 430 C 310 460, 330 500, 400 520 C 470 500, 490 460, 480 430" stroke="url(#lion-grad-2)" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <path d="M 370 520 C 380 540, 400 548, 400 548 C 400 548, 420 540, 430 520" stroke="url(#lion-grad-3)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />

        {/* ── INTERACTIVE WHISKERS & CHEEK DOTS ── */}
        <g style={{ transform: `translate(${eyeOffsetX * 0.3}px, ${eyeOffsetY * 0.3}px)` }}>
          {/* Left whisker pad */}
          <circle cx="330" cy="420" r="2.5" fill="#38bdf8" opacity="0.7" />
          <circle cx="320" cy="430" r="2.5" fill="#38bdf8" opacity="0.7" />
          <circle cx="335" cy="435" r="2.5" fill="#38bdf8" opacity="0.7" />
          <circle cx="325" cy="415" r="2.5" fill="#38bdf8" opacity="0.6" />
          {/* Left whiskers */}
          <path d="M 310 415 C 250 405, 190 400, 150 395" stroke="url(#lion-grad-2)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <path d="M 310 430 C 250 430, 190 435, 145 440" stroke="url(#lion-grad-2)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <path d="M 315 445 C 260 455, 200 468, 155 478" stroke="url(#lion-grad-2)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />

          {/* Right whisker pad */}
          <circle cx="470" cy="420" r="2.5" fill="#38bdf8" opacity="0.7" />
          <circle cx="480" cy="430" r="2.5" fill="#38bdf8" opacity="0.7" />
          <circle cx="465" cy="435" r="2.5" fill="#38bdf8" opacity="0.7" />
          <circle cx="475" cy="415" r="2.5" fill="#38bdf8" opacity="0.6" />
          {/* Right whiskers */}
          <path d="M 490 415 C 550 405, 610 400, 650 395" stroke="url(#lion-grad-2)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <path d="M 490 430 C 550 430, 610 435, 655 440" stroke="url(#lion-grad-2)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <path d="M 485 445 C 540 455, 600 468, 645 478" stroke="url(#lion-grad-2)" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        </g>

        {/* ── DYNAMIC SPARKLES ALONG MANE ── */}
        <circle cx={200 + maneShiftX1 * 1.5} cy={140 + maneShiftY1 * 1.5} r={3 + pulse * 2} fill="#38bdf8" opacity={0.6 + pulse * 0.4} />
        <circle cx={600 + maneShiftX1 * 1.5} cy={140 + maneShiftY1 * 1.5} r={3 + pulse * 2} fill="#34d399" opacity={0.6 + pulse * 0.4} />
        <circle cx={120 + maneShiftX2 * 1.5} cy={300 + maneShiftY2 * 1.5} r={4 - pulse * 1.5} fill="#818cf8" opacity={0.5 + pulse * 0.3} />
        <circle cx={680 + maneShiftX2 * 1.5} cy={300 + maneShiftY2 * 1.5} r={4 - pulse * 1.5} fill="#38bdf8" opacity={0.5 + pulse * 0.3} />
        <circle cx={400 + eyeOffsetX} cy={668 + eyeOffsetY} r={3} fill="#6366f1" opacity={0.7} />
      </svg>
    </div>
  );
}
