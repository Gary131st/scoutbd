import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Users, Shield, Trophy, Zap, Twitter, Facebook, Instagram, Youtube, Play, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import BangladeshMapTestimonials from "@/components/BangladeshMapTestimonials";

const stats = [
  { label: "Players Registered", value: "2,500+", Icon: Users },
  { label: "Verified Scouts", value: "120+", Icon: Shield },
  { label: "Talent Discovered", value: "340+", Icon: Trophy },
];

const socialLinks = [
  { Icon: Facebook, label: "Facebook", href: "https://facebook.com/scoutbd", color: "hover:text-blue-400" },
  { Icon: Twitter, label: "Twitter / X", href: "https://twitter.com/scoutbd", color: "hover:text-sky-400" },
  { Icon: Instagram, label: "Instagram", href: "https://instagram.com/scoutbd", color: "hover:text-pink-400" },
  { Icon: Youtube, label: "YouTube", href: "https://youtube.com/@scoutbd", color: "hover:text-red-400" },
];

type ScoutProfile = {
  user_id: string;
  full_name: string;
  organization: string | null;
  avatar_url: string | null;
};

// Animated number counter
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// Scroll-reveal section
function RevealSection({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 48 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Spotlight particle field
function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 28 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: `hsl(var(--foreground) / ${Math.random() * 0.15 + 0.03})`,
          }}
          animate={{
            y: [0, -(Math.random() * 80 + 40)],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: Math.random() * 6 + 5,
            repeat: Infinity,
            delay: Math.random() * 8,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

// Cinematic scan line
function ScanLine() {
  return (
    <motion.div
      className="absolute inset-x-0 h-px pointer-events-none z-20"
      style={{ background: "linear-gradient(90deg, transparent, hsl(var(--foreground)/0.12), transparent)" }}
      animate={{ top: ["0%", "100%"] }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
    />
  );
}

// Story chapter — scroll-driven reveal
function StoryChapter({
  number,
  tag,
  title,
  body,
  side = "left",
  accent,
  icon: Icon,
}: {
  number: string;
  tag: string;
  title: string;
  body: string;
  side?: "left" | "right";
  accent: string;
  icon: React.ElementType;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: side === "left" ? -60 : 60 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col ${side === "right" ? "sm:items-end sm:text-right" : "sm:items-start"} gap-4 max-w-md`}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center border"
          style={{ borderColor: accent + "40", background: accent + "10" }}
        >
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>
        <span className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: accent }}>{tag}</span>
      </div>
      <div>
        <span className="font-display text-[5rem] leading-none opacity-5 block -mb-6" style={{ color: accent }}>{number}</span>
        <h3 className="font-display text-3xl sm:text-4xl text-foreground leading-tight">{title}</h3>
      </div>
      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-sm">{body}</p>
    </motion.div>
  );
}

const Index = () => {
  const { user, role } = useAuth();
  const [verifiedScouts, setVerifiedScouts] = useState<ScoutProfile[]>([]);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroScale  = useTransform(scrollYProgress, [0, 0.6], [1, 1.08]);
  const heroY      = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const taglineY   = useTransform(scrollYProgress, [0, 0.5], ["0%", "-40%"]);

  useEffect(() => {
    const fetchScouts = async () => {
      const { data: scoutData } = await supabase
        .from("scout_profiles")
        .select("user_id, organization")
        .eq("verification_status", "active")
        .limit(12);
      if (!scoutData || scoutData.length === 0) return;
      const userIds = scoutData.map((s) => s.user_id);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);
      const profileMap = Object.fromEntries((profileData ?? []).map((p) => [p.user_id, p]));
      setVerifiedScouts(
        scoutData.map((s) => ({
          user_id: s.user_id,
          organization: s.organization,
          full_name: profileMap[s.user_id]?.full_name ?? "Scout",
          avatar_url: profileMap[s.user_id]?.avatar_url ?? null,
        }))
      );
    };
    fetchScouts();
    // Mark hero as loaded after brief delay (Spline fallback)
    const t = setTimeout(() => setHeroLoaded(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">

      {/* ══════════════════════════════════════════
          HERO — cinematic full-bleed
      ══════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: "hsl(var(--background))" }}
      >
        {/* Particle dust */}
        <ParticleField />
        <ScanLine />

        {/* Deep radial spotlight */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 40%, hsl(var(--foreground)/0.05) 0%, transparent 70%)",
          }}
        />

        {/* Parallax background grid */}
        <motion.div
          style={{ y: heroY, scale: heroScale, opacity: heroOpacity }}
          className="absolute inset-0 pointer-events-none"
        >
          {/* Cinematic grid lines */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="hsl(var(--foreground))" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Horizon glow line */}
          <div
            className="absolute left-0 right-0 h-px"
            style={{
              top: "55%",
              background: "linear-gradient(90deg, transparent 0%, hsl(var(--foreground)/0.15) 30%, hsl(var(--foreground)/0.3) 50%, hsl(var(--foreground)/0.15) 70%, transparent 100%)",
              boxShadow: "0 0 40px 2px hsl(var(--foreground)/0.08)",
            }}
          />

          {/* Vertical light beams */}
          {[20, 50, 80].map((x, i) => (
            <motion.div
              key={i}
              className="absolute top-0 bottom-0 w-px"
              style={{
                left: `${x}%`,
                background: `linear-gradient(to bottom, transparent, hsl(var(--foreground)/0.04) 30%, hsl(var(--foreground)/0.08) 55%, transparent)`,
              }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 4 + i, repeat: Infinity, delay: i * 1.5 }}
            />
          ))}
        </motion.div>

        {/* Hero content */}
        <motion.div
          style={{ opacity: heroOpacity, y: taglineY }}
          className="container relative z-10 flex flex-col items-center text-center pt-24 pb-20"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.85 }}
            animate={heroLoaded ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 border"
            style={{
              background: "hsl(var(--foreground)/0.04)",
              borderColor: "hsl(var(--foreground)/0.12)",
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-foreground"
            />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground">Bangladesh Sports Revolution</span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={heroLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="font-display leading-[0.88] text-foreground mb-6"
            style={{ fontSize: "clamp(3.5rem, 12vw, 9rem)" }}
          >
            YOUR TALENT
            <br />
            <span
              className="inline-block"
              style={{
                WebkitTextStroke: "1px hsl(var(--foreground)/0.4)",
                color: "transparent",
                textShadow: "0 0 80px hsl(var(--foreground)/0.12)",
              }}
            >
              DESERVES
            </span>
            <br />
            A STAGE
          </motion.h1>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={heroLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="text-base sm:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed"
          >
            The first platform connecting Bangladesh's grassroots football & cricket talent
            with verified scouts. Safe, transparent, built for you.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroLoaded ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.65 }}
            className="flex flex-col xs:flex-row gap-3 sm:gap-4"
          >
            {user && role ? (
              <>
                <Link to={role === "admin" ? "/admin" : role === "scout" ? "/scout/explore" : "/player/explore"} className="md:hidden">
                  <Button size="lg" className="w-full font-bold text-base px-6 glow">
                    Explore <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to={role === "admin" ? "/admin" : role === "scout" ? "/scout" : "/player"} className="hidden md:block">
                  <Button size="lg" className="font-bold text-lg px-10 glow">
                    Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button
                    size="lg"
                    className="font-bold text-base sm:text-lg px-8 sm:px-10 glow animate-pulse-glow"
                    style={{
                      background: "hsl(var(--foreground))",
                      color: "hsl(var(--background))",
                    }}
                  >
                    Join as Player <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
                <Link to="/auth?role=scout">
                  <Button
                    size="lg"
                    variant="outline"
                    className="font-semibold text-base sm:text-lg px-8 sm:px-10"
                    style={{ borderColor: "hsl(var(--foreground)/0.2)" }}
                  >
                    I'm a Scout
                  </Button>
                </Link>
              </>
            )}
          </motion.div>

          {/* Scroll nudge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
          >
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/50">Scroll</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ChevronDown className="h-4 w-4 text-muted-foreground/30" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BAR — live counters
      ══════════════════════════════════════════ */}
      <section className="py-12 border-t border-border relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, hsl(var(--foreground)/0.02), transparent)" }}
        />
        <div className="container">
          <div className="grid grid-cols-3 gap-4 sm:gap-8">
            {[
              { label: "Players Registered", target: 2500, suffix: "+", Icon: Users },
              { label: "Verified Scouts", target: 120, suffix: "+", Icon: Shield },
              { label: "Talent Discovered", target: 340, suffix: "+", Icon: Trophy },
            ].map((stat, i) => (
              <RevealSection key={stat.label} delay={i * 0.1} className="text-center">
                <div className="flex justify-center mb-2 sm:mb-3">
                  <stat.Icon className="h-6 w-6 sm:h-7 sm:w-7 text-foreground/60" />
                </div>
                <div className="font-display text-3xl sm:text-5xl text-foreground">
                  <Counter target={stat.target} suffix={stat.suffix} />
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STORY — scroll-driven narrative chapters
      ══════════════════════════════════════════ */}
      <section className="py-20 sm:py-32 border-t border-border relative overflow-hidden">
        {/* Faint vertical timeline */}
        <div
          className="hidden sm:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, hsl(var(--border)) 20%, hsl(var(--border)) 80%, transparent)" }}
        />

        <div className="container space-y-28 sm:space-y-40">

          {/* Chapter 1 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-12">
            <StoryChapter
              number="01"
              tag="Create Profile"
              title="YOUR STORY STARTS HERE"
              body="Sign up as a Player, add your details, select your sport — Football or Cricket. Your profile becomes your digital identity, visible to scouts across Bangladesh."
              side="left"
              accent="hsl(var(--foreground))"
              icon={Users}
            />
            {/* Visual — holographic card mockup */}
            <RevealSection delay={0.2} className="w-full max-w-xs sm:max-w-sm">
              <div
                className="relative rounded-2xl border p-6 overflow-hidden"
                style={{
                  borderColor: "hsl(var(--foreground)/0.08)",
                  background: "hsl(var(--card))",
                  boxShadow: "0 0 0 1px hsl(var(--foreground)/0.04), 0 30px 80px -20px rgba(0,0,0,0.8)",
                }}
              >
                {/* Shimmer top */}
                <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--foreground)/0.3), transparent)" }} />
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-full border flex items-center justify-center font-display text-xl" style={{ borderColor: "hsl(var(--foreground)/0.2)", color: "hsl(var(--foreground)/0.7)" }}>R</div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Rafiqul Islam</div>
                    <div className="text-xs text-muted-foreground">Midfielder · Football · Dhaka</div>
                  </div>
                  <div className="ml-auto">
                    <div className="flex items-center gap-1 rounded-full px-2 py-0.5 border text-[10px] font-semibold" style={{ borderColor: "hsl(var(--foreground)/0.2)", color: "hsl(var(--foreground)/0.6)" }}>
                      <Shield className="h-2.5 w-2.5" /> Verified
                    </div>
                  </div>
                </div>
                {["Speed", "Dribbling", "Vision", "Positioning"].map((skill, j) => (
                  <div key={skill} className="mb-2">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-muted-foreground">{skill}</span>
                      <span className="text-foreground/60">{[88, 76, 91, 82][j]}</span>
                    </div>
                    <div className="h-1 rounded-full bg-foreground/8 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: "hsl(var(--foreground)/0.6)" }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${[88, 76, 91, 82][j]}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: j * 0.1 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </RevealSection>
          </div>

          {/* Chapter 2 */}
          <div className="flex flex-col sm:flex-row-reverse items-center justify-between gap-12">
            <StoryChapter
              number="02"
              tag="Upload Highlights"
              title="LET YOUR GAME SPEAK"
              body="Record a 3-minute highlight video. Tag your position and traits. Pay ৳100 via bKash. Your reel goes live to hundreds of verified scouts instantly."
              side="right"
              accent="hsl(var(--foreground)/0.7)"
              icon={Play}
            />
            {/* Visual — video player mockup */}
            <RevealSection delay={0.2} className="w-full max-w-xs sm:max-w-sm">
              <div
                className="relative rounded-2xl border overflow-hidden"
                style={{
                  borderColor: "hsl(var(--foreground)/0.08)",
                  background: "hsl(0 0% 3%)",
                  boxShadow: "0 0 0 1px hsl(var(--foreground)/0.04), 0 30px 80px -20px rgba(0,0,0,0.8)",
                  aspectRatio: "16/9",
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    whileHover={{ scale: 1.15 }}
                    className="w-16 h-16 rounded-full flex items-center justify-center border cursor-pointer"
                    style={{
                      background: "hsl(var(--foreground)/0.08)",
                      borderColor: "hsl(var(--foreground)/0.2)",
                      boxShadow: "0 0 40px hsl(var(--foreground)/0.15)",
                    }}
                  >
                    <Play className="h-7 w-7 text-foreground/70 ml-1" />
                  </motion.div>
                </div>
                {/* scan line on video */}
                <motion.div
                  className="absolute inset-x-0 h-px pointer-events-none"
                  style={{ background: "linear-gradient(90deg, transparent, hsl(var(--foreground)/0.2), transparent)" }}
                  animate={{ top: ["0%", "100%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                {/* bottom bar */}
                <div className="absolute bottom-0 inset-x-0 p-3" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }}>
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 flex-1 rounded-full bg-foreground/10">
                      <motion.div className="h-full rounded-full bg-foreground/50" style={{ width: "38%" }} />
                    </div>
                    <span className="text-[9px] text-muted-foreground">1:08 / 3:00</span>
                  </div>
                </div>
                {/* corner tags */}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  {["Midfielder", "Left Foot", "Dhaka"].map(t => (
                    <span key={t} className="text-[8px] px-1.5 py-0.5 rounded bg-foreground/10 text-foreground/50 font-medium">{t}</span>
                  ))}
                </div>
              </div>
            </RevealSection>
          </div>

          {/* Chapter 3 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-12">
            <StoryChapter
              number="03"
              tag="Get Discovered"
              title="SCOUTS FIND YOU"
              body="Verified scouts browse your profile, shortlist you, and reach out through our safe admin-mediated channel. No direct contact. No corruption. Pure merit."
              side="left"
              accent="hsl(var(--foreground)/0.5)"
              icon={Trophy}
            />
            {/* Visual — scout dashboard mockup */}
            <RevealSection delay={0.2} className="w-full max-w-xs sm:max-w-sm">
              <div
                className="relative rounded-2xl border p-4 overflow-hidden space-y-3"
                style={{
                  borderColor: "hsl(var(--foreground)/0.08)",
                  background: "hsl(var(--card))",
                  boxShadow: "0 0 0 1px hsl(var(--foreground)/0.04), 0 30px 80px -20px rgba(0,0,0,0.8)",
                }}
              >
                <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--foreground)/0.3), transparent)" }} />
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-foreground/50" />
                  <span className="text-xs font-semibold text-foreground/70 tracking-widest uppercase">Scout Dashboard</span>
                </div>
                {[
                  { name: "Rafiqul Islam", pos: "Midfielder", score: 91 },
                  { name: "Nusrat Jahan",  pos: "Forward",    score: 87 },
                  { name: "Tanjim Ahmed",  pos: "All-rounder",score: 84 },
                ].map((p, j) => (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: j * 0.15 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl border"
                    style={{ borderColor: "hsl(var(--foreground)/0.06)", background: "hsl(var(--foreground)/0.02)" }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-display text-sm border" style={{ borderColor: "hsl(var(--foreground)/0.15)" }}>
                      {p.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-foreground truncate">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground">{p.pos}</div>
                    </div>
                    <div className="text-xs font-bold text-foreground/60">{p.score}</div>
                    <div className="text-[9px] px-1.5 py-0.5 rounded border font-semibold text-foreground/50" style={{ borderColor: "hsl(var(--foreground)/0.12)" }}>★ Shortlisted</div>
                  </motion.div>
                ))}
              </div>
            </RevealSection>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════
          MAP SECTION
      ══════════════════════════════════════════ */}
      <BangladeshMapTestimonials />

      {/* ══════════════════════════════════════════
          VERIFIED SCOUTS
      ══════════════════════════════════════════ */}
      <section className="py-16 sm:py-24 border-t border-border">
        <div className="container">
          <RevealSection className="text-center mb-10 sm:mb-14">
            <h2 className="font-display text-3xl sm:text-5xl text-foreground mb-2">OUR VERIFIED SCOUTS</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
              These professionals are actively discovering talent across Bangladesh
            </p>
          </RevealSection>

          {verifiedScouts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {verifiedScouts.map((scout, i) => (
                <RevealSection key={scout.user_id} delay={i * 0.07}>
                  <div
                    className="group rounded-2xl border p-5 flex flex-col items-center text-center gap-3 transition-all duration-300 hover:border-foreground/20"
                    style={{
                      background: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                    }}
                  >
                    <div
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-foreground/30"
                      style={{ borderColor: "hsl(var(--foreground)/0.12)", background: "hsl(var(--foreground)/0.04)" }}
                    >
                      {scout.avatar_url ? (
                        <img src={scout.avatar_url} alt={scout.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-display text-2xl text-foreground/60">{scout.full_name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-tight">{scout.full_name}</p>
                      {scout.organization && (
                        <p className="text-xs text-muted-foreground mt-0.5">{scout.organization}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 border" style={{ borderColor: "hsl(var(--foreground)/0.12)", background: "hsl(var(--foreground)/0.04)" }}>
                      <Shield className="h-3 w-3 text-foreground/50" />
                      <span className="text-xs text-foreground/60 font-medium">Verified</span>
                    </div>
                  </div>
                </RevealSection>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm">No verified scouts listed yet.</p>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SOCIAL MEDIA
      ══════════════════════════════════════════ */}
      <section className="py-12 sm:py-16 border-t border-border">
        <div className="container">
          <RevealSection className="text-center mb-8">
            <h2 className="font-display text-3xl sm:text-4xl text-foreground mb-2">FOLLOW THE JOURNEY</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Stay connected with Scout BD across all platforms</p>
          </RevealSection>
          <div className="flex justify-center gap-6 sm:gap-8 flex-wrap">
            {socialLinks.map(({ Icon, label, href, color }, i) => (
              <motion.a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center gap-2 text-muted-foreground transition-colors duration-200 ${color}`}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border flex items-center justify-center transition-all duration-200 hover:border-foreground/20" style={{ borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }}>
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <span className="text-xs font-medium">{label}</span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA — cinematic finale
      ══════════════════════════════════════════ */}
      <section className="relative py-24 sm:py-40 border-t border-border overflow-hidden">
        {/* Spotlight burst */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 70% at 50% 50%, hsl(var(--foreground)/0.05) 0%, transparent 65%)",
          }}
        />
        <ParticleField />

        <div className="container text-center relative z-10">
          <RevealSection>
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="font-display text-[clamp(1rem,3vw,1.5rem)] tracking-[0.3em] uppercase text-muted-foreground/40 mb-4"
            >
              Your moment is now
            </motion.div>
            <h2
              className="font-display leading-[0.88] text-foreground mb-6"
              style={{ fontSize: "clamp(3rem, 10vw, 8rem)" }}
            >
              READY TO{" "}
              <span
                style={{
                  WebkitTextStroke: "1px hsl(var(--foreground)/0.5)",
                  color: "transparent",
                }}
              >
                SHINE?
              </span>
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground mb-10 max-w-md mx-auto">
              Join thousands of young athletes across Bangladesh. Your breakthrough starts here.
            </p>
            {!user && (
              <Link to="/auth">
                <motion.div whileTap={{ scale: 0.96 }} className="inline-block">
                  <Button
                    size="lg"
                    className="font-bold text-base sm:text-lg px-10 sm:px-14 py-6 animate-pulse-glow"
                    style={{
                      background: "hsl(var(--foreground))",
                      color: "hsl(var(--background))",
                      fontSize: "1rem",
                    }}
                  >
                    Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
            )}
            {user && role && (
              <Link to={role === "admin" ? "/admin" : role === "scout" ? "/scout" : "/player"}>
                <Button size="lg" className="font-bold text-lg px-10 glow">
                  Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            )}
          </RevealSection>
        </div>
      </section>
    </div>
  );
};

export default Index;
