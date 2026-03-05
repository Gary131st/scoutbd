import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Quote } from "lucide-react";
import playerRafiq from "@/assets/player-rafiq.jpg";
import playerTanjim from "@/assets/player-tanjim.jpg";
import playerNusrat from "@/assets/player-nusrat.jpg";

type PlayerDot = {
  id: string;
  x: number; // percentage of SVG viewBox width
  y: number; // percentage of SVG viewBox height
  district: string;
  name: string;
  sport: string;
  position: string;
  issue: string;
  story: string;
  image: string;
  defaultOpen?: boolean;
};

const players: PlayerDot[] = [
  {
    id: "rafiq",
    x: 34,
    y: 42,
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
    x: 63,
    y: 30,
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
    x: 22,
    y: 62,
    district: "Khulna",
    name: "Nusrat Jahan",
    sport: "Football",
    position: "Forward",
    issue: "Female players in Khulna had no visibility — no scouts ever visited the district.",
    story: "After uploading her skills video, she received an invite to the Bangladesh Women's U-20 trials. She made the squad.",
    image: playerNusrat,
    defaultOpen: true,
  },
  { id: "p4", x: 28, y: 28, district: "Rajshahi", name: "Arif Hossain", sport: "Football", position: "Goalkeeper", issue: "Limited access to professional coaching.", story: "Now training with Rajshahi FC youth academy after being spotted on Scout BD.", image: playerRafiq },
  { id: "p5", x: 46, y: 70, district: "Barisal", name: "Sumon Dey", sport: "Cricket", position: "Fast Bowler", issue: "No way to reach metropolitan scouts from coastal Barisal.", story: "Secured a trial with a Dhaka-based cricket academy through Scout BD.", image: playerTanjim },
  { id: "p6", x: 54, y: 20, district: "Mymensingh", name: "Karim Uddin", sport: "Football", position: "Defender", issue: "Talented but invisible due to lack of local scouting.", story: "Joined Dhaka Abahani youth team after being discovered on Scout BD.", image: playerNusrat },
  { id: "p7", x: 18, y: 45, district: "Jessore", name: "Parvez Alam", sport: "Cricket", position: "Batsman", issue: "Rural player with no professional exposure.", story: "Now part of the Khulna Division U-19 cricket squad.", image: playerRafiq },
  { id: "p8", x: 42, y: 55, district: "Comilla", name: "Rony Mia", sport: "Football", position: "Winger", issue: "Played street football with no professional pathway.", story: "Discovered by a scout from Chittagong Abahani and offered a trial.", image: playerTanjim },
  { id: "p9", x: 72, y: 52, district: "Chittagong", name: "Sadia Islam", sport: "Football", position: "Midfielder", issue: "Women's football completely unscouted in Chittagong.", story: "Selected for national women's development camp after Scout BD profile.", image: playerNusrat },
  { id: "p10", x: 38, y: 15, district: "Rangpur", name: "Belal Khan", sport: "Cricket", position: "Spinner", issue: "Northern districts ignored by big club scouts.", story: "Offered contract by Rangpur Riders academy after highlight reel went viral.", image: playerRafiq },
  { id: "p11", x: 58, y: 45, district: "Noakhali", name: "Imran Hossain", sport: "Football", position: "Striker", issue: "No football clubs operating in his upazilas.", story: "Now on trial with Chittagong Kings after being spotted on Scout BD.", image: playerTanjim },
  { id: "p12", x: 30, y: 52, district: "Faridpur", name: "Mitu Akter", sport: "Football", position: "Forward", issue: "Female talent completely overlooked in rural areas.", story: "Invited to attend Bangladesh Football Federation's women's development program.", image: playerNusrat },
];

// SVG path data for Bangladesh districts (simplified but recognizable shape)
const bangladeshPath = `M 285 20 L 310 18 L 340 25 L 360 20 L 380 30 L 395 25 L 410 35 L 415 50 L 400 60 L 420 70 L 430 85 L 415 95 L 430 105 L 440 120 L 430 135 L 445 150 L 450 165 L 440 175 L 455 190 L 460 210 L 445 220 L 450 235 L 440 250 L 430 265 L 415 270 L 400 280 L 385 290 L 375 305 L 360 315 L 350 330 L 335 340 L 320 355 L 305 365 L 290 375 L 275 385 L 258 390 L 245 380 L 232 385 L 220 375 L 208 360 L 200 345 L 192 330 L 188 315 L 195 300 L 185 285 L 178 270 L 168 258 L 160 245 L 152 230 L 148 215 L 155 200 L 148 188 L 140 175 L 148 162 L 142 148 L 135 135 L 128 122 L 132 108 L 125 95 L 128 80 L 140 70 L 148 58 L 160 50 L 172 42 L 188 38 L 200 30 L 215 24 L 230 20 L 248 18 L 265 20 Z`;

// Additional district lines (approximate internal borders)
const districtLines = [
  "M 200 120 L 300 115 L 380 130",
  "M 175 160 L 280 155 L 390 170",
  "M 168 200 L 270 195 L 395 205",
  "M 172 240 L 265 235 L 390 245",
  "M 180 280 L 260 278 L 370 285",
  "M 240 20 L 235 120 L 230 200 L 225 300 L 220 390",
  "M 290 18 L 285 115 L 280 200 L 275 300 L 268 385",
  "M 340 22 L 338 115 L 335 200 L 330 300",
  "M 380 28 L 378 115 L 375 200 L 370 290",
  "M 155 200 L 200 195 L 240 200",
  "M 320 350 L 340 360 L 355 375 L 365 390 L 370 410 L 365 430 L 355 445 L 345 455 L 332 460",
];

export default function BangladeshMapTestimonials() {
  const [openDots, setOpenDots] = useState<Set<string>>(new Set());
  const [activeDot, setActiveDot] = useState<string | null>(null);

  useEffect(() => {
    // Open default dots with stagger
    const defaults = players.filter(p => p.defaultOpen).map(p => p.id);
    defaults.forEach((id, i) => {
      setTimeout(() => {
        setOpenDots(prev => new Set([...prev, id]));
      }, i * 600 + 400);
    });
  }, []);

  const toggleDot = (id: string) => {
    setActiveDot(prev => prev === id ? null : id);
    setOpenDots(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const activePlayer = players.find(p => p.id === activeDot);

  // Map SVG coordinate system: viewBox "0 0 500 480"
  const toPercent = (val: number, total: number) => `${(val / total) * 100}%`;

  return (
    <section className="py-12 sm:py-20 border-t border-border overflow-hidden">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12"
        >
          <h2 className="font-display text-3xl sm:text-5xl text-foreground mb-2 sm:mb-3">VOICES FROM ACROSS BANGLADESH</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
            Every dot is a real player whose life changed. Click any dot to hear their story.
          </p>
        </motion.div>

        <div className="relative flex flex-col lg:flex-row gap-8 items-center justify-center">
          {/* Map Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative w-full max-w-lg lg:max-w-xl flex-shrink-0"
          >
            <svg
              viewBox="0 0 500 480"
              className="w-full drop-shadow-2xl"
              style={{ filter: "drop-shadow(0 0 30px hsl(var(--primary)/0.15))" }}
            >
              {/* Glow background blob */}
              <defs>
                <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </radialGradient>
                <filter id="dotGlow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <ellipse cx="280" cy="240" rx="200" ry="230" fill="url(#mapGlow)" />

              {/* Bangladesh main shape */}
              <path
                d={bangladeshPath}
                fill="hsl(var(--primary)/0.12)"
                stroke="hsl(var(--primary)/0.5)"
                strokeWidth="1.5"
              />

              {/* District dividers */}
              {districtLines.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  stroke="hsl(var(--primary)/0.2)"
                  strokeWidth="0.8"
                />
              ))}

              {/* Player dots */}
              {players.map((player) => {
                const cx = (player.x / 100) * 500;
                const cy = (player.y / 100) * 480;
                const isOpen = openDots.has(player.id);
                const isActive = activeDot === player.id;

                return (
                  <g key={player.id} onClick={() => toggleDot(player.id)} style={{ cursor: "pointer" }}>
                    {/* Pulse ring */}
                    {isOpen && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r="12"
                        fill="hsl(var(--primary)/0.15)"
                        className="animate-ping"
                        style={{ animationDuration: "2s" }}
                      />
                    )}
                    {/* Dot */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isActive ? 7 : 5}
                      fill={isOpen ? "hsl(var(--primary))" : "hsl(var(--muted-foreground)/0.4)"}
                      stroke={isOpen ? "hsl(var(--primary-foreground))" : "hsl(var(--border))"}
                      strokeWidth="1.5"
                      filter="url(#dotGlow)"
                      style={{ transition: "all 0.2s ease" }}
                    />

                    {/* Inline mini popup for default-open dots */}
                    {isOpen && !isActive && (
                      <g>
                        {/* Connector line */}
                        <line
                          x1={cx}
                          y1={cy - 7}
                          x2={cx}
                          y2={cy - 30}
                          stroke="hsl(var(--primary)/0.6)"
                          strokeWidth="1"
                        />
                        {/* Mini badge */}
                        <rect
                          x={cx - 28}
                          y={cy - 52}
                          width="56"
                          height="22"
                          rx="11"
                          fill="hsl(var(--primary))"
                          opacity="0.9"
                        />
                        <text
                          x={cx}
                          y={cy - 37}
                          textAnchor="middle"
                          fontSize="7"
                          fontWeight="600"
                          fill="hsl(var(--primary-foreground))"
                        >
                          {player.name.split(" ")[0]} · {player.district}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="flex items-center gap-4 justify-center mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Player story</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-muted-foreground/30 border border-border" />
                <span className="text-xs text-muted-foreground">More players</span>
              </div>
              <span className="text-xs text-muted-foreground italic">Click any dot</span>
            </div>
          </motion.div>

          {/* Testimonial Panel */}
          <div className="w-full lg:max-w-sm lg:flex-shrink-0">
            <AnimatePresence mode="wait">
              {activePlayer ? (
                <motion.div
                  key={activePlayer.id}
                  initial={{ opacity: 0, x: 20, scale: 0.97 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.97 }}
                  transition={{ duration: 0.3 }}
                  className="bg-card border border-primary/30 rounded-2xl overflow-hidden shadow-2xl"
                >
                  {/* Header with image */}
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={activePlayer.image}
                      alt={activePlayer.name}
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                    <button
                      onClick={() => { setActiveDot(null); }}
                      className="absolute top-3 right-3 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center text-foreground hover:bg-background transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-3 left-4">
                      <div className="flex items-center gap-1.5 bg-primary/90 rounded-full px-2.5 py-1 w-fit mb-1.5">
                        <MapPin className="h-3 w-3 text-primary-foreground" />
                        <span className="text-xs font-semibold text-primary-foreground">{activePlayer.district}</span>
                      </div>
                      <h3 className="font-display text-xl text-foreground">{activePlayer.name}</h3>
                      <p className="text-xs text-muted-foreground">{activePlayer.sport} · {activePlayer.position}</p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-4">
                    {/* Issue */}
                    <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3">
                      <p className="text-xs font-semibold text-destructive/80 uppercase tracking-wide mb-1">The Challenge</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{activePlayer.issue}</p>
                    </div>

                    {/* Story */}
                    <div className="bg-primary/5 border border-primary/15 rounded-xl p-3">
                      <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">The Breakthrough</p>
                      <div className="flex gap-2">
                        <Quote className="h-4 w-4 text-primary/50 flex-shrink-0 mt-0.5" />
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
                  className="flex flex-col items-center justify-center h-64 text-center gap-3 bg-card/50 border border-dashed border-border rounded-2xl p-8"
                >
                  <MapPin className="h-8 w-8 text-primary/40" />
                  <p className="text-muted-foreground text-sm">Click any glowing dot on the map to read a player's story</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick-select dots list */}
            <div className="mt-4 flex flex-wrap gap-2">
              {players.filter(p => p.defaultOpen).map(p => (
                <button
                  key={p.id}
                  onClick={() => toggleDot(p.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
                    activeDot === p.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {p.name.split(" ")[0]} · {p.district}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
