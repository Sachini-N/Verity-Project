import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

interface XPProgressBarProps {
  userId: string;
}

export default function XPProgressBar({ userId }: XPProgressBarProps) {
  const [xpPoints, setXpPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchXP = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/user/${userId}`);
        if (res.data.success && res.data.user) {
          setXpPoints(res.data.user.xpPoints || 0);
        }
      } catch (error) {
        console.error('Failed to fetch XP:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchXP();
  }, [userId]);

  const level = Math.floor(xpPoints / 100);
  const currentLevelXP = xpPoints % 100;
  const nextLevelXP = 100;
  const progressPercent = (currentLevelXP / nextLevelXP) * 100;

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-200 rounded-full animate-pulse" />
        <div className="h-3 bg-slate-200 rounded animate-pulse w-1/2" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 15 }}
      className="glass-panel p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
            Level Progress
          </h3>
          <p className="text-2xl font-black text-slate-900 mt-1">
            Level {level}
          </p>
        </div>
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-right"
        >
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total
          </p>
          <p className="text-xl font-black text-indigo-600">
            {xpPoints} XP
          </p>
        </motion.div>
      </div>

      <div className="space-y-2">
        <div className="xp-bar-container h-2.5 w-full">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{
              type: 'spring',
              stiffness: 50,
              damping: 20,
              delay: 0.1,
            }}
            className="xp-bar-fill"
          />
        </div>
        <p className="text-xs font-bold text-slate-500">
          {currentLevelXP} / {nextLevelXP} XP to next level
        </p>
      </div>

      <div className="pt-2 border-t border-slate-200">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          How to earn XP:
        </p>
        <ul className="text-xs text-slate-600 mt-2 space-y-1">
          <li>✓ Complete a task: +10 XP</li>
          <li>✓ Post announcement: +20 XP</li>
          <li>✓ Push code: +5 XP</li>
        </ul>
      </div>
    </motion.div>
  );
}
