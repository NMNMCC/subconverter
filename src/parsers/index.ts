import { pipe } from 'fp-ts/lib/function.js';
import * as E from 'fp-ts/lib/Either.js';
import * as O from 'fp-ts/lib/Option.js';
import { Base64 } from 'js-base64';
import { ProxyConfig, ProxyType, Subscription } from '../types/index.js';
import { 
  decodeBase64, 
  safeSplit, 
  parseUrl, 
  trim, 
  parseInt, 
  isValidPort,
  isValidIPv4,
  isValidIPv6,
  isValidDomain
} from '../utils/index.js';

// Base subscription parser interface
export interface SubscriptionParser {
  readonly parse: (content: string) => E.Either<string, Subscription>;
  readonly canParse: (content: string, url?: string) => boolean;
}

// Shadowsocks parser
export const shadowsocksParser: SubscriptionParser = {
  canParse: (content: string, url?: string): boolean => {
    return content.includes('ss://') || url?.includes('ss://') || false;
  },

  parse: (content: string): E.Either<string, Subscription> => {
    const lines = content.split('\n')
      .map(trim)
      .filter(line => line.startsWith('ss://'));

    if (lines.length === 0) {
      return E.left('No valid Shadowsocks URLs found');
    }

    const proxies = lines.map(parseShadowsocksUrl).filter(E.isRight).map(result => result.right);
    
    if (proxies.length === 0) {
      return E.left('No valid Shadowsocks proxies could be parsed');
    }

    return E.right({
      url: '',
      proxies,
      proxyGroups: [],
      rules: []
    });
  }
};

const parseShadowsocksUrl = (url: string): E.Either<string, ProxyConfig> => {
  return pipe(
    parseUrl(url),
    E.chain(urlObj => {
      if (urlObj.protocol !== 'ss:') {
        return E.left('Invalid Shadowsocks URL protocol');
      }

      const userInfo = urlObj.username;
      const server = urlObj.hostname;
      const port = urlObj.port;
      const name = decodeURIComponent(urlObj.hash.slice(1)) || `${server}:${port}`;

      return pipe(
        decodeBase64(userInfo),
        E.chain(decoded => {
          const parts = decoded.split(':');
          if (parts.length !== 2) {
            return E.left('Invalid Shadowsocks user info format');
          }

          const [cipher, password] = parts;
          
          if (!cipher || !password) {
            return E.left('Missing cipher or password');
          }

          return pipe(
            parseInt(port),
            O.fold(
              () => E.left('Invalid port number'),
              portNum => {
                if (!isValidPort(portNum)) {
                  return E.left('Port number out of range');
                }

                if (!isValidIPv4(server) && !isValidIPv6(server) && !isValidDomain(server)) {
                  return E.left('Invalid server address');
                }

                return E.right({
                  type: 'ss' as ProxyType,
                  name,
                  server,
                  port: portNum,
                  cipher,
                  password
                });
              }
            )
          );
        })
      );
    })
  );
};

// ShadowsocksR parser
export const shadowsocksRParser: SubscriptionParser = {
  canParse: (content: string, url?: string): boolean => {
    return content.includes('ssr://') || url?.includes('ssr://') || false;
  },

  parse: (content: string): E.Either<string, Subscription> => {
    const lines = content.split('\n')
      .map(trim)
      .filter(line => line.startsWith('ssr://'));

    if (lines.length === 0) {
      return E.left('No valid ShadowsocksR URLs found');
    }

    const proxies = lines.map(parseShadowsocksRUrl).filter(E.isRight).map(result => result.right);
    
    if (proxies.length === 0) {
      return E.left('No valid ShadowsocksR proxies could be parsed');
    }

    return E.right({
      url: '',
      proxies,
      proxyGroups: [],
      rules: []
    });
  }
};

const parseShadowsocksRUrl = (url: string): E.Either<string, ProxyConfig> => {
  if (!url.startsWith('ssr://')) {
    return E.left('Invalid ShadowsocksR URL protocol');
  }

  const encoded = url.slice(6); // Remove 'ssr://'
  
  return pipe(
    decodeBase64(encoded),
    E.chain(decoded => {
      const parts = decoded.split(':');
      if (parts.length < 6) {
        return E.left('Invalid ShadowsocksR URL format');
      }

      const [server, port, protocol, cipher, obfs, passwordAndParams] = parts;
      
      if (!server || !port || !protocol || !cipher || !obfs || !passwordAndParams) {
        return E.left('Missing required ShadowsocksR parameters');
      }

      const [passwordBase64, ...paramParts] = passwordAndParams.split('/?');
      const paramsString = paramParts.join('/?');
      
      if (!passwordBase64) {
        return E.left('Missing password in ShadowsocksR URL');
      }
      
      return pipe(
        decodeBase64(passwordBase64),
        E.chain(password => {
          return pipe(
            parseInt(port),
            O.fold(
              () => E.left('Invalid port number'),
              portNum => {
                if (!isValidPort(portNum)) {
                  return E.left('Port number out of range');
                }

                if (!isValidIPv4(server) && !isValidIPv6(server) && !isValidDomain(server)) {
                  return E.left('Invalid server address');
                }

                const params = new URLSearchParams(paramsString);
                const name = params.get('remarks') ? 
                  pipe(decodeBase64(params.get('remarks')!), E.getOrElse(() => `${server}:${port}`)) :
                  `${server}:${port}`;

                const ssrProxy: ProxyConfig = {
                  type: 'ssr' as ProxyType,
                  name,
                  server,
                  port: portNum,
                  cipher,
                  password,
                  // Add SSR-specific fields
                  protocol,
                  obfs,
                  protocolParam: params.get('protoparam') ? 
                    pipe(decodeBase64(params.get('protoparam')!), E.getOrElse(() => '')) || undefined : 
                    undefined,
                  obfsParam: params.get('obfsparam') ? 
                    pipe(decodeBase64(params.get('obfsparam')!), E.getOrElse(() => '')) || undefined : 
                    undefined
                };

                return E.right(ssrProxy);
              }
            )
          );
        })
      );
    })
  );
};

// VMess parser
export const vmessParser: SubscriptionParser = {
  canParse: (content: string, url?: string): boolean => {
    return content.includes('vmess://') || url?.includes('vmess://') || false;
  },

  parse: (content: string): E.Either<string, Subscription> => {
    const lines = content.split('\n')
      .map(trim)
      .filter(line => line.startsWith('vmess://'));

    if (lines.length === 0) {
      return E.left('No valid VMess URLs found');
    }

    const proxies = lines.map(parseVmessUrl).filter(E.isRight).map(result => result.right);
    
    if (proxies.length === 0) {
      return E.left('No valid VMess proxies could be parsed');
    }

    return E.right({
      url: '',
      proxies,
      proxyGroups: [],
      rules: []
    });
  }
};

const parseVmessUrl = (url: string): E.Either<string, ProxyConfig> => {
  if (!url.startsWith('vmess://')) {
    return E.left('Invalid VMess URL protocol');
  }

  const encoded = url.slice(8); // Remove 'vmess://'
  
  return pipe(
    decodeBase64(encoded),
    E.chain(decoded => {
      try {
        const config = JSON.parse(decoded) as Record<string, unknown>;
        
        const name = config.ps as string || config.add as string + ':' + config.port as string;
        const server = config.add as string;
        const port = config.port as number;
        const uuid = config.id as string;
        const alterId = config.aid as number || 0;
        const cipher = config.scy as string || 'auto';
        const network = config.net as string || 'tcp';
        const host = config.host as string || '';
        const path = config.path as string || '/';
        const tls = config.tls as string === 'tls';
        const sni = config.sni as string || '';
        const alpn = config.alpn as string || '';
        const fp = config.fp as string || '';

        if (!server || !port || !uuid) {
          return E.left('Missing required VMess parameters');
        }

        if (!isValidPort(port)) {
          return E.left('Invalid port number');
        }

        if (!isValidIPv4(server) && !isValidIPv6(server) && !isValidDomain(server)) {
          return E.left('Invalid server address');
        }

        const vmessProxy: ProxyConfig = {
          type: 'vmess' as ProxyType,
          name,
          server,
          port,
          uuid,
          alterId,
          cipher,
          network,
          host: host || undefined,
          path: path || undefined,
          tls,
          skipCertVerify: !tls,
          serverName: sni || undefined,
          alpn: alpn ? [alpn] : undefined,
          fingerprint: fp || undefined
        };

        return E.right(vmessProxy);
      } catch (error) {
        return E.left(`Failed to parse VMess JSON: ${String(error)}`);
      }
    })
  );
};

// Base64 subscription parser (for mixed content)
export const base64Parser: SubscriptionParser = {
  canParse: (content: string): boolean => {
    // Check if content looks like base64 encoded data
    try {
      const decoded = Base64.decode(content);
      return decoded.includes('://') && (
        decoded.includes('ss://') || 
        decoded.includes('ssr://') || 
        decoded.includes('vmess://') ||
        decoded.includes('vless://') ||
        decoded.includes('trojan://')
      );
    } catch {
      return false;
    }
  },

  parse: (content: string): E.Either<string, Subscription> => {
    return pipe(
      decodeBase64(content),
      E.chain(decoded => {
        // Try to parse the decoded content with appropriate parsers
        if (shadowsocksParser.canParse(decoded)) {
          return shadowsocksParser.parse(decoded);
        }
        
        if (shadowsocksRParser.canParse(decoded)) {
          return shadowsocksRParser.parse(decoded);
        }
        
        if (vmessParser.canParse(decoded)) {
          return vmessParser.parse(decoded);
        }
        
        return E.left('No suitable parser found for decoded content');
      })
    );
  }
};

// Main subscription parser that tries all parsers
export const parseSubscription = (content: string, url?: string): E.Either<string, Subscription> => {
  const parsers = [shadowsocksParser, shadowsocksRParser, vmessParser, base64Parser];
  
  for (const parser of parsers) {
    if (parser.canParse(content, url)) {
      const result = parser.parse(content);
      if (E.isRight(result)) {
        return result;
      }
    }
  }
  
  return E.left('No suitable parser found for subscription content');
};

// Subscription fetcher with error handling
export const fetchSubscription = async (url: string, headers?: Record<string, string>): Promise<E.Either<string, Subscription>> => {
  try {
    const fetchHeaders = headers || {};
    const response = await fetch(url, { headers: fetchHeaders });
    
    if (!response.ok) {
      return E.left(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const content = await response.text();
    
    return parseSubscription(content, url);
  } catch (error) {
    return E.left(`Network error: ${String(error)}`);
  }
};