import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

interface CharacterAvatarProps {
  state: "idle" | "listening" | "processing" | "speaking";
}

export default function CharacterAvatar({ state }: CharacterAvatarProps) {
  const [isBlinking, setIsBlinking] = useState(false);

  // Blinking logic
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
      }
    }, 4000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Subtle living animation
  const getMotionProps = () => {
    if (state === "speaking") {
      return {
        y: [0, -4, 0],
        transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut" }
      };
    }
    return {
      y: [0, -2, 0],
      transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
    };
  };

  const avatarUrl = "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=1024";

  return (
    <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-2 border-violet-500/20 shadow-[0_0_40px_rgba(139,92,246,0.2)]">
      <motion.div
        animate={getMotionProps()}
        className="w-full h-full"
      >
        <img
          src={avatarUrl}
          alt="Zoya"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />

        {/* Eyes / Blink Overlay */}
        <AnimatePresence>
          {isBlinking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#fce7f3]/80 pointer-events-none"
              style={{
                clipPath: "ellipse(15% 4% at 50% 43%)",
              }}
            />
          )}
        </AnimatePresence>

        {/* Mouth Overlay */}
        {state === "speaking" && (
          <motion.div
            animate={{
              scaleY: [1, 1.3, 0.9, 1.2, 1],
            }}
            transition={{
              duration: 0.15,
              repeat: Infinity,
            }}
            className="absolute inset-0 bg-pink-800/20 pointer-events-none"
            style={{
              clipPath: "ellipse(5% 2% at 50% 64%)",
              transformOrigin: "50% 64%"
            }}
          />
        )}
      </motion.div>

      {/* Overlays for depth */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/60 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-violet-600/5 mix-blend-overlay" />
      </div>
    </div>
  );
}
