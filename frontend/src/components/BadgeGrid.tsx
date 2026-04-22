import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Award, Lock } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  threshold: number;
  color: string;
}

const BADGE_CATALOG: Badge[] = [
  {
    id: 'task_master',
    name: 'Task Master',
    icon: '✓',
    description: 'Complete 10 tasks',
    threshold: 10,
    color: 'from-blue-400 to-indigo-600',
  },
  {
    id: 'code_warrior',
    name: 'Code Warrior',
    icon: '⚡',
    description: '50+ commits',
    threshold: 50,
    color: 'from-purple-400 to-pink-600',
  },
  {
    id: 'engagement_hero',
    name: 'Engagement Hero',
    icon: '🌟',
    description: '100+ XP earned',
    threshold: 100,
    color: 'from-yellow-400 to-orange-600',
  },
  {
    id: 'collaboration_star',
    name: 'Collaboration Star',
    icon: '🤝',
    description: 'Help 5 team members',
    threshold: 5,
    color: 'from-green-400 to-emerald-600',
  },
  {
    id: 'deadline_ace',
    name: 'Deadline Ace',
    icon: '⏱',
    description: '100% on-time tasks',
    threshold: 100,
    color: 'from-red-400 to-pink-600',
  },
  {
    id: 'innovator',
    name: 'Innovator',
    icon: '💡',
    description: 'Lead 3 projects',
    threshold: 3,
    color: 'from-cyan-400 to-blue-600',
  },
];

interface BadgeGridProps {
  userId: string;
}

export default function BadgeGrid({ userId }: BadgeGridProps) {
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/user/${userId}`);
        if (res.data.success && res.data.user?.badges) {
          setEarnedBadges(
            res.data.user.badges
              .split(',')
              .map((b: string) => b.trim())
              .filter(Boolean)
          );
        }
      } catch (error) {
        console.error('Failed to fetch badges:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBadges();
  }, [userId]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  if (loading) {
    return (
      <div className="glass-panel p-6">
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 bg-slate-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="glass-panel p-6 space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.1 }}
    >
      <div className="flex items-center gap-2">
        <Award className="w-5 h-5 text-indigo-600" />
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
          Achievements
        </h3>
      </div>

      <motion.div
        className="grid grid-cols-3 gap-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {BADGE_CATALOG.map((badge) => {
          const isEarned = earnedBadges.includes(badge.id);

          return (
            <motion.div
              key={badge.id}
              variants={badgeVariants}
              className="group relative"
            >
              <div
                className={`h-20 rounded-lg flex flex-col items-center justify-center transition-all cursor-default ${
                  isEarned
                    ? `bg-gradient-to-br ${badge.color} text-white shadow-lg shadow-slate-900/20`
                    : 'bg-slate-100/50 text-slate-400 opacity-60'
                }`}
              >
                <span className="text-xl font-bold">{badge.icon}</span>
                {!isEarned && <Lock className="w-3 h-3 absolute top-1 right-1" />}
              </div>

              {/* Tooltip */}
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                whileHover={{ opacity: 1, y: 2 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none"
              >
                <div className="bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
                  <p>{badge.name}</p>
                  <p className="text-slate-300 font-normal">{badge.description}</p>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>

      <p className="text-xs text-slate-500 pt-2">
        {earnedBadges.length} of {BADGE_CATALOG.length} badges unlocked
      </p>
    </motion.div>
  );
}
