import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import { X, MapPin, Quote } from "lucide-react";
import playerRafiq from "@/assets/player-rafiq.jpg";
import playerTanjim from "@/assets/player-tanjim.jpg";
import playerNusrat from "@/assets/player-nusrat.jpg";
import bangladeshMap from "@/assets/bangladesh-divisions-map.png";

type PlayerPin = {
  id: string;
  x: number; // % relative to map container
  y: number;
  district: string;
  name: string;
  sport: string;
  position: string;
  issue: string;
  story: string;
  image: string;
  defaultOpen?: boolean;
};

// Pin positions carefully placed INSIDE the map boundaries for each division
const players: PlayerPin[] = [
  {
    id: "rafiq",
    x: 47,
    y: 56,
    district: "Dhaka",
    name: "Rafiqul Islam",
    sport: "Football",
    position: "Midfielder",
    issue: "No platform to showcase talent outside his locality. Spent 3 years unnoticed.",
    story: "Within weeks of uploading his highlight reel on Scout BD, three clubs reached out. He now plays for a Dhaka Premier Division club.",
    image: playerRafiq,
    defaultOpen: true,
  },
  {
    id: "tanjim",
    x: 73,
    y: 38,
    district: "Sylhet",
    name: "Tanjim Ahmed",
    sport: "Cricket",
    position: "All-rounder",
    issue: "Playing in remote Sylhet with zero scouting infrastructure. His talent was invisible.",
    story: "Scout BD connected him to a BPL franchise scout. He now holds a regional cricket contract and represents Sylhet in the National Championship.",
    image: playerTanjim,
    defaultOpen: true,
  },
  {
    id: "nusrat",
    x: 21,
    y: 70,
    district: "Khulna",
    name: "Nusrat Jahan",
    sport: "Football",
    position: "Forward",
    issue: "Female players in Khulna had no visibility — no scouts ever visited the district.",
    story: "After uploading her skills video, she received an invite to the Bangladesh Women's U-20 trials. She made the squad.",
    image: playerNusrat,
    defaultOpen: true,
  },
  { id: "p4", x: 27, y: 34, district: "Rajshahi", name: "Arif Hossain", sport: "Football", position: "Goalkeeper", issue: "Limited access to professional coaching.", story: "Now training with Rajshahi FC youth academy after being spotted on Scout BD.", image: playerRafiq },
  { id: "p5", x: 44, y: 80, district: "Barisal", name: "Sumon Dey", sport: "Cricket", position: "Fast Bowler", issue: "No way to reach metropolitan scouts from coastal Barisal.", story: "Secured a trial with a Dhaka-based cricket academy through Scout BD.", image: playerTanjim },
  { id: "p6", x: 52, y: 28, district: "Mymensingh", name: "Karim Uddin", sport: "Football", position: "Defender", issue: "Talented but invisible due to lack of local scouting.", story: "Joined Dhaka Abahani youth team after being discovered on Scout BD.", image: playerNusrat },
  { id: "p7", x: 34, y: 16, district: "Rangpur", name: "Belal Khan", sport: "Cricket", position: "Spinner", issue: "Northern districts ignored by big club scouts.", story: "Offered contract by Rangpur Riders academy after highlight reel went viral.", image: playerRafiq },
  { id: "p8", x: 60, y: 64, district: "Comilla", name: "Rony Mia", sport: "Football", position: "Winger", issue: "Played street football with no professional pathway.", story: "Discovered by a scout from Chittagong Abahani and offered a trial.", image: playerTanjim },
  { id: "p9", x: 72, y: 72, district: "Chittagong", name: "Sadia Islam", sport: "Football", position: "Midfielder", issue: "Women's football completely unscouted in Chittagong.", story: "Selected for national women's development camp after Scout BD profile.", image: playerNusrat },
  { id: "p10", x: 55, y: 46, district: "Noakhali", name: "Imran Hossain", sport: "Football", position: "Striker", issue: "No football clubs operating in his upazilas.", story: "Now on trial with Chittagong Kings after being spotted on Scout BD.", image: playerTanjim },
  { id: "p11", x: 38, y: 74, district: "Faridpur", name: "Mitu Akter", sport: "Football", position: "Forward", issue: "Female talent completely overlooked in rural areas.", story: "Invited to attend Bangladesh Football Federation's women's development program.", image: playerNusrat },
];

// 3D tilt hook for the map card
function useCardTilt() {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 20 });

  const handleMouse = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleLeave = () => { x.set(0); y.set(0); };

  return { ref, rotateX, rotateY, handleMouse, handleLeave };
}

export default function BangladeshMapTestimonials() {
  const [openPins, setOpenPins] = useState<Set<string>>(new Set());
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const { ref: mapRef, rotateX, rotateY, handleMouse, handleLeave } = useCardTilt();

  useEffect(() => {
    if (!mapVisible) return;
    const defaults = players.filter(p => p.defaultOpen).map(p => p.id);
    defaults.forEach((id, i) => {
      setTimeout(() => {
        setOpenPins(prev => new Set([...prev, id]));
      }, 600 + i * 300);
    });
  }, [mapVisible]);

  const handlePinClick = (id: string) => {
    setActivePinId(prev => (prev === id ? null : id));
    setOpenPins(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const activePlayer = players.find(p => p.id === activePinId);

  return (
    <section className="py-12 sm:py-20 border-t border-border overflow-hidden">
      <div className="container">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="font-display text-3xl sm:text-5xl text-foreground mb-2 sm:mb-3">
            VOICES FROM ACROSS BANGLADESH
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
            Every pin is a real player whose life changed. Click any pin to hear their story.
          </p>
        </motion.div>

        <div className="relative flex flex-col lg:flex-row gap-8 items-start justify-center">
          {/* ── Map ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => setMapVisible(true)}
            style={{ perspective: 1000 }}
            className="w-full max-w-md lg:max-w-lg flex-shrink-0 mx-auto lg:mx-0"
          >
            {/* No frame — map floats directly on page background */}
            <motion.div
              ref={mapRef}
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
              onMouseMove={handleMouse}
              onMouseLeave={handleLeave}
              className="relative overflow-visible cursor-crosshair"
            >
                {/* Map image — inverted so outlines are white/grey on black fill */}
                <div className="relative">
                  <img
                    src={bangladeshMap}
                    alt="Bangladesh divisions map"
                    className="w-full select-none pointer-events-none relative z-10"
                    style={{
                      filter: "invert(1) grayscale(1) brightness(0.85) contrast(1.2)",
                    }}
                    draggable={false}
                  />

                  {/* Pins overlay — z-20 so they sit above map */}
                  {players.map((player, idx) => {
                    const isOpen = openPins.has(player.id);
                    const isActive = activePinId === player.id;

                    return (
                      <motion.button
                        key={player.id}
                        initial={{ opacity: 0, scale: 0, y: -10 }}
                        animate={
                          mapVisible
                            ? { opacity: 1, scale: 1, y: 0 }
                            : { opacity: 0, scale: 0, y: -10 }
                        }
                        transition={{
                          delay: 0.2 + idx * 0.07,
                          duration: 0.5,
                          type: "spring",
                          stiffness: 280,
                          damping: 22,
                        }}
                        whileHover={{ scale: 1.35, y: -3, transition: { duration: 0.15 } }}
                        onClick={() => handlePinClick(player.id)}
                        className="absolute -translate-x-1/2 -translate-y-full focus:outline-none z-20"
                        style={{ left: `${player.x}%`, top: `${player.y}%` }}
                        aria-label={`${player.name} from ${player.district}`}
                      >
                        {/* Pin glow ring when active */}
                        {isOpen && (
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="absolute inset-0 rounded-full pointer-events-none"
                            style={{
                              filter: "blur(6px)",
                              background: "hsl(var(--primary)/0.5)",
                              transform: "translate(-50%, -50%) scale(2)",
                              top: "50%",
                              left: "50%",
                            }}
                          />
                        )}

                        {/* SVG Pin */}
                        <svg
                          viewBox="0 0 24 32"
                          className="w-6 h-8 sm:w-7 sm:h-9 drop-shadow-lg relative z-10"
                          style={{
                            filter: isActive
                              ? "drop-shadow(0 0 8px hsl(var(--primary)))"
                              : isOpen
                              ? "drop-shadow(0 0 5px hsl(var(--primary)/0.7))"
                              : "drop-shadow(0 2px 3px rgba(0,0,0,0.6))",
                          }}
                        >
                          <path
                            d="M12 0C7.13 0 3 4.13 3 9c0 6.75 9 23 9 23s9-16.25 9-23C21 4.13 16.87 0 12 0z"
                            fill={isOpen ? "hsl(var(--primary))" : "hsl(var(--foreground)/0.65)"}
                            stroke={isOpen ? "hsl(var(--primary-foreground)/0.3)" : "hsl(var(--background)/0.4)"}
                            strokeWidth="0.8"
                          />
                          <circle cx="12" cy="9" r="3.5"
                            fill={isOpen ? "hsl(var(--primary-foreground))" : "hsl(var(--background)/0.8)"}
                          />
                        </svg>

                        {/* Name label on open */}
                        <AnimatePresence>
                          {isOpen && !isActive && (
                            <motion.div
                              initial={{ opacity: 0, y: 4, scale: 0.85 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 4, scale: 0.85 }}
                              transition={{ duration: 0.2 }}
                              className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap bg-primary text-primary-foreground text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-lg pointer-events-none z-30"
                            >
                              {player.name.split(" ")[0]} · {player.district}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* ── Testimonial Panel ── */}
          <div className="w-full lg:max-w-sm lg:flex-shrink-0 sticky top-24">
            <AnimatePresence mode="wait">
              {activePlayer ? (
                <motion.div
                  key={activePlayer.id}
                  initial={{ opacity: 0, x: 28, scale: 0.96 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -28, scale: 0.96 }}
                  transition={{ duration: 0.32, ease: "easeOut" }}
                  className="rounded-2xl overflow-hidden shadow-2xl border border-primary/20"
                  style={{
                    background: "hsl(var(--card))",
                    boxShadow: "0 0 0 1px hsl(var(--primary)/0.12), 0 20px 50px -10px rgba(0,0,0,0.5)",
                  }}
                >
                  {/* ── Player photo: full bleed, face visible, smooth fade ── */}
                  <div className="relative w-full" style={{ paddingBottom: "72%" }}>
                    <img
                      src={activePlayer.image}
                      alt={activePlayer.name}
                      className="absolute inset-0 w-full h-full object-cover object-center"
                      style={{ objectPosition: "center 20%" }}
                    />
                    {/* Smooth gradient: fully transparent on top half, fades to card color at bottom */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: "linear-gradient(to bottom, transparent 30%, transparent 45%, hsl(var(--card)/0.6) 68%, hsl(var(--card)) 100%)",
                      }}
                    />

                    {/* Close button */}
                    <button
                      onClick={() => setActivePinId(null)}
                      className="absolute top-3 right-3 w-7 h-7 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors shadow z-10"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>

                    {/* Name + district overlaid over bottom gradient */}
                    <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 z-10">
                      <div className="flex items-end justify-between">
                        <div>
                          <h3 className="font-display text-lg text-foreground leading-tight drop-shadow-md">
                            {activePlayer.name}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {activePlayer.sport} · {activePlayer.position}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 bg-primary/90 backdrop-blur-sm rounded-full px-2 py-0.5 mb-0.5">
                          <MapPin className="h-3 w-3 text-primary-foreground" />
                          <span className="text-[10px] font-semibold text-primary-foreground">{activePlayer.district}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content blocks — below image, no overlap */}
                  <div className="px-4 pb-4 pt-3 space-y-3">
                    <div className="bg-destructive/8 border border-destructive/20 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-destructive/80 uppercase tracking-wider mb-1">The Challenge</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{activePlayer.issue}</p>
                    </div>
                    <div className="bg-primary/5 border border-primary/15 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1">The Breakthrough</p>
                      <div className="flex gap-2">
                        <Quote className="h-3.5 w-3.5 text-primary/50 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-foreground leading-relaxed">{activePlayer.story}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-56 text-center gap-3 bg-card/40 border border-dashed border-border/60 rounded-2xl p-8"
                >
                  <MapPin className="h-8 w-8 text-primary/35" />
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Click any location pin on the map<br />to read a player's story
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick-select chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              {players.filter(p => p.defaultOpen).map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePinClick(p.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                    activePinId === p.id
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {p.name.split(" ")[0]} · {p.district}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-3 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 32" className="w-4 h-5">
                  <path d="M12 0C7.13 0 3 4.13 3 9c0 6.75 9 23 9 23s9-16.25 9-23C21 4.13 16.87 0 12 0z" fill="hsl(var(--primary))" />
                  <circle cx="12" cy="9" r="3.5" fill="hsl(var(--primary-foreground))" />
                </svg>
                <span className="text-xs text-muted-foreground">Has story</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 32" className="w-4 h-5">
                  <path d="M12 0C7.13 0 3 4.13 3 9c0 6.75 9 23 9 23s9-16.25 9-23C21 4.13 16.87 0 12 0z" fill="hsl(var(--foreground)/0.5)" />
                  <circle cx="12" cy="9" r="3.5" fill="hsl(var(--background))" />
                </svg>
                <span className="text-xs text-muted-foreground">More players</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
