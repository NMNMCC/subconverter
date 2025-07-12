import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';
import { ServerConfig } from '../types/index.js';
import {
  handleSubscriptionConversion,
  handleHealthCheck,
  handleGetProfile,
  handleGetVersion,
  handleRenderTemplate,
  handleSimpleConversion,
  createRateLimitHandler,
  errorHandler,
  notFoundHandler
} from '../handlers/index.js';

// Load environment variables
config();

// Default server configuration
const defaultServerConfig: ServerConfig = {
  port: parseInt(process.env.PORT || '25500', 10),
  host: process.env.HOST || '0.0.0.0',
  apiPath: process.env.API_PATH || '/api',
  maxConcurrency: parseInt(process.env.MAX_CONCURRENCY || '10', 10),
  timeout: parseInt(process.env.TIMEOUT || '30000', 10),
  cors: process.env.CORS === 'true' || true,
  helmet: process.env.HELMET === 'true' || true,
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
  }
};

// Create Express application
export const createServer = (serverConfig: ServerConfig = defaultServerConfig): express.Application => {
  const app = express();

  // Security middleware
  if (serverConfig.helmet) {
    app.use(helmet({
      contentSecurityPolicy: false, // Disable CSP for API
      crossOriginEmbedderPolicy: false
    }));
  }

  // CORS middleware
  if (serverConfig.cors) {
    app.use(cors({
      origin: true, // Allow all origins for API
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));
  }

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging middleware
  app.use((req, _res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
    next();
  });

  // Rate limiting middleware
  if (serverConfig.rateLimit) {
    const rateLimitHandler = createRateLimitHandler(
      serverConfig.rateLimit.windowMs,
      serverConfig.rateLimit.max
    );
    app.use(rateLimitHandler);
  }

  // Health check endpoint
  app.get('/health', handleHealthCheck);
  app.get('/ping', handleHealthCheck);

  // Version endpoint
  app.get('/version', handleGetVersion);

  // Main API routes
  const apiRouter = express.Router();

  // Subscription conversion endpoints
  apiRouter.get('/sub', handleSubscriptionConversion);
  apiRouter.post('/sub', handleSubscriptionConversion);
  
  // Profile management endpoints
  apiRouter.get('/profile/:name', handleGetProfile);
  
  // Template rendering endpoints
  apiRouter.post('/render/:template', handleRenderTemplate);
  
  // Simple conversion endpoints
  apiRouter.post('/convert/simple', handleSimpleConversion);
  
  // Legacy compatibility endpoints
  apiRouter.get('/clash', (req, res, next) => {
    req.query.target = 'clash';
    handleSubscriptionConversion(req, res).catch(next);
  });
  
  apiRouter.get('/surge', (req, res, next) => {
    req.query.target = 'surge';
    handleSubscriptionConversion(req, res).catch(next);
  });
  
  apiRouter.get('/quan', (req, res, next) => {
    req.query.target = 'quan';
    handleSubscriptionConversion(req, res).catch(next);
  });
  
  apiRouter.get('/quanx', (req, res, next) => {
    req.query.target = 'quanx';
    handleSubscriptionConversion(req, res).catch(next);
  });
  
  apiRouter.get('/loon', (req, res, next) => {
    req.query.target = 'loon';
    handleSubscriptionConversion(req, res).catch(next);
  });
  
  apiRouter.get('/ss', (req, res, next) => {
    req.query.target = 'ss';
    handleSubscriptionConversion(req, res).catch(next);
  });
  
  apiRouter.get('/ssr', (req, res, next) => {
    req.query.target = 'ssr';
    handleSubscriptionConversion(req, res).catch(next);
  });
  
  apiRouter.get('/v2ray', (req, res, next) => {
    req.query.target = 'v2ray';
    handleSubscriptionConversion(req, res).catch(next);
  });

  // Mount API router
  app.use(serverConfig.apiPath || '/api', apiRouter);

  // Root endpoint redirect to main conversion endpoint
  app.get('/', (req, res) => {
    if (Object.keys(req.query).length > 0) {
      // If query parameters are present, treat as conversion request
      handleSubscriptionConversion(req, res).catch(next => {
        errorHandler(new Error('Conversion failed'), req, res, next);
      });
    } else {
      // Otherwise, show API documentation
      res.json({
        name: 'Subconverter API',
        version: process.env.npm_package_version || '1.0.0',
        description: 'Utility to convert between various proxy subscription formats',
        endpoints: {
          '/health': 'Health check endpoint',
          '/version': 'Get version information',
          '/sub': 'Main subscription conversion endpoint',
          '/profile/:name': 'Get profile configuration',
          '/render/:template': 'Render template with data',
          '/convert/simple': 'Simple format conversion',
          '/clash': 'Convert to Clash format',
          '/surge': 'Convert to Surge format',
          '/quan': 'Convert to Quantumult format',
          '/quanx': 'Convert to Quantumult X format',
          '/loon': 'Convert to Loon format',
          '/ss': 'Convert to Shadowsocks format',
          '/ssr': 'Convert to ShadowsocksR format',
          '/v2ray': 'Convert to V2Ray format'
        },
        usage: {
          target: 'Target format (clash, surge, quan, quanx, loon, ss, ssr, v2ray)',
          url: 'Subscription URL to convert (URL encoded)',
          config: 'External configuration file URL (optional)',
          emoji: 'Add emoji to node names (true/false)',
          rename: 'Rename pattern for nodes',
          include: 'Include nodes matching pattern',
          exclude: 'Exclude nodes matching pattern',
          sort: 'Sort nodes by name (true/false)',
          udp: 'Enable UDP support (true/false)',
          tfo: 'Enable TCP Fast Open (true/false)',
          mptcp: 'Enable Multipath TCP (true/false)'
        }
      });
    }
  });

  // Fallback for legacy compatibility (without /api prefix)
  app.get('/sub', handleSubscriptionConversion);
  app.post('/sub', handleSubscriptionConversion);

  // Error handling middleware
  app.use(errorHandler);

  // Not found handler
  app.use(notFoundHandler);

  return app;
};

// Start server function
export const startServer = (serverConfig: ServerConfig = defaultServerConfig): Promise<void> => {
  return new Promise((resolve, reject) => {
    const app = createServer(serverConfig);
    
    const server = app.listen(serverConfig.port, serverConfig.host || '0.0.0.0', () => {
      console.log(`🚀 Subconverter server started on http://${serverConfig.host}:${serverConfig.port}`);
      console.log(`📡 API available at http://${serverConfig.host}:${serverConfig.port}${serverConfig.apiPath}`);
      console.log(`🔍 Health check: http://${serverConfig.host}:${serverConfig.port}/health`);
      console.log(`📋 Version info: http://${serverConfig.host}:${serverConfig.port}/version`);
      
      // Graceful shutdown handling
      process.on('SIGTERM', () => {
        console.log('🔄 Received SIGTERM, shutting down gracefully...');
        server.close(() => {
          console.log('✅ Server closed');
          process.exit(0);
        });
      });
      
      process.on('SIGINT', () => {
        console.log('🔄 Received SIGINT, shutting down gracefully...');
        server.close(() => {
          console.log('✅ Server closed');
          process.exit(0);
        });
      });
      
      resolve();
    });
    
    server.on('error', (error) => {
      console.error('❌ Server startup error:', error);
      reject(error);
    });
  });
};

// Export the Express application for testing
export default createServer();