import swaggerJSDoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Webhook Relay API',
      version: '1.0.0',
      description: 'Developer-first self-hostable webhook tunneling & inspection API for real-time payload debugging and replaying.',
      contact: {
        name: 'Webhook Relay Team',
        url: 'https://github.com/Ahsan-Qamar-47/webhookrelay',
      },
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Local Development Gateway',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT authentication token.',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key authentication header.',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
            email: { type: 'string', format: 'email', example: 'developer@example.com' },
            name: { type: 'string', example: 'Alex Developer' },
            role: { type: 'string', example: 'user' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Endpoint: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'c2ddde77-7a09-4ce6-994b-4bb7ab160c33' },
            subdomain: { type: 'string', example: 'stripe-checkout' },
            destination_url: { type: 'string', example: 'http://localhost:3000/api/webhooks/stripe' },
            secret: { type: 'string', example: 'whsec_abc123xyz' },
            is_active: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', example: 'd3eeef66-6f08-4bd5-883a-3aa6ba050d44' },
            endpoint_id: { type: 'string', format: 'uuid' },
            event_id: { type: 'string', example: 'evt_101_stripe' },
            provider: { type: 'string', example: 'stripe' },
            method: { type: 'string', example: 'POST' },
            headers: { type: 'object' },
            payload: { type: 'object' },
            status: { type: 'string', example: 'relayed' },
            response_status: { type: 'integer', example: 200 },
            latency_ms: { type: 'integer', example: 32 },
            received_at: { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'INVALID_CREDENTIALS' },
                message: { type: 'string', example: 'Invalid credentials provided.' },
              },
            },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          summary: 'Health check endpoint',
          description: 'Returns status 200 OK if server gateway is operational.',
          responses: {
            200: {
              description: 'Gateway is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      uptime: { type: 'number', example: 123.45 },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/ingest/{tunnelId}': {
        post: {
          summary: 'Webhook Ingestion HTTP Gateway',
          description: 'Receives third-party webhooks and dispatches over Redis Pub/Sub to target tunnels.',
          parameters: [
            {
              name: 'tunnelId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Tunnel subdomain or session ID',
            },
          ],
          responses: {
            202: { description: 'Webhook request accepted and dispatched' },
            404: { description: 'No active tunnel found for specified ID' },
          },
        },
      },
      '/api/auth/signup': {
        post: {
          summary: 'Register new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'User created' },
            409: { description: 'User already exists' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          summary: 'Authenticate user credentials',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful, returns JWT token' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/api/endpoints': {
        get: {
          summary: 'List user endpoints',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'List of provisioned webhook endpoints' },
          },
        },
        post: {
          summary: 'Provision a new webhook endpoint',
          security: [{ BearerAuth: [] }],
          responses: {
            201: { description: 'Endpoint provisioned successfully' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
