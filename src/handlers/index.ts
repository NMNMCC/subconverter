import { Request, Response } from 'express';
import { pipe } from 'fp-ts/lib/function.js';
import * as E from 'fp-ts/lib/Either.js';
import * as TE from 'fp-ts/lib/TaskEither.js';
import { 
  ConversionConfig, 
  ConversionTarget, 
  ConversionResult, 
  ConversionError 
} from '../types/index.js';
import { fetchSubscription } from '../parsers/index.js';
import { generateSubscription } from '../generators/index.js';
import { isValidUrl } from '../utils/index.js';

// Request handler type
export type RequestHandler = (req: Request, res: Response) => Promise<void>;

// Main subscription conversion handler
export const handleSubscriptionConversion: RequestHandler = async (req, res) => {
  await pipe(
    parseConversionRequest(req),
    TE.chain(config => processSubscriptionConversion(config)),
    TE.fold(
      error => sendErrorResponse(res, error),
      result => sendSuccessResponse(res, result)
    )
  )();
};

// Parse conversion request from Express request
const parseConversionRequest = (req: Request): TE.TaskEither<ConversionError, ConversionConfig> => {
  return TE.fromEither(
    pipe(
      extractRequestParams(req),
      E.chain(validateConversionParams),
      E.mapLeft(message => ({ message, code: 'INVALID_REQUEST' }))
    )
  );
};

// Extract parameters from request
const extractRequestParams = (req: Request): E.Either<string, Record<string, string>> => {
  const params = {
    ...req.query,
    ...req.params,
    ...req.body
  } as Record<string, string>;

  if (!params.target) {
    return E.left('Missing required parameter: target');
  }

  if (!params.url) {
    return E.left('Missing required parameter: url');
  }

  return E.right(params);
};

// Validate conversion parameters
const validateConversionParams = (params: Record<string, string>): E.Either<string, ConversionConfig> => {
  const validTargets: ConversionTarget[] = [
    'clash', 'clashr', 'quan', 'quanx', 'loon', 'ss', 'sssub', 'ssd', 'ssr', 
    'surfboard', 'surge', 'v2ray', 'mixed', 'auto'
  ];

  const target = params.target as ConversionTarget;
  if (!validTargets.includes(target)) {
    return E.left(`Invalid target: ${target}. Valid targets: ${validTargets.join(', ')}`);
  }

  if (!params.url) {
    return E.left('Missing required parameter: url');
  }

  const url = decodeURIComponent(params.url);
  if (!isValidUrl(url)) {
    return E.left(`Invalid URL: ${url}`);
  }

  const config: ConversionConfig = {
    target,
    url,
    enableRuleGenerator: parseBooleanParam(params.rulegen),
    enableTfo: parseBooleanParam(params.tfo),
    enableMptcp: parseBooleanParam(params.mptcp),
    enableUdp: parseBooleanParam(params.udp),
    enableSort: parseBooleanParam(params.sort),
    enableFdn: parseBooleanParam(params.fdn),
    enableClashMode: parseBooleanParam(params.mode),
    enableInsert: parseBooleanParam(params.insert),
    appendType: parseBooleanParam(params.append_type),
    appendInfo: parseBooleanParam(params.append_info),
    sort: parseBooleanParam(params.sort),
    filterDeprecated: parseBooleanParam(params.filter_deprecated),
    fdn: parseBooleanParam(params.fdn),
    emoji: parseBooleanParam(params.emoji),
    rename: params.rename || undefined,
    ruleSet: params.ruleset ? params.ruleset.split('|') : undefined,
    includeRemarks: params.include ? params.include.split('|') : undefined,
    excludeRemarks: params.exclude ? params.exclude.split('|') : undefined,
    template: params.template || undefined,
    filename: params.filename || undefined,
    config: params.config || undefined,
    scv: parseBooleanParam(params.scv),
    udp: parseBooleanParam(params.udp),
    tfo: parseBooleanParam(params.tfo),
    mptcp: parseBooleanParam(params.mptcp),
    expand: parseBooleanParam(params.expand),
    dev: parseBooleanParam(params.dev),
    strict: parseBooleanParam(params.strict),
    interval: params.interval ? parseInt(params.interval, 10) : undefined,
    timeout: params.timeout ? parseInt(params.timeout, 10) : undefined,
    new_name: parseBooleanParam(params.new_name)
  };

  return E.right(config);
};

// Parse boolean parameter
const parseBooleanParam = (value: string | undefined): boolean => {
  if (!value) return false;
  const lower = value.toLowerCase();
  return lower === 'true' || lower === '1' || lower === 'yes' || lower === 'on';
};

// Process subscription conversion
const processSubscriptionConversion = (config: ConversionConfig): TE.TaskEither<ConversionError, ConversionResult> => {
  return pipe(
    TE.fromTask(() => fetchSubscription(config.url || '')),
    TE.chain(subscriptionResult => 
      TE.fromEither(
        pipe(
          subscriptionResult,
          E.chain(subscription => generateSubscription(subscription, config)),
          E.mapLeft(message => ({ message, code: 'CONVERSION_ERROR' }))
        )
      )
    ),
    TE.mapLeft(error => 
      typeof error === 'string' 
        ? { message: error, code: 'FETCH_ERROR' }
        : error
    )
  );
};

// Send error response
const sendErrorResponse = (res: Response, error: ConversionError): TE.TaskEither<never, void> => {
  return TE.fromIO(() => {
    res.status(400).json({
      error: {
        message: error.message,
        code: error.code,
        details: error.details
      }
    });
  });
};

// Send success response
const sendSuccessResponse = (res: Response, result: ConversionResult): TE.TaskEither<never, void> => {
  return TE.fromIO(() => {
    res.setHeader('Content-Type', result.contentType);
    
    if (result.filename) {
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    }
    
    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }
    
    res.send(result.content);
  });
};

// Health check handler
export const handleHealthCheck: RequestHandler = async (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
};

// Get profile handler (for configuration profiles)
export const handleGetProfile: RequestHandler = async (req, res) => {
  const { name } = req.params;
  
  if (!name) {
    res.status(400).json({ error: 'Profile name is required' });
    return;
  }

  // This would typically load from a profile store
  // For now, return a basic profile
  const profile = {
    name,
    description: `Profile for ${name}`,
    rules: [],
    proxyGroups: []
  };

  res.json(profile);
};

// Get version handler
export const handleGetVersion: RequestHandler = async (_req, res) => {
  res.json({
    version: process.env.npm_package_version || '1.0.0',
    node: process.version,
    platform: process.platform,
    arch: process.arch
  });
};

// Render template handler
export const handleRenderTemplate: RequestHandler = async (req, res) => {
  const { template } = req.params;
  const data = req.body;
  
  if (!template) {
    res.status(400).json({ error: 'Template name is required' });
    return;
  }

  try {
    // This would typically use a template engine
    // For now, return the data as-is
    res.json({
      template,
      data,
      rendered: JSON.stringify(data, null, 2)
    });
  } catch (error) {
    res.status(500).json({
      error: {
        message: `Template rendering failed: ${String(error)}`,
        code: 'TEMPLATE_ERROR'
      }
    });
  }
};

// Convert simple format handler (for quick conversions)
export const handleSimpleConversion: RequestHandler = async (req, res) => {
  const { data } = req.body;
  
  if (!data) {
    res.status(400).json({ error: 'Conversion data is required' });
    return;
  }

  try {
    // This would implement simple format conversions
    // For now, return the data as-is
    res.json({
      original: data,
      converted: data,
      format: 'simple'
    });
  } catch (error) {
    res.status(500).json({
      error: {
        message: `Simple conversion failed: ${String(error)}`,
        code: 'SIMPLE_CONVERSION_ERROR'
      }
    });
  }
};

// Rate limiting helper
export const createRateLimitHandler = (windowMs: number = 60000, max: number = 100) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: () => void): void => {
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    const clientData = requests.get(clientIP);
    
    if (!clientData || now > clientData.resetTime) {
      requests.set(clientIP, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }
    
    if (clientData.count >= max) {
      res.status(429).json({
        error: {
          message: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            limit: max,
            windowMs,
            resetTime: clientData.resetTime
          }
        }
      });
      return;
    }
    
    clientData.count++;
    next();
  };
};

// Error handling middleware
export const errorHandler = (error: Error, _req: Request, res: Response, _next: () => void): void => {
  console.error('Error occurred:', error);
  
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  });
};

// Not found handler
export const notFoundHandler: RequestHandler = async (req, res) => {
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.path}`,
      code: 'NOT_FOUND'
    }
  });
};