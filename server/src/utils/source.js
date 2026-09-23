/**
 * Webhook Provider & Source Detection Utility
 * Sniffs incoming request headers, query parameters, and body payloads to identify source.
 */

/**
 * Detect webhook source provider from HTTP request elements
 * @param {Object} headers - Request headers object
 * @param {Object} [query={}] - Request query parameters
 * @param {Object} [body={}] - Request parsed body payload
 * @returns {string} Lowercase provider name string ('stripe', 'github', 'whatsapp', 'slack', 'shopify', 'twilio', 'generic', or 'unknown')
 */
export function detectSource(headers = {}, query = {}, body = {}) {
  const normHeaders = {};
  for (const [key, value] of Object.entries(headers)) {
    normHeaders[key.toLowerCase()] = typeof value === 'string' ? value.toLowerCase() : value;
  }

  const userAgent = normHeaders['user-agent'] || '';

  // 1. Stripe Detection
  if (
    normHeaders['stripe-signature'] ||
    userAgent.includes('stripe/') ||
    userAgent.includes('stripe.com')
  ) {
    return 'stripe';
  }

  // 2. GitHub Detection
  if (
    normHeaders['x-github-event'] ||
    normHeaders['x-github-delivery'] ||
    userAgent.includes('github-hookshot/')
  ) {
    return 'github';
  }

  // 3. WhatsApp / Meta Detection
  if (
    normHeaders['x-hub-signature-256'] ||
    normHeaders['x-hub-signature'] ||
    userAgent.includes('facebookexternalua') ||
    query['hub.mode'] ||
    (body && body.object === 'whatsapp_business_account')
  ) {
    return 'whatsapp';
  }

  // 4. Slack Detection
  if (
    normHeaders['x-slack-signature'] ||
    normHeaders['x-slack-request-timestamp'] ||
    userAgent.includes('slackbot') ||
    userAgent.includes('slack-imgproxy')
  ) {
    return 'slack';
  }

  // 5. Shopify Detection
  if (
    normHeaders['x-shopify-topic'] ||
    normHeaders['x-shopify-hmac-sha256'] ||
    normHeaders['x-shopify-shop-domain']
  ) {
    return 'shopify';
  }

  // 6. Twilio Detection
  if (
    normHeaders['x-twilio-signature'] ||
    userAgent.includes('twilio')
  ) {
    return 'twilio';
  }

  // Sniffing attempt for body key indicators
  if (body && typeof body === 'object') {
    if (body.event_type && body.event_type.startsWith('stripe.')) return 'stripe';
    if (body.action && body.repository) return 'github';
  }

  return 'generic';
}

export default {
  detectSource,
};
