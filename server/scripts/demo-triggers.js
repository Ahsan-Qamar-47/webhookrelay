import http from 'node:http';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const TUNNEL_SUBDOMAIN = process.env.TUNNEL_SUBDOMAIN || 'stripe-demo';
const TARGET_URL = `${BASE_URL}/ingest/${TUNNEL_SUBDOMAIN}`;

const webhooks = [
  {
    name: 'Stripe — invoice.paid',
    headers: {
      'Content-Type': 'application/json',
      'Stripe-Signature': `t=${Math.floor(Date.now() / 1000)},v1=demo_sig_${Date.now()}`,
      'User-Agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)',
    },
    body: {
      id: `evt_demo_stripe_${Date.now().toString(36)}`,
      object: 'event',
      api_version: '2022-11-15',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'in_1M001A2eZvKYlo2C9990123',
          object: 'invoice',
          amount_due: 4900,
          amount_paid: 4900,
          currency: 'usd',
          customer: 'cus_N1892837492',
          customer_email: 'alex.developer@example.com',
          paid: true,
          status: 'paid',
          subscription: 'sub_1M001A2eZvKYlo2C',
        },
      },
      type: 'invoice.paid',
    },
  },
  {
    name: 'GitHub — push (main branch)',
    headers: {
      'Content-Type': 'application/json',
      'X-GitHub-Event': 'push',
      'X-GitHub-Delivery': `del_${Date.now().toString(36)}`,
      'X-Hub-Signature-256': `sha256=demo_github_${Date.now()}`,
      'User-Agent': 'GitHub-Hookshot/f31c89f',
    },
    body: {
      ref: 'refs/heads/main',
      before: '61108f88b5b21e24c05c3f000000000000000000',
      after: 'a116ea1000000000000000000000000000000000',
      repository: {
        id: 5891238,
        name: 'webhookrelay',
        full_name: 'Ahsan-Qamar-47/webhookrelay',
        html_url: 'https://github.com/Ahsan-Qamar-47/webhookrelay',
        owner: { login: 'Ahsan-Qamar-47' },
      },
      pusher: { name: 'Ahsan Qamar', email: 'ahsan@dev.org' },
      commits: [
        {
          id: 'a116ea1',
          message: 'feat: add Redis caching and ETag headers for performance',
          timestamp: new Date().toISOString(),
          author: { name: 'Ahsan Qamar' },
        },
      ],
    },
  },
  {
    name: 'WhatsApp — customer message',
    headers: {
      'Content-Type': 'application/json',
      'X-Hub-Signature-256': `sha256=demo_whatsapp_${Date.now()}`,
      'User-Agent': 'facebookexternalua',
    },
    body: {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '1098273645',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '+1 555-0198',
                  phone_number_id: '100293847',
                },
                messages: [
                  {
                    from: '+1 555-0123',
                    id: `wamid_${Date.now()}`,
                    timestamp: `${Math.floor(Date.now() / 1000)}`,
                    text: { body: 'Can you please resend my invoice receipt for subscription #1092?' },
                    type: 'text',
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    },
  },
];

function sendWebhook(webhook) {
  return new Promise((resolve, reject) => {
    const payloadStr = JSON.stringify(webhook.body);
    const url = new URL(TARGET_URL);

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        ...webhook.headers,
        'Content-Length': Buffer.byteLength(payloadStr),
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        console.log(`✅ [${res.statusCode} ${res.statusMessage}] Dispatched: ${webhook.name}`);
        if (body) {
          try {
            console.log('   Response:', JSON.stringify(JSON.parse(body), null, 2));
          } catch {
            console.log('   Response:', body);
          }
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error(`❌ Failed to dispatch ${webhook.name}:`, err.message);
      reject(err);
    });

    req.write(payloadStr);
    req.end();
  });
}

async function runDemoTriggers() {
  console.log(`\n🚀 WebhookRelay Live Demo Event Trigger Script`);
  console.log(`Targeting Endpoint: ${TARGET_URL}\n`);

  for (let i = 0; i < webhooks.length; i++) {
    console.log(`[${i + 1}/${webhooks.length}] Firing ${webhooks.name}...`);
    try {
      await sendWebhook(webhooks[i]);
    } catch {
      // Continue next triggers even if server offline
    }
    console.log('---');
    await new Promise((res) => setTimeout(res, 800));
  }

  console.log('\n🎉 Demo triggers completed! Check your WebhookRelay Inspector UI.\n');
}

runDemoTriggers();
