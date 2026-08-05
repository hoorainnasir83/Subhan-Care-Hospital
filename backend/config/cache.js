const logger = require('./logger');

// ── In-Memory Cache Store (Fallback when Redis server is offline) ────────────
class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value, ttlSeconds = 300) {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.store.set(key, { value, expiresAt });
  }

  del(pattern) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  flush() {
    this.store.clear();
  }
}

const memoryCache = new MemoryCache();
let redisClient = null;

// Initialize Redis if REDIS_URL environment variable is provided
if (process.env.REDIS_URL) {
  try {
    const Redis = require('ioredis');
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false
    });
    redisClient.on('connect', () => logger.info('⚡ Redis connected for API caching'));
    redisClient.on('error', (err) => {
      logger.warn('⚠️  Redis connection error. Falling back to in-memory cache.', { error: err.message });
      redisClient = null;
    });
  } catch {
    logger.info('ℹ️  ioredis not installed — using in-memory cache fallback.');
  }
}

/**
 * Express Middleware for Caching GET requests
 * @param {number} durationSeconds - Cache TTL in seconds (default: 300s = 5 mins)
 */
const cacheMiddleware = (durationSeconds = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const userId = req.user ? (req.user._id || req.user.id) : 'public';
    // Sort query parameters to ensure deterministic cache keys
    const sortedQuery = Object.keys(req.query || {}).sort().reduce((acc, key) => {
      acc[key] = req.query[key];
      return acc;
    }, {});
    const cacheKey = `cache:${req.baseUrl}${req.path}:${userId}:${JSON.stringify(sortedQuery)}`;

    try {
      let cachedData = null;

      if (redisClient) {
        const data = await redisClient.get(cacheKey);
        if (data) cachedData = JSON.parse(data);
      } else {
        cachedData = memoryCache.get(cacheKey);
      }

      if (cachedData) {
        logger.info('⚡ Cache HIT', { key: cacheKey });
        res.setHeader('X-Cache', 'HIT');
        return res.json(cachedData);
      }

      logger.info('🐢 Cache MISS', { key: cacheKey });
      res.setHeader('X-Cache', 'MISS');

      // Intercept res.json to store in cache
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (redisClient) {
            redisClient.setex(cacheKey, durationSeconds, JSON.stringify(body)).catch(() => {});
          } else {
            memoryCache.set(cacheKey, body, durationSeconds);
          }
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      logger.error('Cache middleware error', { error: err.message });
      next();
    }
  };
};

/**
 * Clear cached entries matching pattern (used when data is updated/deleted)
 * @param {string} pattern - Glob pattern e.g. "cache:/api/doctors*"
 */
const clearCachePattern = (pattern) => {
  if (redisClient) {
    redisClient.keys(`cache:${pattern}`).then(keys => {
      if (keys.length > 0) redisClient.del(...keys);
    }).catch(() => {});
  }
  memoryCache.del(`cache:${pattern}`);
  logger.info('🧹 Cache invalidated', { pattern });
};

module.exports = {
  cacheMiddleware,
  clearCachePattern
};
