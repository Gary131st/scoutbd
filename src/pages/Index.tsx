import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Users, Shield, Trophy, Zap, Twitter, Facebook, Instagram, Youtube, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import heroBg from "@/assets/hero-bg.jpg";

const stats = [
  { label: "Players Registered", value: "2,500+", Icon: Users },
  { label: "Verified Scouts", value: "120+", Icon: Shield },
  { label: "Talent Discovered", value: "340+", Icon: Trophy },
];

const testimonials = [
  {
    quote: "Scout BD gave me the platform I never had. Within weeks of uploading my highlight reel, three clubs reached out.",
    name: "Rafiqul Islam",
    role: "Football Midfielder, Dhaka",
    initial: "R",
  },
  {
    quote: "As a scout, I can now discover talent from remote districts I'd never be able to visit in person. Revolutionary.",
    name: "Kamal Hossain",
    role: "Senior Scout, Bangladesh Football Federation",
    initial: "K",
  },
  {
    quote: "I was a nobody from Sylhet. Now I have a cricket contract. Scout BD changed my life completely.",
    name: "Tanjim Ahmed",
    role: "Cricket All-rounder, Sylhet",
    initial: "T",
  },
];

const socialLinks = [
  { Icon: Facebook, label: "Facebook", href: "https://facebook.com/scoutbd", color: "hover:text-blue-500" },
  { Icon: Twitter, label: "Twitter / X", href: "https://twitter.com/scoutbd", color: "hover:text-sky-400" },
  { Icon: Instagram, label: "Instagram", href: "https://instagram.com/scoutbd", color: "hover:text-pink-500" },
  { Icon: Youtube, label: "YouTube", href: "https://youtube.com/@scoutbd", color: "hover:text-red-500" },
];

type ScoutProfile = {
  user_id: string;
  full_name: string;
  organization: string | null;
  avatar_url: string | null;
};

const Index = () => {
  const { user, role } = useAuth();
  const [verifiedScouts, setVerifiedScouts] = useState<ScoutProfile[]>([]);

  useEffect(() => {
    const fetchScouts = async () => {
      const { data } = await supabase
        .from("scout_profiles")
        .select("user_id, organization, profiles!inner(full_name, avatar_url)")
        .eq("verification_status", "active")
        .limit(12);
      if (data) {
        setVerifiedScouts(
          data.map((s: any) => ({
            user_id: s.user_id,
            organization: s.organization,
            full_name: s.profiles?.full_name ?? "Scout",
            avatar_url: s.profiles?.avatar_url ?? null,
          }))
        );
      }
    };
    fetchScouts();
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroBg})` }} />
        <div className="absolute inset-0 bg-background/65" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        <motion.div
          animate={{ y: [-20, 20, -20] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="hidden sm:block absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-primary/5 border border-primary/10 blur-xl pointer-events-none"
        />
        <motion.div
          animate={{ y: [20, -20, 20] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="hidden sm:block absolute bottom-1/3 right-1/3 w-40 h-40 rounded-full bg-primary/8 border border-primary/15 blur-lg pointer-events-none"
        />

        <div className="container relative z-10 pt-24 pb-16 sm:pt-32 sm:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-3 py-1.5 mb-5 sm:px-4 sm:mb-6"
            >
              <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-primary">Bangladesh Sports Revolution</span>
            </motion.div>

            <h1 className="font-display text-4xl xs:text-5xl sm:text-7xl lg:text-8xl leading-[0.9] text-foreground mb-4 sm:mb-6">
              YOUR TALENT
              <br />
              <span className="text-gradient">DESERVES A</span>
              <br />
              STAGE
            </h1>

            <p className="text-sm sm:text-lg text-muted-foreground max-w-xl mb-6 sm:mb-8 leading-relaxed">
              The first platform connecting Bangladesh's grassroots football & cricket talent
              with verified scouts. Safe, transparent, and built for you.
            </p>

            <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 w-full xs:w-auto">
              {user && role ? (
                <>
                  <Link
                    to={role === "admin" ? "/admin" : role === "scout" ? "/scout/explore" : "/player/explore"}
                    className="w-full xs:w-auto md:hidden"
                  >
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Button size="lg" className="w-full bg-primary text-primary-foreground font-bold text-base px-6 glow hover:bg-primary/90 transition-all">
                        Explore <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </motion.div>
                  </Link>
                  <Link
                    to={role === "admin" ? "/admin" : role === "scout" ? "/scout" : "/player"}
                    className="w-full xs:w-auto hidden md:block"
                  >
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Button size="lg" className="w-full xs:w-auto bg-primary text-primary-foreground font-bold text-lg px-8 glow hover:bg-primary/90 transition-all">
                        Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </motion.div>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/auth" className="w-full xs:w-auto">
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Button size="lg" className="w-full xs:w-auto bg-primary text-primary-foreground font-bold text-base sm:text-lg px-6 sm:px-8 glow hover:bg-primary/90 transition-all">
                        Join as Player <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </motion.div>
                  </Link>
                  <Link to="/auth?role=scout" className="w-full xs:w-auto">
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Button size="lg" variant="outline" className="w-full xs:w-auto border-primary/40 text-primary hover:bg-primary/10 font-semibold text-base sm:text-lg px-6 sm:px-8">
                        I'm a Scout
                      </Button>
                    </motion.div>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 sm:py-16 border-t border-border">
        <div className="container">
          <div className="grid grid-cols-3 gap-3 sm:gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="bg-card border border-border rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center"
              >
                <div className="flex justify-center mb-2 sm:mb-3">
                  <stat.Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <div className="font-display text-2xl sm:text-4xl text-foreground mb-0.5 sm:mb-1">{stat.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground leading-tight">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="font-display text-3xl sm:text-5xl text-foreground mb-2 sm:mb-3">HOW IT WORKS</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">Three simple steps to showcase your talent to the world</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
            {[
              { step: "01", title: "CREATE PROFILE", desc: "Sign up as a Player, add your details, and select your sport — Football or Cricket." },
              { step: "02", title: "UPLOAD YOUR BEST", desc: "Record a 3-minute highlight video. Tag your position and traits. Pay ৳100 via bKash." },
              { step: "03", title: "GET DISCOVERED", desc: "Verified scouts browse your profile. Get your Digital Participation Certificate instantly." },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative bg-card border border-border rounded-xl sm:rounded-2xl p-6 sm:p-8 hover:border-primary/50 transition-all duration-300"
              >
                <span className="font-display text-5xl sm:text-6xl text-primary/20 absolute top-3 right-5 sm:top-4 sm:right-6">{item.step}</span>
                <h3 className="font-display text-xl sm:text-2xl text-foreground mt-6 sm:mt-8 mb-2 sm:mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials — Desktop only */}
      <section className="hidden lg:block py-20 border-t border-border">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-display text-5xl text-foreground mb-3">WHAT THEY SAY</h2>
            <p className="text-base text-muted-foreground max-w-lg mx-auto">Real stories from players and scouts who found their breakthrough</p>
          </motion.div>
          <div className="grid grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="bg-card border border-border rounded-2xl p-8 flex flex-col gap-5 hover:border-primary/40 transition-all duration-300"
              >
                <Quote className="h-7 w-7 text-primary/40" />
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center font-display text-primary text-lg">
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Verified Scouts */}
      <section className="py-12 sm:py-20 border-t border-border">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="font-display text-3xl sm:text-5xl text-foreground mb-2 sm:mb-3">OUR VERIFIED SCOUTS</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
              These professionals are actively discovering talent across Bangladesh
            </p>
          </motion.div>

          {verifiedScouts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {verifiedScouts.map((scout, i) => (
                <motion.div
                  key={scout.user_id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="bg-card border border-border rounded-xl sm:rounded-2xl p-5 flex flex-col items-center text-center gap-3 hover:border-primary/40 transition-all duration-300"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 border border-primary/25 flex items-center justify-center overflow-hidden">
                    {scout.avatar_url ? (
                      <img src={scout.avatar_url} alt={scout.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-display text-2xl text-primary">{scout.full_name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">{scout.full_name}</p>
                    {scout.organization && (
                      <p className="text-xs text-muted-foreground mt-0.5">{scout.organization}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-2.5 py-1">
                    <Shield className="h-3 w-3 text-primary" />
                    <span className="text-xs text-primary font-medium">Verified</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm">No verified scouts listed yet.</p>
          )}
        </div>
      </section>

      {/* Social Media */}
      <section className="py-12 sm:py-16 border-t border-border">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="font-display text-3xl sm:text-4xl text-foreground mb-2">FOLLOW THE JOURNEY</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Stay connected with Scout BD across all platforms</p>
          </motion.div>
          <div className="flex justify-center gap-6 sm:gap-8 flex-wrap">
            {socialLinks.map(({ Icon, label, href, color }, i) => (
              <motion.a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.35 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center gap-2 text-muted-foreground transition-colors duration-200 ${color}`}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-card border border-border flex items-center justify-center hover:border-primary/40 transition-all duration-200">
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                </div>
                <span className="text-xs font-medium">{label}</span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-20 border-t border-border">
        <div className="container text-center">
          <h2 className="font-display text-3xl sm:text-5xl text-foreground mb-3 sm:mb-4">
            READY TO <span className="text-gradient">SHINE?</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto">
            Join thousands of young athletes across Bangladesh. Your breakthrough starts here.
          </p>
          {!user && (
            <Link to="/auth">
              <motion.div whileTap={{ scale: 0.95 }} className="inline-block">
                <Button size="lg" className="bg-primary text-primary-foreground font-bold text-base sm:text-lg px-8 sm:px-10 glow animate-pulse-glow">
                  Start Your Journey <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </motion.div>
            </Link>
          )}
          {user && role && (
            <>
              <Link to={role === "admin" ? "/admin" : role === "scout" ? "/scout/explore" : "/player/explore"} className="md:hidden inline-block">
                <motion.div whileTap={{ scale: 0.95 }} className="inline-block">
                  <Button size="lg" className="bg-primary text-primary-foreground font-bold text-base px-8 glow">
                    Explore <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
              <Link to={role === "admin" ? "/admin" : role === "scout" ? "/scout" : "/player"} className="hidden md:inline-block">
                <motion.div whileTap={{ scale: 0.95 }} className="inline-block">
                  <Button size="lg" className="bg-primary text-primary-foreground font-bold text-lg px-10 glow">
                    Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
