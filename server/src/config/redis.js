import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Client for general commands and publishing
export const redisPublisher = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
});

// Separate client for subscription mode
export const redisSubscriber = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
});

redisPublisher.on('connect', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('✅ Redis Publisher connected');
  }
});

redisSubscriber.on('connect', () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('✅ Redis Subscriber connected');
  }
});

redisPublisher.on('error', (err) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('❌ Redis Publisher Error:', err.message);
  }
});

redisSubscriber.on('error', (err) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('❌ Redis Subscriber Error:', err.message);
  }
});

/**
 * Helper function to publish event object to a Redis channel
 * @param {string} channel Channel name e.g. endpoint:<id> or tunnel:<subdomain>
 * @param {Object} message Payload object
 */
export async function publishEvent(channel, message) {
  try {
    const serialized = typeof message === 'string' ? message : JSON.stringify(message);
    await redisPublisher.publish(channel, serialized);
  } catch (err) {
    console.error(`[Redis Publish Error] Channel: ${channel} | Error: ${err.message}`);
    throw err;
  }
}

export async function closeRedis() {
  try {
    redisPublisher.disconnect();
    redisSubscriber.disconnect();
  } catch {
    // Ignore cleanup error
  }
}

export default {
  redisPublisher,
  redisSubscriber,
  publishEvent,
  closeRedis,
};
