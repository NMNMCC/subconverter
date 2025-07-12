#!/usr/bin/env node

import { config } from 'dotenv';
import { startServer } from './server/index.js';
import { ServerConfig } from './types/index.js';

// Load environment variables
config();

// Parse command line arguments
const args = process.argv.slice(2);
const argsMap = new Map<string, string>();

for (let i = 0; i < args.length; i += 2) {
  const key = args[i]?.replace(/^--/, '');
  const value = args[i + 1];
  if (key && value) {
    argsMap.set(key, value);
  }
}

// Create server configuration from environment and command line arguments
const serverConfig: ServerConfig = {
  port: parseInt(argsMap.get('port') || process.env.PORT || '25500', 10),
  host: argsMap.get('host') || process.env.HOST || '0.0.0.0',
  apiPath: argsMap.get('api-path') || process.env.API_PATH || '/api',
  maxConcurrency: parseInt(argsMap.get('max-concurrency') || process.env.MAX_CONCURRENCY || '10', 10),
  timeout: parseInt(argsMap.get('timeout') || process.env.TIMEOUT || '30000', 10),
  cors: (argsMap.get('cors') || process.env.CORS || 'true') === 'true',
  helmet: (argsMap.get('helmet') || process.env.HELMET || 'true') === 'true',
  rateLimit: {
    windowMs: parseInt(argsMap.get('rate-limit-window') || process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(argsMap.get('rate-limit-max') || process.env.RATE_LIMIT_MAX || '100', 10)
  }
};

// Display startup banner
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║    ███████╗██╗   ██╗██████╗  ██████╗ ██████╗ ██╗   ██╗██╗   ██╗██████╗     ║
║    ██╔════╝██║   ██║██╔══██╗██╔════╝██╔═══██╗██║   ██║██║   ██║██╔══██╗    ║
║    ███████╗██║   ██║██████╔╝██║     ██║   ██║██║   ██║██║   ██║██████╔╝    ║
║    ╚════██║██║   ██║██╔══██╗██║     ██║   ██║╚██╗ ██╔╝██║   ██║██╔══██╗    ║
║    ███████║╚██████╔╝██████╔╝╚██████╗╚██████╔╝ ╚████╔╝ ╚██████╔╝██║  ██║    ║
║    ╚══════╝ ╚═════╝ ╚═════╝  ╚═════╝ ╚═════╝   ╚═══╝   ╚═════╝ ╚═╝  ╚═╝    ║
║                                                                              ║
║                 TypeScript + Node.js Subscription Converter                 ║
║                           Functional Programming Edition                     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

console.log('🔧 Configuration:');
console.log(`   Port: ${serverConfig.port}`);
console.log(`   Host: ${serverConfig.host}`);
console.log(`   API Path: ${serverConfig.apiPath}`);
console.log(`   CORS: ${serverConfig.cors ? 'enabled' : 'disabled'}`);
console.log(`   Helmet: ${serverConfig.helmet ? 'enabled' : 'disabled'}`);
console.log(`   Rate Limit: ${serverConfig.rateLimit?.max} requests per ${serverConfig.rateLimit?.windowMs}ms`);
console.log(`   Max Concurrency: ${serverConfig.maxConcurrency}`);
console.log(`   Timeout: ${serverConfig.timeout}ms`);
console.log('');

// Show help if requested
if (argsMap.has('help') || argsMap.has('h')) {
  console.log('Usage: npm start [options]');
  console.log('');
  console.log('Options:');
  console.log('  --port <number>              Server port (default: 25500)');
  console.log('  --host <string>              Server host (default: 0.0.0.0)');
  console.log('  --api-path <string>          API base path (default: /api)');
  console.log('  --max-concurrency <number>   Max concurrent requests (default: 10)');
  console.log('  --timeout <number>           Request timeout in ms (default: 30000)');
  console.log('  --cors <boolean>             Enable CORS (default: true)');
  console.log('  --helmet <boolean>           Enable Helmet security (default: true)');
  console.log('  --rate-limit-window <number> Rate limit window in ms (default: 60000)');
  console.log('  --rate-limit-max <number>    Max requests per window (default: 100)');
  console.log('  --help, -h                   Show this help message');
  console.log('');
  console.log('Environment Variables:');
  console.log('  PORT, HOST, API_PATH, MAX_CONCURRENCY, TIMEOUT, CORS, HELMET,');
  console.log('  RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX');
  console.log('');
  console.log('Examples:');
  console.log('  npm start                                    # Start with default settings');
  console.log('  npm start -- --port 3000 --host localhost   # Custom port and host');
  console.log('  PORT=8080 npm start                          # Using environment variable');
  console.log('');
  process.exit(0);
}

// Start the server
async function main(): Promise<void> {
  try {
    await startServer(serverConfig);
    
    // Show some example URLs
    const baseUrl = `http://${serverConfig.host === '0.0.0.0' ? 'localhost' : serverConfig.host}:${serverConfig.port}`;
    
    console.log('📖 Example usage:');
    console.log(`   Clash: ${baseUrl}/sub?target=clash&url=<encoded_subscription_url>`);
    console.log(`   Surge: ${baseUrl}/sub?target=surge&url=<encoded_subscription_url>`);
    console.log(`   V2Ray: ${baseUrl}/sub?target=v2ray&url=<encoded_subscription_url>`);
    console.log('');
    console.log('📚 For full API documentation, visit: ' + baseUrl);
    console.log('');
    console.log('✅ Server is ready to accept connections!');
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the application
main().catch(error => {
  console.error('Application startup failed:', error);
  process.exit(1);
});