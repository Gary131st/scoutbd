import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

gsap.registerPlugin(ScrollTrigger);

/* ─── Stadium Canvas Scene ─────────────────────────────────────────── */
function StadiumCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    camAlt: 1.0,      // 0 = pitch level, 1 = bird's eye
    camDist: 5.5,
    camAngle: 0,
    dronePitch: 0,    // tilt from top-down to 45deg
    fogAmount: 0,
    t: 0,
  });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = window.innerWidth * devicePixelRatio;
      canvas.height = window.innerHeight * devicePixelRatio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    /* ── GSAP scroll-driven camera animation ── */
    const scrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: "#cinematic-hero",
        start: "top top",
        end: "bottom top",
        scrub: 1.4,         // lerp factor — heavy & cinematic
      },
    });

    scrollTl
      // Phase 1→2: bird's eye descent + tilt
      .to(stateRef.current, { camAlt: 0.35, camDist: 3.8, dronePitch: 0.42, duration: 3 }, 0)
      // Phase 2→3: fly forward, level out more, fog starts
      .to(stateRef.current, { camAlt: 0.08, camDist: 2.1, dronePitch: 0.72, fogAmount: 0.55, duration: 3 }, 3)
      // Phase 3→4: final land, max fog
      .to(stateRef.current, { camAlt: 0.0, camDist: 1.4, dronePitch: 0.88, fogAmount: 0.85, duration: 2 }, 6);

    /* ── Render loop ── */
    const draw = (ts: number) => {
      stateRef.current.t = ts * 0.001;
      const S = stateRef.current;
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      /* Sky / pitch background */
      const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
      bgGrad.addColorStop(0, `rgba(8,14,10,1)`);
      bgGrad.addColorStop(0.45, `rgba(10,22,14,1)`);
      bgGrad.addColorStop(1, `rgba(4,28,12,1)`);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;

      /* ── Perspective helpers ── */
      // camAlt: 1=top, 0=side. Controls vanishing point Y and horizon Y.
      const horizonY = H * (0.35 + S.camAlt * 0.28); // high horizon when top, mid when low
      const vpy = cy * (0.4 + S.camAlt * 0.9);         // vanishing pt Y

      // Project a 3D pitch point (px,pz) → screen (sx,sy)
      const project = (px: number, pz: number, elevation = 0): [number, number, number] => {
        // camera height lerps 0→8 based on camAlt
        const camH = S.camAlt * 8 + 0.18;
        const camZ = -S.camDist;
        const relZ = pz - camZ;
        if (relZ <= 0) return [-9999, -9999, 0];
        // perspective tilt: dronePitch rotates the camera down
        const pitch = S.dronePitch;
        const worldY = elevation - camH;
        const projZ = relZ * Math.cos(pitch) + worldY * Math.sin(pitch);
        const projY = relZ * Math.sin(pitch) - worldY * Math.cos(pitch);
        if (projZ <= 0.01) return [-9999, -9999, 0];
        const fov = 0.65 + S.camAlt * 0.55;
        const scale = (H * fov) / projZ;
        const sx = cx + px * scale;
        const sy = cy - projY * scale;
        return [sx, sy, scale];
      };

      /* ─── PITCH SURFACE ─── */
      // Draw a quad representing the grass field
      const pitchPts: [number, number][] = [
        [-6, -6], [6, -6], [6, 18], [-6, 18],
      ];
      const projected = pitchPts.map(([x, z]) => project(x, z));
      if (projected.every(([, , s]) => s > 0)) {
        // Dark grass stripes (alternating)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(projected[0][0], projected[0][1]);
        ctx.lineTo(projected[1][0], projected[1][1]);
        ctx.lineTo(projected[2][0], projected[2][1]);
        ctx.lineTo(projected[3][0], projected[3][1]);
        ctx.closePath();

        // Base pitch gradient
        const pitchGrad = ctx.createLinearGradient(
          projected[0][0], projected[0][1],
          projected[3][0], projected[3][1]
        );
        pitchGrad.addColorStop(0, "rgba(15,52,28,1)");
        pitchGrad.addColorStop(0.5, "rgba(20,70,36,1)");
        pitchGrad.addColorStop(1, "rgba(12,44,22,1)");
        ctx.fillStyle = pitchGrad;
        ctx.fill();
        ctx.restore();

        // Grass stripes
        for (let i = -5; i <= 16; i += 2) {
          const p0 = project(-6, i);
          const p1 = project(6, i);
          const p2 = project(6, i + 1);
          const p3 = project(-6, i + 1);
          if (p0[2] > 0 && p1[2] > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(p0[0], p0[1]);
            ctx.lineTo(p1[0], p1[1]);
            ctx.lineTo(p2[0], p2[1]);
            ctx.lineTo(p3[0], p3[1]);
            ctx.closePath();
            ctx.fillStyle = "rgba(12,60,28,0.55)";
            ctx.fill();
            ctx.restore();
          }
        }
      }

      /* ─── PITCH LINES ─── */
      const drawLine = (x1: number, z1: number, x2: number, z2: number, w = 1.5) => {
        const [sx1, sy1, s1] = project(x1, z1);
        const [sx2, sy2, s2] = project(x2, z2);
        if (s1 <= 0 || s2 <= 0) return;
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.75)";
        ctx.lineWidth = w * ((s1 + s2) / 2) * 0.006;
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();
        ctx.restore();
      };

      // Boundary
      drawLine(-5.5, -5.5, 5.5, -5.5);
      drawLine(-5.5, 17.5, 5.5, 17.5);
      drawLine(-5.5, -5.5, -5.5, 17.5);
      drawLine(5.5, -5.5, 5.5, 17.5);
      // Centre line
      drawLine(-5.5, 6, 5.5, 6, 1.2);
      // Centre circle
      const circleSegs = 64;
      for (let i = 0; i < circleSegs; i++) {
        const a1 = (i / circleSegs) * Math.PI * 2;
        const a2 = ((i + 1) / circleSegs) * Math.PI * 2;
        drawLine(Math.cos(a1) * 1.5, 6 + Math.sin(a1) * 1.5, Math.cos(a2) * 1.5, 6 + Math.sin(a2) * 1.5, 1.2);
      }
      // Centre spot
      const [csx, csy, css] = project(0, 6);
      if (css > 0) {
        ctx.beginPath();
        ctx.arc(csx, csy, 3 * css * 0.006, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fill();
      }
      // Penalty boxes
      drawLine(-2.5, -5.5, -2.5, -2.5);
      drawLine(2.5, -5.5, 2.5, -2.5);
      drawLine(-2.5, -2.5, 2.5, -2.5);
      drawLine(-2.5, 17.5, -2.5, 14.5);
      drawLine(2.5, 17.5, 2.5, 14.5);
      drawLine(-2.5, 14.5, 2.5, 14.5);
      // Goals
      drawLine(-1, -5.5, -1, -6.4, 1.2);
      drawLine(1, -5.5, 1, -6.4, 1.2);
      drawLine(-1, -6.4, 1, -6.4, 1.2);
      drawLine(-1, 17.5, -1, 18.4, 1.2);
      drawLine(1, 17.5, 1, 18.4, 1.2);
      drawLine(-1, 18.4, 1, 18.4, 1.2);

      /* ─── FLOODLIGHTS ─── */
      const lights: [number, number, number][] = [
        [-7, -7, 5],  [7, -7, 5],
        [-7, 19, 5],  [7, 19, 5],
      ];

      lights.forEach(([lx, lz, lh]) => {
        // Beam from top of pole to pitch area
        const [topX, topY, topS] = project(lx, lz, lh);
        const [baseX, baseY] = project(lx, lz);
        if (topS > 0) {
          // Pole
          ctx.save();
          ctx.strokeStyle = "rgba(180,200,190,0.6)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(baseX, baseY);
          ctx.lineTo(topX, topY);
          ctx.stroke();
          ctx.restore();

          // Light orb glow
          const grd = ctx.createRadialGradient(topX, topY, 0, topX, topY, 45);
          grd.addColorStop(0, "rgba(220,240,220,0.9)");
          grd.addColorStop(0.25, "rgba(180,230,200,0.35)");
          grd.addColorStop(1, "rgba(180,230,200,0)");
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(topX, topY, 45, 0, Math.PI * 2);
          ctx.fill();

          // Light cone to pitch
          const coneGrd = ctx.createRadialGradient(topX, topY, 0, topX, topY, 200);
          coneGrd.addColorStop(0, "rgba(200,255,220,0.08)");
          coneGrd.addColorStop(1, "rgba(200,255,220,0)");
          ctx.fillStyle = coneGrd;
          ctx.beginPath();
          ctx.arc(topX, topY, 200, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      /* ─── STADIUM STANDS ─── */
      // Draw tiered seating on all four sides as trapezoid layers
      const standSides: { pts: [number, number][]; h: number; rows: number }[] = [
        { pts: [[-8, -8], [8, -8], [5.5, -5.5], [-5.5, -5.5]], h: 0, rows: 4 }, // near
        { pts: [[-8, 20], [8, 20], [5.5, 17.5], [-5.5, 17.5]], h: 0, rows: 4 }, // far
        { pts: [[-8, -8], [-5.5, -5.5], [-5.5, 17.5], [-8, 20]], h: 0, rows: 3 }, // left
        { pts: [[8, -8], [5.5, -5.5], [5.5, 17.5], [8, 20]], h: 0, rows: 3 },  // right
      ];

      standSides.forEach(({ pts, rows }) => {
        for (let r = 0; r < rows; r++) {
          const elevation = r * 1.1;
          const shrink = r * 0.18;
          const projPts = pts.map(([x, z]) => {
            const nx = x > 0 ? x - shrink : x + shrink;
            const nz = z > 6 ? z + shrink : z - shrink;
            return project(nx, nz, elevation);
          });
          if (projPts.some(([, , s]) => s <= 0)) return;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(projPts[0][0], projPts[0][1]);
          for (let i = 1; i < projPts.length; i++) ctx.lineTo(projPts[i][0], projPts[i][1]);
          ctx.closePath();
          const alpha = 0.2 + r * 0.12;
          ctx.fillStyle = `rgba(20,35,22,${alpha})`;
          ctx.fill();
          ctx.strokeStyle = `rgba(255,255,255,0.04)`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
          ctx.restore();

          // Crowd dots on upper tiers
          if (r >= 1) {
            const density = 8;
            for (let i = 0; i < density; i++) {
              const t2 = i / density;
              const ix = pts[0][0] + (pts[1][0] - pts[0][0]) * t2;
              const iz = pts[0][1] + (pts[1][1] - pts[0][1]) * t2;
              const nx = ix > 0 ? ix - shrink : ix + shrink;
              const nz = iz > 6 ? iz + shrink : iz - shrink;
              const [dx, dy, ds] = project(nx, nz, elevation + 0.5);
              if (ds > 0 && dx > 0 && dx < W && dy > 0 && dy < H) {
                ctx.beginPath();
                ctx.arc(dx, dy, Math.max(1, ds * 0.008), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200,220,210,0.18)`;
                ctx.fill();
              }
            }
          }
        }
      });

      /* ─── PLAYERS ─── */
      const players = [
        { x: -1.2, z: 5, bobPhase: 0 },
        { x: 1.5,  z: 4, bobPhase: 1.2 },
        { x: -2,   z: 8, bobPhase: 2.4 },
        { x: 2.2,  z: 9, bobPhase: 0.7 },
        { x: 0,    z: 11, bobPhase: 3.1 },
      ];

      players.forEach(({ x, z, bobPhase }) => {
        const bob = Math.sin(S.t * 2.8 + bobPhase) * 0.04;
        const [px, py, ps] = project(x, z, bob);
        if (ps <= 0 || px < 0 || px > W || py < 0 || py > H) return;
        const sz = Math.max(2, ps * 0.025);

        // Shadow
        const [shx, shy] = project(x, z);
        ctx.beginPath();
        ctx.ellipse(shx, shy, sz * 1.2, sz * 0.35, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fill();

        // Body
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.beginPath();
        ctx.ellipse(px, py, sz * 0.55, sz * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(px, py - sz * 1.3, sz * 0.52, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // HUD box (fades in as fogAmount grows)
        if (S.fogAmount > 0.2) {
          const hudAlpha = Math.min(1, (S.fogAmount - 0.2) / 0.5);
          ctx.save();
          ctx.globalAlpha = hudAlpha;
          ctx.strokeStyle = "rgba(100,255,150,0.7)";
          ctx.lineWidth = 1;
          ctx.strokeRect(px - sz * 1.5, py - sz * 2.4, sz * 3, sz * 3.6);
          // Scanning line sweep
          const scanY = py - sz * 2.4 + (((S.t * 0.8 + bobPhase * 0.5) % 1)) * sz * 3.6;
          ctx.strokeStyle = "rgba(100,255,150,0.25)";
          ctx.beginPath();
          ctx.moveTo(px - sz * 1.5, scanY);
          ctx.lineTo(px + sz * 1.5, scanY);
          ctx.stroke();
          // Corner ticks
          const tk = sz * 0.6;
          const bx = px - sz * 1.5, by = py - sz * 2.4;
          const bw = sz * 3, bh = sz * 3.6;
          ctx.strokeStyle = "rgba(150,255,180,0.9)";
          ctx.lineWidth = 1.5;
          [[bx, by, 1, 1], [bx + bw, by, -1, 1], [bx, by + bh, 1, -1], [bx + bw, by + bh, -1, -1]].forEach(([cx2, cy2, dx, dy]) => {
            ctx.beginPath();
            ctx.moveTo(cx2, cy2 + dy * tk);
            ctx.lineTo(cx2, cy2);
            ctx.lineTo(cx2 + dx * tk, cy2);
            ctx.stroke();
          });
          ctx.restore();
        }
      });

      /* ─── FLOODLIGHT GLOW ON PITCH ─── */
      lights.forEach(([lx, lz, lh]) => {
        const [_, __, ls] = project(lx, lz, lh);
        if (ls <= 0) return;
        const [gx, gy] = project(0, 6);
        if (gy < 0) return;
        const grd = ctx.createRadialGradient(gx, gy, 0, gx, gy, H * 0.4);
        grd.addColorStop(0, "rgba(180,255,200,0.06)");
        grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);
      });

      /* ─── MIST / ATMOSPHERE ─── */
      const mistGrad = ctx.createRadialGradient(cx, H, 0, cx, H, H);
      mistGrad.addColorStop(0, `rgba(15,35,18,${0.0 + S.fogAmount * 0.65})`);
      mistGrad.addColorStop(0.7, `rgba(10,22,12,${S.fogAmount * 0.35})`);
      mistGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = mistGrad;
      ctx.fillRect(0, 0, W, H);

      /* ─── BOKEH BLUR simulation (final phase) ─── */
      if (S.fogAmount > 0.6) {
        const bokehAlpha = (S.fogAmount - 0.6) / 0.4;
        // Overlay semi-transparent charcoal to simulate depth-of-field
        ctx.fillStyle = `rgba(10,18,12,${bokehAlpha * 0.75})`;
        ctx.fillRect(0, 0, W, H);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: "block" }}
    />
  );
}

/* ─── HUD Panel ─────────────────────────────────────────────────────── */
function HudPanel({ style, children }: { style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(15px) saturate(180%)",
        WebkitBackdropFilter: "blur(15px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: "0.75rem",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function CinematicHero() {
  const { user, role } = useAuth();
  const sectionRef = useRef<HTMLDivElement>(null);

  // Scroll-driven phase text transitions
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });

  const phase1Opacity = useTransform(scrollYProgress, [0, 0.22, 0.32], [1, 1, 0]);
  const phase2Opacity = useTransform(scrollYProgress, [0.28, 0.38, 0.55, 0.62], [0, 1, 1, 0]);
  const phase3Opacity = useTransform(scrollYProgress, [0.58, 0.68, 0.82, 0.90], [0, 1, 1, 0]);
  const phase4Opacity = useTransform(scrollYProgress, [0.86, 0.94, 1], [0, 1, 1]);

  const phase1Y = useTransform(scrollYProgress, [0, 0.32], ["0%", "-12%"]);
  const phase2Y = useTransform(scrollYProgress, [0.28, 0.62], ["8%", "-8%"]);
  const phase3Y = useTransform(scrollYProgress, [0.58, 0.90], ["8%", "-8%"]);
  const phase4Y = useTransform(scrollYProgress, [0.86, 1], ["10%", "0%"]);

  // Mini HUD dots that appear in phase 2
  const hudOpacity = useTransform(scrollYProgress, [0.32, 0.45, 0.88, 0.96], [0, 1, 1, 0]);
  const scrollNudgeOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);

  return (
    <section
      id="cinematic-hero"
      ref={sectionRef}
      style={{ height: "500vh" }}
      className="relative"
    >
      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen overflow-hidden">

        {/* ── CANVAS STADIUM ── */}
        <StadiumCanvas />

        {/* ── Dark vignette edges ── */}
        <div className="absolute inset-0 pointer-events-none z-[2]" style={{
          background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(0,0,0,0.6) 100%)"
        }} />

        {/* ════ PHASE 1: Bird's Eye ════ */}
        <motion.div
          style={{ opacity: phase1Opacity, y: phase1Y }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none px-6"
        >
          <HudPanel style={{ padding: "2rem 2.5rem", textAlign: "center", maxWidth: "560px",
            WebkitMaskImage: "radial-gradient(ellipse 100% 100% at 50% 50%, black 55%, rgba(0,0,0,0.8) 75%, transparent 100%)",
            maskImage: "radial-gradient(ellipse 100% 100% at 50% 50%, black 55%, rgba(0,0,0,0.8) 75%, transparent 100%)",
          }}>
            {/* Specular line */}
            <div className="absolute top-0 left-[20%] right-[20%] h-px pointer-events-none"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)" }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center justify-center gap-2 mb-5">
                <motion.span
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  style={{ width: 7, height: 7, borderRadius: "50%", background: "hsl(var(--green))", display: "inline-block" }}
                />
                <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.22em", color: "hsl(var(--green))", textTransform: "uppercase" }}>
                  Bangladesh Sports Revolution
                </span>
              </div>
              <h1 className="font-display leading-[0.9] mb-4"
                style={{ fontSize: "clamp(2.2rem, 7vw, 5rem)", color: "rgba(255,255,255,0.97)" }}>
                THE SEARCH FOR
                <br />
                <span style={{
                  backgroundImage: "linear-gradient(135deg, hsl(var(--green)), hsl(142 80% 72%))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>EXCELLENCE.</span>
              </h1>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.95rem", fontStyle: "italic", letterSpacing: "0.02em" }}>
                Bangladesh's premier scouting network.
              </p>
            </motion.div>
          </HudPanel>

          {/* Scroll nudge */}
          <motion.div style={{ opacity: scrollNudgeOpacity }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <span style={{ fontSize: "0.6rem", letterSpacing: "0.3em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Scroll</span>
            <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 9l5 5 5-5" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ════ PHASE 2: Descending Focus ════ */}
        <motion.div
          style={{ opacity: phase2Opacity, y: phase2Y }}
          className="absolute inset-0 z-10 flex flex-col justify-center px-8 sm:px-16 pointer-events-none"
        >
          <HudPanel style={{ padding: "1.5rem 2rem", maxWidth: "420px",
            WebkitMaskImage: "radial-gradient(ellipse 110% 100% at 10% 50%, black 50%, rgba(0,0,0,0.7) 78%, transparent 100%)",
            maskImage: "radial-gradient(ellipse 110% 100% at 10% 50%, black 50%, rgba(0,0,0,0.7) 78%, transparent 100%)",
          }}>
            <div className="absolute top-0 left-[10%] right-[40%] h-px pointer-events-none"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" }} />
            <div style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.25em", color: "hsl(var(--green))", textTransform: "uppercase", marginBottom: "0.75rem" }}>
              ◆ Action Angle
            </div>
            <h2 className="font-display leading-[0.9] mb-3"
              style={{ fontSize: "clamp(1.8rem, 6vw, 4rem)", color: "rgba(255,255,255,0.97)" }}>
              EVERY MOVE
              <br />
              <span style={{ color: "hsl(var(--green))" }}>MATTERS.</span>
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.82rem", lineHeight: 1.6 }}>
              AI-powered tracking watches every training session. No talent goes unnoticed.
            </p>
          </HudPanel>

          {/* HUD floating indicators */}
          <motion.div style={{ opacity: hudOpacity }} className="absolute top-[20%] right-[8%] sm:right-[12%]">
            <HudPanel style={{ padding: "0.6rem 0.9rem" }}>
              <div style={{ fontSize: "0.6rem", color: "hsl(var(--green))", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>
                ⬤ Player Detected
              </div>
              <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.7)", marginTop: "0.2rem" }}>5 athletes tracked</div>
            </HudPanel>
          </motion.div>

          <motion.div style={{ opacity: hudOpacity }} className="absolute bottom-[22%] right-[6%] sm:right-[10%]">
            <HudPanel style={{ padding: "0.6rem 0.9rem" }}>
              <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Speed</div>
              <div style={{ fontSize: "0.9rem", color: "hsl(var(--green))", fontWeight: 800 }}>24.7 <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}>km/h</span></div>
            </HudPanel>
          </motion.div>
        </motion.div>

        {/* ════ PHASE 3: Discovery ════ */}
        <motion.div
          style={{ opacity: phase3Opacity, y: phase3Y }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 pointer-events-none"
        >
          <HudPanel style={{ padding: "2rem", textAlign: "center", maxWidth: "480px",
            WebkitMaskImage: "radial-gradient(ellipse 100% 100% at 50% 50%, black 55%, rgba(0,0,0,0.75) 78%, transparent 100%)",
            maskImage: "radial-gradient(ellipse 100% 100% at 50% 50%, black 55%, rgba(0,0,0,0.75) 78%, transparent 100%)",
          }}>
            <div className="absolute top-0 left-[15%] right-[15%] h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)" }} />
            <div style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.22em", color: "hsl(var(--green))", textTransform: "uppercase", marginBottom: "0.75rem" }}>
              ◆ Scout Interface
            </div>
            {/* Mini scout card UI */}
            <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.6rem", padding: "0.75rem", marginBottom: "1rem", background: "rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "hsl(var(--green) / 0.15)", border: "1px solid hsl(var(--green) / 0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Shield style={{ width: 14, height: 14, color: "hsl(var(--green))" }} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>Rafiqul Islam</div>
                  <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>Midfielder · Dhaka Division</div>
                </div>
                <div style={{ marginLeft: "auto", fontSize: "0.65rem", padding: "0.2rem 0.5rem", borderRadius: "9999px", background: "hsl(var(--green) / 0.12)", border: "1px solid hsl(var(--green) / 0.25)", color: "hsl(var(--green))", fontWeight: 700 }}>
                  91 ★
                </div>
              </div>
            </div>
            <h2 className="font-display leading-[0.9]"
              style={{ fontSize: "clamp(1.8rem, 5vw, 3.2rem)", color: "rgba(255,255,255,0.95)" }}>
              YOUR PROFILE.
              <br />
              <span style={{ color: "hsl(var(--green))" }}>THEIR SEARCH.</span>
            </h2>
          </HudPanel>
        </motion.div>

        {/* ════ PHASE 4: Final CTA ════ */}
        <motion.div
          style={{ opacity: phase4Opacity, y: phase4Y }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 pointer-events-none"
        >
          <div style={{ textAlign: "center", maxWidth: "640px", pointerEvents: "auto" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="font-display leading-[0.88] mb-8"
                style={{ fontSize: "clamp(2.8rem, 9vw, 7rem)", color: "rgba(255,255,255,0.97)" }}>
                CONNECTING
                <br />
                <span style={{
                  backgroundImage: "linear-gradient(135deg, hsl(var(--green)), hsl(142 80% 72%))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                }}>TALENT</span>
                <br />
                TO TRIUMPH.
              </h2>

              {/* CTA Buttons */}
              <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                {user && role ? (
                  <Link to={role === "admin" ? "/admin" : role === "scout" ? "/scout" : "/player"}>
                    <button style={{
                      background: "hsl(var(--green))",
                      color: "#fff",
                      border: "none",
                      borderRadius: "9999px",
                      padding: "0.875rem 2.5rem",
                      fontSize: "0.9rem",
                      fontWeight: 800,
                      letterSpacing: "0.05em",
                      cursor: "pointer",
                      boxShadow: "0 0 32px hsl(var(--green) / 0.45), 0 4px 16px rgba(0,0,0,0.3)",
                      display: "flex", alignItems: "center", gap: "0.5rem",
                    }}>
                      Go to Dashboard <ArrowRight style={{ width: 16, height: 16 }} />
                    </button>
                  </Link>
                ) : (
                  <>
                    <Link to="/auth">
                      <button style={{
                        background: "hsl(var(--green))",
                        color: "#fff",
                        border: "none",
                        borderRadius: "9999px",
                        padding: "0.875rem 2.5rem",
                        fontSize: "0.9rem",
                        fontWeight: 800,
                        letterSpacing: "0.05em",
                        cursor: "pointer",
                        boxShadow: "0 0 32px hsl(var(--green) / 0.45), 0 4px 16px rgba(0,0,0,0.3)",
                        display: "flex", alignItems: "center", gap: "0.5rem",
                        transition: "transform 0.2s, box-shadow 0.2s",
                      }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.04)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
                      >
                        Join as Player <ArrowRight style={{ width: 16, height: 16 }} />
                      </button>
                    </Link>
                    <Link to="/auth?role=scout">
                      <button style={{
                        background: "rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.9)",
                        border: "1px solid rgba(255,255,255,0.25)",
                        borderRadius: "9999px",
                        padding: "0.875rem 2.5rem",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        cursor: "pointer",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        transition: "background 0.2s, border-color 0.2s",
                      }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.14)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"; }}
                      >
                        I'm a Scout
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
