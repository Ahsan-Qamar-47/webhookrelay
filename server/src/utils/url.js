import crypto from 'node:crypto';
import { query } from '../config/db.js';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generate a random alphanumeric slug of specified length
 * @param {number} [length=12] Length of slug
 * @returns {string} Random slug
 */
export function generateSlug(length = 12) {
  let result = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    result += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return result;
}

/**
 * Generate a unique subdomain slug that does not exist in the database
 * @param {number} [length=12] Length of slug
 * @returns {Promise<string>} Unique subdomain slug
 */
export async function generateUniqueSubdomain(length = 12) {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const slug = generateSlug(length);
    const existing = await query('SELECT id FROM endpoints WHERE subdomain = $1;', [slug]);
    if (existing.rows.length === 0) {
      return slug;
    }
    attempts++;
  }

  throw new Error('Failed to generate a unique subdomain slug after multiple attempts.');
}

/**
 * Build full public webhook ingest URL for a subdomain
 * @param {string} subdomain Endpoint subdomain
 * @returns {string} Full public URL
 */
export function buildPublicUrl(subdomain) {
  const baseUrl = process.env.PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:8080';
  return `${baseUrl}/ingest/${subdomain}`;
}

export default {
  generateSlug,
  generateUniqueSubdomain,
  buildPublicUrl,
};
