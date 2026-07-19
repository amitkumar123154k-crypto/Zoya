import React, { useState, useEffect } from "react";
import { motion } from "motion/react";

type VisualizerState = "idle" | "listening" | "processing" | "speaking";

interface VisualizerProps {
  state: VisualizerState;
}

export default function Visualizer({ state }: VisualizerProps) {
  // We can simulate dynamic frequency spectrum levels
  const [frequencies, setFrequencies] = useState<number[]>(
    Array.from({ length: 32 }, () => Math.random() * 40 + 20)
  );

  useEffect(() => {
    // Generate organic reactive waveform movement
    const interval = setInterval(() => {
      setFrequencies(() => {
        let multiplier = 1;
        if (state === "speaking") multiplier = 2.5;
        else if (state === "listening") multiplier = 1.8;
        else if (state === "processing") multiplier = 1.2;
        else multiplier = 0.5;

        return Array.from({ length: 32 }, () => {
          const base = Math.random() * 50;
          return Math.max(10, Math.min(120, base * multiplier + 10));
        });
      });
    }, 120);

    return () => clearInterval(interval);
  }, [state]);

  // JARVIS style high-tech color palettes matching the action states
  const getTheme = () => {
    switch (state) {
      case "listening":
        return {
          color: "#8b5cf6", // Violet
          glow: "rgba(139, 92, 246, 0.4)",
          shadow: "shadow-violet-500/50",
          border: "border-violet-500",
          bgGlow: "from-violet-600/10 to-violet-900/5",
          text: "text-violet-400",
          label: "LISTENING"
        };
      case "processing":
        return {
          color: "#38bdf8", // Sky blue
          glow: "rgba(56, 189, 248, 0.4)",
          shadow: "shadow-sky-400/50",
          border: "border-sky-400",
          bgGlow: "from-sky-500/10 to-sky-900/5",
          text: "text-sky-400",
          label: "PROCESSING"
        };
      case "speaking":
        return {
          color: "#ec4899", // Pink
          glow: "rgba(236, 72, 153, 0.4)",
          shadow: "shadow-pink-500/50",
          border: "border-pink-500",
          bgGlow: "from-pink-500/10 to-pink-900/5",
          text: "text-pink-400",
          label: "SPEAKING"
        };
      default: // Idle
        return {
          color: "#06b6d4", // Cyan (Classic Jarvis)
          glow: "rgba(6, 182, 212, 0.3)",
          shadow: "shadow-cyan-500/30",
          border: "border-cyan-500",
          bgGlow: "from-cyan-500/10 to-cyan-950/5",
          text: "text-cyan-400",
          label: "ONLINE"
        };
    }
  };

  const theme = getTheme();

  // Floating/swaying transition for the entire Jarvis UI
  const floatTransition = {
    y: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut",
      values: [-12, 12, -12]
    },
    x: {
      duration: 7,
      repeat: Infinity,
      ease: "easeInOut",
      values: [-6, 6, -6]
    },
    rotate: {
      duration: 9,
      repeat: Infinity,
      ease: "easeInOut",
      values: [-1.5, 1.5, -1.5]
    }
  };

  // Speed scaling for rotation based on state
  const getRotationSpeed = (baseSpeed: number) => {
    if (state === "listening") return baseSpeed * 0.4;
    if (state === "processing") return baseSpeed * 0.2;
    if (state === "speaking") return baseSpeed * 0.6;
    return baseSpeed; // slow idle
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
      
      {/* 1. Main Floating Container */}
      <motion.div
        animate={{
          y: [-12, 12, -12],
          x: [-6, 6, -6],
          rotate: [-1.5, 1.5, -1.5]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative w-[340px] h-[340px] md:w-[600px] md:h-[600px] flex items-center justify-center"
      >
        
        {/* Hologram Background Grid Overlay */}
        <div className="absolute inset-0 rounded-full border border-white/5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/[0.01] via-transparent to-transparent pointer-events-none" />

        {/* Ambient background aura */}
        <div 
          className="absolute w-[80%] h-[80%] rounded-full blur-[100px] opacity-20 transition-all duration-1000"
          style={{ backgroundColor: theme.color }}
        />

        {/* 2. Geometric Radar Crosshairs (Vertical & Horizontal lines) */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="absolute w-[100%] h-[1px] bg-white border-dashed border-t" />
          <div className="absolute h-[100%] w-[1px] bg-white border-dashed border-l" />
          <div className="absolute w-[95%] h-[95%] rounded-full border border-dashed border-white/20" />
          <div className="absolute w-[80%] h-[80%] rounded-full border border-white/10" />
        </div>

        {/* 3. Outer Rotating Ring (Complex segment indicator) */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: getRotationSpeed(35), repeat: Infinity, ease: "linear" }}
          className="absolute w-[96%] h-[96%] rounded-full border-2 border-dashed border-white/10"
        />

        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: getRotationSpeed(25), repeat: Infinity, ease: "linear" }}
          className="absolute w-[92%] h-[92%] rounded-full border border-t-transparent border-b-transparent border-l-white/20 border-r-white/20"
        />

        {/* 4. Telemetry Circle & Floating Data Ticks */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: getRotationSpeed(60), repeat: Infinity, ease: "linear" }}
          className="absolute w-[82%] h-[82%] rounded-full pointer-events-none"
        >
          {/* North, South, East, West Mini Ticks */}
          <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[8px] font-mono text-white/40 tracking-wider">N 00°</span>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-mono text-white/40 tracking-wider">S 180°</span>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-mono text-white/40 tracking-wider">E 90°</span>
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[8px] font-mono text-white/40 tracking-wider">W 270°</span>
        </motion.div>

        {/* 5. Circular Audio Waveform Equalizer (32 audio bars dancing in a circle) */}
        <div className="absolute inset-0 flex items-center justify-center">
          {frequencies.map((height, i) => {
            const angle = (i * 360) / 32;
            return (
              <div
                key={i}
                className="absolute w-[2px] h-[150px] md:h-[280px] origin-bottom pointer-events-none"
                style={{
                  transform: `rotate(${angle}deg) translateY(-140px) md:translateY(-260px)`,
                  bottom: "50%",
                  left: "50%",
                }}
              >
                {/* Wave indicator line */}
                <motion.div
                  animate={{ height: `${height}%` }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="w-full rounded-full opacity-60"
                  style={{
                    backgroundColor: theme.color,
                    boxShadow: `0 0 10px ${theme.color}`,
                    height: "10%"
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* 6. Middle Rotating Orbital Nodes (Simulating real-time data calculations) */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: getRotationSpeed(16), repeat: Infinity, ease: "linear" }}
          className={`absolute w-[75%] h-[75%] rounded-full border border-dashed opacity-40`}
          style={{ borderColor: theme.color }}
        >
          {/* Orbital Node 1 */}
          <div 
            className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full shadow-lg"
            style={{ backgroundColor: theme.color, boxShadow: `0 0 12px ${theme.color}` }}
          />
          {/* Orbital Node 2 */}
          <div 
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full shadow-lg"
            style={{ backgroundColor: theme.color, boxShadow: `0 0 12px ${theme.color}` }}
          />
        </motion.div>

        {/* 7. Secondary rotating tech border with split segments */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: getRotationSpeed(20), repeat: Infinity, ease: "linear" }}
          className={`absolute w-[60%] h-[60%] rounded-full border-4 border-double border-t-transparent border-b-transparent opacity-60`}
          style={{ borderColor: theme.color }}
        />

        {/* 8. Concentric Tech Ticks Ring (Rotates opposite) */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: getRotationSpeed(12), repeat: Infinity, ease: "linear" }}
          className="absolute w-[50%] h-[50%] rounded-full border border-dotted opacity-30"
          style={{ borderColor: theme.color }}
        />

        {/* 9. Floating UI Readouts outside the core */}
        <div className="absolute inset-0 flex items-center justify-center text-[8px] md:text-[10px] font-mono text-white/40 pointer-events-none">
          <div className="absolute top-12 left-12 text-left space-y-0.5">
            <div>SYS_LOAD: <span className="text-emerald-400">NORMAL</span></div>
            <div>STABLE_CONN: 98.4%</div>
          </div>
          <div className="absolute top-12 right-12 text-right space-y-0.5">
            <div>SIGNAL: <span className={theme.text}>ACTIVE</span></div>
            <div>BANDWIDTH: 1.2 Gbps</div>
          </div>
          <div className="absolute bottom-12 left-12 text-left space-y-0.5">
            <div>ZOYA_MATRIX: v3.5</div>
            <div>STATUS_CODE: <span className="text-white/60">0x8B92</span></div>
          </div>
          <div className="absolute bottom-12 right-12 text-right space-y-0.5">
            <div>MATRIX_FLOW: <span className={theme.text}>{theme.label}</span></div>
            <div>HZ_FREQ: ~{frequencies[0] * 4}Hz</div>
          </div>
        </div>

        {/* 10. Inner Core Hub containing the Zoya Holographic Center Shield */}
        <motion.div
          animate={{
            scale: state === "speaking" ? [1, 1.04, 0.98, 1.02, 1] : [1, 1.02, 1],
          }}
          transition={{
            duration: state === "speaking" ? 0.6 : 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`absolute w-44 h-44 md:w-64 md:h-64 rounded-full border-2 bg-black/60 backdrop-blur-xl flex flex-col items-center justify-center z-10 transition-all duration-500`}
          style={{ 
            borderColor: theme.color,
            boxShadow: `0 0 50px ${theme.color}30, inset 0 0 25px ${theme.color}20`,
          }}
        >
          {/* Cybernetic Tech lines inside core */}
          <div className="absolute inset-0 rounded-full border border-dashed border-white/5 pointer-events-none" />

          {/* Core rotating wireframe */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className={`absolute w-[92%] h-[92%] rounded-full border border-dashed opacity-25`}
            style={{ borderColor: theme.color }}
          />

          {/* Animated Glow Dot */}
          <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute w-[80%] h-[80%] rounded-full opacity-10 blur-xl pointer-events-none"
            style={{ backgroundColor: theme.color }}
          />

          {/* Human-Centered Futuristic Label */}
          <div className="flex flex-col items-center select-none z-20">
            {/* Holographic flashing state header */}
            <motion.div 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-[9px] md:text-xs tracking-[0.4em] font-mono font-medium text-white/50 uppercase"
            >
              AMIT'S A.I.
            </motion.div>

            {/* Glowing Zoya Text */}
            <h1 
              className="font-black tracking-[0.3em] text-3xl md:text-5xl text-white my-1 md:my-2 relative select-none font-sans"
              style={{ textShadow: `0 0 15px ${theme.color}, 0 0 35px ${theme.color}` }}
            >
              ZOYA
            </h1>

            {/* State/Action Display */}
            <div className="flex items-center gap-1.5 mt-0.5 md:mt-1">
              {/* Dynamic blinking active dot */}
              <motion.span 
                animate={{ scale: [1, 1.5, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: theme.color, boxShadow: `0 0 8px ${theme.color}` }}
              />
              <span className={`text-[8px] md:text-[10px] tracking-[0.2em] font-mono font-bold uppercase ${theme.text}`}>
                {theme.label}
              </span>
            </div>
          </div>
          
        </motion.div>
        
      </motion.div>
      
    </div>
  );
}
