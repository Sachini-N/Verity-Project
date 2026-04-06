const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const redis = require('../config/redis');

const prisma = new PrismaClient();
const CACHE_KEY = 'leaderboard:top50';
const CACHE_DURATION = 5 * 60; // 5 minutes

// GET /api/leaderboard?limit=50
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    // Try Redis cache first
    let leaderboard = null;
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        leaderboard = JSON.parse(cached);
      }
    } catch (e) {
      console.warn('[Leaderboard] Redis cache miss, querying database');
    }

    // If not cached, query database
    if (!leaderboard) {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          xpPoints: true,
          badges: true,
          role: true,
        },
        orderBy: { xpPoints: 'desc' },
        take: limit,
      });

      leaderboard = users.map((user, index) => ({
        rank: index + 1,
        id: user.id,
        name: user.name,
        xpPoints: user.xpPoints || 0,
        badges: user.badges
          ? user.badges
              .split(',')
              .map((b) => b.trim())
              .filter(Boolean)
          : [],
        role: user.role,
      }));

      // Cache for 5 minutes
      try {
        await redis.setex(
          CACHE_KEY,
          CACHE_DURATION,
          JSON.stringify(leaderboard)
        );
      } catch (e) {
        console.warn('[Leaderboard] Failed to cache:', e.message);
      }
    }

    res.json({
      success: true,
      count: leaderboard.length,
      leaderboard,
      cachedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Leaderboard] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leaderboard',
      error: error.message,
    });
  }
});

module.exports = router;
