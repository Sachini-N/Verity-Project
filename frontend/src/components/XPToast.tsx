import { motion } from 'framer-motion';
import { useEffect } from 'react';

interface XPToastProps {
  xpAmount: number;
  position: { x: number; y: number };
  onComplete?: () => void;
}

export default function XPToast({
  xpAmount,
  position,
  onComplete,
}: XPToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -60, scale: 1.1 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        pointerEvents: 'none',
      }}
      onAnimationComplete={onComplete}
    >
      <div className="relative">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 0.6,
            ease: 'easeInOut',
          }}
          className="text-2xl font-black text-emerald-500 drop-shadow-lg"
        >
          +{xpAmount} XP
        </motion.div>

        {/* Particle effects */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              opacity: 1,
              scale: 0.3,
              x: 0,
              y: 0,
            }}
            animate={{
              opacity: 0,
              scale: 0,
              x: Math.cos((i / 5) * Math.PI * 2) * 40,
              y: Math.sin((i / 5) * Math.PI * 2) * 40 - 40,
            }}
            transition={{
              duration: 1.2,
              delay: i * 0.05,
              ease: 'easeOut',
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="text-xs font-bold text-emerald-400">✨</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
