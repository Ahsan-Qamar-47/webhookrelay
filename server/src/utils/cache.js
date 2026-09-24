import { redisPublisher } from '../config/redis.js';

/**
 * Get cached item by key
 * @param {string} key Cache key
 * @returns {Promise<any|null>} Parsed JSON object or null
 */
export async function getCache(key) {
  try {
    if (!redisPublisher || redisPublisher.status !== 'ready' && redisPublisher.status !== 'connecting') {
      return null;
    }
    const val = await redisPublisher.get(key);
    if (!val) return null;
    return JSON.parse(val);
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[Redis Cache Read Error] Key: ${key} | Error: ${err.message}`);
    }
    return null;
  }
}

/**
 * Store item in Redis with TTL
 * @param {string} key Cache key
 * @param {any} value Value to serialize as JSON
 * @param {number} ttlSeconds Time to live in seconds (default 3600)
 */
export async function setCache(key, value, ttlSeconds = 3600) {
  try {
    if (!redisPublisher || redisPublisher.status !== 'ready' && redisPublisher.status !== 'connecting') {
      return;
    }
    const serialized = JSON.stringify(value);
    await redisPublisher.setex(key, ttlSeconds, serialized);
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[Redis Cache Write Error] Key: ${key} | Error: ${err.message}`);
    }
  }
}

/**
 * Delete single cache key
 * @param {string} key Cache key
 */
export async function deleteCache(key) {
  try {
    if (!redisPublisher || redisPublisher.status !== 'ready' && redisPublisher.status !== 'connecting') {
      return;
    }
    await redisPublisher.del(key);
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[Redis Cache Delete Error] Key: ${key} | Error: ${err.message}`);
    }
  }
}

/**
 * Delete keys matching glob pattern
 * @param {string} pattern Glob pattern e.g. cache:endpoint:123:*
 */
export async function deleteCachePattern(pattern) {
  try {
    if (!redisPublisher || redisPublisher.status !== 'ready' && redisPublisher.status !== 'connecting') {
      return;
    }
    const keys = await redisPublisher.keys(pattern);
    if (keys && keys.length > 0) {
      await redisPublisher.del(...keys);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[Redis Cache Invalidate Error] Pattern: ${pattern} | Error: ${err.message}`);
    }
  }
}

/**
 * Invalidate all cached queries associated with a specific endpoint ID
 * @param {string} endpointId Endpoint UUID
 */
export async function invalidateEndpointCache(endpointId) {
  if (!endpointId) return;
  await deleteCachePattern(`cache:endpoint:${endpointId}:*`);
  await deleteCachePattern(`cache:events:${endpointId}:*`);
}

export default {
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  invalidateEndpointCache,
};
