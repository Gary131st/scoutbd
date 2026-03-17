import React, { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";

/* ── Skill bar ── */
function SkillBar({ label, value, delay = 0 }: { label: string; value: number; delay?: number }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-[11px] mb-1">
        <span style={{ color: "rgba(255,255,255,0.6)" }}>{label}</span>
        <span className="font-bold" style={{ color: "hsl(var(--green))" }}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, hsl(var(--green)), hsl(142 90% 55%))" }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

/* ── Sport emoji orb ── */
function SportOrb({ emoji, size = 80 }: { emoji: string; size?: number }) {
  return (
    <motion.div
      animate={{ y: [0, -14, 0], rotate: [-2, 2, -2] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.2)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)",
        fontSize: size * 0.42,
      }}
    >
      {emoji}
    </motion.div>
  );
}

/* ── Glass scene card ── */
function SceneCard({ children, opacity, y, scale }: {
  children: React.ReactNode;
  opacity: any; y: any; scale: any;
}) {
  return (
    <motion.div
      style={{ opacity, y, scale, position: "absolute", inset: 0 }}
      className="flex items-center justify-center"
    >
      {children}
    </motion.div>
  );
}

export default function ScrollytellingHero({
  user,
  role,
}: {
  user: any;
  role: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Scene 1: Intro (0–25%)
  const introOpacity = useTransform(scrollYProgress, [0, 0.18, 0.25], [1, 1, 0]);
  const introY       = useTransform(scrollYProgress, [0, 0.25], ["0%", "-8%"]);
  const introScale   = useTransform(scrollYProgress, [0, 0.25], [1, 0.94]);

  // Scene 2: Football (25–50%)
  const footballOpacity = useTransform(scrollYProgress, [0.22, 0.28, 0.45, 0.52], [0, 1, 1, 0]);
  const footballY       = useTransform(scrollYProgress, [0.22, 0.28, 0.45, 0.52], ["6%", "0%", "0%", "-6%"]);
  const footballScale   = useTransform(scrollYProgress, [0.22, 0.28, 0.45, 0.52], [0.94, 1, 1, 0.94]);

  // Scene 3: Cricket (50–75%)
  const cricketOpacity = useTransform(scrollYProgress, [0.47, 0.53, 0.7, 0.77], [0, 1, 1, 0]);
  const cricketY       = useTransform(scrollYProgress, [0.47, 0.53, 0.7, 0.77], ["6%", "0%", "0%", "-6%"]);
  const cricketScale   = useTransform(scrollYProgress, [0.47, 0.53, 0.7, 0.77], [0.94, 1, 1, 0.94]);

  // Scene 4: Basketball (75–100%)
  const basketballOpacity = useTransform(scrollYProgress, [0.72, 0.78, 1], [0, 1, 1]);
  const basketballY       = useTransform(scrollYProgress, [0.72, 0.78], ["6%", "0%"]);
  const basketballScale   = useTransform(scrollYProgress, [0.72, 0.78], [0.94, 1]);

  // Background gradient shifts between scenes
  const bgGradient = useTransform(
    scrollYProgress,
    [0, 0.25, 0.5, 0.75, 1],
    [
      "radial-gradient(ellipse 80% 80% at 50% 50%, hsl(220 80% 12%) 0%, hsl(220 60% 4%) 100%)",
      "radial-gradient(ellipse 80% 80% at 50% 50%, hsl(142 60% 8%) 0%, hsl(142 40% 3%) 100%)",
      "radial-gradient(ellipse 80% 80% at 50% 50%, hsl(38 80% 10%) 0%, hsl(38 60% 3%) 100%)",
      "radial-gradient(ellipse 80% 80% at 50% 50%, hsl(260 60% 10%) 0%, hsl(260 40% 3%) 100%)",
      "radial-gradient(ellipse 80% 80% at 50% 50%, hsl(260 60% 10%) 0%, hsl(260 40% 3%) 100%)",
    ]
  );

  return (
    /* Tall container = scroll distance for the pinned viewport */
    <div ref={containerRef} style={{ height: "400vh" }} className="relative">

      {/* Sticky viewport */}
      <div className="sticky top-0 h-screen overflow-hidden">

        {/* Animated background */}
        <motion.div className="absolute inset-0" style={{ background: bgGradient }} />

        {/* Noise texture overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

        {/* Scenes container */}
        <div className="absolute inset-0">

          {/* ── SCENE 1: Intro ── */}
          <SceneCard opacity={introOpacity} y={introY} scale={introScale}>
            <div className="container flex flex-col items-center text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 mb-8"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="w-2 h-2 rounded-full"
                  style={{ background: "hsl(var(--green))" }}
                />
                <span className="text-xs font-bold tracking-[0.18em] uppercase" style={{ color: "hsl(var(--green))" }}>
                  Bangladesh Sports Revolution
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="font-display leading-[0.88] mb-6"
                style={{ fontSize: "clamp(3.5rem, 12vw, 9rem)", color: "rgba(255,255,255,0.95)" }}
              >
                YOUR TALENT
                <br />
                <span style={{
                  backgroundImage: "linear-gradient(135deg, hsl(var(--green)), hsl(142 90% 65%))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  DESERVES
                </span>
                <br />
                A STAGE
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="text-base sm:text-xl max-w-xl leading-relaxed mb-10"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                Scroll to experience the journey from unknown to professional athlete across three core sports.
              </motion.p>

              {/* Scroll nudge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="flex flex-col items-center gap-2"
              >
                <span className="text-[10px] tracking-[0.25em] uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>Scroll</span>
                <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>
                  <ChevronDown className="h-5 w-5" style={{ color: "rgba(255,255,255,0.25)" }} />
                </motion.div>
              </motion.div>
            </div>
          </SceneCard>

          {/* ── SCENE 2: Football ── */}
          <SceneCard opacity={footballOpacity} y={footballY} scale={footballScale}>
            <div className="container flex flex-col sm:flex-row items-center justify-between gap-12 px-6">
              {/* Text */}
              <div className="flex-1 max-w-lg">
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-6"
                  style={{ background: "hsl(var(--green) / 0.15)", border: "1px solid hsl(var(--green) / 0.3)" }}>
                  <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "hsl(var(--green))" }}>Sport 01</span>
                </div>
                <h2 className="font-display leading-[0.88] mb-5"
                  style={{ fontSize: "clamp(3rem, 10vw, 7rem)", color: "rgba(255,255,255,0.95)" }}>
                  FOOT<br />BALL
                </h2>
                <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Showcase your dribbling, vision, and speed. Our platform connects grassroots football players directly with division clubs.
                </p>
                <div className="max-w-xs">
                  {[["Speed", 88], ["Dribbling", 76], ["Vision", 91]].map(([skill, val], j) => (
                    <SkillBar key={skill as string} label={skill as string} value={val as number} delay={j * 0.15} />
                  ))}
                </div>
              </div>

              {/* Orb */}
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ background: "radial-gradient(circle, hsl(var(--green) / 0.25) 0%, transparent 70%)", transform: "scale(2)" }} />
                  <SportOrb emoji="⚽" size={140} />
                </div>
              </div>
            </div>
          </SceneCard>

          {/* ── SCENE 3: Cricket ── */}
          <SceneCard opacity={cricketOpacity} y={cricketY} scale={cricketScale}>
            <div className="container flex flex-col sm:flex-row-reverse items-center justify-between gap-12 px-6">
              {/* Text */}
              <div className="flex-1 max-w-lg">
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-6"
                  style={{ background: "hsl(38 90% 55% / 0.15)", border: "1px solid hsl(38 90% 55% / 0.3)" }}>
                  <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "hsl(38 90% 65%)" }}>Sport 02</span>
                </div>
                <h2 className="font-display leading-[0.88] mb-5"
                  style={{ fontSize: "clamp(3rem, 10vw, 7rem)", color: "rgba(255,255,255,0.95)" }}>
                  CRIC<br />KET
                </h2>
                <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Pace, spin, or power hitting. We bring your 3-minute highlight reels to verified domestic cricket scouts.
                </p>
                <div className="max-w-xs">
                  {[["Batting", 92], ["Bowling Pace", 85], ["Fielding", 88]].map(([skill, val], j) => (
                    <SkillBar key={skill as string} label={skill as string} value={val as number} delay={j * 0.15} />
                  ))}
                </div>
              </div>

              {/* Orb */}
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ background: "radial-gradient(circle, hsl(38 90% 55% / 0.2) 0%, transparent 70%)", transform: "scale(2)" }} />
                  <SportOrb emoji="🏏" size={140} />
                </div>
              </div>
            </div>
          </SceneCard>

          {/* ── SCENE 4: Basketball ── */}
          <SceneCard opacity={basketballOpacity} y={basketballY} scale={basketballScale}>
            <div className="container flex flex-col sm:flex-row items-center justify-between gap-12 px-6">
              {/* Text */}
              <div className="flex-1 max-w-lg">
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-6"
                  style={{ background: "hsl(260 80% 65% / 0.15)", border: "1px solid hsl(260 80% 65% / 0.3)" }}>
                  <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "hsl(260 80% 75%)" }}>Sport 03</span>
                </div>
                <h2 className="font-display leading-[0.88] mb-5"
                  style={{ fontSize: "clamp(3rem, 10vw, 7rem)", color: "rgba(255,255,255,0.95)" }}>
                  BASKET<br />BALL
                </h2>
                <p className="text-base leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Show your hops, shooting form, and defense. Stand out and secure your spot on the court.
                </p>

                <div className="flex flex-col xs:flex-row gap-3 mt-8">
                  {user && role ? (
                    <Link to={role === "admin" ? "/admin" : role === "scout" ? "/scout" : "/player"}>
                      <Button size="lg" className="font-bold text-base px-8 animate-pulse-glow"
                        style={{ background: "hsl(var(--green))", color: "#fff" }}>
                        Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link to="/auth">
                        <Button size="lg" className="font-bold text-base px-8 animate-pulse-glow"
                          style={{ background: "hsl(var(--green))", color: "#fff" }}>
                          Upload Highlights — ৳100 <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </Link>
                      <Link to="/auth?role=scout">
                        <Button size="lg" variant="ghost" className="font-semibold text-base px-8"
                          style={{ color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}>
                          I'm a Scout
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Orb */}
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ background: "radial-gradient(circle, hsl(260 80% 65% / 0.2) 0%, transparent 70%)", transform: "scale(2)" }} />
                  <SportOrb emoji="🏀" size={140} />
                </div>
              </div>
            </div>
          </SceneCard>
        </div>

        {/* Scene progress indicator */}
        <ProgressDots scrollYProgress={scrollYProgress} />
      </div>
    </div>
  );
}
