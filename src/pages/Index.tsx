import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight, Users, Shield, Trophy, Twitter, Facebook,
  Instagram, Youtube, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import BangladeshMapTestimonials from "@/components/BangladeshMapTestimonials";
import MarqueeTicker from "@/components/MarqueeTicker";
import VideoHighlights from "@/components/VideoHighlights";
import CinematicHero from "@/components/CinematicHero";

const socialLinks = [
  { Icon: Facebook,  label: "Facebook",    href: "https://facebook.com/scoutbd",  color: "hover:text-blue-500" },
  { Icon: Twitter,   label: "Twitter / X", href: "https://twitter.com/scoutbd",   color: "hover:text-sky-500" },
  { Icon: Instagram, label: "Instagram",   href: "https://instagram.com/scoutbd", color: "hover:text-pink-500" },
  { Icon: Youtube,   label: "YouTube",     href: "https://youtube.com/@scoutbd",  color: "hover:text-red-500" },
];

type ScoutProfile = {
  user_id: string;
  full_name: string;
  organization: string | null;
  avatar_url: string | null;
};

/* ── Animated counter ── */
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const prog = Math.min((ts - start) / 1800, 1);
      const eased = 1 - Math.pow(1 - prog, 3);
      setCount(Math.floor(eased * target));
      if (prog < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ── Scroll-reveal ── */
function Reveal({ children, delay = 0, className = "", direction = "up" }: {
  children: React.ReactNode; delay?: number; className?: string; direction?: "up" | "left" | "right";
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-8% 0px" });
  const initial = direction === "left" ? { opacity: 0, x: -50 } : direction === "right" ? { opacity: 0, x: 50 } : { opacity: 0, y: 50 };
  return (
    <motion.div ref={ref} initial={initial} animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

/* ── Glass card used throughout page ── */
function GlassCard({ children, className = "", style = {} }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.15)",
        ...style,
      }}
    >
      {/* specular top edge */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)" }} />
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════
   SCROLL TRANSITION — sport blobs dissolve in
════════════════════════════════════════════ */
function ScrollTransition() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const blobs = [
    { cx: "20%", cy: "40%", r: 180, color: "hsl(142 76% 46% / 0.18)", delay: 0 },
    { cx: "70%", cy: "60%", r: 220, color: "hsl(142 76% 36% / 0.12)", delay: 0.15 },
    { cx: "50%", cy: "20%", r: 140, color: "hsl(142 76% 56% / 0.10)", delay: 0.08 },
  ];

  return (
    <div ref={ref} className="relative overflow-hidden" style={{ height: "180px", marginTop: "-1px" }}>
      {/* Background fade from hero to page */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(to bottom, transparent 0%, hsl(var(--background)) 100%)"
      }} />
      {/* Animated sport icon particles rising up */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {["⚽", "🏏", "🏀", "🎾", "🏸"].map((emoji, i) => (
          <motion.span
            key={emoji}
            className="absolute text-2xl select-none"
            initial={{ opacity: 0, y: 60, scale: 0.5 }}
            whileInView={{ opacity: [0, 0.7, 0] as any, y: -20, scale: [0.5, 1, 0.8] as any }}
            viewport={{ once: false, margin: "-20px" }}
            transition={{ duration: 2.2, delay: i * 0.18, ease: "easeOut", repeat: Infinity, repeatDelay: 3 }}
            style={{
              left: `${15 + i * 17}%`,
              filter: "drop-shadow(0 0 8px hsl(142 76% 46% / 0.6))",
            }}
          >
            {emoji}
          </motion.span>
        ))}
      </div>
      {/* Glowing line */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2"
        initial={{ scaleX: 0, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: "60%",
          height: "1px",
          background: "linear-gradient(90deg, transparent, hsl(var(--green)), transparent)",
        }}
      />
    </div>
  );
}

/* ════════════════════════════════════════════
   PAGE
════════════════════════════════════════════ */
const Index = () => {
  const [verifiedScouts, setVerifiedScouts] = useState<ScoutProfile[]>([]);

  useEffect(() => {
    const fetchScouts = async () => {
      const { data: scoutData } = await supabase.from("scout_profiles").select("user_id, organization").eq("verification_status", "active").limit(12);
      if (!scoutData?.length) return;
      const userIds = scoutData.map((s) => s.user_id);
      const { data: profileData } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds);
      const map = Object.fromEntries((profileData ?? []).map((p) => [p.user_id, p]));
      setVerifiedScouts(scoutData.map((s) => ({
        user_id: s.user_id, organization: s.organization,
        full_name: map[s.user_id]?.full_name ?? "Scout",
        avatar_url: map[s.user_id]?.avatar_url ?? null,
      })));
    };
    fetchScouts();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">

      {/* ══════════════════════════════════════════
          CINEMATIC HERO — GSAP scroll-driven stadium
      ══════════════════════════════════════════ */}
      <CinematicHero />

      {/* ══════════════════════════════════════════
          MARQUEE
      ══════════════════════════════════════════ */}
      <MarqueeTicker />

      {/* ══════════════════════════════════════════
          LIVE STATS BAR
      ══════════════════════════════════════════ */}
      <section className="py-16 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 60% 80% at 50% 50%, hsl(var(--green) / 0.06) 0%, transparent 70%)"
        }} />
        <div className="container">
          <div className="grid grid-cols-3 gap-4 sm:gap-8">
            {[
              { label: "Players Registered", target: 2500, suffix: "+", Icon: Users },
              { label: "Verified Scouts",    target: 120,  suffix: "+", Icon: Shield },
              { label: "Talent Discovered",  target: 340,  suffix: "+", Icon: Trophy },
            ].map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.12} className="text-center group">
                <div className="relative p-6 rounded-2xl border transition-all duration-300"
                  style={{
                    background: "hsl(var(--card))",
                    borderColor: "hsl(var(--border))",
                    backdropFilter: "blur(12px)",
                  }}>
                  <div className="absolute top-0 inset-x-0 h-px rounded-t-2xl" style={{
                    background: "linear-gradient(90deg, transparent, hsl(var(--green) / 0.3), transparent)"
                  }} />
                  <div className="flex justify-center mb-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                      style={{ background: "hsl(var(--green) / 0.1)" }}>
                      <stat.Icon className="h-5 w-5" style={{ color: "hsl(var(--green))" }} />
                    </div>
                  </div>
                  <div className="font-display text-4xl sm:text-5xl mb-1" style={{ color: "hsl(var(--green))" }}>
                    <Counter target={stat.target} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 group-hover:w-3/4 transition-all duration-500 rounded-full"
                    style={{ background: "hsl(var(--green))" }} />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS — 3 STEPS
      ══════════════════════════════════════════ */}
      <section className="py-20 sm:py-32 border-t border-border overflow-hidden relative">
        <div className="hidden sm:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, hsl(var(--green) / 0.15) 20%, hsl(var(--green) / 0.15) 80%, transparent)" }} />

        <div className="container">
          <Reveal className="text-center mb-16 sm:mb-24">
            <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase mb-4 px-4 py-1.5 rounded-full"
              style={{ background: "hsl(var(--green) / 0.1)", color: "hsl(var(--green))", border: "1px solid hsl(var(--green) / 0.2)" }}>
              The Platform
            </span>
            <h2 className="font-display text-4xl sm:text-6xl text-foreground">HOW IT <span style={{ color: "hsl(var(--green))" }}>WORKS</span></h2>
            <p className="text-muted-foreground mt-3 max-w-md mx-auto text-sm sm:text-base">Three simple steps from unknown talent to scouted athlete</p>
          </Reveal>

          <div className="space-y-24 sm:space-y-36">

            {/* Step 1 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-12">
              <Reveal direction="left" className="flex-1 max-w-lg">
                <div className="flex items-center gap-3 mb-5">
                  <span className="font-display text-7xl sm:text-8xl leading-none" style={{ color: "hsl(var(--green) / 0.15)" }}>01</span>
                  <div className="h-px flex-1" style={{ background: "hsl(var(--green) / 0.18)" }} />
                  <span className="text-xs font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full"
                    style={{ background: "hsl(var(--green) / 0.1)", color: "hsl(var(--green))", border: "1px solid hsl(var(--green) / 0.2)" }}>Create Profile</span>
                </div>
                <h3 className="font-display text-4xl sm:text-5xl text-foreground mb-4">YOUR STORY<br />STARTS HERE</h3>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">Sign up as a Player, add your details, select your sport — Football, Cricket, Basketball. Your profile becomes your digital identity, visible to scouts across Bangladesh.</p>
                <div className="mt-6 flex gap-3 flex-wrap">
                  {["Football", "Cricket", "Basketball"].map((s) => (
                    <span key={s} className="text-xs px-3 py-1 rounded-full font-semibold"
                      style={{ border: "1px solid hsl(var(--green) / 0.3)", color: "hsl(var(--green))", background: "hsl(var(--green) / 0.06)" }}>{s}</span>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={0.2} direction="right" className="flex-1 max-w-sm w-full">
                <motion.div whileHover={{ y: -6, rotateY: 3 }} transition={{ type: "spring", stiffness: 200 }}
                  className="relative rounded-2xl p-6 overflow-hidden"
                  style={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                  }}>
                  <div className="absolute top-0 inset-x-0 h-0.5 rounded-t-2xl" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--green) / 0.5), transparent)" }} />
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center font-display text-2xl"
                      style={{ borderColor: "hsl(var(--green) / 0.35)", background: "hsl(var(--green) / 0.08)", color: "hsl(var(--green))" }}>R</div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">Rafiqul Islam</div>
                      <div className="text-xs text-muted-foreground">Midfielder · Football · Dhaka</div>
                    </div>
                    <div className="ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{ border: "1px solid hsl(var(--green) / 0.3)", color: "hsl(var(--green))", background: "hsl(var(--green) / 0.08)" }}>
                      <Shield className="h-2.5 w-2.5" /> Live
                    </div>
                  </div>
                  {["Speed", "Dribbling", "Vision", "Positioning"].map((skill, j) => (
                    <div key={skill} className="mb-3">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-muted-foreground">{skill}</span>
                        <span className="font-bold" style={{ color: "hsl(var(--green))" }}>{[88, 76, 91, 82][j]}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--foreground) / 0.07)" }}>
                        <motion.div className="h-full rounded-full"
                          style={{ background: "linear-gradient(90deg, hsl(var(--green)), hsl(142 76% 32%))" }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${[88, 76, 91, 82][j]}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: j * 0.1 }} />
                      </div>
                    </div>
                  ))}
                </motion.div>
              </Reveal>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col sm:flex-row-reverse items-center justify-between gap-12">
              <Reveal direction="right" className="flex-1 max-w-lg">
                <div className="flex items-center gap-3 mb-5">
                  <span className="font-display text-7xl sm:text-8xl leading-none" style={{ color: "hsl(var(--green) / 0.15)" }}>02</span>
                  <div className="h-px flex-1" style={{ background: "hsl(var(--green) / 0.18)" }} />
                  <span className="text-xs font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full"
                    style={{ background: "hsl(var(--green) / 0.1)", color: "hsl(var(--green))", border: "1px solid hsl(var(--green) / 0.2)" }}>Upload Highlights</span>
                </div>
                <h3 className="font-display text-4xl sm:text-5xl text-foreground mb-4">LET YOUR GAME<br />SPEAK</h3>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">Record a 3-minute highlight video. Tag your position and traits. Pay ৳100 via bKash. Your reel goes live to hundreds of verified scouts instantly.</p>
                <div className="mt-6 p-4 rounded-xl flex items-center gap-4"
                  style={{ border: "1px solid hsl(var(--green) / 0.18)", background: "hsl(var(--green) / 0.05)" }}>
                  <Zap className="h-7 w-7 flex-shrink-0" style={{ color: "hsl(var(--green))" }} />
                  <div>
                    <div className="text-sm font-bold text-foreground">Only ৳100</div>
                    <div className="text-xs text-muted-foreground">One-time payment via bKash · Instantly live</div>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={0.2} direction="left" className="flex-1 max-w-sm w-full">
                <VideoHighlights />
              </Reveal>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-12">
              <Reveal direction="left" className="flex-1 max-w-lg">
                <div className="flex items-center gap-3 mb-5">
                  <span className="font-display text-7xl sm:text-8xl leading-none" style={{ color: "hsl(var(--green) / 0.15)" }}>03</span>
                  <div className="h-px flex-1" style={{ background: "hsl(var(--green) / 0.18)" }} />
                  <span className="text-xs font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full"
                    style={{ background: "hsl(var(--green) / 0.1)", color: "hsl(var(--green))", border: "1px solid hsl(var(--green) / 0.2)" }}>Get Discovered</span>
                </div>
                <h3 className="font-display text-4xl sm:text-5xl text-foreground mb-4">SCOUTS<br />FIND YOU</h3>
                <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">Verified scouts browse your profile, shortlist you, and reach out through our safe admin-mediated channel. No direct contact. No corruption. Pure merit.</p>
              </Reveal>

              <Reveal delay={0.2} direction="right" className="flex-1 max-w-sm w-full">
                <motion.div whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 200 }}
                  className="relative rounded-2xl p-5 overflow-hidden"
                  style={{
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                    backdropFilter: "blur(12px)",
                  }}>
                  <div className="absolute top-0 inset-x-0 h-0.5 rounded-t-2xl" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--green) / 0.5), transparent)" }} />
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-4 w-4" style={{ color: "hsl(var(--green))" }} />
                    <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "hsl(var(--green))" }}>Scout Dashboard</span>
                  </div>
                  {[
                    { name: "Rafiqul Islam", pos: "Midfielder",  score: 91 },
                    { name: "Nusrat Jahan",  pos: "Forward",     score: 87 },
                    { name: "Tanjim Ahmed",  pos: "All-rounder", score: 84 },
                  ].map((p, j) => (
                    <motion.div key={p.name}
                      initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }} transition={{ delay: j * 0.15 }}
                      className="flex items-center gap-3 p-3 rounded-xl border mb-2 last:mb-0"
                      style={{ borderColor: "hsl(var(--foreground) / 0.06)", background: "hsl(var(--foreground) / 0.02)" }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-display text-sm border"
                        style={{ borderColor: "hsl(var(--green) / 0.25)", background: "hsl(var(--green) / 0.06)", color: "hsl(var(--green))" }}>
                        {p.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate">{p.name}</div>
                        <div className="text-[10px] text-muted-foreground">{p.pos}</div>
                      </div>
                      <div className="text-sm font-bold" style={{ color: "hsl(var(--green))" }}>{p.score}</div>
                      <div className="text-[9px] px-2 py-1 rounded-full font-semibold"
                        style={{ background: "hsl(var(--green) / 0.1)", color: "hsl(var(--green))" }}>★ Top</div>
                    </motion.div>
                  ))}
                </motion.div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          MARQUEE #2
      ══════════════════════════════════════════ */}
      <MarqueeTicker />

      {/* ══════════════════════════════════════════
          MAP SECTION
      ══════════════════════════════════════════ */}
      <BangladeshMapTestimonials />

      {/* ══════════════════════════════════════════
          VERIFIED SCOUTS
      ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 border-t border-border">
        <div className="container">
          <Reveal className="text-center mb-12">
            <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase mb-4 px-4 py-1.5 rounded-full"
              style={{ background: "hsl(var(--green) / 0.1)", color: "hsl(var(--green))", border: "1px solid hsl(var(--green) / 0.2)" }}>Our Network</span>
            <h2 className="font-display text-3xl sm:text-5xl text-foreground">
              VERIFIED <span style={{ color: "hsl(var(--green))" }}>SCOUTS</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto mt-2">
              These professionals are actively discovering talent across Bangladesh
            </p>
          </Reveal>

          {verifiedScouts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {verifiedScouts.map((scout, i) => (
                <Reveal key={scout.user_id} delay={i * 0.07}>
                  <motion.div whileHover={{ y: -5, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}
                    className="group rounded-2xl p-5 flex flex-col items-center text-center gap-3 transition-all duration-300"
                    style={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      backdropFilter: "blur(8px)",
                    }}>
                    <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center overflow-hidden"
                      style={{ borderColor: "hsl(var(--green) / 0.2)", background: "hsl(var(--green) / 0.06)" }}>
                      {scout.avatar_url ? (
                        <img src={scout.avatar_url} alt={scout.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-display text-2xl" style={{ color: "hsl(var(--green))" }}>
                          {scout.full_name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-tight">{scout.full_name}</p>
                      {scout.organization && <p className="text-xs text-muted-foreground mt-0.5">{scout.organization}</p>}
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                      style={{ border: "1px solid hsl(var(--green) / 0.2)", color: "hsl(var(--green))", background: "hsl(var(--green) / 0.07)" }}>
                      <Shield className="h-3 w-3" /> Verified
                    </div>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm py-12">No verified scouts listed yet.</p>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA
      ══════════════════════════════════════════ */}
      <section className="py-24 sm:py-36 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 50%, hsl(var(--green) / 0.06) 0%, transparent 70%)"
        }} />
        <div className="absolute inset-x-0 top-0 h-px accent-line" />
        <div className="absolute inset-x-0 bottom-0 h-px accent-line" />
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: "linear-gradient(hsl(var(--green)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--green)) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="container relative z-10 text-center">
          <Reveal>
            <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 3.5, repeat: Infinity }}>
              <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase mb-6 px-4 py-1.5 rounded-full"
                style={{ background: "hsl(var(--green) / 0.1)", color: "hsl(var(--green))", border: "1px solid hsl(var(--green) / 0.2)" }}>Ready to Shine</span>
            </motion.div>
            <h2 className="font-display text-5xl sm:text-7xl lg:text-9xl text-foreground mb-6 leading-none">
              YOUR MOMENT<br />
              <span style={{ color: "hsl(var(--green))" }}>STARTS NOW</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-10 text-base sm:text-lg">
              Join thousands of players who have already uploaded their highlights. Scouts are watching.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="font-bold text-lg px-12 py-6 animate-pulse-glow"
                  style={{ background: "hsl(var(--green))", color: "#fff", boxShadow: "0 4px 32px hsl(var(--green) / 0.35)" }}>
                  Join Scout BD Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/mission">
                <Button size="lg" variant="outline" className="font-semibold text-lg px-10 py-6"
                  style={{ borderColor: "hsl(var(--green) / 0.35)", color: "hsl(var(--green))" }}>
                  Our Mission
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER SOCIAL
      ══════════════════════════════════════════ */}
      <section className="py-16 border-t border-border">
        <div className="container text-center">
          <Reveal>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground mb-6">Follow the Journey</p>
            <div className="flex justify-center gap-5">
              {socialLinks.map(({ Icon, label, href, color }) => (
                <motion.a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  whileHover={{ scale: 1.2, y: -4 }} transition={{ type: "spring", stiffness: 400 }}
                  className={`text-muted-foreground transition-colors duration-200 ${color}`}
                  aria-label={label}>
                  <Icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
            <p className="text-xs text-muted-foreground/40 mt-8">© 2025 Scout BD. All rights reserved.</p>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default Index;
