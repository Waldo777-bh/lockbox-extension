import { useMemo } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import { useWalletContext } from "../App";

const CONFETTI_COLORS = [
  "#00d87a",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

interface ConfettiDot {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
  drift: number;
  rotation: number;
}

function ConfettiAnimation() {
  const dots = useMemo<ConfettiDot[]>(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 4 + Math.random() * 6,
      delay: Math.random() * 0.8,
      drift: (Math.random() - 0.5) * 120,
      rotation: Math.random() * 720,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((dot) => (
        <motion.div
          key={dot.id}
          className="absolute rounded-full"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: dot.size,
            height: dot.size,
            backgroundColor: dot.color,
          }}
          initial={{
            y: 0,
            x: 0,
            opacity: 1,
            scale: 1,
            rotate: 0,
          }}
          animate={{
            y: 500 + Math.random() * 200,
            x: dot.drift,
            opacity: [1, 1, 0.8, 0],
            scale: [1, 1.2, 0.8, 0.3],
            rotate: dot.rotation,
          }}
          transition={{
            duration: 2 + Math.random() * 1.5,
            delay: dot.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

export function WalletReady() {
  const { navigate } = useWalletContext();

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8 py-10 relative">
      <ConfettiAnimation />

      {/* Green checkmark circle */}
      <motion.div
        className="relative mb-6"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.3,
        }}
      >
        {/* Outer glow */}
        <motion.div
          className="absolute inset-0 rounded-full blur-xl"
          style={{ backgroundColor: "rgba(0, 216, 122, 0.2)" }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Circle bg */}
        <div
          className="relative w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(0, 216, 122, 0.12)" }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#00d87a" }}
          >
            <Check size={28} className="text-[#0f0f14]" strokeWidth={3} />
          </div>
        </div>
      </motion.div>

      {/* Heading */}
      <motion.h1
        className="text-2xl font-bold text-lockbox-text text-center tracking-tight"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        Your wallet is ready!
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="mt-2 text-sm text-lockbox-text-secondary text-center leading-relaxed"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        You can now start adding your API keys
      </motion.p>

      {/* Buttons */}
      <motion.div
        className="mt-10 w-full flex flex-col items-center gap-3"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <button
          onClick={() => navigate("add-key")}
          className="w-full py-3.5 rounded-xl font-semibold text-sm tracking-wide
                     transition-all duration-200 cursor-pointer flex items-center justify-center gap-2
                     hover:shadow-lg hover:shadow-lockbox-accent/20 active:scale-[0.98]"
          style={{ backgroundColor: "#00d87a", color: "#0f0f14" }}
        >
          Add Your First Key
          <ArrowRight size={16} />
        </button>

        <button
          onClick={() => navigate("home")}
          className="text-sm text-lockbox-text-muted hover:text-lockbox-text-secondary
                     transition-colors cursor-pointer py-2 bg-transparent border-none"
        >
          Skip for now
        </button>
      </motion.div>
    </div>
  );
}
